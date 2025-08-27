import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Eye, Activity, CloudRain, Waves } from 'lucide-react';

export type AgentStatus = 'online' | 'warning' | 'offline' | 'error';

interface AgentStatusCardProps {
  name: string;
  description: string;
  status: AgentStatus;
  lastUpdate?: string;
  type: 'fire' | 'earthquake' | 'weather' | 'flood';
}

const AgentStatusCard = ({ name, description, status, lastUpdate, type }: AgentStatusCardProps) => {
  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'online':
        return 'bg-success/20 text-success border-success/30';
      case 'warning':
        return 'bg-warning/20 text-warning border-warning/30';
      case 'error':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'offline':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'fire':
        return <Eye className="w-5 h-5" />;
      case 'earthquake':
        return <Activity className="w-5 h-5" />;
      case 'weather':
        return <CloudRain className="w-5 h-5" />;
      case 'flood':
        return <Waves className="w-5 h-5" />;
      default:
        return <Eye className="w-5 h-5" />;
    }
  };

  const getStatusDotColor = (status: AgentStatus) => {
    switch (status) {
      case 'online':
        return 'bg-success';
      case 'warning':
        return 'bg-warning';
      case 'error':
        return 'bg-destructive';
      case 'offline':
        return 'bg-muted-foreground';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusIconColor = (status: AgentStatus) => {
    switch (status) {
      case 'online':
        return 'bg-success/20 text-success';
      case 'warning':
        return 'bg-warning/20 text-warning';
      case 'error':
        return 'bg-destructive/20 text-destructive';  
      case 'offline':
        return 'bg-muted/20 text-muted-foreground';
      default:
        return 'bg-muted/20 text-muted-foreground';
    }
  };

  const statusColor = getStatusColor(status);
  const statusDotColor = getStatusDotColor(status);
  const statusIconColor = getStatusIconColor(status);

  return (
    <Card className={`p-4 bg-gradient-surface backdrop-blur-glass border-border/50 shadow-glass hover:shadow-glow-secondary transition-all duration-300 animate-slide-up ${status === 'online' ? 'animate-agent-pulse' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${statusIconColor}`}>
            {getIcon(type)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{name}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          <div className={`w-3 h-3 rounded-full ${statusDotColor} shadow-glow-secondary animate-pulse`} />
          <Badge 
            variant="secondary" 
            className={`text-xs ${statusColor} capitalize`}
          >
            {status}
          </Badge>
        </div>
      </div>
      
      {lastUpdate && (
        <div className="text-xs text-muted-foreground">
          Last update: {lastUpdate}
        </div>
      )}
    </Card>
  );
};

export default AgentStatusCard;