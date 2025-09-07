import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Shield,
  Settings,
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  Check,
  X,
  Edit,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Database,
  Bell,
  Key,
  Globe,
  Zap,
  BarChart3
} from 'lucide-react';

interface SystemConfig {
  alertThresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  apiRateLimits: {
    nasa: number;
    usgs: number;
    noaa: number;
  };
  agentIntervals: {
    detection: number;
    analysis: number;
    action: number;
  };
  dataRetention: {
    disasters: number;
    alerts: number;
    logs: number;
  };
  maintenanceMode: boolean;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  admins: number;
  newToday: number;
}

interface SystemStats {
  uptime: string;
  totalDisasters: number;
  totalAlerts: number;
  apiCalls: number;
  errorRate: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    admins: 0,
    newToday: 0,
  });
  
  const [systemStats, setSystemStats] = useState<SystemStats>({
    uptime: '0d 0h 0m',
    totalDisasters: 0,
    totalAlerts: 0,
    apiCalls: 0,
    errorRate: 0,
  });
  
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    alertThresholds: {
      critical: 7.0,
      high: 5.5,
      medium: 4.5,
      low: 3.0,
    },
    apiRateLimits: {
      nasa: 1000,
      usgs: 500,
      noaa: 750,
    },
    agentIntervals: {
      detection: 60000,
      analysis: 30000,
      action: 15000,
    },
    dataRetention: {
      disasters: 30,
      alerts: 60,
      logs: 7,
    },
    maintenanceMode: false,
  });
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  
  // Check if user is admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast({
        title: 'Access Denied',
        description: 'You must be an admin to access this page',
        variant: 'destructive',
      });
      navigate('/');
    }
  }, [user, navigate, toast]);
  
  // Fetch users and stats
  useEffect(() => {
    fetchUsers();
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);
  
  const fetchUsers = async () => {
    try {
      const response = await apiService.getAllUsers();
      setUsers(response);
      
      // Calculate user stats
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      setUserStats({
        totalUsers: response.length,
        activeUsers: response.filter((u: any) => u.isActive).length,
        admins: response.filter((u: any) => u.role === 'admin').length,
        newToday: response.filter((u: any) => 
          new Date(u.createdAt) >= todayStart
        ).length,
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };
  
  const fetchStats = async () => {
    try {
      const [health, disasters, alerts, analytics] = await Promise.all([
        apiService.checkHealth(),
        apiService.getDisasters(),
        apiService.getAlerts(),
        apiService.getAnalytics(),
      ]);
      
      // Format uptime
      const uptimeSeconds = health.uptime || 0;
      const days = Math.floor(uptimeSeconds / 86400);
      const hours = Math.floor((uptimeSeconds % 86400) / 3600);
      const minutes = Math.floor((uptimeSeconds % 3600) / 60);
      
      setSystemStats({
        uptime: `${days}d ${hours}h ${minutes}m`,
        totalDisasters: disasters.length,
        totalAlerts: alerts.length,
        apiCalls: analytics.apiCalls || 0,
        errorRate: analytics.errorRate || 0,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };
  
  const handleUserAction = async (userId: string, action: 'activate' | 'deactivate' | 'delete' | 'makeAdmin') => {
    try {
      switch (action) {
        case 'activate':
          await apiService.updateUserProfile({ id: userId, isActive: true });
          toast({ title: 'User activated' });
          break;
        case 'deactivate':
          await apiService.updateUserProfile({ id: userId, isActive: false });
          toast({ title: 'User deactivated' });
          break;
        case 'delete':
          // In production, implement proper user deletion
          toast({ title: 'User deletion not implemented in demo' });
          break;
        case 'makeAdmin':
          await apiService.updateUserProfile({ id: userId, role: 'admin' });
          toast({ title: 'User promoted to admin' });
          break;
      }
      fetchUsers();
    } catch (error) {
      toast({
        title: 'Action failed',
        description: 'Failed to perform user action',
        variant: 'destructive',
      });
    }
  };
  
  const handleConfigUpdate = async (section: keyof SystemConfig, value: any) => {
    const updatedConfig = {
      ...systemConfig,
      [section]: value,
    };
    setSystemConfig(updatedConfig);
    
    // In production, save to backend
    toast({
      title: 'Configuration Updated',
      description: `${section} settings have been updated`,
    });
  };
  
  const handleMaintenanceToggle = async (enabled: boolean) => {
    setSystemConfig({ ...systemConfig, maintenanceMode: enabled });
    
    toast({
      title: enabled ? 'Maintenance Mode Enabled' : 'Maintenance Mode Disabled',
      description: enabled 
        ? 'System is now in maintenance mode' 
        : 'System is back online',
      variant: enabled ? 'destructive' : 'default',
    });
  };
  
  const exportData = async () => {
    // In production, implement proper data export
    toast({
      title: 'Export Started',
      description: 'System data export has been initiated',
    });
  };
  
  const importData = async () => {
    // In production, implement proper data import
    toast({
      title: 'Import Feature',
      description: 'Data import is not available in demo mode',
    });
  };
  
  if (!user || user.role !== 'admin') {
    return null;
  }
  
  return (
    <div className="container max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div className="flex items-center gap-4">
          <Badge variant={systemConfig.maintenanceMode ? 'destructive' : 'default'}>
            {systemConfig.maintenanceMode ? 'Maintenance Mode' : 'System Online'}
          </Badge>
          <Badge variant="outline">
            <Shield className="h-3 w-3 mr-1" />
            Admin Panel
          </Badge>
        </div>
      </div>
      
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System administration and monitoring</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {userStats.newToday} new today
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.uptime}</div>
            <p className="text-xs text-muted-foreground">
              Error rate: {systemStats.errorRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Disasters Tracked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalDisasters}</div>
            <p className="text-xs text-muted-foreground">
              {systemStats.totalAlerts} alerts sent
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              API Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.apiCalls}</div>
            <p className="text-xs text-muted-foreground">
              Across all services
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="system">System Config</TabsTrigger>
          <TabsTrigger value="agents">Agent Control</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>
        
        {/* User Management Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage system users and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant={u.role === 'admin' ? 'destructive' : 'default'}>
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={u.isActive ? 'default' : 'secondary'}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedUser(u);
                                setShowUserDialog(true);
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            {u.isActive ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleUserAction(u.id, 'deactivate')}
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleUserAction(u.id, 'activate')}
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            {u.role !== 'admin' && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleUserAction(u.id, 'makeAdmin')}
                              >
                                <Shield className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Config Tab */}
        <TabsContent value="system">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Alert Thresholds</CardTitle>
                <CardDescription>Configure severity thresholds for different alert levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(systemConfig.alertThresholds).map(([level, value]) => (
                    <div key={level}>
                      <Label htmlFor={`threshold-${level}`}>
                        {level.charAt(0).toUpperCase() + level.slice(1)} (Magnitude)
                      </Label>
                      <Input
                        id={`threshold-${level}`}
                        type="number"
                        step="0.1"
                        value={value}
                        onChange={(e) => {
                          handleConfigUpdate('alertThresholds', {
                            ...systemConfig.alertThresholds,
                            [level]: parseFloat(e.target.value),
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>API Rate Limits</CardTitle>
                <CardDescription>Set rate limits for external API calls (per hour)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(systemConfig.apiRateLimits).map(([api, limit]) => (
                    <div key={api}>
                      <Label htmlFor={`limit-${api}`}>
                        {api.toUpperCase()}
                      </Label>
                      <Input
                        id={`limit-${api}`}
                        type="number"
                        value={limit}
                        onChange={(e) => {
                          handleConfigUpdate('apiRateLimits', {
                            ...systemConfig.apiRateLimits,
                            [api]: parseInt(e.target.value),
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
                <CardDescription>Enable maintenance mode to restrict system access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">System Maintenance</p>
                    <p className="text-sm text-muted-foreground">
                      {systemConfig.maintenanceMode 
                        ? 'System is in maintenance mode' 
                        : 'System is operational'}
                    </p>
                  </div>
                  <Switch
                    checked={systemConfig.maintenanceMode}
                    onCheckedChange={handleMaintenanceToggle}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Agent Control Tab */}
        <TabsContent value="agents">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>Configure AI agent processing intervals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-3">Processing Intervals (milliseconds)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {Object.entries(systemConfig.agentIntervals).map(([squad, interval]) => (
                      <div key={squad}>
                        <Label htmlFor={`interval-${squad}`}>
                          {squad.charAt(0).toUpperCase() + squad.slice(1)} Squad
                        </Label>
                        <Input
                          id={`interval-${squad}`}
                          type="number"
                          step="1000"
                          value={interval}
                          onChange={(e) => {
                            handleConfigUpdate('agentIntervals', {
                              ...systemConfig.agentIntervals,
                              [squad]: parseInt(e.target.value),
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={() => window.location.reload()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Restart All Agents
                  </Button>
                  <Button variant="outline">
                    <Activity className="h-4 w-4 mr-2" />
                    View Agent Logs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Data Management Tab */}
        <TabsContent value="data">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
                <CardDescription>Configure how long data is retained (days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(systemConfig.dataRetention).map(([type, days]) => (
                    <div key={type}>
                      <Label htmlFor={`retention-${type}`}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Label>
                      <Input
                        id={`retention-${type}`}
                        type="number"
                        value={days}
                        onChange={(e) => {
                          handleConfigUpdate('dataRetention', {
                            ...systemConfig.dataRetention,
                            [type]: parseInt(e.target.value),
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Data Operations</CardTitle>
                <CardDescription>Export or import system data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Export All Data
                  </Button>
                  <Button variant="outline" onClick={importData}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                  <Button variant="destructive">
                    <Database className="h-4 w-4 mr-2" />
                    Clear Old Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* User Edit Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Modify user details and permissions
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={selectedUser.name} disabled />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={selectedUser.email} disabled />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={selectedUser.role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Save changes
                  setShowUserDialog(false);
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}