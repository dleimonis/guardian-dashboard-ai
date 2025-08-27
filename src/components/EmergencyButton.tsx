import { useState, useEffect } from 'react';
import { AlertTriangle, Zap, Play, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEmergency } from '@/contexts/EmergencyContext';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const EmergencyButton = () => {
  const [isActive, setIsActive] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const { runSimulation } = useEmergency();
  const { toast } = useToast();

  // Load simulation scenarios
  useEffect(() => {
    const loadScenarios = async () => {
      try {
        const data = await apiService.getSimulationScenarios();
        setScenarios(data);
      } catch (error) {
        // Use default scenarios if API fails
        setScenarios([
          {
            id: 'mega_disaster',
            name: '🔥 MEGA DISASTER',
            description: 'Multiple simultaneous disasters',
            severity: 'critical',
            type: 'multi',
          },
          {
            id: 'earthquake_major',
            name: '🌍 Major Earthquake',
            description: 'Magnitude 7.5 earthquake',
            severity: 'critical',
            type: 'earthquake',
          },
          {
            id: 'wildfire_spreading',
            name: '🔥 Spreading Wildfire',
            description: 'Rapidly spreading wildfire',
            severity: 'critical',
            type: 'fire',
          },
          {
            id: 'hurricane_cat5',
            name: '🌀 Category 5 Hurricane',
            description: 'Major hurricane approaching',
            severity: 'critical',
            type: 'weather',
          },
          {
            id: 'tsunami_warning',
            name: '🌊 Tsunami Warning',
            description: 'Large tsunami approaching coast',
            severity: 'critical',
            type: 'flood',
          },
        ]);
      }
    };
    loadScenarios();
  }, []);

  const handleEmergencyClick = () => {
    setIsActive(!isActive);
    setShowPanel(!showPanel);
    
    if (!isActive) {
      // Add dramatic effect
      document.body.style.animation = 'emergencyShake 0.5s';
      setTimeout(() => {
        document.body.style.animation = '';
      }, 500);
    }
  };

  const handleRunSimulation = async () => {
    if (!selectedScenario) {
      toast({
        title: 'Select a Scenario',
        description: 'Please select a disaster scenario to simulate',
        variant: 'destructive',
      });
      return;
    }

    setIsSimulating(true);

    try {
      // Special handling for MEGA DISASTER
      if (selectedScenario.id === 'mega_disaster') {
        toast({
          title: '💥 MEGA DISASTER ACTIVATED',
          description: 'Simulating multiple disasters simultaneously!',
          variant: 'destructive',
        });

        // Run multiple simulations
        const disasters = [
          { type: 'earthquake', severity: 'critical', location: { lat: 37.7749, lon: -122.4194, name: 'San Francisco' }},
          { type: 'fire', severity: 'critical', location: { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' }},
          { type: 'flood', severity: 'high', location: { lat: 29.7604, lon: -95.3698, name: 'Houston' }},
          { type: 'weather', severity: 'critical', location: { lat: 25.7617, lon: -80.1918, name: 'Miami' }},
        ];

        for (const disaster of disasters) {
          await runSimulation({
            ...disaster,
            data: { isSimulation: true, megaDisaster: true },
          });
          // Delay between disasters for dramatic effect
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        await runSimulation(selectedScenario);
      }

      toast({
        title: '✅ Simulation Running',
        description: 'Check the dashboard for live updates',
      });
    } catch (error) {
      console.error('Simulation failed:', error);
      toast({
        title: 'Simulation Failed',
        description: 'Unable to start the simulation',
        variant: 'destructive',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleEmergencyClick}
        size="lg"
        className={`
          fixed bottom-8 right-8 z-50 
          ${isActive ? 
            'bg-critical hover:bg-critical/90 animate-emergency-pulse shadow-critical-glow' : 
            'bg-primary hover:bg-primary/90 shadow-glow'
          }
          transition-all duration-300 transform hover:scale-105
        `}
      >
        {isActive ? (
          <X className="w-5 h-5 mr-2" />
        ) : (
          <AlertTriangle className="w-5 h-5 mr-2" />
        )}
        {isActive ? 'ACTIVE' : 'EMERGENCY'}
      </Button>

      {/* Simulation Control Panel */}
      {showPanel && (
        <Card className="fixed bottom-24 right-8 w-96 z-40 p-6 bg-gradient-surface backdrop-blur-glass border-border/50 shadow-glass animate-slide-up">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center">
              <Zap className="w-5 h-5 mr-2 text-warning" />
              Disaster Simulation Control
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Test the emergency response system
            </p>
          </div>

          <div className="space-y-4">
            {/* Scenario Selection */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Select Scenario
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedScenario ? (
                      <span className="flex items-center">
                        <span className="mr-2">{selectedScenario.name}</span>
                      </span>
                    ) : (
                      'Choose a disaster scenario...'
                    )}
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                  {scenarios.map((scenario) => (
                    <DropdownMenuItem
                      key={scenario.id}
                      onClick={() => setSelectedScenario(scenario)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-start justify-between w-full">
                        <div>
                          <div className="font-medium">{scenario.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {scenario.description}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs ml-2 ${
                            scenario.severity === 'critical' 
                              ? 'bg-critical/20 text-critical' 
                              : 'bg-warning/20 text-warning'
                          }`}
                        >
                          {scenario.severity}
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Selected Scenario Details */}
            {selectedScenario && (
              <div className="p-3 bg-surface/50 rounded-lg border border-border/30">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-foreground capitalize">{selectedScenario.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Severity:</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        selectedScenario.severity === 'critical' 
                          ? 'bg-critical/20 text-critical' 
                          : 'bg-warning/20 text-warning'
                      }`}
                    >
                      {selectedScenario.severity}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleRunSimulation}
                disabled={!selectedScenario || isSimulating}
                className={`flex-1 ${
                  selectedScenario?.id === 'mega_disaster' 
                    ? 'bg-gradient-to-r from-critical to-warning hover:from-critical/90 hover:to-warning/90' 
                    : ''
                }`}
              >
                {isSimulating ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedScenario(null);
                  setShowPanel(false);
                  setIsActive(false);
                }}
              >
                Cancel
              </Button>
            </div>

            {/* Warning */}
            <div className="text-xs text-warning/80 flex items-start">
              <AlertTriangle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              This is a simulation. No real alerts will be sent.
            </div>
          </div>
        </Card>
      )}

      {/* Add custom styles */}
      <style>{`
        @keyframes emergencyShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes emergency-pulse {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 0 20px hsl(var(--critical) / 0.5);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 0 30px hsl(var(--critical) / 0.8);
          }
        }
        
        .shadow-critical-glow {
          box-shadow: 0 0 30px hsl(var(--critical) / 0.5);
        }
      `}</style>
    </>
  );
};

export default EmergencyButton;