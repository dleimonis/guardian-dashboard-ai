import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  X, 
  Activity, 
  AlertTriangle, 
  Map, 
  Users,
  Settings,
  Home
} from 'lucide-react';

interface MobileNavProps {
  className?: string;
  onNavigate?: (section: string) => void;
  currentSection?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ 
  className = '', 
  onNavigate,
  currentSection = 'dashboard'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'agents', label: 'AI Agents', icon: Activity },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'map', label: 'World Map', icon: Map },
    { id: 'community', label: 'Community', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavigate = (section: string) => {
    onNavigate?.(section);
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`md:hidden ${className}`}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">C</span>
            </div>
            Crisis AI
          </SheetTitle>
        </SheetHeader>
        
        <nav className="mt-8 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start gap-3 h-12"
                onClick={() => handleNavigate(item.id)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
            );
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="p-3 bg-muted/30 rounded-lg border border-border/50">
            <p className="text-xs text-muted-foreground">
              Guardian Dashboard AI v1.0
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Emergency Management System
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;