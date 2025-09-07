import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, VolumeX, Mic, MicOff, Settings, Play, Pause } from 'lucide-react';
import { useVoiceAlerts } from '@/hooks/useVoiceAlerts';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VoiceAlertsProps {
  className?: string;
}

const VoiceAlerts: React.FC<VoiceAlertsProps> = ({ className = '' }) => {
  const {
    settings,
    updateSettings,
    testVoice,
    stop,
    speaking,
    supported,
    voices,
  } = useVoiceAlerts();

  if (!supported) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Quick Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => updateSettings({ enabled: !settings.enabled })}
        className="relative"
        aria-label={settings.enabled ? 'Disable voice alerts' : 'Enable voice alerts'}
      >
        {settings.enabled ? (
          <Volume2 className="h-4 w-4" />
        ) : (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
        {speaking && (
          <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />
        )}
      </Button>

      {/* Settings Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" aria-label="Voice settings">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Voice Alert Settings</h3>
              {speaking && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={stop}
                  aria-label="Stop speaking"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <Label htmlFor="voice-enabled">Enable Voice Alerts</Label>
              <Switch
                id="voice-enabled"
                checked={settings.enabled}
                onCheckedChange={(enabled) => updateSettings({ enabled })}
              />
            </div>

            {/* Voice Selection */}
            <div className="space-y-2">
              <Label htmlFor="voice-select">Voice</Label>
              <Select
                value={settings.voice || ''}
                onValueChange={(voice) => updateSettings({ voice })}
                disabled={!settings.enabled}
              >
                <SelectTrigger id="voice-select">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.name} value={voice.name}>
                      {voice.name} ({voice.lang})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-volume">Volume</Label>
                <span className="text-sm text-muted-foreground">
                  {Math.round(settings.volume * 100)}%
                </span>
              </div>
              <Slider
                id="voice-volume"
                value={[settings.volume]}
                onValueChange={([volume]) => updateSettings({ volume })}
                max={1}
                min={0}
                step={0.1}
                disabled={!settings.enabled}
                className="w-full"
              />
            </div>

            {/* Speed */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-rate">Speed</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.rate.toFixed(1)}x
                </span>
              </div>
              <Slider
                id="voice-rate"
                value={[settings.rate]}
                onValueChange={([rate]) => updateSettings({ rate })}
                max={2}
                min={0.5}
                step={0.1}
                disabled={!settings.enabled}
                className="w-full"
              />
            </div>

            {/* Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-pitch">Pitch</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.pitch.toFixed(1)}
                </span>
              </div>
              <Slider
                id="voice-pitch"
                value={[settings.pitch]}
                onValueChange={([pitch]) => updateSettings({ pitch })}
                max={2}
                min={0}
                step={0.1}
                disabled={!settings.enabled}
                className="w-full"
              />
            </div>

            {/* Urgency Voice */}
            <div className="space-y-2">
              <Label htmlFor="urgency-voice">Alert Urgency Style</Label>
              <Select
                value={settings.urgencyVoice}
                onValueChange={(urgencyVoice: 'calm' | 'urgent' | 'critical') => 
                  updateSettings({ urgencyVoice })
                }
                disabled={!settings.enabled}
              >
                <SelectTrigger id="urgency-voice">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Test Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => testVoice()}
              disabled={!settings.enabled || speaking}
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              Test Voice Alert
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VoiceAlerts;