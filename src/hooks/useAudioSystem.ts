import { useState, useCallback, useRef, useEffect } from 'react';

export type SoundProfile = 'Red Alert' | 'Subtle' | 'Voice Only';

interface AudioSystemState {
  isEnabled: boolean;
  volume: number;
  profile: SoundProfile;
  isPlaying: boolean;
}

export const useAudioSystem = () => {
  const [state, setState] = useState<AudioSystemState>({
    isEnabled: false,
    volume: 0.7,
    profile: 'Subtle',
    isPlaying: false,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    // Initialize Web Audio API with better error handling
    const initAudio = async () => {
      try {
        // Check if Web Audio API is supported
        if (!window.AudioContext && !(window as any).webkitAudioContext) {
          console.warn('Web Audio API not supported in this browser');
          return;
        }

        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = state.volume;
        console.log('Audio system initialized successfully');
      } catch (error) {
        console.warn('Audio context initialization failed:', error);
        // Gracefully degrade - disable audio features
        setState(prev => ({ ...prev, isEnabled: false }));
      }
    };

    initAudio();

    return () => {
      try {
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
      } catch (error) {
        console.warn('Error closing audio context:', error);
      }
    };
  }, []);

  const toggleSound = useCallback(() => {
    setState(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume }));
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, []);

  const setProfile = useCallback((profile: SoundProfile) => {
    setState(prev => ({ ...prev, profile }));
  }, []);

  const playSound = useCallback(async (type: 'alert' | 'notification' | 'emergency' | 'test') => {
    if (!state.isEnabled || !audioContextRef.current || !gainNodeRef.current) return;

    setState(prev => ({ ...prev, isPlaying: true }));

    try {
      // Create different tones based on sound profile and type
      const frequency = getFrequency(type, state.profile);
      const duration = getDuration(type, state.profile);
      
      const oscillator = audioContextRef.current.createOscillator();
      const envelope = audioContextRef.current.createGain();
      
      oscillator.connect(envelope);
      envelope.connect(gainNodeRef.current);
      
      oscillator.frequency.setValueAtTime(frequency, audioContextRef.current.currentTime);
      oscillator.type = state.profile === 'Red Alert' ? 'sawtooth' : 'sine';
      
      // Envelope for smooth attack and decay
      envelope.gain.setValueAtTime(0, audioContextRef.current.currentTime);
      envelope.gain.linearRampToValueAtTime(0.3, audioContextRef.current.currentTime + 0.1);
      envelope.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
      
      oscillator.onended = () => {
        setState(prev => ({ ...prev, isPlaying: false }));
      };
      
    } catch (error) {
      console.warn('Sound playback failed:', error);
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, [state.isEnabled, state.profile]);

  return {
    ...state,
    toggleSound,
    setVolume,
    setProfile,
    playSound,
  };
};

const getFrequency = (type: string, profile: SoundProfile): number => {
  const frequencies = {
    'Red Alert': { alert: 880, notification: 660, emergency: 1047, test: 523 },
    'Subtle': { alert: 440, notification: 330, emergency: 523, test: 261 },
    'Voice Only': { alert: 220, notification: 165, emergency: 261, test: 130 },
  };
  return frequencies[profile][type as keyof typeof frequencies[typeof profile]] || 440;
};

const getDuration = (type: string, profile: SoundProfile): number => {
  const durations = {
    'Red Alert': { alert: 0.8, notification: 0.3, emergency: 1.2, test: 0.5 },
    'Subtle': { alert: 0.4, notification: 0.2, emergency: 0.6, test: 0.3 },
    'Voice Only': { alert: 0.2, notification: 0.1, emergency: 0.3, test: 0.2 },
  };
  return durations[profile][type as keyof typeof durations[typeof profile]] || 0.3;
};