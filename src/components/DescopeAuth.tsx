import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, CheckCircle, AlertCircle, Key, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DescopeAuthProps {
  onAuthenticated: (token: string, apiTokens: any) => void;
}

interface ConnectedService {
  name: string;
  connected: boolean;
  required: boolean;
  description: string;
  keyName?: string;
  keyValue?: string;
  placeholder?: string;
}

const DescopeAuth: React.FC<DescopeAuthProps> = ({ onAuthenticated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | 'connect' | 'ready'>('login');
  const [descopeToken, setDescopeToken] = useState<string | null>(null);
  const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([
    { 
      name: 'NASA FIRMS API', 
      connected: false, 
      required: true, 
      description: 'Fire detection from satellites',
      keyName: 'nasa_map_key',
      placeholder: 'Enter your NASA FIRMS MAP_KEY',
      keyValue: ''
    },
    { 
      name: 'USGS Earthquake', 
      connected: false, 
      required: false, 
      description: 'Real-time earthquake monitoring (Public API - no key needed)',
      keyName: 'usgs_api_key',
      placeholder: 'Public API - No key required',
      keyValue: 'PUBLIC'
    },
    { 
      name: 'NOAA Weather', 
      connected: false, 
      required: false, 
      description: 'Weather and storm tracking (Public API - no key needed)',
      keyName: 'noaa_api_key',
      placeholder: 'Public API - No key required',
      keyValue: 'PUBLIC'
    },
    { 
      name: 'Twilio SMS', 
      connected: false, 
      required: false, 
      description: 'Send emergency alerts via SMS (Optional)',
      keyName: 'twilio_auth_token',
      placeholder: 'Enter Twilio Auth Token (optional)',
      keyValue: ''
    },
  ]);
  const { toast } = useToast();

  // Initialize Descope Flow
  useEffect(() => {
    const loadDescopeFlow = async () => {
      try {
        // Load Descope SDK
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@descope/web-component@latest/dist/index.js';
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          // Initialize Descope with project ID from environment
          const projectId = import.meta.env.VITE_DESCOPE_PROJECT_ID || 'YOUR_PROJECT_ID';
          
          // Create Descope flow container
          const descopeFlow = document.createElement('descope-wc');
          descopeFlow.setAttribute('project-id', projectId);
          descopeFlow.setAttribute('flow-id', 'sign-up-or-in');
          
          // Add event listeners for Descope events
          descopeFlow.addEventListener('success', (e: any) => {
            const token = e.detail.sessionJwt;
            handleDescopeSuccess(token);
          });

          descopeFlow.addEventListener('error', (e: any) => {
            console.error('Descope error:', e.detail);
            toast({
              title: 'Authentication Error',
              description: 'Failed to authenticate. Please try again.',
              variant: 'destructive',
            });
          });

          // Mount to DOM if in login step
          if (authStep === 'login') {
            const container = document.getElementById('descope-container');
            if (container) {
              container.appendChild(descopeFlow);
            }
          }
        };

        return () => {
          document.body.removeChild(script);
        };
      } catch (error) {
        console.error('Failed to load Descope:', error);
      }
    };

    if (authStep === 'login') {
      loadDescopeFlow();
    }
  }, [authStep]);

  const handleDescopeSuccess = async (token: string) => {
    setDescopeToken(token);
    setAuthStep('connect');
    
    toast({
      title: 'Authentication Successful',
      description: 'Now connect your external services to continue.',
    });
  };

  const updateServiceKey = (serviceName: string, keyValue: string) => {
    setConnectedServices(prev => 
      prev.map(service => 
        service.name === serviceName 
          ? { ...service, keyValue, connected: keyValue.length > 0 && keyValue !== 'PUBLIC' }
          : service
      )
    );
  };

  const saveApiKeys = async () => {
    setIsLoading(true);
    
    try {
      // Save API keys to Descope user custom attributes
      const apiKeys: Record<string, string> = {};
      
      for (const service of connectedServices) {
        if (service.keyName && service.keyValue) {
          apiKeys[service.keyName] = service.keyValue;
        }
      }

      // Send to backend to store in Descope
      const response = await fetch('/api/auth/save-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${descopeToken}`,
        },
        body: JSON.stringify({ apiKeys }),
      });

      if (response.ok) {
        // Mark services as connected
        setConnectedServices(prev => 
          prev.map(service => ({
            ...service,
            connected: service.keyValue ? service.keyValue.length > 0 : false
          }))
        );
        
        toast({
          title: 'API Keys Saved',
          description: 'Your API keys have been securely stored in Descope.',
        });
      } else {
        throw new Error('Failed to save API keys');
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save API keys. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const proceedToApp = async () => {
    if (!descopeToken) return;
    
    // Check if all required services are connected
    const requiredConnected = connectedServices
      .filter(s => s.required)
      .every(s => s.connected);
    
    if (!requiredConnected) {
      toast({
        title: 'Required Services Missing',
        description: 'Please connect all required services before proceeding.',
        variant: 'destructive',
      });
      return;
    }

    // Fetch all API tokens from backend
    try {
      const response = await fetch('/api/auth/tokens', {
        headers: { 'Authorization': `Bearer ${descopeToken}` },
      });
      
      if (response.ok) {
        const apiTokens = await response.json();
        onAuthenticated(descopeToken, apiTokens);
        setAuthStep('ready');
      } else {
        throw new Error('Failed to fetch API tokens');
      }
    } catch (error) {
      console.error('Error fetching tokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to retrieve API tokens. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl p-8 space-y-6 bg-card/90 backdrop-blur-glass border-border/50">
        <div className="text-center space-y-2">
          <Shield className="w-12 h-12 mx-auto text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Guardian Dashboard AI</h1>
          <p className="text-muted-foreground">Secure authentication powered by Descope</p>
        </div>

        {authStep === 'login' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Sign In to Continue</h2>
            <div id="descope-container" className="min-h-[400px]" />
            
            <div className="text-sm text-muted-foreground space-y-2 p-4 bg-surface/50 rounded-lg">
              <p className="font-medium">Why Descope Authentication?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Secure token management for all external APIs</li>
                <li>No passwords stored in our system</li>
                <li>Automatic token refresh and rotation</li>
                <li>Enterprise-grade security compliance</li>
              </ul>
            </div>
          </div>
        )}

        {authStep === 'connect' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Configure API Keys</h2>
            <p className="text-muted-foreground">
              Enter your API keys to enable real-time disaster monitoring. Keys are securely stored in Descope.
            </p>

            <div className="space-y-3">
              {connectedServices.map(service => (
                <div
                  key={service.name}
                  className={`p-4 rounded-lg border ${
                    service.connected 
                      ? 'bg-success/10 border-success/30' 
                      : service.required
                      ? 'bg-warning/10 border-warning/30'
                      : 'bg-surface/50 border-border/30'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      {service.connected || service.keyValue === 'PUBLIC' ? (
                        <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                      ) : (
                        <Key className={`w-5 h-5 mt-0.5 ${
                          service.required ? 'text-warning' : 'text-muted-foreground'
                        }`} />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          {service.name}
                          {service.required && (
                            <span className="ml-2 text-xs text-warning">Required</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {service.description}
                        </div>
                      </div>
                    </div>
                    
                    {service.keyValue !== 'PUBLIC' && (
                      <div className="ml-8">
                        <Input
                          type="password"
                          placeholder={service.placeholder}
                          value={service.keyValue || ''}
                          onChange={(e) => updateServiceKey(service.name, e.target.value)}
                          className="font-mono text-sm"
                          disabled={isLoading}
                        />
                        {service.name === 'NASA FIRMS API' && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Get your MAP_KEY from{' '}
                            <a 
                              href="https://firms.modaps.eosdis.nasa.gov/api/area" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              NASA FIRMS
                            </a>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-start space-x-2">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground">Secure Storage via Descope</p>
                  <p className="text-muted-foreground">
                    Your API keys are encrypted and stored in Descope's secure vault. 
                    They are never saved in our database or code.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => saveApiKeys()}
                disabled={isLoading || !connectedServices.some(s => s.required && s.keyValue && s.keyValue.length > 0)}
              >
                <Save className="w-4 h-4 mr-2" />
                Save Keys
              </Button>
              <Button
                onClick={() => proceedToApp()}
                disabled={!connectedServices.some(s => s.required && (s.connected || s.keyValue === 'PUBLIC'))}
              >
                Continue to Dashboard
              </Button>
            </div>
          </div>
        )}

        {authStep === 'ready' && (
          <div className="text-center space-y-4 py-8">
            <CheckCircle className="w-16 h-16 mx-auto text-success" />
            <h2 className="text-2xl font-semibold">Setup Complete!</h2>
            <p className="text-muted-foreground">
              All services are connected. Redirecting to dashboard...
            </p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DescopeAuth;