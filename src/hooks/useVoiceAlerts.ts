import { useState, useEffect, useCallback, useRef } from 'react';

export interface VoiceSettings {
  enabled: boolean;
  volume: number; // 0-1
  rate: number; // 0.5-2
  pitch: number; // 0-2
  voice: string | null;
  urgencyVoice: 'calm' | 'urgent' | 'critical';
}

export interface VoiceAlert {
  id: string;
  text: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  enabled: true,
  volume: 0.8,
  rate: 1.0,
  pitch: 1.0,
  voice: null,
  urgencyVoice: 'urgent',
};

const URGENCY_SETTINGS = {
  calm: { rate: 0.9, pitch: 0.9, pauseBefore: 500 },
  urgent: { rate: 1.1, pitch: 1.1, pauseBefore: 200 },
  critical: { rate: 1.3, pitch: 1.2, pauseBefore: 0 },
};

export const useVoiceAlerts = () => {
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    const saved = localStorage.getItem('voiceSettings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });
  
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const [queue, setQueue] = useState<VoiceAlert[]>([]);
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  // Check browser support
  useEffect(() => {
    if ('speechSynthesis' in window) {
      setSupported(true);
      speechSynthesis.current = window.speechSynthesis;
      
      // Load voices
      const loadVoices = () => {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        
        // Set default voice if not set
        if (!settings.voice && availableVoices.length > 0) {
          // Prefer English voices
          const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
          if (englishVoice) {
            setSettings(prev => ({ ...prev, voice: englishVoice.name }));
          }
        }
      };

      loadVoices();
      
      // Chrome loads voices asynchronously
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    
    return () => {
      if (speechSynthesis.current) {
        speechSynthesis.current.cancel();
      }
    };
  }, []);

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('voiceSettings', JSON.stringify(settings));
  }, [settings]);

  // Process queue
  useEffect(() => {
    if (!settings.enabled || !supported || speaking || queue.length === 0) {
      return;
    }

    const alert = queue[0];
    speak(alert.text, alert.priority);
    setQueue(prev => prev.slice(1));
  }, [queue, speaking, settings.enabled, supported]);

  const speak = useCallback((text: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium') => {
    if (!supported || !speechSynthesis.current || !settings.enabled) {
      return;
    }

    // Cancel any ongoing speech
    speechSynthesis.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance.current = utterance;
    
    // Apply settings
    utterance.volume = settings.volume;
    
    // Apply urgency-based settings
    const urgencyLevel = priority === 'critical' ? 'critical' : 
                        priority === 'high' ? 'urgent' : 'calm';
    const urgency = URGENCY_SETTINGS[urgencyLevel];
    
    utterance.rate = settings.rate * urgency.rate;
    utterance.pitch = settings.pitch * urgency.pitch;
    
    // Set voice
    if (settings.voice) {
      const selectedVoice = voices.find(v => v.name === settings.voice);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }
    
    // Handle events
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    
    // Add pause before speaking based on urgency
    setTimeout(() => {
      speechSynthesis.current?.speak(utterance);
    }, urgency.pauseBefore);
  }, [supported, settings, voices]);

  const speakAlert = useCallback((alert: Omit<VoiceAlert, 'id' | 'timestamp'>) => {
    const voiceAlert: VoiceAlert = {
      ...alert,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    
    if (settings.enabled) {
      setQueue(prev => [...prev, voiceAlert]);
    }
  }, [settings.enabled]);

  const stop = useCallback(() => {
    if (speechSynthesis.current) {
      speechSynthesis.current.cancel();
      setSpeaking(false);
      setQueue([]);
    }
  }, []);

  const pause = useCallback(() => {
    if (speechSynthesis.current && speaking) {
      speechSynthesis.current.pause();
    }
  }, [speaking]);

  const resume = useCallback(() => {
    if (speechSynthesis.current && speechSynthesis.current.paused) {
      speechSynthesis.current.resume();
    }
  }, []);

  const updateSettings = useCallback((updates: Partial<VoiceSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  }, []);

  const testVoice = useCallback((text: string = 'This is a test of the emergency alert system.') => {
    speak(text, 'medium');
  }, [speak]);

  return {
    settings,
    updateSettings,
    speakAlert,
    speak,
    stop,
    pause,
    resume,
    testVoice,
    speaking,
    supported,
    voices,
    queueLength: queue.length,
  };
};