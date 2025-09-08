import React, { useEffect, useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useEmergency } from '@/contexts/EmergencyContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Smartphone,
  Monitor,
  Zap
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const NotificationCenter: React.FC = () => {
  const { 
    permission, 
    isSupported, 
    soundEnabled, 
    setSoundEnabled,
    criticalOnly,
    setCriticalOnly,
    requestPermission,
    sendDisasterNotification,
    stopAllSounds 
  } = useNotifications();
  
  const { disasters, alerts } = useEmergency();
  const [notifiedDisasters, setNotifiedDisasters] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [testMode, setTestMode] = useState(false);

  // Monitor for new disasters and send notifications
  useEffect(() => {
    if (permission !== 'granted') return;

    disasters.forEach(disaster => {
      if (!notifiedDisasters.has(disaster.id)) {
        sendDisasterNotification({
          id: disaster.id,
          type: disaster.type,
          severity: disaster.severity,
          location: disaster.location.name || `${disaster.location.lat}, ${disaster.location.lon}`,
          message: `Magnitude ${disaster.data?.magnitude || 'Unknown'} event detected`,
          timestamp: disaster.timestamp,
        });
        
        setNotifiedDisasters(prev => new Set([...prev, disaster.id]));
      }
    });
  }, [disasters, notifiedDisasters, permission, sendDisasterNotification]);

  // Test notification
  const sendTestNotification = () => {
    sendDisasterNotification({
      id: `test-${Date.now()}`,
      type: 'Test Alert',
      severity: 'critical',
      location: 'Your Location',
      message: 'This is a test of the Guardian AI emergency notification system',
      timestamp: new Date().toISOString(),
    });
  };

  const getPermissionIcon = () => {
    switch (permission) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getPermissionText = () => {
    switch (permission) {
      case 'granted':
        return 'Notifications Active';
      case 'denied':
        return 'Notifications Blocked';
      default:
        return 'Permission Required';
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Notification Bell Button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setShowSettings(true)}
        className="relative"
        title="Notification Settings"
      >
        {permission === 'granted' ? (
          <Bell className="h-4 w-4" />
        ) : (
          <BellOff className="h-4 w-4" />
        )}
        {permission !== 'granted' && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-500 rounded-full animate-pulse" />
        )}
      </Button>

      {/* Notification Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </DialogTitle>
            <DialogDescription>
              Configure how you receive disaster alerts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Permission Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {getPermissionIcon()}
                  {getPermissionText()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {permission === 'default' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Enable browser notifications to receive real-time disaster alerts even when the app is in the background.
                    </p>
                    <Button 
                      onClick={requestPermission}
                      className="w-full"
                      variant="default"
                    >
                      <Bell className="h-4 w-4 mr-2" />
                      Enable Notifications
                    </Button>
                  </div>
                )}
                
                {permission === 'granted' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Desktop notifications enabled</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Mobile alerts active</span>
                    </div>
                  </div>
                )}
                
                {permission === 'denied' && (
                  <div className="space-y-3">
                    <p className="text-sm text-destructive">
                      Notifications are blocked. Please enable them in your browser settings to receive alerts.
                    </p>
                    <Badge variant="destructive">
                      Check browser settings → Site settings → Notifications
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            {permission === 'granted' && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        Sound Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Play sound when disasters are detected
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={soundEnabled}
                        onCheckedChange={setSoundEnabled}
                      />
                      {soundEnabled && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={stopAllSounds}
                          title="Emergency mute all sounds"
                        >
                          <VolumeX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Critical Only
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Only notify for critical severity disasters
                      </p>
                    </div>
                    <Switch
                      checked={criticalOnly}
                      onCheckedChange={setCriticalOnly}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Test Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Send test notifications
                      </p>
                    </div>
                    <Switch
                      checked={testMode}
                      onCheckedChange={setTestMode}
                    />
                  </div>
                </div>

                {/* Test Notification Button */}
                {testMode && (
                  <Button 
                    onClick={sendTestNotification}
                    variant="outline"
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Send Test Alert
                  </Button>
                )}

                {/* Statistics */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Notification Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Alerts Sent</p>
                        <p className="text-2xl font-bold">{notifiedDisasters.size}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Active Disasters</p>
                        <p className="text-2xl font-bold">{disasters.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationCenter;