import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Accessibility, 
  Eye, 
  Type, 
  Zap,
  Settings2
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  reducedMotion: boolean;
  focusHighlight: boolean;
}

const AccessibilitySettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('accessibilitySettings');
    return saved ? JSON.parse(saved) : {
      highContrast: false,
      fontSize: 'normal',
      reducedMotion: false,
      focusHighlight: true,
    };
  });

  const [fontScale, setFontScale] = useState(1);

  useEffect(() => {
    // Apply settings to document
    const root = document.documentElement;
    const body = document.body;
    
    // High contrast
    if (settings.highContrast) {
      body.classList.add('high-contrast');
    } else {
      body.classList.remove('high-contrast');
    }
    
    // Font size
    const scale = settings.fontSize === 'large' ? 1.15 : 
                  settings.fontSize === 'extra-large' ? 1.3 : 1;
    root.style.fontSize = `${scale * 16}px`;
    setFontScale(scale);
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
    } else {
      root.style.setProperty('--animation-duration', '');
    }
    
    // Save to localStorage
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings({
      highContrast: false,
      fontSize: 'normal',
      reducedMotion: false,
      focusHighlight: true,
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          aria-label="Accessibility settings"
          className="relative"
        >
          <Accessibility className="h-4 w-4" />
          {settings.highContrast && (
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Accessibility Settings
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSettings}
              className="text-xs"
            >
              Reset
            </Button>
          </div>

          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="high-contrast">High Contrast</Label>
            </div>
            <Switch
              id="high-contrast"
              checked={settings.highContrast}
              onCheckedChange={(checked) => updateSetting('highContrast', checked)}
            />
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="font-size">Text Size</Label>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs w-8">A</span>
              <Slider
                id="font-size"
                value={[fontScale]}
                onValueChange={([value]) => {
                  const size = value <= 1.1 ? 'normal' : 
                              value <= 1.2 ? 'large' : 'extra-large';
                  updateSetting('fontSize', size);
                }}
                max={1.3}
                min={1}
                step={0.15}
                className="flex-1"
              />
              <span className="text-lg w-8">A</span>
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {settings.fontSize === 'normal' ? 'Normal' : 
               settings.fontSize === 'large' ? 'Large (115%)' : 'Extra Large (130%)'}
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="reduced-motion">Reduce Motion</Label>
            </div>
            <Switch
              id="reduced-motion"
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => updateSetting('reducedMotion', checked)}
            />
          </div>

          {/* Info */}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              These settings help make the dashboard more accessible for users with visual 
              impairments or motion sensitivity.
            </p>
          </div>

          {/* Keyboard Shortcuts Info */}
          <div className="pt-2 border-t">
            <h4 className="text-xs font-semibold mb-2">Keyboard Shortcuts</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>
                <kbd className="px-1 py-0.5 bg-muted rounded">Tab</kbd> Navigate elements
              </div>
              <div>
                <kbd className="px-1 py-0.5 bg-muted rounded">Space</kbd> Activate buttons
              </div>
              <div>
                <kbd className="px-1 py-0.5 bg-muted rounded">Esc</kbd> Close dialogs
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AccessibilitySettingsComponent;