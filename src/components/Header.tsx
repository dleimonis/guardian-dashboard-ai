import { useState, useEffect } from 'react';
import { Clock, Globe, Sun, Moon, Menu, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import HeartbeatLine from '@/components/HeartbeatLine';
import SoundControlPanel from '@/components/SoundControlPanel';
import VoiceAlerts from '@/components/VoiceAlerts';
import AccessibilitySettings from '@/components/AccessibilitySettings';
import MobileNav from '@/components/MobileNav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timezone, setTimezone] = useState('America/New_York');
  const { theme, toggleTheme } = useTheme();
  const { isMobile, isTablet } = useIsMobile();

  const timezones = [
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'UTC', label: 'UTC' },
  ];

  useEffect(() => {
    // Detect user's timezone on mount
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date, tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  const formatDate = (date: Date, tz: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <header className="h-16 bg-gradient-surface backdrop-blur-glass border-b border-border/50 px-4 md:px-6 flex items-center justify-between shadow-glass">
      {/* Mobile Nav and Logo */}
      <div className="flex items-center space-x-2 md:space-x-3">
        {isMobile && <MobileNav />}
        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow animate-pulse-glow">
          <span className="text-primary-foreground font-bold text-sm md:text-lg">C</span>
        </div>
        <div className={`${isMobile ? 'hidden' : ''}`}>
          <h1 className="text-lg md:text-xl font-bold text-foreground">Crisis AI</h1>
          <p className="text-xs text-muted-foreground">Command Center</p>
        </div>
        {!isMobile && <HeartbeatLine className="ml-4" />}
      </div>

      {/* Center - Controls (Hidden on mobile, in dropdown) */}
      {!isMobile && (
        <div className="flex-1 flex justify-center items-center gap-4">
          <SoundControlPanel />
          <VoiceAlerts />
          <AccessibilitySettings />
        </div>
      )}

      {/* Mobile: Settings Dropdown, Desktop: Full Controls */}
      {isMobile ? (
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-sm font-mono font-bold text-foreground">
              {formatTime(currentTime, timezone)}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem className="p-2">
                <SoundControlPanel />
              </DropdownMenuItem>
              
              <DropdownMenuItem className="p-2">
                <VoiceAlerts />
              </DropdownMenuItem>
              
              <DropdownMenuItem className="p-2">
                <AccessibilitySettings />
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={toggleTheme}>
                {theme === 'light' ? (
                  <><Moon className="h-4 w-4 mr-2" /> Dark Mode</>
                ) : (
                  <><Sun className="h-4 w-4 mr-2" /> Light Mode</>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex items-center space-x-2 md:space-x-6">
          <div className={`flex items-center space-x-2 md:space-x-3 ${isTablet ? 'hidden' : ''}`}>
            <Clock className="w-4 h-4 text-secondary" />
            <div className="text-right">
              <div className="text-sm md:text-lg font-mono font-bold text-foreground">
                {formatTime(currentTime, timezone)}
              </div>
              <div className="text-xs text-muted-foreground hidden md:block">
                {formatDate(currentTime, timezone)}
              </div>
            </div>
          </div>

          <div className={`flex items-center space-x-2 ${isTablet ? 'hidden' : ''}`}>
            <Globe className="w-4 h-4 text-secondary" />
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="w-32 md:w-40 bg-surface-glass border-border/50 text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-surface-glass backdrop-blur-glass border-border/50">
                {timezones.map((tz) => (
                  <SelectItem 
                    key={tz.value} 
                    value={tz.value}
                    className="text-foreground hover:bg-accent/20 focus:bg-accent/20"
                  >
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="bg-surface-glass border-border/50"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;