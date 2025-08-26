import { useState } from 'react';
import Header from '@/components/Header';
import AgentStatusCard from '@/components/AgentStatusCard';
import AlertCard from '@/components/AlertCard';
import StatisticsBar from '@/components/StatisticsBar';
import WorldMap from '@/components/WorldMap';
import EmergencyButton from '@/components/EmergencyButton';
import LiveTicker from '@/components/LiveTicker';

const Index = () => {
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());

  // Mock data for agents
  const agents = [
    {
      name: 'FireWatcher',
      description: 'Monitoring NASA Satellites',
      status: 'online' as const,
      type: 'fire' as const,
      lastUpdate: '2 min ago',
    },
    {
      name: 'QuakeDetector',
      description: 'Scanning Seismic Activity',
      status: 'online' as const,
      type: 'earthquake' as const,
      lastUpdate: '1 min ago',
    },
    {
      name: 'WeatherTracker',
      description: 'Analyzing Storm Patterns',
      status: 'warning' as const,
      type: 'weather' as const,
      lastUpdate: '5 min ago',
    },
    {
      name: 'FloodMonitor',
      description: 'Checking Water Levels',
      status: 'online' as const,
      type: 'flood' as const,
      lastUpdate: '3 min ago',
    },
  ];

  // Mock data for alerts
  const alerts = [
    {
      id: '1',
      title: 'Wildfire Spreading',
      description: 'Fire detected in Los Angeles County. Wind conditions deteriorating. Immediate evacuation recommended for Zone 7.',
      location: 'Los Angeles, CA',
      severity: 'critical' as const,
      timestamp: '14:23',
    },
    {
      id: '2',
      title: 'Hurricane Approaching',
      description: 'Category 3 hurricane tracking towards Miami coastline. Expected landfall in 18 hours.',
      location: 'Miami, FL',
      severity: 'warning' as const,
      timestamp: '14:18',
    },
    {
      id: '3',
      title: 'Flood Warning',
      description: 'River levels rising rapidly due to heavy rainfall. Potential overflow in low-lying areas.',
      location: 'Houston, TX',
      severity: 'warning' as const,
      timestamp: '14:15',
    },
    {
      id: '4',
      title: 'Seismic Activity',
      description: 'Minor earthquake swarm detected. Monitoring for potential larger events.',
      location: 'San Francisco, CA',
      severity: 'watch' as const,
      timestamp: '14:12',
    },
    {
      id: '5',
      title: 'Severe Weather',
      description: 'Tornado warning issued for multiple counties. Take shelter immediately.',
      location: 'Oklahoma City, OK',
      severity: 'critical' as const,
      timestamp: '14:08',
    },
  ];

  const handleAcknowledgeAlert = (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
  };

  const activeEmergencies = alerts.filter(alert => alert.severity === 'critical').length;
  const systemStatus = agents.some(agent => agent.status === 'warning') ? 'degraded' : 'online';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="flex h-[calc(100vh-128px)]">
        {/* Left Sidebar - Agent Status */}
        <div className="w-80 p-6 space-y-4 overflow-y-auto">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <div className="w-2 h-2 bg-success rounded-full mr-3 animate-pulse" />
            Monitoring Agents
          </h2>
          {agents.map((agent, index) => (
            <AgentStatusCard
              key={agent.name}
              name={agent.name}
              description={agent.description}
              status={agent.status}
              type={agent.type}
              lastUpdate={agent.lastUpdate}
            />
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <StatisticsBar
            activeEmergencies={activeEmergencies}
            peopleWarned={1247893}
            responseTime={18}
            systemStatus={systemStatus as 'online' | 'degraded' | 'offline'}
          />
          <WorldMap />
        </div>

        {/* Right Sidebar - Alert Feed */}
        <div className="w-96 p-6 space-y-4 overflow-y-auto">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-critical rounded-full mr-3 animate-status-blink" />
              Alert Feed
            </div>
            <div className="text-sm text-muted-foreground">
              {alerts.filter(alert => !acknowledgedAlerts.has(alert.id)).length} unread
            </div>
          </h2>
          {alerts.map((alert) => (
            <AlertCard
              key={alert.id}
              id={alert.id}
              title={alert.title}
              description={alert.description}
              location={alert.location}
              severity={alert.severity}
              timestamp={alert.timestamp}
              isAcknowledged={acknowledgedAlerts.has(alert.id)}
              onAcknowledge={handleAcknowledgeAlert}
            />
          ))}
        </div>
      </div>

      {/* Bottom Ticker */}
      <LiveTicker />

      {/* Emergency Button */}
      <EmergencyButton />
    </div>
  );
};

export default Index;