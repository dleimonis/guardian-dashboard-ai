import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, X } from 'lucide-react';
import RadarSweep from '@/components/RadarSweep';

interface Emergency {
  id: string;
  lat: number;
  lng: number;
  title: string;
  severity: 'critical' | 'warning' | 'watch';
  type: string;
  affectedPeople: number;
}

const WorldMap = () => {
  const [selectedEmergency, setSelectedEmergency] = useState<Emergency | null>(null);

  // Mock emergency data
  const emergencies: Emergency[] = [
    {
      id: '1',
      lat: 34.0522,
      lng: -118.2437,
      title: 'Wildfire Alert',
      severity: 'critical',
      type: 'Fire',
      affectedPeople: 15000,
    },
    {
      id: '2',
      lat: 35.6762,
      lng: 139.6503,
      title: 'Earthquake Warning',
      severity: 'warning',
      type: 'Earthquake',
      affectedPeople: 2000000,
    },
    {
      id: '3',
      lat: 25.7617,
      lng: -80.1918,
      title: 'Hurricane Watch',
      severity: 'warning',
      type: 'Hurricane',
      affectedPeople: 500000,
    },
    {
      id: '4',
      lat: 51.5074,
      lng: -0.1278,
      title: 'Flood Warning',
      severity: 'watch',
      type: 'Flood',
      affectedPeople: 50000,
    },
  ];

  // Convert lat/lng to SVG coordinates (simplified projection)
  const projectToSVG = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * 800;
    const y = ((90 - lat) / 180) * 400;
    return { x, y };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#ff4444';
      case 'warning':
        return '#ff8800';
      case 'watch':
        return '#ffaa00';
      default:
        return '#4488ff';
    }
  };

  return (
    <Card className="relative p-6 bg-gradient-surface backdrop-blur-glass border-border/50 shadow-glass h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Global Emergency Monitor</h2>
        <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
          {emergencies.length} Active
        </Badge>
      </div>

      <div className="relative w-full h-full min-h-[400px] bg-surface rounded-lg overflow-hidden">
        {/* Radar Sweep Overlay */}
        <RadarSweep />
        
        {/* Simplified world map SVG */}
        <svg
          viewBox="0 0 800 400"
          className="w-full h-full"
          style={{ filter: 'brightness(0.3)' }}
        >
          {/* Simple world map outline */}
          <rect width="800" height="400" fill="hsl(var(--surface))" />
          
          {/* Continents as simple shapes */}
          <path
            d="M150 100 L300 80 L350 120 L300 180 L200 200 L120 150 Z"
            fill="hsl(var(--surface-elevated))"
            stroke="hsl(var(--border))"
          />
          <path
            d="M400 90 L600 70 L650 100 L600 160 L500 180 L420 140 Z"
            fill="hsl(var(--surface-elevated))"
            stroke="hsl(var(--border))"
          />
          <path
            d="M100 220 L280 200 L320 250 L280 320 L150 340 L80 280 Z"
            fill="hsl(var(--surface-elevated))"
            stroke="hsl(var(--border))"
          />
          <path
            d="M500 200 L700 180 L750 220 L700 280 L600 300 L520 260 Z"
            fill="hsl(var(--surface-elevated))"
            stroke="hsl(var(--border))"
          />
        </svg>

        {/* Emergency markers */}
        {emergencies.map((emergency) => {
          const { x, y } = projectToSVG(emergency.lat, emergency.lng);
          return (
            <div
              key={emergency.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{ left: `${(x / 800) * 100}%`, top: `${(y / 400) * 100}%` }}
              onClick={() => setSelectedEmergency(emergency)}
            >
              <div
                className="w-4 h-4 rounded-full animate-pulse-glow"
                style={{
                  backgroundColor: getSeverityColor(emergency.severity),
                  boxShadow: `0 0 20px ${getSeverityColor(emergency.severity)}`,
                }}
              />
              <div
                className="absolute top-0 left-0 w-4 h-4 rounded-full animate-emergency-pulse"
                style={{
                  backgroundColor: getSeverityColor(emergency.severity),
                }}
              />
            </div>
          );
        })}

        {/* Emergency details popup */}
        {selectedEmergency && (
          <div className="absolute top-4 right-4 w-80 bg-gradient-surface backdrop-blur-glass border border-border/50 rounded-lg p-4 shadow-glass animate-slide-up">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">{selectedEmergency.title}</h3>
              </div>
              <button
                onClick={() => setSelectedEmergency(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="text-foreground">{selectedEmergency.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Severity:</span>
                <Badge 
                  variant="secondary"
                  className={`text-xs bg-${selectedEmergency.severity}/20 text-${selectedEmergency.severity}-foreground border-${selectedEmergency.severity}/30 capitalize`}
                >
                  {selectedEmergency.severity}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Affected:</span>
                <span className="text-foreground">{selectedEmergency.affectedPeople.toLocaleString()} people</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coordinates:</span>
                <span className="text-foreground font-mono text-xs">
                  {selectedEmergency.lat.toFixed(4)}, {selectedEmergency.lng.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WorldMap;