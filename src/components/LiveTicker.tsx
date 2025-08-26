import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface TickerItem {
  id: string;
  message: string;
  timestamp: string;
  type: 'update' | 'alert' | 'system';
}

const LiveTicker = () => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([
    {
      id: '1',
      message: 'FireWatcher: Satellite imagery updated - 0 new hotspots detected',
      timestamp: new Date().toLocaleTimeString(),
      type: 'update',
    },
    {
      id: '2',
      message: 'QuakeDetector: Seismic monitoring operational - Pacific Ring of Fire stable',
      timestamp: new Date().toLocaleTimeString(),
      type: 'system',
    },
    {
      id: '3',
      message: 'WeatherTracker: Hurricane season monitoring active - 2 systems tracked',
      timestamp: new Date().toLocaleTimeString(),
      type: 'alert',
    },
  ]);

  const mockUpdates = [
    'FloodMonitor: Water level sensors calibrated - 847 stations online',
    'System: Database synchronization complete - 99.9% uptime maintained',
    'Alert: Wildfire containment progress - 85% contained in Los Angeles sector',
    'Update: Emergency response teams dispatched to Tokyo region',
    'System: Satellite constellation realigned - Coverage optimized',
    'FireWatcher: Thermal anomaly detected - Investigation initiated',
    'QuakeDetector: Minor tremor recorded - No threat assessment',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      const randomUpdate = mockUpdates[Math.floor(Math.random() * mockUpdates.length)];
      const newItem: TickerItem = {
        id: Date.now().toString(),
        message: randomUpdate,
        timestamp: new Date().toLocaleTimeString(),
        type: Math.random() > 0.7 ? 'alert' : Math.random() > 0.5 ? 'system' : 'update',
      };

      setTickerItems(prev => [newItem, ...prev.slice(0, 4)]);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'warning';
      case 'system':
        return 'secondary';
      case 'update':
        return 'success';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="h-16 bg-gradient-surface backdrop-blur-glass border-t border-border/50 px-6 flex items-center shadow-glass overflow-hidden">
      <div className="flex items-center space-x-4 mr-6">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-foreground">LIVE UPDATES</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex space-x-8 animate-[scroll_60s_linear_infinite]">
          {tickerItems.map((item) => (
            <div key={item.id} className="flex items-center space-x-3 whitespace-nowrap animate-slide-up">
              <Badge 
                variant="secondary"
                className={`text-xs bg-${getTypeColor(item.type)}/20 text-${getTypeColor(item.type)}-foreground border-${getTypeColor(item.type)}/30 uppercase`}
              >
                {item.type}
              </Badge>
              <span className="text-sm text-foreground">{item.message}</span>
              <span className="text-xs text-muted-foreground">({item.timestamp})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveTicker;