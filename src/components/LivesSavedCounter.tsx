import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Shield, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LivesSavedCounter() {
  const [livesSaved, setLivesSaved] = React.useState(8542);
  const [recentSave, setRecentSave] = React.useState<number | null>(null);
  const [totalEvacuated, setTotalEvacuated] = React.useState(125432);
  const [activeAlerts, setActiveAlerts] = React.useState(12);

  React.useEffect(() => {
    // Simulate lives being saved through evacuations
    const interval = setInterval(() => {
      const newSaves = Math.floor(Math.random() * 50) + 10;
      setLivesSaved(prev => prev + newSaves);
      setRecentSave(newSaves);
      setTotalEvacuated(prev => prev + newSaves);
      
      // Clear the recent save animation after 2 seconds
      setTimeout(() => setRecentSave(null), 2000);
    }, 15000); // Update every 15 seconds

    // Simulate active alerts changing
    const alertInterval = setInterval(() => {
      setActiveAlerts(Math.floor(Math.random() * 5) + 8);
    }, 30000);

    return () => {
      clearInterval(interval);
      clearInterval(alertInterval);
    };
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <Heart className="h-5 w-5 text-red-500 animate-pulse" />
          Lives Saved by Guardian Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main counter */}
          <div className="text-center">
            <div className="text-4xl font-bold text-green-700 dark:text-green-300 relative">
              <motion.div
                key={livesSaved}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.3 }}
              >
                {formatNumber(livesSaved)}
              </motion.div>
              
              <AnimatePresence>
                {recentSave && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -30 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-0 right-0 text-lg text-green-600 font-semibold"
                  >
                    +{recentSave}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Lives saved through early warning systems
            </p>
          </div>

          {/* Statistics grid */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-lg font-semibold">{formatNumber(totalEvacuated)}</div>
              <div className="text-xs text-muted-foreground">Evacuated</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Shield className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-lg font-semibold">{activeAlerts}</div>
              <div className="text-xs text-muted-foreground">Active Alerts</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
              <div className="text-lg font-semibold">99.2%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>

          {/* Impact message */}
          <div className="bg-green-100 dark:bg-green-900/50 rounded-lg p-3 mt-4">
            <p className="text-xs text-green-700 dark:text-green-300 text-center font-medium">
              Every alert sent, every evacuation ordered, every early warning saves lives.
              Guardian Dashboard's AI agents work 24/7 to protect communities worldwide.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}