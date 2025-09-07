import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, MapPin, ChevronDown, ChevronUp, Shield, Navigation } from 'lucide-react';
import { useAudioSystem } from '@/hooks/useAudioSystem';
import { useEffect, useState } from 'react';

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
  const [showActionPlan, setShowActionPlan] = useState(false);

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

  // Quick action items based on severity
  const getQuickActions = () => {
    if (severity === 'critical') {
      return [
        'Evacuate immediately if in danger zone',
        'Follow official evacuation routes',
        'Contact emergency services if needed'
      ];
    } else if (severity === 'warning') {
      return [
        'Monitor situation closely',
        'Prepare emergency supplies',
        'Stay informed through official channels'
      ];
    } else {
      return [
        'Stay aware of developing situation',
        'Check emergency preparedness',
        'Sign up for local alerts'
      ];
    }
  };

  const quickActions = getQuickActions();

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

      {/* Action Buttons */}
      <div className="space-y-2">
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
          <div className="text-xs text-success font-medium mb-2">
            ✓ Acknowledged
          </div>
        )}

        {/* Action Plan Toggle */}
        <Button
          onClick={() => setShowActionPlan(!showActionPlan)}
          size="sm"
          variant="outline"
          className="w-full text-xs"
        >
          <Shield className="w-3 h-3 mr-1" />
          {showActionPlan ? 'Hide' : 'View'} Action Plan
          {showActionPlan ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
        </Button>
      </div>

      {/* Expandable Action Plan */}
      {showActionPlan && (
        <div className="mt-3 p-3 bg-muted/30 dark:bg-muted/10 rounded-lg border border-border/50 animate-slide-down">
          <div className="flex items-center gap-2 mb-2">
            <Navigation className="w-4 h-4 text-primary" />
            <h4 className="text-xs font-semibold">Immediate Actions</h4>
          </div>
          <ul className="space-y-1">
            {quickActions.map((action, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                <span className="text-primary">•</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
          {severity === 'critical' && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <p className="text-xs text-warning font-medium">
                ⚠️ Emergency Services: Call 911
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default AlertCard;