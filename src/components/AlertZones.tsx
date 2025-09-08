import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMapEvents } from 'react-leaflet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  MapPin, 
  Trash2, 
  Edit, 
  Bell, 
  TestTube,
  Plus,
  AlertTriangle,
  Info,
  Check,
  X
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Component for drawing polygons on the map
function DrawingLayer({ onPolygonComplete }: { onPolygonComplete: (points: [number, number][]) => void }) {
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState<[number, number][]>([]);

  useMapEvents({
    click(e) {
      if (drawing) {
        const newPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPoints([...points, newPoint]);
      }
    },
  });

  const handleComplete = () => {
    if (points.length >= 3) {
      onPolygonComplete(points);
      setPoints([]);
      setDrawing(false);
    }
  };

  const handleCancel = () => {
    setPoints([]);
    setDrawing(false);
  };

  return (
    <>
      {points.length > 0 && (
        <>
          <Polyline positions={points} color="blue" />
          {points.map((point, idx) => (
            <Marker key={idx} position={point} />
          ))}
        </>
      )}
      <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-4">
        {!drawing ? (
          <Button onClick={() => setDrawing(true)} size="sm">
            <MapPin className="h-4 w-4 mr-2" />
            Draw Zone
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium">Click on map to add points</p>
            <p className="text-xs text-muted-foreground">Points: {points.length}</p>
            <div className="flex gap-2">
              <Button
                onClick={handleComplete}
                size="sm"
                disabled={points.length < 3}
                variant="default"
              >
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
              <Button
                onClick={handleCancel}
                size="sm"
                variant="outline"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function AlertZones() {
  const { alertZones, createAlertZone, updateAlertZone, deleteAlertZone, testAlertZone } = useUser();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    description: '',
    polygon: [] as [number, number][],
    color: '#ff0000',
    priority: 'medium' as 'high' | 'medium' | 'low',
    isActive: true,
  });

  const handlePolygonComplete = (points: [number, number][]) => {
    setNewZone({ ...newZone, polygon: points });
    setShowCreateDialog(true);
  };

  const handleCreateZone = async () => {
    if (newZone.name && newZone.polygon.length >= 3) {
      await createAlertZone(newZone);
      setNewZone({
        name: '',
        description: '',
        polygon: [],
        color: '#ff0000',
        priority: 'medium',
        isActive: true,
      });
      setShowCreateDialog(false);
    }
  };

  const handleToggleZone = async (zoneId: string, isActive: boolean) => {
    await updateAlertZone(zoneId, { isActive });
  };

  const handleTestZone = async (zoneId: string) => {
    const result = await testAlertZone(zoneId);
    console.log('Test result:', result);
  };

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-orange-500',
    low: 'bg-yellow-500',
  };

  return (
    <div className="h-full flex gap-4">
      {/* Map Section */}
      <div className="flex-1 relative">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Alert Zone Map
            </CardTitle>
            <CardDescription>
              Click "Draw Zone" to create a new alert zone by clicking points on the map
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[calc(100%-120px)] p-0">
            <MapContainer
              center={[39.8283, -98.5795]} // Center of USA
              zoom={4}
              className="h-full w-full"
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {/* Render existing zones */}
              {alertZones.map((zone) => (
                <Polygon
                  key={zone.id}
                  positions={zone.polygon}
                  pathOptions={{
                    color: zone.color,
                    fillColor: zone.color,
                    fillOpacity: zone.isActive ? 0.3 : 0.1,
                    weight: zone.id === selectedZone ? 3 : 1,
                  }}
                  eventHandlers={{
                    click: () => setSelectedZone(zone.id),
                  }}
                />
              ))}
              
              <DrawingLayer onPolygonComplete={handlePolygonComplete} />
            </MapContainer>
          </CardContent>
        </Card>
      </div>

      {/* Zones List Section */}
      <div className="w-96">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Your Alert Zones
            </CardTitle>
            <CardDescription>
              Manage and monitor your custom alert zones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4">
                {alertZones.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No alert zones created yet</p>
                    <p className="text-sm mt-2">Draw a zone on the map to get started</p>
                  </div>
                ) : (
                  alertZones.map((zone) => (
                    <Card
                      key={zone.id}
                      className={`cursor-pointer transition-colors ${
                        selectedZone === zone.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedZone(zone.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{zone.name}</h4>
                            {zone.description && (
                              <p className="text-sm text-muted-foreground">{zone.description}</p>
                            )}
                          </div>
                          <Switch
                            checked={zone.isActive}
                            onCheckedChange={(checked) => handleToggleZone(zone.id, checked)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={priorityColors[zone.priority]}>
                            {zone.priority}
                          </Badge>
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: zone.color }}
                          />
                          <span className="text-xs text-muted-foreground">
                            {zone.polygon.length} points
                          </span>
                        </div>
                        
                        {zone.statistics && (
                          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                            <div>
                              <p className="text-muted-foreground">Total Alerts</p>
                              <p className="font-medium">{zone.statistics.totalAlerts}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Active</p>
                              <p className="font-medium">{zone.statistics.activeDisasters}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Last Alert</p>
                              <p className="font-medium">
                                {zone.statistics.lastAlert
                                  ? new Date(zone.statistics.lastAlert).toLocaleDateString()
                                  : 'Never'}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestZone(zone.id);
                            }}
                          >
                            <TestTube className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Edit functionality - future enhancement
                              toast({
                                title: "Coming Soon",
                                description: "Zone editing will be available in the next version.",
                              });
                            }}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAlertZone(zone.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Create Zone Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Alert Zone</DialogTitle>
            <DialogDescription>
              Configure your new alert zone settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="zone-name">Zone Name</Label>
              <Input
                id="zone-name"
                value={newZone.name}
                onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                placeholder="e.g., Home Area, Work Zone"
              />
            </div>
            
            <div>
              <Label htmlFor="zone-description">Description (Optional)</Label>
              <Input
                id="zone-description"
                value={newZone.description}
                onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                placeholder="Additional notes about this zone"
              />
            </div>
            
            <div>
              <Label htmlFor="zone-priority">Priority Level</Label>
              <Select
                value={newZone.priority}
                onValueChange={(value: 'high' | 'medium' | 'low') =>
                  setNewZone({ ...newZone, priority: value })
                }
              >
                <SelectTrigger id="zone-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="zone-color">Zone Color</Label>
              <div className="flex gap-2">
                <Input
                  id="zone-color"
                  type="color"
                  value={newZone.color}
                  onChange={(e) => setNewZone({ ...newZone, color: e.target.value })}
                  className="w-20"
                />
                <Input
                  value={newZone.color}
                  onChange={(e) => setNewZone({ ...newZone, color: e.target.value })}
                  placeholder="#ff0000"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="zone-active">Activate immediately</Label>
              <Switch
                id="zone-active"
                checked={newZone.isActive}
                onCheckedChange={(checked) => setNewZone({ ...newZone, isActive: checked })}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateZone} disabled={!newZone.name}>
                Create Zone
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}