'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/atoms/button';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showErrorDetails?: boolean;
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

/**
 * Production-ready error boundary for activities system
 * Provides comprehensive error handling with logging and recovery options
 */
export class ActivityErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to monitoring service
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logError = (error: Error, errorInfo: ErrorInfo) => {
    const errorData = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: this.props.context || 'ActivitySystem',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      retryCount: this.retryCount,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Activity Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Data:', errorData);
      console.groupEnd();
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      try {
        // Replace with your actual error monitoring service
        // Example: Sentry, LogRocket, Bugsnag, etc.
        this.sendToMonitoringService(errorData);
      } catch (monitoringError) {
        console.error('Failed to send error to monitoring service:', monitoringError);
      }
    }
  };

  private sendToMonitoringService = async (errorData: any) => {
    try {
      // Example implementation - replace with your monitoring service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData),
      });
    } catch (error) {
      console.error('Error monitoring service failed:', error);
    }
  };

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: '',
      });
    }
  };

  private handleReset = () => {
    this.retryCount = 0;
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReportData = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      context: this.props.context,
    };

    // Open bug report with pre-filled data
    const bugReportUrl = `mailto:support@fabriiq.com?subject=Activity Error Report - ${errorId}&body=${encodeURIComponent(
      `Error ID: ${errorId}\n\nError Message: ${error?.message}\n\nContext: ${this.props.context}\n\nPlease describe what you were doing when this error occurred:\n\n`
    )}`;

    if (typeof window !== 'undefined') {
      window.open(bugReportUrl);
    }
  };

  private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'medium';
    }
    
    if (message.includes('chunk') || message.includes('loading')) {
      return 'low';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'high';
    }
    
    if (message.includes('database') || message.includes('server')) {
      return 'critical';
    }
    
    return 'medium';
  };

  private getErrorMessage = (error: Error): string => {
    const severity = this.getErrorSeverity(error);
    
    switch (severity) {
      case 'low':
        return 'A minor issue occurred while loading the activity. Please try again.';
      case 'medium':
        return 'An error occurred while processing your request. Please try again or contact support if the issue persists.';
      case 'high':
        return 'A significant error occurred. Please check your permissions and try again, or contact support.';
      case 'critical':
        return 'A critical system error occurred. Please contact support immediately.';
      default:
        return 'An unexpected error occurred. Please try again or contact support.';
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorId } = this.state;
      const severity = error ? this.getErrorSeverity(error) : 'medium';
      const userMessage = error ? this.getErrorMessage(error) : 'An unexpected error occurred.';
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Activity System Error
              </CardTitle>
              <CardDescription className="text-gray-600">
                {userMessage}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Alert variant={severity === 'critical' ? 'destructive' : 'default'}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Error ID: <code className="font-mono text-sm">{errorId}</code>
                  {severity === 'critical' && (
                    <span className="block mt-2 font-medium">
                      This is a critical error. Please contact support immediately.
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {this.props.showErrorDetails && process.env.NODE_ENV === 'development' && error && (
                <Alert>
                  <Bug className="h-4 w-4" />
                  <AlertDescription>
                    <details className="mt-2">
                      <summary className="cursor-pointer font-medium">
                        Technical Details (Development Only)
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto bg-gray-50 p-2 rounded">
                        {error.message}
                        {error.stack && `\n\nStack Trace:\n${error.stack}`}
                      </pre>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {canRetry && (
                  <Button onClick={this.handleRetry} className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}
                
                <Button variant="outline" onClick={this.handleReset}>
                  <Home className="h-4 w-4 mr-2" />
                  Reset Component
                </Button>
                
                <Button variant="outline" onClick={this.handleReportBug}>
                  <Bug className="h-4 w-4 mr-2" />
                  Report Bug
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                <p>
                  If this error persists, please contact support with Error ID: {errorId}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withActivityErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ActivityErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ActivityErrorBoundary>
  );

  WrappedComponent.displayName = `withActivityErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for error reporting
export function useActivityErrorReporting() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    const errorData = {
      errorId: `ACT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      context: context || 'Manual Report',
      timestamp: new Date().toISOString(),
    };

    if (process.env.NODE_ENV === 'development') {
      console.error('Manual Error Report:', errorData);
    }

    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(console.error);
    }
  }, []);

  return { reportError };
}
