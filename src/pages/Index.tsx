import { useState, useMemo, useEffect } from 'react';
import { useEmergency } from '@/contexts/EmergencyContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import ErrorBoundary from '@/components/ErrorBoundary';
import AgentStatusCard from '@/components/AgentStatusCard';
import AlertCard from '@/components/AlertCard';
import StatisticsBar from '@/components/StatisticsBar';
import WorldMap from '@/components/WorldMap';
import EmergencyButton from '@/components/EmergencyButton';
import LiveTicker from '@/components/LiveTicker';
import InfoModal from '@/components/InfoModal';
import CommunityReport from '@/components/CommunityReport';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import OnboardingTour from '@/components/OnboardingTour';
import { LivesSavedCounter } from '@/components/LivesSavedCounter';
import { AgentDecisionLog } from '@/components/AgentDecisionLog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronDown, ChevronUp, Minimize2, Maximize2, Activity, AlertTriangle, BarChart3 } from 'lucide-react';

const Index = () => {
  console.log('Index component rendering...');
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState<Set<string>>(new Set());
  const [isAgentsCollapsed, setIsAgentsCollapsed] = useState(() => {
    return localStorage.getItem('agentsCollapsed') === 'true';
  });
  const [mobileAgentsOpen, setMobileAgentsOpen] = useState(false);
  const [mobileAlertsOpen, setMobileAlertsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const { alerts: contextAlerts, agentStatuses, isConnected, acknowledgeAlert: contextAcknowledgeAlert } = useEmergency();
  const { isMobile, isTablet, isDesktop } = useIsMobile();

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
      <OnboardingTour autoStart={true} />
      <div className={`${isMobile ? 'flex-col' : 'flex'} h-[calc(100vh-128px)]`}>
        {/* Left Sidebar - Agent Status (Desktop only, mobile uses Sheet) */}
        {!isMobile && (
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
          {!isAgentsCollapsed && (
            <>
              {/* Lives Saved Counter - Shows impact */}
              <LivesSavedCounter />
              
              {/* Agent Cards */}
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
            </>
          )}
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
        )}

        {/* Main Content Area */}
        <div className={`flex-1 ${isMobile ? 'p-2' : 'p-6'}`}>
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

        {/* Right Sidebar - Alert Feed & Decision Log (Desktop only, mobile uses Sheet) */}
        {!isMobile && (
          <div className="w-96 p-6 space-y-4 overflow-y-auto">
          {/* Agent Decision Log - Shows AI autonomy */}
          <AgentDecisionLog />
          
          {/* Alert Feed */}
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
        )}
      </div>

      {/* Mobile Floating Action Buttons */}
      {isMobile && (
        <div className="fixed bottom-20 left-4 right-4 flex justify-between z-40">
          {/* Agents Button */}
          <Sheet open={mobileAgentsOpen} onOpenChange={setMobileAgentsOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="rounded-full shadow-lg"
                variant="outline"
              >
                <Activity className="h-5 w-5 mr-2" />
                Agents
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {agents.filter(a => a.status === 'online').length}/{agents.length}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[90%] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Monitoring Agents</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[70vh]">
                {agents.map((agent) => (
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
            </SheetContent>
          </Sheet>

          {/* Alerts Button */}
          <Sheet open={mobileAlertsOpen} onOpenChange={setMobileAlertsOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="rounded-full shadow-lg"
                variant={alerts.filter(a => !acknowledgedAlerts.has(a.id)).length > 0 ? 'destructive' : 'outline'}
              >
                <AlertTriangle className="h-5 w-5 mr-2" />
                Alerts
                {alerts.filter(a => !acknowledgedAlerts.has(a.id)).length > 0 && (
                  <span className="ml-2 bg-background text-foreground rounded-full px-2 py-0.5 text-xs">
                    {alerts.filter(a => !acknowledgedAlerts.has(a.id)).length}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[90%] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Alert Feed</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-3 overflow-y-auto max-h-[70vh]">
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
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Bottom Ticker */}
      <ErrorBoundary fallback={<div className="p-2 text-warning text-center">Live updates unavailable</div>}>
        <LiveTicker />
      </ErrorBoundary>

      {/* Emergency Button */}
      <ErrorBoundary fallback={null}>
        <EmergencyButton />
      </ErrorBoundary>

      {/* Analytics Dashboard Button */}
      <div className={`fixed ${isMobile ? 'bottom-52 right-4' : 'bottom-44 right-6'} z-50`}>
        {isMobile ? (
          <Sheet open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
                title="View Analytics Dashboard"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh]">
              <SheetHeader>
                <SheetTitle>Analytics Dashboard</SheetTitle>
              </SheetHeader>
              <div className="mt-4 overflow-y-auto h-[calc(100%-4rem)]">
                <AnalyticsDashboard />
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <Dialog open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="rounded-full shadow-lg bg-primary hover:bg-primary/90"
                title="View Analytics Dashboard"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Analytics Dashboard</DialogTitle>
              </DialogHeader>
              <AnalyticsDashboard />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Community Report Button */}
      <div className={`fixed ${isMobile ? 'bottom-32 right-4' : 'bottom-24 right-6'} z-50`}>
        <CommunityReport 
          onSubmit={(report) => {
            console.log('Community report submitted:', report);
            // Report will be handled by backend and broadcast via WebSocket
          }}
        />
      </div>

      {/* Info Modal */}
      <InfoModal />
    </div>
  );
};

export default Index;