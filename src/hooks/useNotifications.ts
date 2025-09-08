import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Flame, CloudRain, Activity, Users } from 'lucide-react';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
}

interface DisasterNotification {
  id: string;
  type: string;
  severity: string;
  location: string;
  message: string;
  timestamp: string;
}

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Check if notifications are supported and add initialization delay
  useEffect(() => {
    setIsSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
    
    // Add a 3 second delay before allowing notifications to prevent immediate sounds on page load
    const initTimer = setTimeout(() => {
      setIsInitialized(true);
    }, 3000);
    
    return () => clearTimeout(initTimer);
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: 'Notifications not supported',
        description: 'Your browser does not support notifications',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: 'Notifications enabled',
          description: 'You will receive alerts for disasters',
        });
        
        // Show a test notification
        showNotification({
          title: '🚨 Guardian AI Active',
          body: 'You will now receive real-time disaster alerts',
          tag: 'welcome',
        });
        
        return true;
      } else if (result === 'denied') {
        toast({
          title: 'Notifications blocked',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [isSupported, toast]);

  // Track active sounds for cleanup
  const [activeSounds, setActiveSounds] = useState<Set<number>>(new Set());
  const soundTimeoutsRef = useRef<number[]>([]);
  const maxBeeps = 3;
  const beepCount = useRef(0);

  // Play notification sound with proper cleanup
  const playSound = useCallback((severity: string, repetition: number = 0) => {
    if (!soundEnabled || !isInitialized) return;
    
    // Prevent infinite loops - max 3 beeps for critical
    if (repetition >= maxBeeps) {
      beepCount.current = 0;
      return;
    }
    
    try {
      // Create audio context for different severity levels
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different sounds for different severities
      switch (severity) {
        case 'critical':
          // Urgent alarm sound
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.3;
          oscillator.type = 'square';
          break;
        case 'high':
          // Warning beep
          oscillator.frequency.value = 600;
          gainNode.gain.value = 0.2;
          oscillator.type = 'sine';
          break;
        case 'medium':
          // Soft alert
          oscillator.frequency.value = 400;
          gainNode.gain.value = 0.15;
          oscillator.type = 'sine';
          break;
        default:
          // Info chime
          oscillator.frequency.value = 300;
          gainNode.gain.value = 0.1;
          oscillator.type = 'sine';
      }
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
      
      // Cleanup after sound plays
      oscillator.onended = () => {
        audioContext.close();
      };
      
      // Play multiple beeps for critical (with safety limit)
      if (severity === 'critical' && repetition < maxBeeps - 1) {
        const timeoutId = window.setTimeout(() => {
          playSound('critical', repetition + 1);
        }, 300);
        soundTimeoutsRef.current.push(timeoutId);
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, [soundEnabled, isInitialized]);

  // Emergency stop all sounds
  const stopAllSounds = useCallback(() => {
    // Clear all pending timeouts
    soundTimeoutsRef.current.forEach(id => clearTimeout(id));
    soundTimeoutsRef.current = [];
    beepCount.current = 0;
    setSoundEnabled(false);
    
    toast({
      title: 'Sounds muted',
      description: 'All notification sounds have been disabled',
    });
  }, [toast]);

  // Show browser notification
  const showNotification = useCallback((options: NotificationOptions) => {
    if (permission !== 'granted') return null;
    
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction ?? true,
        silent: options.silent ?? false,
        data: options.data,
        badge: '/badge-72x72.png',
        vibrate: options.data?.severity === 'critical' ? [200, 100, 200] : [200],
      });
      
      // Handle click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
        
        // If there's location data, could center map on it
        if (options.data?.location) {
          window.dispatchEvent(new CustomEvent('focus-disaster', { 
            detail: options.data 
          }));
        }
      };
      
      // Auto close after 10 seconds for non-critical
      if (options.data?.severity !== 'critical') {
        setTimeout(() => notification.close(), 10000);
      }
      
      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      
      // Fallback to toast
      toast({
        title: options.title,
        description: options.body,
        variant: options.data?.severity === 'critical' ? 'destructive' : 'default',
      });
      
      return null;
    }
  }, [permission, toast]);

  // Send disaster notification
  const sendDisasterNotification = useCallback((disaster: DisasterNotification) => {
    // Skip notifications during initialization period
    if (!isInitialized) return;
    
    // Check if we should send this notification
    if (criticalOnly && disaster.severity !== 'critical') {
      return;
    }
    
    // Play sound
    playSound(disaster.severity);
    
    // Determine icon based on disaster type
    let icon = '🌍';
    switch (disaster.type.toLowerCase()) {
      case 'earthquake':
        icon = '🏚️';
        break;
      case 'fire':
        icon = '🔥';
        break;
      case 'flood':
        icon = '🌊';
        break;
      case 'weather':
        icon = '⛈️';
        break;
      case 'community':
        icon = '👥';
        break;
    }
    
    // Severity badge
    const severityBadge = disaster.severity === 'critical' ? '🚨 CRITICAL' : 
                         disaster.severity === 'high' ? '⚠️ HIGH' : 
                         disaster.severity === 'medium' ? '⚡ MEDIUM' : 'ℹ️ LOW';
    
    // Show notification
    showNotification({
      title: `${icon} ${severityBadge}: ${disaster.type.toUpperCase()}`,
      body: `${disaster.location}\n${disaster.message}`,
      tag: disaster.id,
      requireInteraction: disaster.severity === 'critical',
      data: disaster,
    });
    
    // Also show in-app toast for visibility
    toast({
      title: `${icon} ${disaster.type} Alert`,
      description: `${disaster.location}: ${disaster.message}`,
      variant: disaster.severity === 'critical' ? 'destructive' : 'default',
    });
  }, [criticalOnly, playSound, showNotification, toast, isInitialized]);

  // Check and request permission on mount if not granted
  useEffect(() => {
    if (isSupported && permission === 'default') {
      // Auto-request after 5 seconds on page
      const timer = setTimeout(() => {
        requestPermission();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission, requestPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear all sound timeouts on unmount
      soundTimeoutsRef.current.forEach(id => clearTimeout(id));
      soundTimeoutsRef.current = [];
    };
  }, []);

  return {
    permission,
    isSupported,
    soundEnabled,
    setSoundEnabled,
    criticalOnly,
    setCriticalOnly,
    requestPermission,
    showNotification,
    sendDisasterNotification,
    playSound,
    stopAllSounds,
  };
};