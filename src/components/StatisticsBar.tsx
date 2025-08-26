import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Users, Clock, Activity } from 'lucide-react';
import CountUpNumber from '@/components/CountUpNumber';

interface StatisticsBarProps {
  activeEmergencies: number;
  peopleWarned: number;
  responseTime: number;
  systemStatus: 'online' | 'degraded' | 'offline';
}

const StatisticsBar = ({ activeEmergencies, peopleWarned, responseTime, systemStatus }: StatisticsBarProps) => {
  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'offline':
        return 'critical';
      default:
        return 'success';
    }
  };

  const statusColor = getSystemStatusColor(systemStatus);

  const stats = [
    {
      label: 'Active Emergencies',
      value: activeEmergencies,
      icon: AlertTriangle,
      color: activeEmergencies > 0 ? 'critical' : 'success',
    },
    {
      label: 'People Warned',
      value: peopleWarned.toLocaleString(),
      icon: Users,
      color: 'secondary',
    },
    {
      label: 'Response Time',
      value: `${responseTime}s`,
      icon: Clock,
      color: responseTime < 30 ? 'success' : responseTime < 60 ? 'warning' : 'critical',
    },
    {
      label: 'System Status',
      value: systemStatus.toUpperCase(),
      icon: Activity,
      color: statusColor,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className="p-4 bg-gradient-surface backdrop-blur-glass border-border/50 shadow-glass hover:shadow-glow-secondary transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
              <p className={`text-lg font-bold text-${stat.color}`}>
                {stat.label === 'People Warned' ? (
                  <CountUpNumber value={peopleWarned} formatter={(n) => n.toLocaleString()} />
                ) : stat.label === 'Active Emergencies' ? (
                  <CountUpNumber value={activeEmergencies} />
                ) : stat.label === 'Response Time' ? (
                  <CountUpNumber value={responseTime} formatter={(n) => `${n}s`} />
                ) : (
                  stat.value
                )}
              </p>
            </div>
            <div className={`p-2 rounded-lg bg-${stat.color}/20`}>
              <stat.icon className={`w-5 h-5 text-${stat.color}`} />
            </div>
          </div>
          
          {stat.label === 'System Status' && (
            <div className="flex items-center mt-2">
              <div className={`w-2 h-2 rounded-full bg-${stat.color} mr-2 animate-pulse`} />
              <Badge 
                variant="secondary"
                className={`text-xs bg-${stat.color}/20 text-${stat.color}-foreground border-${stat.color}/30`}
              >
                {systemStatus}
              </Badge>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};

export default StatisticsBar;