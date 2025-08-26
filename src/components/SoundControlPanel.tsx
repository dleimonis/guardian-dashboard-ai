import { Volume2, VolumeX, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useAudioSystem, SoundProfile } from '@/hooks/useAudioSystem';

const SoundControlPanel = () => {
  try {
    const { isEnabled, volume, profile, isPlaying, toggleSound, setVolume, setProfile, playSound } = useAudioSystem();

  const soundProfiles: SoundProfile[] = ['Red Alert', 'Subtle', 'Voice Only'];

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

    const handleTestSound = () => {
      try {
        playSound('test');
      } catch (error) {
        console.warn('Failed to play test sound:', error);
      }
    };

    return (
    <div className="flex items-center space-x-4">
      {/* Sound Toggle */}
      <Button
        variant="glass"
        size="sm"
        onClick={toggleSound}
        className="p-2"
      >
        {isEnabled ? (
          <Volume2 className="w-4 h-4 text-success" />
        ) : (
          <VolumeX className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {/* Volume Slider */}
      {isEnabled && (
        <div className="flex items-center space-x-2 min-w-20">
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            max={1}
            step={0.1}
            className="w-20"
          />
          <span className="text-xs text-muted-foreground min-w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}

      {/* Sound Profile */}
      {isEnabled && (
        <Select value={profile} onValueChange={setProfile}>
          <SelectTrigger className="w-32 bg-surface-glass border-border/50 text-foreground text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-glass backdrop-blur-glass border-border/50">
            {soundProfiles.map((profileOption) => (
              <SelectItem 
                key={profileOption} 
                value={profileOption}
                className="text-foreground hover:bg-accent/20 focus:bg-accent/20 text-xs"
              >
                {profileOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Test Sound */}
      {isEnabled && (
        <Button
          variant="glass"
          size="sm"
          onClick={handleTestSound}
          disabled={isPlaying}
          className="p-2"
        >
          <TestTube className="w-4 h-4 text-secondary" />
        </Button>
      )}
    </div>
    );
  } catch (error) {
    console.error('SoundControlPanel render error:', error);
    // Fallback UI for sound controls
    return (
      <div className="flex items-center space-x-4">
        <Button variant="glass" size="sm" disabled className="p-2">
          <VolumeX className="w-4 h-4 text-muted-foreground" />
        </Button>
        <span className="text-xs text-muted-foreground">Audio unavailable</span>
      </div>
    );
  }
};

export default SoundControlPanel;