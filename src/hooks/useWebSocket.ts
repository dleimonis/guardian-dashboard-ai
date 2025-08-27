import { useEffect, useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface WSMessage {
  type: 'disaster' | 'alert' | 'agent_status' | 'statistics' | 'heartbeat' | 'simulation';
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  url?: string;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (message: WSMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

export const useWebSocket = ({
  url = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws',
  reconnectAttempts = 5,
  reconnectInterval = 3000,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const connect = useCallback(() => {
    try {
      // Clean up existing connection
      if (wsRef.current) {
        wsRef.current.close();
      }

      console.log(`Connecting to WebSocket: ${url}`);
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectCount(0);
        onConnect?.();
        
        // Send initial subscription message
        ws.send(JSON.stringify({
          type: 'subscribe',
          channels: ['disasters', 'alerts', 'agents', 'statistics'],
        }));

        toast({
          title: 'Connected',
          description: 'Real-time updates activated',
          duration: 3000,
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          console.log('WebSocket message received:', message);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        onDisconnect?.();
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectCount < reconnectAttempts) {
          toast({
            title: 'Disconnected',
            description: `Reconnecting... (${reconnectCount + 1}/${reconnectAttempts})`,
            duration: 2000,
          });

          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        } else {
          toast({
            title: 'Connection Lost',
            description: 'Unable to connect to real-time updates',
            variant: 'destructive',
          });
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to establish real-time connection',
        variant: 'destructive',
      });
    }
  }, [url, reconnectCount, reconnectAttempts, reconnectInterval, onConnect, onDisconnect, onError, onMessage, toast]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, []); // Empty dependency array for mount only

  // Heartbeat to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const heartbeatInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnectCount,
  };
};