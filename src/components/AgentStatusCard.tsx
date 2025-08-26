import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Eye, Activity, CloudRain, Waves } from 'lucide-react';

export type AgentStatus = 'online' | 'warning' | 'offline';

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
        return 'success';
      case 'warning':
        return 'warning';
      case 'offline':
        return 'critical';
      default:
        return 'success';
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

  const statusColor = getStatusColor(status);

  return (
    <Card className="p-4 bg-gradient-surface backdrop-blur-glass border-border/50 shadow-glass hover:shadow-glow-secondary transition-all duration-300 animate-slide-up">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg bg-${statusColor}/20 text-${statusColor}`}>
            {getIcon(type)}
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">{name}</h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-1">
          <div className={`w-3 h-3 rounded-full bg-${statusColor} shadow-glow-secondary animate-pulse`} />
          <Badge 
            variant="secondary" 
            className={`text-xs bg-${statusColor}/20 text-${statusColor}-foreground border-${statusColor}/30 capitalize`}
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