import { useCountUp } from '@/hooks/useCountUp';

interface CountUpNumberProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

const CountUpNumber = ({ 
  value, 
  duration = 2000, 
  className = "", 
  formatter = (n) => n.toString() 
}: CountUpNumberProps) => {
  const count = useCountUp(value, duration);
  
  return (
    <span className={className}>
      {formatter(count)}
    </span>
  );
};

export default CountUpNumber;