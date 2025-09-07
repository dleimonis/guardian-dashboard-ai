import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, Activity, CloudRain, Waves, Info, Flame } from 'lucide-react';

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
        return <Flame className="w-5 h-5" />;
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

  const getAgentInfo = (type: string) => {
    switch (type) {
      case 'fire':
        return 'Monitors NASA FIRMS satellite data for active fire detection';
      case 'earthquake':
        return 'Tracks USGS seismic activity and earthquake reports worldwide';
      case 'weather':
        return 'Analyzes NOAA weather patterns for severe storm detection';
      case 'flood':
        return 'Monitors water levels and flood risk from multiple sources';
      default:
        return 'AI-powered monitoring agent for disaster detection';
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
    <Card className={`p-4 bg-white/5 dark:bg-gradient-surface backdrop-blur-sm border-gray-200 dark:border-border/50 shadow-sm dark:shadow-glass hover:shadow-md dark:hover:shadow-glow-secondary transition-all duration-300 ${status === 'online' ? 'animate-agent-pulse' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl ${statusIconColor} transition-colors duration-200`}>
            {getIcon(type)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-foreground text-sm">{name}</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">{getAgentInfo(type)}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-gray-600 dark:text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          <div className={`w-2.5 h-2.5 rounded-full ${statusDotColor} ${status === 'online' ? 'animate-pulse shadow-lg' : ''}`} />
          <Badge 
            variant="secondary" 
            className={`text-xs font-medium ${statusColor} capitalize`}
          >
            {status}
          </Badge>
        </div>
      </div>
      
      {lastUpdate && (
        <div className="text-xs text-gray-500 dark:text-muted-foreground border-t border-gray-100 dark:border-border/30 pt-2 mt-2">
          <span className="font-medium">Last check:</span> {lastUpdate}
        </div>
      )}
    </Card>
  );
};

export default AgentStatusCard;