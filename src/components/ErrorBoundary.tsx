import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-6 m-4 bg-surface-glass backdrop-blur-glass border-border/50">
          <div className="flex items-center space-x-3 text-warning mb-4">
            <AlertTriangle className="w-6 h-6" />
            <h2 className="text-lg font-semibold">Component Error</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            A component failed to render properly. This error has been logged for debugging.
          </p>
          <Button 
            variant="glass" 
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Try Again
          </Button>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;