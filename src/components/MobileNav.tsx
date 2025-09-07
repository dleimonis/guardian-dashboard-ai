import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  Menu, 
  Home,
  User,
  Shield,
  Settings,
  Bell,
  Volume2,
  Accessibility
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
  const navigate = useNavigate();
  const { user } = useUser();

  const handleNavigate = (path: string) => {
    navigate(path);
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
          {/* Main Navigation */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => handleNavigate('/')}
          >
            <Home className="h-5 w-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12"
            onClick={() => handleNavigate('/profile')}
          >
            <User className="h-5 w-5" />
            <span className="text-sm font-medium">User Profile</span>
          </Button>
          
          {user?.role === 'admin' && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => handleNavigate('/admin')}
            >
              <Shield className="h-5 w-5" />
              <span className="text-sm font-medium">Admin Dashboard</span>
            </Button>
          )}
          
          <Separator className="my-4" />
          
          {/* Settings Section */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground px-3">Settings</p>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                // These could open modals or sections
                setIsOpen(false);
              }}
            >
              <Bell className="h-5 w-5" />
              <span className="text-sm font-medium">Notifications</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              <Volume2 className="h-5 w-5" />
              <span className="text-sm font-medium">Sound Settings</span>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                setIsOpen(false);
              }}
            >
              <Accessibility className="h-5 w-5" />
              <span className="text-sm font-medium">Accessibility</span>
            </Button>
          </div>
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