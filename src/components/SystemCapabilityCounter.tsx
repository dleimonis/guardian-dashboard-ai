import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, Shield, TrendingUp, Clock, Globe, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SystemCapabilityCounter() {
  const [responseTime, setResponseTime] = React.useState(18);
  const [coverage, setCoverage] = React.useState(195);
  const [activeAlerts, setActiveAlerts] = React.useState(12);
  const [detectionAccuracy, setDetectionAccuracy] = React.useState(99.2);

  React.useEffect(() => {
    // Simulate real-time metrics
    const interval = setInterval(() => {
      setResponseTime(Math.floor(Math.random() * 10) + 15); // 15-25 seconds
      setActiveAlerts(Math.floor(Math.random() * 5) + 8);
      setDetectionAccuracy(98.5 + Math.random() * 1.5); // 98.5-100%
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
          <Shield className="h-5 w-5 text-blue-500" />
          System Capabilities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main capability message */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              Life-Saving Potential
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Designed to save thousands of lives through early warning
            </p>
          </div>

          {/* Real-time metrics grid */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Clock className="h-4 w-4 text-green-500" />
              </div>
              <motion.div
                key={responseTime}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-lg font-semibold"
              >
                {responseTime}s
              </motion.div>
              <div className="text-xs text-muted-foreground">Response Time</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Activity className="h-4 w-4 text-purple-500" />
              </div>
              <motion.div
                key={detectionAccuracy}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="text-lg font-semibold"
              >
                {detectionAccuracy.toFixed(1)}%
              </motion.div>
              <div className="text-xs text-muted-foreground">Accuracy</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Globe className="h-4 w-4 text-blue-500" />
              </div>
              <div className="text-lg font-semibold">{coverage}</div>
              <div className="text-xs text-muted-foreground">Countries</div>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Shield className="h-4 w-4 text-orange-500" />
              </div>
              <div className="text-lg font-semibold">{activeAlerts}</div>
              <div className="text-xs text-muted-foreground">Active Agents</div>
            </div>
          </div>

          {/* Impact message */}
          <div className="bg-blue-100 dark:bg-blue-900/50 rounded-lg p-3 mt-4">
            <p className="text-xs text-blue-700 dark:text-blue-300 text-center font-medium">
              With global deployment, this system could prevent thousands of casualties
              annually through 24/7 autonomous monitoring and instant alerts.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}