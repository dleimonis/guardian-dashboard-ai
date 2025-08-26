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
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'hsl(var(--critical))';
      case 'warning':
        return 'hsl(var(--warning))';
      case 'watch':
        return 'hsl(var(--success))';
      default:
        return 'hsl(var(--secondary))';
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

      <div className="relative w-full h-full min-h-[400px] bg-surface/50 rounded-lg overflow-hidden">
        {/* Radar Sweep Overlay */}
        <RadarSweep />
        
        {/* World map SVG */}
        <svg
          viewBox="0 0 1000 500"
          className="w-full h-full"
        >
          {/* Ocean background */}
          <rect width="1000" height="500" fill="hsl(220 15% 10%)" />
          
          {/* Grid lines for reference */}
          <g stroke="hsl(var(--border))" strokeWidth="0.5" opacity="0.3">
            {[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map(x => (
              <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" />
            ))}
            {[0, 100, 200, 300, 400, 500].map(y => (
              <line key={`h${y}`} x1="0" y1={y} x2="1000" y2={y} />
            ))}
          </g>

          {/* Simplified world continents - more recognizable shapes */}
          <g fill="hsl(220 15% 18%)" stroke="hsl(var(--secondary) / 0.5)" strokeWidth="1">
            {/* North America */}
            <path d="M 150 150 Q 200 120 250 140 L 280 160 L 290 180 L 280 200 L 260 220 L 240 240 L 220 250 L 200 240 L 180 220 L 160 200 L 150 180 Z" />
            
            {/* South America */}
            <path d="M 220 260 L 240 280 L 250 320 L 240 360 L 220 400 L 200 420 L 180 400 L 170 360 L 180 320 L 190 280 L 210 260 Z" />
            
            {/* Europe */}
            <path d="M 480 140 L 520 130 L 540 140 L 530 160 L 510 170 L 490 160 L 480 150 Z" />
            
            {/* Africa */}
            <path d="M 470 200 L 510 190 L 530 210 L 540 250 L 530 300 L 510 340 L 490 360 L 470 340 L 460 300 L 460 250 L 470 210 Z" />
            
            {/* Asia */}
            <path d="M 550 120 L 650 110 L 750 130 L 800 150 L 820 180 L 800 200 L 750 190 L 700 180 L 650 170 L 600 160 L 550 150 Z" />
            
            {/* Australia */}
            <path d="M 720 320 L 780 310 L 800 330 L 790 360 L 760 370 L 730 360 L 720 340 Z" />
          </g>

          {/* Country borders (subtle) */}
          <g stroke="hsl(var(--border) / 0.2)" strokeWidth="0.5" fill="none">
            <path d="M 200 140 L 210 160 M 230 150 L 240 170" />
            <path d="M 500 140 L 510 150 M 520 145 L 530 155" />
            <path d="M 600 130 L 620 140 M 680 135 L 700 145" />
          </g>

          {/* Emergency markers */}
          {emergencies.map((emergency) => {
            const { x, y } = projectToSVG(emergency.lat, emergency.lng);
            return (
              <g
                key={emergency.id}
                onClick={() => setSelectedEmergency(emergency)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse rings */}
                <circle
                  cx={x}
                  cy={y}
                  r="20"
                  fill="none"
                  stroke={getSeverityColor(emergency.severity)}
                  strokeWidth="1"
                  opacity="0.3"
                  className="animate-ping"
                />
                <circle
                  cx={x}
                  cy={y}
                  r="15"
                  fill="none"
                  stroke={getSeverityColor(emergency.severity)}
                  strokeWidth="1"
                  opacity="0.5"
                  className="animate-ping"
                  style={{ animationDelay: '0.5s' }}
                />
                
                {/* Main marker */}
                <circle
                  cx={x}
                  cy={y}
                  r="6"
                  fill={getSeverityColor(emergency.severity)}
                  stroke="white"
                  strokeWidth="2"
                  className="animate-pulse"
                />
                
                {/* Glow effect */}
                <circle
                  cx={x}
                  cy={y}
                  r="8"
                  fill={getSeverityColor(emergency.severity)}
                  opacity="0.3"
                  filter="blur(4px)"
                />
              </g>
            );
          })}
        </svg>

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

            <div className="mt-4 pt-3 border-t border-border/30">
              <button className="w-full px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-md transition-colors text-sm font-medium">
                View Details
              </button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WorldMap;