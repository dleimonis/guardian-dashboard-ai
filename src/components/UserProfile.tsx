import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import AlertZones from '@/components/AlertZones';
import { 
  User, 
  MapPin, 
  Bell, 
  Shield, 
  Clock, 
  Globe, 
  Save,
  Plus,
  Trash2,
  Home,
  AlertTriangle,
  Volume2,
  Mail,
  MessageSquare,
  Smartphone,
  ArrowLeft,
  Map
} from 'lucide-react';

export default function UserProfile() {
  const navigate = useNavigate();
  const { 
    user, 
    locations, 
    preferences, 
    updateProfile, 
    updatePreferences,
    addLocation,
    deleteLocation,
    setDefaultLocation 
  } = useUser();
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    lat: 0,
    lon: 0,
  });
  
  const [showAddLocation, setShowAddLocation] = useState(false);

  const handleProfileSave = async () => {
    await updateProfile(profileForm);
  };

  const handlePreferenceToggle = async (category: string, key: string, value: boolean) => {
    if (!preferences) return;
    
    const updates = {
      ...preferences,
      [category]: {
        ...preferences[category as keyof typeof preferences],
        [key]: value,
      },
    };
    
    await updatePreferences(updates);
  };

  const handleAddLocation = async () => {
    if (newLocation.name && newLocation.address) {
      // In production, geocode the address to get lat/lon
      await addLocation({
        ...newLocation,
        isDefault: locations.length === 0,
      });
      
      setNewLocation({ name: '', address: '', lat: 0, lon: 0 });
      setShowAddLocation(false);
    }
  };

  const handleQuietHoursToggle = async (enabled: boolean) => {
    if (!preferences) return;
    
    await updatePreferences({
      ...preferences,
      quietHours: {
        ...preferences.quietHours,
        enabled,
      },
    });
  };

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <Badge variant={user?.role === 'admin' ? 'destructive' : 'default'}>
          {user?.role || 'User'}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Profile</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="zones">Alert Zones</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="alerts">Alert Settings</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={preferences?.timezone} onValueChange={(value) => {
                    if (preferences) {
                      updatePreferences({ ...preferences, timezone: value });
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleProfileSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Saved Locations
              </CardTitle>
              <CardDescription>Manage your monitored locations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {location.isDefault && <Home className="h-5 w-5 text-primary" />}
                      <div>
                        <p className="font-medium">{location.name}</p>
                        <p className="text-sm text-muted-foreground">{location.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!location.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDefaultLocation(location.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteLocation(location.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {showAddLocation ? (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Location Name</Label>
                        <Input
                          value={newLocation.name}
                          onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                          placeholder="Home, Office, etc."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Address</Label>
                        <Input
                          value={newLocation.address}
                          onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                          placeholder="123 Main St, City, State"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddLocation}>Add Location</Button>
                      <Button variant="outline" onClick={() => setShowAddLocation(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <Button onClick={() => setShowAddLocation(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive alerts via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notifications.email}
                    onCheckedChange={(checked) => handlePreferenceToggle('notifications', 'email', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">SMS Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive alerts via text message</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notifications.sms}
                    onCheckedChange={(checked) => handlePreferenceToggle('notifications', 'sms', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">Browser and mobile app notifications</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notifications.push}
                    onCheckedChange={(checked) => handlePreferenceToggle('notifications', 'push', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">In-App Notifications</p>
                      <p className="text-sm text-muted-foreground">Show alerts within the app</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences?.notifications.inApp}
                    onCheckedChange={(checked) => handlePreferenceToggle('notifications', 'inApp', checked)}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Quiet Hours
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Enable Quiet Hours</p>
                      <p className="text-sm text-muted-foreground">
                        Silence non-critical alerts during specified hours
                      </p>
                    </div>
                    <Switch
                      checked={preferences?.quietHours.enabled}
                      onCheckedChange={handleQuietHoursToggle}
                    />
                  </div>
                  
                  {preferences?.quietHours.enabled && (
                    <div className="grid gap-4 md:grid-cols-2 pl-4">
                      <div className="space-y-2">
                        <Label>Start Time</Label>
                        <Input
                          type="time"
                          value={preferences.quietHours.start}
                          onChange={(e) => {
                            updatePreferences({
                              ...preferences,
                              quietHours: {
                                ...preferences.quietHours,
                                start: e.target.value,
                              },
                            });
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Time</Label>
                        <Input
                          type="time"
                          value={preferences.quietHours.end}
                          onChange={(e) => {
                            updatePreferences({
                              ...preferences,
                              quietHours: {
                                ...preferences.quietHours,
                                end: e.target.value,
                              },
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Zones Tab */}
        <TabsContent value="zones" className="h-[600px]">
          <AlertZones />
        </TabsContent>

        {/* Alert Settings Tab */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alert Settings
              </CardTitle>
              <CardDescription>Customize which alerts you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-4">Alert Severity Levels</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">Critical</Badge>
                      <span className="text-sm">Life-threatening emergencies</span>
                    </div>
                    <Switch
                      checked={preferences?.alertSeverity.critical}
                      onCheckedChange={(checked) => handlePreferenceToggle('alertSeverity', 'critical', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-500">High</Badge>
                      <span className="text-sm">Significant threats</span>
                    </div>
                    <Switch
                      checked={preferences?.alertSeverity.high}
                      onCheckedChange={(checked) => handlePreferenceToggle('alertSeverity', 'high', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-yellow-500">Medium</Badge>
                      <span className="text-sm">Moderate risks</span>
                    </div>
                    <Switch
                      checked={preferences?.alertSeverity.medium}
                      onCheckedChange={(checked) => handlePreferenceToggle('alertSeverity', 'medium', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Low</Badge>
                      <span className="text-sm">Minor incidents</span>
                    </div>
                    <Switch
                      checked={preferences?.alertSeverity.low}
                      onCheckedChange={(checked) => handlePreferenceToggle('alertSeverity', 'low', checked)}
                    />
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-4">Disaster Types</h3>
                <div className="space-y-3">
                  {Object.entries(preferences?.disasterTypes || {}).map(([type, enabled]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">{type}</span>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => handlePreferenceToggle('disasterTypes', type, checked)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}