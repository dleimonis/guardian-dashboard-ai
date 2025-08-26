import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const EmergencyButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  const { toast } = useToast();

  const handleEmergencyTest = () => {
    setIsPressed(true);
    
    toast({
      title: "🚨 Emergency Test Initiated",
      description: "All monitoring systems activated. Simulating emergency response protocols.",
      duration: 5000,
    });

    // Reset after animation
    setTimeout(() => {
      setIsPressed(false);
    }, 2000);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <div className="relative">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-full bg-critical/20 animate-emergency-pulse" />
        
        {/* Main button */}
        <Button
          onClick={handleEmergencyTest}
          disabled={isPressed}
          variant="emergency"
          className={`
            relative w-20 h-20 rounded-full
            ${isPressed ? 'scale-95 bg-critical-glow' : 'hover:scale-105'}
            ${!isPressed ? 'animate-pulse-glow' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center">
            <AlertTriangle className={`w-8 h-8 ${isPressed ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold mt-1">TEST</span>
          </div>
        </Button>

        {/* Label */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
          <span className="bg-surface-glass backdrop-blur-glass px-3 py-1 rounded-full text-xs text-foreground border border-border/50">
            Emergency Test
          </span>
        </div>

        {/* Activation waves */}
        {isPressed && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-critical animate-ping" />
            <div className="absolute inset-0 rounded-full border border-critical/50 animate-ping animation-delay-200" style={{ animationDelay: '0.2s' }} />
            <div className="absolute inset-0 rounded-full border border-critical/30 animate-ping animation-delay-400" style={{ animationDelay: '0.4s' }} />
          </>
        )}
      </div>
    </div>
  );
};

export default EmergencyButton;