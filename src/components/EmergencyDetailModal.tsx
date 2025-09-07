import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MapPin, 
  AlertTriangle, 
  Users, 
  Clock, 
  Shield, 
  Navigation, 
  Phone, 
  Activity,
  Flame,
  CloudRain,
  Waves,
  CheckCircle,
  XCircle,
  Bot
} from 'lucide-react';

export interface EmergencyDetail {
  id: string;
  title: string;
  type: string;
  severity: 'critical' | 'warning' | 'watch';
  lat: number;
  lng: number;
  affectedPeople: number;
  description?: string;
  timestamp?: string;
}

interface EmergencyDetailModalProps {
  emergency: EmergencyDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const EmergencyDetailModal = ({ emergency, isOpen, onClose }: EmergencyDetailModalProps) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!emergency) return null;

  const getEmergencyIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fire':
      case 'wildfire':
        return <Flame className="h-5 w-5" />;
      case 'earthquake':
        return <Activity className="h-5 w-5" />;
      case 'hurricane':
      case 'storm':
      case 'weather':
        return <CloudRain className="h-5 w-5" />;
      case 'flood':
        return <Waves className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-destructive';
      case 'warning':
        return 'text-warning';
      case 'watch':
        return 'text-success';
      default:
        return 'text-muted-foreground';
    }
  };

  // Generate action plan based on emergency type
  const getActionPlan = (type: string) => {
    const plans: Record<string, string[]> = {
      fire: [
        'Evacuate immediately if in danger zone',
        'Follow designated evacuation routes',
        'Close all windows and doors if safe to do so',
        'Turn off gas and electricity if possible',
        'Move to designated emergency shelter',
        'Keep N95 masks ready for smoke protection',
        'Monitor official channels for updates',
        'Do not return until all-clear is given'
      ],
      earthquake: [
        'Drop, Cover, and Hold On if shaking',
        'Stay away from windows and heavy objects',
        'Do not run outside during shaking',
        'Check for injuries and provide first aid',
        'Turn off gas if you smell a leak',
        'Expect aftershocks - stay alert',
        'Use text messages instead of calls',
        'Listen to emergency broadcasts'
      ],
      hurricane: [
        'Secure outdoor objects immediately',
        'Board up windows if time permits',
        'Fill bathtubs and containers with water',
        'Charge all electronic devices',
        'Move to interior room on lowest floor',
        'Stay away from windows and doors',
        'Monitor weather updates continuously',
        'Do not go outside until all-clear'
      ],
      flood: [
        'Move to higher ground immediately',
        'Never drive through flooded areas',
        'Turn off utilities at main switches',
        'Avoid contact with floodwater',
        'Document damage with photos',
        'Do not return until authorities say safe',
        'Watch for contaminated water',
        'Be alert for weakened structures'
      ]
    };

    const key = type.toLowerCase();
    return plans[key] || plans.fire;
  };

  // Get emergency contacts based on type
  const getEmergencyContacts = () => [
    { name: 'Emergency Services', number: '911', type: 'primary' },
    { name: 'Red Cross', number: '1-800-RED-CROSS', type: 'support' },
    { name: 'FEMA', number: '1-800-621-3362', type: 'federal' },
    { name: 'Local Emergency Mgmt', number: '555-0100', type: 'local' },
    { name: 'Medical Services', number: '555-0199', type: 'medical' }
  ];

  // Get responding agents
  const getRespondingAgents = () => [
    { name: 'FireWatcher', status: 'active', role: 'Monitoring fire spread' },
    { name: 'EvacuationPlanner', status: 'active', role: 'Planning safe routes' },
    { name: 'ResourceCoordinator', status: 'active', role: 'Allocating resources' },
    { name: 'AlertDispatcher', status: 'active', role: 'Sending notifications' },
    { name: 'ImpactPredictor', status: 'analyzing', role: 'Calculating impact zones' }
  ];

  const actionPlan = getActionPlan(emergency.type);
  const contacts = getEmergencyContacts();
  const agents = getRespondingAgents();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              emergency.severity === 'critical' ? 'bg-destructive/20' :
              emergency.severity === 'warning' ? 'bg-warning/20' :
              'bg-success/20'
            }`}>
              {getEmergencyIcon(emergency.type)}
            </div>
            {emergency.title}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-4 mt-2">
            <Badge variant="secondary" className={`${getSeverityColor(emergency.severity)} uppercase font-bold`}>
              {emergency.severity}
            </Badge>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Lat: {emergency.lat.toFixed(4)}, Lng: {emergency.lng.toFixed(4)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {emergency.affectedPeople.toLocaleString()} affected
            </span>
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="action-plan">Action Plan</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="ai-response">AI Response</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Emergency Summary
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-muted-foreground">
                  {emergency.description || `A ${emergency.severity} level ${emergency.type} emergency has been detected in this area. Immediate action may be required to ensure safety.`}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="font-medium">Detection Time:</span>
                    <p className="text-muted-foreground">{emergency.timestamp || new Date().toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-medium">Response Status:</span>
                    <p className="text-success flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Active Response
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Evacuation Status:</span>
                    <p className={emergency.severity === 'critical' ? 'text-destructive' : 'text-warning'}>
                      {emergency.severity === 'critical' ? 'Mandatory' : 'Voluntary'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Est. Resolution:</span>
                    <p className="text-muted-foreground">24-48 hours</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Affected Areas
              </h3>
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <Badge variant="outline">Downtown District</Badge>
                  <Badge variant="outline">Industrial Zone</Badge>
                  <Badge variant="outline">Residential North</Badge>
                  <Badge variant="outline">Shopping Center</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Impact radius: Approximately 10-15 miles from epicenter
                </p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="action-plan" className="space-y-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Immediate Actions Required
              </h3>
              <div className="space-y-2">
                {actionPlan.map((action, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="mt-1">
                      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {index + 1}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{action}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Evacuation Information
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Primary Route:</p>
                  <p className="text-muted-foreground">Highway 101 North to Emergency Shelter A</p>
                </div>
                <div>
                  <p className="font-medium">Alternative Route:</p>
                  <p className="text-muted-foreground">State Route 85 East to Emergency Shelter B</p>
                </div>
                <div>
                  <p className="font-medium">Shelter Locations:</p>
                  <ul className="text-muted-foreground mt-1 space-y-1">
                    <li>• Community Center - 123 Main St (5 miles)</li>
                    <li>• High School Gym - 456 Oak Ave (8 miles)</li>
                    <li>• Convention Center - 789 Park Blvd (12 miles)</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Emergency Contacts
              </h3>
              <div className="space-y-2">
                {contacts.map((contact, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="font-medium">{contact.name}</span>
                    <span className="font-mono text-primary">{contact.number}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Resource Allocation
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Fire Units Deployed:</span>
                  <span className="font-medium">12 units</span>
                </div>
                <div className="flex justify-between">
                  <span>Medical Teams:</span>
                  <span className="font-medium">8 teams</span>
                </div>
                <div className="flex justify-between">
                  <span>Evacuation Buses:</span>
                  <span className="font-medium">15 buses</span>
                </div>
                <div className="flex justify-between">
                  <span>Emergency Shelters:</span>
                  <span className="font-medium">3 active</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="ai-response" className="space-y-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Agents Responding
              </h3>
              <div className="space-y-3">
                {agents.map((agent, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'active' ? 'bg-success animate-pulse' : 'bg-warning'
                      }`} />
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    <span className="text-muted-foreground text-xs">{agent.role}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                AI Analysis
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Pattern recognition identifies this as a Type-{emergency.severity === 'critical' ? 'A' : 'B'} emergency</p>
                <p>• Historical data suggests 85% containment probability within 48 hours</p>
                <p>• Weather patterns favorable for emergency response operations</p>
                <p>• Population density analysis complete - evacuation routes optimized</p>
                <p>• Resource allocation optimized based on predictive models</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button className="bg-primary">
            <Phone className="h-4 w-4 mr-2" />
            Contact Emergency Services
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyDetailModal;