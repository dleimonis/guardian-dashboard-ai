import { useState, useMemo, useEffect } from 'react';
import { useEmergency } from '@/contexts/EmergencyContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Header from '@/components/Header';
import AgentStatusCard from '@/components/AgentStatusCard';
import AlertCard from '@/components/AlertCard';
import StatisticsBar from '@/components/StatisticsBar';
import WorldMap from '@/components/WorldMap';
import EmergencyButton from '@/components/EmergencyButton';
import LiveTicker from '@/components/LiveTicker';
import InfoModal from '@/components/InfoModal';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';

const Index = () => {
  console.log('Index component rendering...');
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [isAgentsCollapsed, setIsAgentsCollapsed] = useState(() => {
    return localStorage.getItem('agentsCollapsed') === 'true';
  });
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
  const systemStatus = !isConnected ? 'demo' : agents.some(agent => agent.status === 'warning') ? 'degraded' : 'online';

  // Save agent collapse state
  useEffect(() => {
    localStorage.setItem('agentsCollapsed', String(isAgentsCollapsed));
  }, [isAgentsCollapsed]);

  const toggleAgentsCollapse = () => {
    setIsAgentsCollapsed(!isAgentsCollapsed);
  };

  console.log('Index component returning JSX...');
  
  return (
    <div className="min-h-screen bg-background">
      <ErrorBoundary fallback={<div className="p-4 text-warning">Header failed to load</div>}>
        <Header />
      </ErrorBoundary>
      
      <div className="flex h-[calc(100vh-128px)]">
        {/* Left Sidebar - Agent Status */}
        <div className={`${isAgentsCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 p-6 space-y-4 overflow-y-auto border-r border-border/50`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold text-foreground flex items-center ${isAgentsCollapsed ? 'hidden' : ''}`}>
              <div className={`w-2 h-2 ${isConnected ? 'bg-success' : 'bg-warning'} rounded-full mr-3 animate-pulse`} />
              Monitoring Agents
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAgentsCollapse}
              className="ml-auto"
              title={isAgentsCollapsed ? 'Expand agents' : 'Collapse agents'}
            >
              {isAgentsCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>
          {!isAgentsCollapsed && agents.map((agent, index) => (
            <AgentStatusCard
              key={agent.name}
              name={agent.name}
              description={agent.description}
              status={agent.status}
              type={agent.type}
              lastUpdate={agent.lastUpdate}
            />
          ))}
          {isAgentsCollapsed && (
            <div className="space-y-2">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    agent.status === 'online' ? 'bg-success/20' :
                    agent.status === 'warning' ? 'bg-warning/20' :
                    agent.status === 'error' ? 'bg-destructive/20' :
                    'bg-muted/20'
                  }`}
                  title={`${agent.name}: ${agent.status}`}
                >
                  <div className={`w-3 h-3 rounded-full ${
                    agent.status === 'online' ? 'bg-success' :
                    agent.status === 'warning' ? 'bg-warning' :
                    agent.status === 'error' ? 'bg-destructive' :
                    'bg-muted'
                  } ${agent.status === 'online' ? 'animate-pulse' : ''}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <ErrorBoundary fallback={<div className="p-4 text-warning">Statistics failed to load</div>}>
            <StatisticsBar
              activeEmergencies={activeEmergencies}
              peopleWarned={1247893}
              responseTime={18}
              systemStatus={systemStatus === 'demo' ? 'online' : systemStatus as 'online' | 'degraded' | 'offline'}
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

      {/* Info Modal */}
      <InfoModal />
    </div>
  );
};

export default Index;