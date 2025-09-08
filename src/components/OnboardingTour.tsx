import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Play, 
  SkipForward, 
  RefreshCw,
  CheckCircle,
  Info,
  Map,
  Users,
  Bell,
  AlertTriangle,
  Shield
} from 'lucide-react';

interface OnboardingTourProps {
  autoStart?: boolean;
  onComplete?: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ autoStart = false, onComplete }) => {
  const [run, setRun] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { toast } = useToast();

  const steps: Step[] = [
    {
      target: '#disaster-map',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Map className="h-4 w-4" />
            Real-Time Disaster Map
          </h3>
          <p>This interactive map shows disasters as they happen worldwide. Red markers indicate critical events, orange for high severity, and yellow for medium.</p>
        </div>
      ),
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#agent-status',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            AI Agent Status
          </h3>
          <p>These cards show the status of our 12+ automated agents that monitor different disaster sources 24/7. Green means online and actively monitoring.</p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '#alert-feed',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alert Feed
          </h3>
          <p>Critical alerts appear here in real-time. You can acknowledge or dismiss alerts, and they're automatically sorted by severity and time.</p>
        </div>
      ),
      placement: 'left',
    },
    {
      target: '#statistics-bar',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Info className="h-4 w-4" />
            Live Statistics
          </h3>
          <p>Monitor system performance and activity metrics. See active emergencies, people warned, response times, and overall system status.</p>
        </div>
      ),
      placement: 'top',
    },
    {
      target: '#emergency-button',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Emergency Simulation
          </h3>
          <p>Test the system with realistic disaster scenarios! Click this button to run simulations including the MEGA DISASTER mode with multiple simultaneous events.</p>
        </div>
      ),
      placement: 'top-start',
    },
    {
      target: '#notification-center',
      content: (
        <div className="space-y-2">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notification Settings
          </h3>
          <p>Configure how you receive alerts - browser notifications, sounds, and more. Make sure to enable notifications for critical alerts!</p>
        </div>
      ),
      placement: 'bottom',
    },
  ];

  // Check if user has completed tour before
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('guardian-tour-completed');
    const isFirstVisit = !hasCompletedTour;

    if (isFirstVisit && autoStart) {
      // Show welcome message first
      setShowWelcome(true);
    }
  }, [autoStart]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, type } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('guardian-tour-completed', 'true');
      
      if (status === STATUS.FINISHED) {
        toast({
          title: 'Tour Complete!',
          description: 'You now know the basics of Guardian Dashboard. Stay safe!',
          duration: 5000,
        });
        onComplete?.();
      }
    }
  };

  const startTour = () => {
    setShowWelcome(false);
    setRun(true);
  };

  const skipTour = () => {
    setShowWelcome(false);
    localStorage.setItem('guardian-tour-completed', 'true');
    toast({
      title: 'Tour Skipped',
      description: 'You can restart the tour anytime from the settings menu.',
    });
  };

  const restartTour = () => {
    setRun(true);
  };

  // Welcome Modal
  if (showWelcome) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="max-w-lg">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to Guardian Dashboard!</CardTitle>
            </div>
            <CardDescription className="text-base">
              Your AI-powered emergency management system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Guardian Dashboard uses 12+ automated agents to monitor disasters worldwide and send you real-time alerts. 
              Let's take a quick tour to show you how everything works!
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Map className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Interactive disaster map</p>
                  <p className="text-sm text-muted-foreground">See real-time disasters worldwide</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">AI agent monitoring</p>
                  <p className="text-sm text-muted-foreground">24/7 automated disaster detection</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Bell className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Smart notifications</p>
                  <p className="text-sm text-muted-foreground">Multi-channel alerts for your safety</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 pt-2">
              <Button onClick={startTour} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Start Tour
              </Button>
              <Button onClick={skipTour} variant="outline" className="flex-1">
                <SkipForward className="h-4 w-4 mr-2" />
                Skip for Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Joyride
        steps={steps}
        run={run}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#dc2626',
            zIndex: 10000,
          },
          buttonNext: {
            backgroundColor: '#dc2626',
            color: '#fff',
          },
          buttonBack: {
            color: '#666',
          },
          tooltip: {
            borderRadius: '8px',
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />
      
      {/* Restart Tour Button (shown in settings or help menu) */}
      {!run && !showWelcome && (
        <Button
          onClick={restartTour}
          variant="outline"
          size="sm"
          className="hidden"
          id="restart-tour-button"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Restart Tour
        </Button>
      )}
    </>
  );
};

export default OnboardingTour;