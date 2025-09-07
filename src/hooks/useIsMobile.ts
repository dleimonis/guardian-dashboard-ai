import { useState, useEffect } from 'react';

interface MobileBreakpoints {
  isMobile: boolean;      // < 768px
  isTablet: boolean;      // 768px - 1024px
  isDesktop: boolean;     // > 1024px
  isSmallMobile: boolean; // < 480px
  width: number;
  height: number;
}

/**
 * Custom hook to detect device type and screen size
 * Returns responsive breakpoint states and dimensions
 */
export const useIsMobile = (): MobileBreakpoints => {
  const [windowSize, setWindowSize] = useState<MobileBreakpoints>(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const height = typeof window !== 'undefined' ? window.innerHeight : 768;
    
    return {
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      isSmallMobile: width < 480,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isSmallMobile: width < 480,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Simple hook to just detect if mobile (< 768px)
 */
export const useSimpleIsMobile = (): boolean => {
  const { isMobile } = useIsMobile();
  return isMobile;
};

/**
 * Hook to detect touch device capability
 */
export const useIsTouchDevice = (): boolean => {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
};

/**
 * Hook to detect device orientation
 */
export const useOrientation = (): 'portrait' | 'landscape' => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    () => {
      if (typeof window !== 'undefined') {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      }
      return 'portrait';
    }
  );

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
      );
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return orientation;
};