import { useState, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Header = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timezone, setTimezone] = useState('America/New_York');

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
    <header className="h-16 bg-gradient-surface backdrop-blur-glass border-b border-border/50 px-6 flex items-center justify-between shadow-glass">
      {/* Logo */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center shadow-glow animate-pulse-glow">
          <span className="text-primary-foreground font-bold text-lg">C</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Crisis AI</h1>
          <p className="text-xs text-muted-foreground">Command Center</p>
        </div>
      </div>

      {/* Time and Timezone */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-3">
          <Clock className="w-4 h-4 text-secondary" />
          <div className="text-right">
            <div className="text-lg font-mono font-bold text-foreground">
              {formatTime(currentTime, timezone)}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDate(currentTime, timezone)}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-secondary" />
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger className="w-40 bg-surface-glass border-border/50 text-foreground">
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
      </div>
    </header>
  );
};

export default Header;