import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, Brain, Users, Zap, Globe, AlertTriangle, Bot } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const InfoModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed bottom-4 right-4 z-40 bg-white/80 dark:bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all"
          title="About Guardian Dashboard AI"
        >
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Guardian Dashboard AI
          </DialogTitle>
          <DialogDescription>
            Multi-Agent AI System for Global Disaster Response
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="agents">AI Agents</TabsTrigger>
            <TabsTrigger value="demo">Demo Mode</TabsTrigger>
            <TabsTrigger value="hackathon">Hackathon</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">What is Guardian Dashboard?</h3>
              <p className="text-sm text-muted-foreground">
                Guardian Dashboard AI is an advanced emergency response system that uses multiple AI agents
                to monitor, analyze, and respond to disasters worldwide in real-time. Built for the MCP Hackathon,
                it demonstrates the power of coordinated AI systems in crisis management.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Globe className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Global Coverage</h4>
                    <p className="text-xs text-muted-foreground">
                      Monitors disasters worldwide using NASA, USGS, and NOAA data
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Real-time Response</h4>
                    <p className="text-xs text-muted-foreground">
                      Instant alerts and coordinated emergency response
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Brain className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">AI-Powered</h4>
                    <p className="text-xs text-muted-foreground">
                      11 specialized agents working in coordinated squads
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Public Safety</h4>
                    <p className="text-xs text-muted-foreground">
                      Designed to save lives through early warning systems
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="agents" className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Multi-Agent Architecture
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                <h4 className="font-medium text-sm mb-2">Detection Squad (4 agents)</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• FireWatcher - NASA FIRMS satellite fire detection</li>
                  <li>• QuakeDetector - USGS earthquake monitoring</li>
                  <li>• WeatherTracker - NOAA severe weather tracking</li>
                  <li>• FloodMonitor - Water level and flood detection</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                <h4 className="font-medium text-sm mb-2">Analysis Squad (3 agents)</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• ThreatAnalyzer - Risk assessment and severity analysis</li>
                  <li>• ImpactPredictor - Population impact predictions</li>
                  <li>• PatternRecognizer - Historical pattern analysis</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                <h4 className="font-medium text-sm mb-2">Action Squad (4 agents)</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• AlertDispatcher - Emergency alert distribution</li>
                  <li>• ResourceCoordinator - Resource allocation</li>
                  <li>• EvacuationPlanner - Evacuation route planning</li>
                  <li>• CommunicationHub - Multi-channel notifications</li>
                </ul>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              All agents communicate through a centralized orchestrator for coordinated response.
            </p>
          </TabsContent>

          <TabsContent value="demo" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Demo Mode Active
              </h3>
              <p className="text-sm text-muted-foreground">
                You're currently running Guardian Dashboard in demo mode, perfect for testing and evaluation.
              </p>

              <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 space-y-2">
                <h4 className="font-medium text-sm">Demo Features:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ All 11 AI agents running with simulated data</li>
                  <li>✓ Real-time WebSocket updates (when backend is running)</li>
                  <li>✓ Interactive map with sample emergency locations</li>
                  <li>✓ Alert acknowledgment and management</li>
                  <li>✓ No API keys required for testing</li>
                </ul>
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 space-y-2">
                <h4 className="font-medium text-sm">To Enable Live Data:</h4>
                <ol className="text-xs text-muted-foreground space-y-1">
                  <li>1. Obtain API keys from NASA FIRMS, USGS, and NOAA</li>
                  <li>2. Configure Descope authentication</li>
                  <li>3. Enter keys in the authentication screen</li>
                  <li>4. System will switch to live monitoring mode</li>
                </ol>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hackathon" className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">MCP Hackathon Submission</h3>
              
              <div className="flex flex-wrap gap-2">
                <Badge>MCP Hackathon 2024</Badge>
                <Badge variant="secondary">Multi-Agent AI</Badge>
                <Badge variant="outline">Disaster Response</Badge>
              </div>

              <div className="space-y-3 mt-4">
                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm mb-1">Project Theme</h4>
                  <p className="text-xs text-muted-foreground">
                    Multi-Agent Orchestration for Emergency Response - demonstrating how AI agents
                    can work together to save lives during disasters.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm mb-1">Key Innovations</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Squad-based agent architecture for specialized tasks</li>
                    <li>• Real-time data integration from multiple sources</li>
                    <li>• Intelligent alert prioritization and distribution</li>
                    <li>• Visual monitoring with interactive global map</li>
                  </ul>
                </div>

                <div className="p-3 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-sm mb-1">Tech Stack</h4>
                  <p className="text-xs text-muted-foreground">
                    React 18.3 • TypeScript • Node.js • Express • WebSockets • 
                    Leaflet Maps • Descope Auth • Docker • PostgreSQL • Redis
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-success/10 border border-success/30">
                  <h4 className="font-medium text-sm mb-1">Compliance</h4>
                  <p className="text-xs text-muted-foreground">
                    ✓ Fully functional demo mode • ✓ No API keys required for testing • 
                    ✓ All agents operational • ✓ Ready for evaluation
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            Built with care for the MCP Hackathon 2024 • Theme: Multi-Agent AI Systems
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InfoModal;