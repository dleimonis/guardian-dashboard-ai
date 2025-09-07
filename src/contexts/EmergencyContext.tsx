import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useWebSocket, WSMessage } from '@/hooks/useWebSocket';
import { apiService, Disaster, Alert, AgentStatus } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

interface EmergencyContextType {
  // Data
  disasters: Disaster[];
  alerts: Alert[];
  agentStatuses: Record<string, AgentStatus>;
  statistics: any;
  
  // Connection status
  isConnected: boolean;
  
  // Actions
  acknowledgeAlert: (id: string) => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
  runSimulation: (scenario: any) => Promise<void>;
  refreshData: () => Promise<void>;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (!context) {
    throw new Error('useEmergency must be used within EmergencyProvider');
  }
  return context;
};

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});
  const [statistics, setStatistics] = useState<any>({});
  const { toast } = useToast();

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: WSMessage) => {
    console.log('Processing WebSocket message:', message);
    
    switch (message.type) {
      case 'disaster':
        setDisasters((prev) => {
          const existing = prev.findIndex((d) => d.id === message.data.id);
          if (existing >= 0) {
            // Update existing disaster
            const updated = [...prev];
            updated[existing] = message.data;
            return updated;
          } else {
            // Add new disaster
            toast({
              title: '⚠️ New Disaster Detected',
              description: `${message.data.type} - ${message.data.location.name || 'Unknown location'}`,
              variant: message.data.severity === 'critical' ? 'destructive' : 'default',
            });
            return [message.data, ...prev];
          }
        });
        break;
        
      case 'alert':
        setAlerts((prev) => {
          const existing = prev.findIndex((a) => a.id === message.data.id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = message.data;
            return updated;
          } else {
            toast({
              title: '🚨 New Alert',
              description: message.data.title,
            });
            return [message.data, ...prev];
          }
        });
        break;
        
      case 'agent_status':
        setAgentStatuses((prev) => ({
          ...prev,
          [message.data.agent]: message.data,
        }));
        break;
        
      case 'statistics':
        setStatistics(message.data);
        break;
        
      case 'simulation':
        toast({
          title: '🎮 Simulation Update',
          description: message.data.message || 'Simulation in progress',
        });
        break;
    }
  }, [toast]);

  // Initialize WebSocket connection
  const { isConnected, sendMessage } = useWebSocket({
    onMessage: handleWebSocketMessage,
    onConnect: () => {
      console.log('Emergency context: WebSocket connected');
      fetchInitialData();
    },
  });

  // Fetch initial data from API
  const fetchInitialData = async () => {
    try {
      console.log('Fetching initial data...');
      
      // Fetch all data in parallel
      const [
        disastersData,
        alertsData,
        agentStatusesData,
        statisticsData,
      ] = await Promise.all([
        apiService.getDisasters().catch(() => []),
        apiService.getAlerts().catch(() => []),
        apiService.getAgentStatuses().catch(() => ({})),
        apiService.getAlertStatistics().catch(() => ({})),
      ]);

      setDisasters(disastersData);
      setAlerts(alertsData);
      setAgentStatuses(agentStatusesData);
      setStatistics(statisticsData);
      
      console.log('Initial data loaded:', {
        disasters: disastersData.length,
        alerts: alertsData.length,
        agents: Object.keys(agentStatusesData).length,
      });
    } catch (error) {
      console.error('Failed to fetch initial data:', error);
      
      // Use mock data if API is not available
      setDisasters([
        {
          id: 'mock_1',
          type: 'fire',
          severity: 'critical',
          location: { lat: 34.0522, lon: -118.2437, name: 'Los Angeles' },
          data: { confidence: 95 },
          timestamp: new Date().toISOString(),
        },
      ]);
      
      setAlerts([
        {
          id: 'mock_alert_1',
          title: 'Wildfire Alert',
          description: 'Active wildfire detected',
          severity: 'critical',
          location: 'Los Angeles, CA',
          timestamp: new Date().toISOString(),
          status: 'active',
        },
      ]);
      
      toast({
        title: 'Running in Demo Mode',
        description: 'Using simulated data - Backend not connected',
      });
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Actions
  const acknowledgeAlert = async (id: string) => {
    // Optimistically update UI first
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, status: 'acknowledged' } : alert
      )
    );

    try {
      await apiService.acknowledgeAlert(id);
      // Success - no need to show toast, UI already updated
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
      // In demo mode or when backend is down, keep the optimistic update
      // Only show error if it's a real error (not connection refused)
      if (error && !error.message?.includes('ECONNREFUSED') && !error.message?.includes('Network')) {
        // Rollback the optimistic update
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === id ? { ...alert, status: 'active' } : alert
          )
        );
        toast({
          title: 'Error',
          description: 'Failed to acknowledge alert',
          variant: 'destructive',
        });
      } else {
        // Demo mode or backend down - show success anyway
        console.log('Alert acknowledged in demo mode');
      }
    }
  };

  const dismissAlert = async (id: string) => {
    // Optimistically update UI first
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, status: 'dismissed' } : alert
      )
    );

    try {
      await apiService.dismissAlert(id);
      // Success - no need to show toast, UI already updated
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
      // In demo mode or when backend is down, keep the optimistic update
      if (error && !error.message?.includes('ECONNREFUSED') && !error.message?.includes('Network')) {
        // Rollback the optimistic update
        setAlerts((prev) =>
          prev.map((alert) =>
            alert.id === id ? { ...alert, status: 'active' } : alert
          )
        );
        toast({
          title: 'Error',
          description: 'Failed to dismiss alert',
          variant: 'destructive',
        });
      } else {
        console.log('Alert dismissed in demo mode');
      }
    }
  };

  const runSimulation = async (scenario: any) => {
    try {
      const result = await apiService.runSimulation(scenario);
      toast({
        title: '🚀 Simulation Started',
        description: `Running ${scenario.name} scenario`,
      });
      return result;
    } catch (error) {
      console.error('Failed to run simulation:', error);
      toast({
        title: 'Error',
        description: 'Failed to start simulation',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const refreshData = async () => {
    await fetchInitialData();
  };

  const value: EmergencyContextType = {
    disasters,
    alerts,
    agentStatuses,
    statistics,
    isConnected,
    acknowledgeAlert,
    dismissAlert,
    runSimulation,
    refreshData,
  };

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
};