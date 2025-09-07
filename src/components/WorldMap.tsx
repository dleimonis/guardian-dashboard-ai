import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip, LayersControl } from 'react-leaflet';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, AlertTriangle, Flame, Activity, CloudRain, Maximize2, Minimize2 } from 'lucide-react';
import EmergencyDetailModal, { EmergencyDetail } from '@/components/EmergencyDetailModal';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Emergency {
  id: string;
  lat: number;
  lng: number;
  title: string;
  severity: 'critical' | 'warning' | 'watch';
  type: string;
  affectedPeople: number;
}

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const WorldMap = () => {
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modalEmergency, setModalEmergency] = useState<EmergencyDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock emergency data with real coordinates
  const emergencies: Emergency[] = [
    {
      id: '1',
      lat: 34.0522,
      lng: -118.2437,
      title: 'Wildfire Alert - Los Angeles',
      severity: 'critical',
      type: 'Fire',
      affectedPeople: 15000,
    },
    {
      id: '2',
      lat: 35.6762,
      lng: 139.6503,
      title: 'Earthquake Warning - Tokyo',
      severity: 'warning',
      type: 'Earthquake',
      affectedPeople: 2000000,
    },
    {
      id: '3',
      lat: 25.7617,
      lng: -80.1918,
      title: 'Hurricane Watch - Miami',
      severity: 'warning',
      type: 'Hurricane',
      affectedPeople: 500000,
    },
    {
      id: '4',
      lat: 51.5074,
      lng: -0.1278,
      title: 'Flood Warning - London',
      severity: 'watch',
      type: 'Flood',
      affectedPeople: 50000,
    },
    {
      id: '5',
      lat: -33.8688,
      lng: 151.2093,
      title: 'Bushfire Alert - Sydney',
      severity: 'critical',
      type: 'Fire',
      affectedPeople: 75000,
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ef4444'; // red
      case 'warning':
        return '#f59e0b'; // amber
      case 'watch':
        return '#22c55e'; // green
      default:
        return '#3b82f6'; // blue
    }
  };

  const getEmergencyIcon = (type: string) => {
    switch (type) {
      case 'Fire':
        return Flame;
      case 'Earthquake':
        return Activity;
      case 'Hurricane':
      case 'Flood':
        return CloudRain;
      default:
        return AlertTriangle;
    }
  };

  // Custom icon for emergency markers
  const createCustomIcon = (emergency: Emergency) => {
    const Icon = getEmergencyIcon(emergency.type);
    return L.divIcon({
      html: `
        <div class="relative">
          <div class="absolute -inset-4 rounded-full animate-ping" style="background-color: ${getSeverityColor(emergency.severity)}; opacity: 0.3;"></div>
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg" style="background-color: ${getSeverityColor(emergency.severity)};">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${emergency.type === 'Fire' ? '<path d="M12 12c0-3-2-6-6-6 0 3 0 6 3 9-3 0-3 3-3 3s6 0 9-3c0 3-3 6-3 6s6-3 6-9z"/>' : 
                 emergency.type === 'Earthquake' ? '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>' :
                 '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5Z"/>'}
            </svg>
          </div>
        </div>
      `,
      className: 'custom-emergency-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  // Custom styles for the map container
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-emergency-marker {
        background: transparent !important;
        border: none !important;
        text-align: center;
      }
      .leaflet-container {
        background-color: hsl(220 15% 10%);
        font-family: inherit;
      }
      .leaflet-tile-pane.dark-mode {
        filter: brightness(0.8) contrast(1.2) saturate(0.8);
      }
      .leaflet-popup-content-wrapper {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      }
      .dark .leaflet-popup-content-wrapper {
        background: hsl(220 15% 12% / 0.95);
        border: 1px solid hsl(220 15% 20%);
        box-shadow: 0 8px 32px hsl(220 15% 0% / 0.3);
      }
      .leaflet-popup-content {
        color: #333;
        margin: 0;
        padding: 0;
      }
      .dark .leaflet-popup-content {
        color: white;
      }
      .leaflet-popup-tip {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(0, 0, 0, 0.1);
      }
      .dark .leaflet-popup-tip {
        background: hsl(220 15% 12% / 0.95);
        border: 1px solid hsl(220 15% 20%);
      }
      .leaflet-control-zoom {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
      }
      .dark .leaflet-control-zoom {
        background: hsl(220 15% 12% / 0.95);
        border: 1px solid hsl(220 15% 20%) !important;
      }
      .leaflet-control-zoom a {
        background: transparent;
        color: #333;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      }
      .dark .leaflet-control-zoom a {
        color: white;
        border-bottom: 1px solid hsl(220 15% 20%);
      }
      .leaflet-control-zoom a:hover {
        background: rgba(0, 0, 0, 0.05);
      }
      .dark .leaflet-control-zoom a:hover {
        background: hsl(220 15% 18%);
      }
      .leaflet-control-layers {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(0, 0, 0, 0.1) !important;
        border-radius: 8px;
      }
      .dark .leaflet-control-layers {
        background: hsl(220 15% 12% / 0.95);
        border: 1px solid hsl(220 15% 20%) !important;
      }
      .leaflet-control-layers-toggle {
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M12 2L2 7v10l10 5 10-5V7z"/></svg>');
        background-size: 24px 24px;
        background-position: center;
      }
      .dark .leaflet-control-layers-toggle {
        background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L2 7v10l10 5 10-5V7z"/></svg>');
      }
      @keyframes emergencyPulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.7; }
      }
      .emergency-pulse {
        animation: emergencyPulse 2s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleViewDetails = (emergency: Emergency) => {
    setModalEmergency({
      id: emergency.id,
      title: emergency.title,
      type: emergency.type,
      severity: emergency.severity,
      lat: emergency.lat,
      lng: emergency.lng,
      affectedPeople: emergency.affectedPeople,
      description: `${emergency.severity.charAt(0).toUpperCase() + emergency.severity.slice(1)} level ${emergency.type} emergency detected. Immediate action required for affected populations.`,
      timestamp: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  return (
    <Card className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : 'p-6'} bg-gradient-surface backdrop-blur-glass border-border/50 shadow-glass h-full transition-all duration-300`}>
      <div className={`flex items-center justify-between ${isFullscreen ? 'absolute top-4 left-4 right-4 z-[1001]' : 'mb-4'}`}>
        <h2 className="text-lg font-semibold text-foreground bg-background/80 backdrop-blur-sm px-3 py-1 rounded-lg">Global Emergency Monitor</h2>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
            {emergencies.length} Active
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="bg-background/80 backdrop-blur-sm"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className={`relative w-full ${isFullscreen ? 'h-full' : 'h-full min-h-[400px]'} rounded-lg overflow-hidden`}>
        <MapContainer
          center={[20, 0]}
          zoom={isFullscreen ? 3 : 2}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
          scrollWheelZoom={true}
          zoomControl={true}
        >
          {/* Layer controls for different map styles */}
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street Map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Dark Mode">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                className="dark-mode"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Terrain">
              <TileLayer
                attribution='&copy; <a href="https://www.opentopomap.org">OpenTopoMap</a>'
                url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Emergency markers */}
          {emergencies.map((emergency) => (
            <Marker
              key={emergency.id}
              position={[emergency.lat, emergency.lng]}
              icon={createCustomIcon(emergency)}
              eventHandlers={{
                click: () => setSelectedEmergency(emergency),
              }}
            >
              <Popup className="custom-popup">
                <div className="p-4 min-w-[250px]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{emergency.title}</h3>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Type:</span>
                      <span className="font-medium">{emergency.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Severity:</span>
                      <Badge 
                        variant="secondary"
                        className="text-xs capitalize"
                        style={{ 
                          backgroundColor: `${getSeverityColor(emergency.severity)}20`,
                          color: getSeverityColor(emergency.severity),
                          borderColor: getSeverityColor(emergency.severity)
                        }}
                      >
                        {emergency.severity}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Affected:</span>
                      <span className="font-medium">{emergency.affectedPeople.toLocaleString()} people</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Coordinates:</span>
                      <span className="font-mono text-xs">
                        {emergency.lat.toFixed(4)}, {emergency.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      onClick={() => handleViewDetails(emergency)}
                      className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </Popup>

              <Tooltip direction="top" offset={[0, -10]} opacity={0.9}>
                <div className="text-xs">
                  <div className="font-semibold">{emergency.title}</div>
                  <div className="text-gray-600 dark:text-gray-300">Click for details</div>
                </div>
              </Tooltip>
            </Marker>
          ))}

          {/* Circle overlays for affected areas */}
          {emergencies.map((emergency) => (
            <CircleMarker
              key={`circle-${emergency.id}`}
              center={[emergency.lat, emergency.lng]}
              radius={Math.sqrt(emergency.affectedPeople / 1000) * 2}
              pathOptions={{
                fillColor: getSeverityColor(emergency.severity),
                fillOpacity: 0.1,
                color: getSeverityColor(emergency.severity),
                weight: 1,
                opacity: 0.3,
              }}
            />
          ))}
        </MapContainer>

        {/* Legend */}
        <div className={`absolute ${isFullscreen ? 'bottom-8' : 'bottom-4'} left-4 bg-white/90 dark:bg-gradient-surface backdrop-blur-glass border border-gray-200 dark:border-border/50 rounded-lg p-3 shadow-lg dark:shadow-glass z-[1000]`}>
          <h4 className="text-xs font-semibold text-gray-800 dark:text-foreground mb-2">Severity Levels</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-critical"></div>
              <span className="text-gray-600 dark:text-muted-foreground">Critical</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span className="text-gray-600 dark:text-muted-foreground">Warning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span className="text-gray-600 dark:text-muted-foreground">Watch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Detail Modal */}
      <EmergencyDetailModal
        emergency={modalEmergency}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Card>
  );
};

export default WorldMap;