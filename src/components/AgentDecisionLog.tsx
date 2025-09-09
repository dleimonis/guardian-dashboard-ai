import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, Shield, Zap } from 'lucide-react';

interface Decision {
  id: string;
  agent: string;
  squad: 'detection' | 'analysis' | 'action';
  timestamp: string;
  decision: string;
  reasoning: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export function AgentDecisionLog() {
  const [decisions, setDecisions] = React.useState<Decision[]>([]);

  React.useEffect(() => {
    // Simulate agent decisions being made
    const interval = setInterval(() => {
      const newDecision = generateDecision();
      setDecisions(prev => [newDecision, ...prev].slice(0, 20)); // Keep last 20 decisions
    }, 5000); // New decision every 5 seconds

    // Add initial decisions
    setDecisions([
      generateDecision(),
      generateDecision(),
      generateDecision(),
    ]);

    return () => clearInterval(interval);
  }, []);

  const generateDecision = (): Decision => {
    const decisions = [
      {
        agent: 'FireWatcher',
        squad: 'detection' as const,
        decision: 'Detected heat anomaly in California',
        reasoning: 'Satellite thermal imaging shows 15°C above normal. Vegetation dryness index at 0.8. Wind speed 25mph.',
        confidence: 0.92,
        impact: 'high' as const,
      },
      {
        agent: 'ThreatAnalyzer',
        squad: 'analysis' as const,
        decision: 'Elevated threat level to CRITICAL',
        reasoning: 'Fire spread model predicts 5000 acres affected in 6 hours. Population density: 2500/sq mi. Infrastructure at risk.',
        confidence: 0.87,
        impact: 'critical' as const,
      },
      {
        agent: 'AlertDispatcher',
        squad: 'action' as const,
        decision: 'Initiated mass evacuation alert',
        reasoning: 'Critical threat confirmed. 15,000 residents in danger zone. Emergency services notified. Evacuation routes calculated.',
        confidence: 0.95,
        impact: 'critical' as const,
      },
      {
        agent: 'QuakeDetector',
        squad: 'detection' as const,
        decision: 'Monitoring seismic activity in Japan',
        reasoning: 'P-wave detected at 3 stations. Magnitude estimate: 4.2. Depth: 10km. No tsunami risk.',
        confidence: 0.78,
        impact: 'medium' as const,
      },
      {
        agent: 'RouteCalculator',
        squad: 'analysis' as const,
        decision: 'Optimized evacuation routes',
        reasoning: 'Traffic analysis complete. 3 primary routes selected. Estimated evacuation time: 2.5 hours. Avoiding congestion points.',
        confidence: 0.91,
        impact: 'high' as const,
      },
    ];

    const selected = decisions[Math.floor(Math.random() * decisions.length)];
    
    return {
      id: `decision-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      ...selected,
    };
  };

  const getSquadIcon = (squad: string) => {
    switch (squad) {
      case 'detection':
        return <AlertTriangle className="h-4 w-4" />;
      case 'analysis':
        return <Brain className="h-4 w-4" />;
      case 'action':
        return <Shield className="h-4 w-4" />;
      default:
        return <Zap className="h-4 w-4" />;
    }
  };

  const getSquadColor = (squad: string) => {
    switch (squad) {
      case 'detection':
        return 'bg-blue-500';
      case 'analysis':
        return 'bg-purple-500';
      case 'action':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Agent Decision Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className="border rounded-lg p-3 space-y-2 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${getSquadColor(decision.squad)}`}>
                      {getSquadIcon(decision.squad)}
                    </div>
                    <div>
                      <div className="font-semibold">{decision.agent}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(decision.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {Math.round(decision.confidence * 100)}% confident
                    </Badge>
                    <Badge className={getImpactColor(decision.impact)}>
                      {decision.impact}
                    </Badge>
                  </div>
                </div>
                
                <div className="pl-8">
                  <div className="font-medium text-sm">{decision.decision}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-semibold">Reasoning:</span> {decision.reasoning}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}