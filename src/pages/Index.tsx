import { useState, useMemo } from 'react';
import { useEmergency } from '@/contexts/EmergencyContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Header from '@/components/Header';
import AgentStatusCard from '@/components/AgentStatusCard';
import AlertCard from '@/components/AlertCard';
import StatisticsBar from '@/components/StatisticsBar';
import WorldMap from '@/components/WorldMap';
import EmergencyButton from '@/components/EmergencyButton';
import LiveTicker from '@/components/LiveTicker';

const Index = () => {
  console.log('Index component rendering...');
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const { alerts: contextAlerts, agentStatuses, isConnected, acknowledgeAlert: contextAcknowledgeAlert } = useEmergency();

  // Convert agent statuses to display format
  const agents = useMemo(() => {
    const defaultAgents = [
      { name: 'FireWatcher', description: 'Monitoring NASA Satellites', type: 'fire' as const },
      { name: 'QuakeDetector', description: 'Scanning Seismic Activity', type: 'earthquake' as const },
      { name: 'WeatherTracker', description: 'Analyzing Storm Patterns', type: 'weather' as const },
      { name: 'FloodMonitor', description: 'Checking Water Levels', type: 'flood' as const },
    ];

    return defaultAgents.map(agent => {
      const status = agentStatuses[agent.name];
      return {
        ...agent,
        status: (status?.status || 'online') as 'online' | 'warning' | 'offline' | 'error',
        lastUpdate: status?.lastActivity ? 
          `${Math.floor((Date.now() - new Date(status.lastActivity).getTime()) / 60000)} min ago` :
          '1 min ago',
      };
    });
  }, [agentStatuses]);

  // Use context alerts or fallback to mock data
  const alerts = useMemo(() => {
    if (contextAlerts && contextAlerts.length > 0) {
      return contextAlerts.map(alert => ({
        id: alert.id,
        title: alert.title,
        description: alert.description || '',
        location: typeof alert.location === 'string' ? alert.location : 'Unknown',
        severity: (alert.severity || 'warning') as 'critical' | 'warning' | 'watch',
        timestamp: new Date(alert.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      }));
    }
    
    // Fallback mock data
    return [
      {
        id: '1',
        title: 'System Active',
        description: isConnected ? 'Connected to emergency monitoring system' : 'Running in demo mode',
        location: 'System Wide',
        severity: 'watch' as const,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  }, [contextAlerts, isConnected]);

  const handleAcknowledgeAlert = async (alertId: string) => {
    setAcknowledgedAlerts(prev => new Set([...prev, alertId]));
    // Also acknowledge in context
    await contextAcknowledgeAlert(alertId);
  };

  const activeEmergencies = alerts.filter(alert => alert.severity === 'critical').length;
  const systemStatus = !isConnected ? 'offline' : agents.some(agent => agent.status === 'warning') ? 'degraded' : 'online';

  console.log('Index component returning JSX...');
  
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary fallback={<div className="p-4 text-warning">Header failed to load</div>}>
        <Header />
      </ErrorBoundary>
      
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
          <ErrorBoundary fallback={<div className="p-4 text-warning">Statistics failed to load</div>}>
            <StatisticsBar
              activeEmergencies={activeEmergencies}
              peopleWarned={1247893}
              responseTime={18}
              systemStatus={systemStatus as 'online' | 'degraded' | 'offline'}
            />
          </ErrorBoundary>
          <ErrorBoundary fallback={<div className="p-4 text-warning">Map failed to load</div>}>
            <WorldMap />
          </ErrorBoundary>
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
              {!isConnected && ' (Offline)'}
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
      <ErrorBoundary fallback={<div className="p-2 text-warning text-center">Live updates unavailable</div>}>
        <LiveTicker />
      </ErrorBoundary>

      {/* Emergency Button */}
      <ErrorBoundary fallback={null}>
        <EmergencyButton />
      </ErrorBoundary>
    </div>
  );
};

export default Index;