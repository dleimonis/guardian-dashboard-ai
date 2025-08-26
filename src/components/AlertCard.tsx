import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, MapPin } from 'lucide-react';
import { useAudioSystem } from '@/hooks/useAudioSystem';
import { useEffect } from 'react';

export type AlertSeverity = 'critical' | 'warning' | 'watch';

interface AlertCardProps {
  id: string;
  title: string;
  description: string;
  location: string;
  severity: AlertSeverity;
  timestamp: string;
  isAcknowledged?: boolean;
  onAcknowledge?: (id: string) => void;
  isNew?: boolean;
}

const AlertCard = ({ 
  id, 
  title, 
  description, 
  location, 
  severity, 
  timestamp, 
  isAcknowledged = false,
  onAcknowledge,
  isNew = false
}: AlertCardProps) => {
  const { playSound } = useAudioSystem();

  useEffect(() => {
    if (isNew && !isAcknowledged) {
      playSound(severity === 'critical' ? 'emergency' : 'alert');
    }
  }, [isNew, isAcknowledged, severity, playSound]);

  const getSeverityColor = (severity: AlertSeverity) => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'warning':
        return 'warning';
      case 'watch':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const severityColor = getSeverityColor(severity);

  return (
    <Card 
      className={`p-4 bg-gradient-surface backdrop-blur-glass border-border/50 shadow-glass transition-all duration-300 ${
        !isAcknowledged && severity === 'critical' ? 'animate-pulse-glow' : 'hover:shadow-glow-secondary'
      } ${isNew ? 'animate-slide-in-right-glow' : 'animate-slide-up'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <AlertTriangle className={`w-4 h-4 text-${severityColor}`} />
          <Badge 
            variant="secondary"
            className={`text-xs bg-${severityColor}/20 text-${severityColor}-foreground border-${severityColor}/30 uppercase font-bold`}
          >
            {severity}
          </Badge>
        </div>
        <div className={`w-2 h-2 rounded-full bg-${severityColor} ${!isAcknowledged ? 'animate-status-blink' : ''}`} />
      </div>

      <h3 className="font-semibold text-foreground text-sm mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{description}</p>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
        <div className="flex items-center space-x-1">
          <MapPin className="w-3 h-3" />
          <span>{location}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{timestamp}</span>
        </div>
      </div>

      {!isAcknowledged && onAcknowledge && (
        <Button
          onClick={() => onAcknowledge(id)}
          size="sm"
          variant="glass"
          className="w-full"
        >
          Acknowledge
        </Button>
      )}

      {isAcknowledged && (
        <div className="text-xs text-success font-medium">
          ✓ Acknowledged
        </div>
      )}
    </Card>
  );
};

export default AlertCard;