'use client';

import React, { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showDetails?: boolean;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error boundary component specifically designed for teacher portal
 * Provides consistent error handling with teacher-specific recovery options
 */
export class TeacherErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Teacher Portal Error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service if available
    if (typeof window !== 'undefined' && (window as any).errorReporting) {
      (window as any).errorReporting.captureException(error, {
        context: 'TeacherPortal',
        errorInfo,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="container mx-auto py-8">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error in Teacher Portal</AlertTitle>
                <AlertDescription>
                  We encountered an unexpected error while loading this page. 
                  Your teaching data is safe, and this issue has been reported to our team.
                </AlertDescription>
              </Alert>

              {this.props.showDetails && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md text-sm font-mono">
                    <div className="text-destructive font-semibold">
                      {this.state.error.name}: {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <pre className="mt-2 text-xs overflow-auto">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={this.handleReset} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                
                <Button variant="outline" asChild>
                  <Link href="/teacher/dashboard" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>

                <Button variant="ghost" onClick={() => window.history.back()}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </div>

              <div className="text-sm text-muted-foreground pt-4 border-t">
                <p>
                  If this problem persists, please contact your IT administrator or 
                  <Link href="/support" className="text-primary hover:underline ml-1">
                    submit a support ticket
                  </Link>.
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

/**
 * Hook-based error boundary for functional components
 */
export function useTeacherErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    console.error('Teacher Portal Error:', error);
    setError(error);

    // Log to error reporting service if available
    if (typeof window !== 'undefined' && (window as any).errorReporting) {
      (window as any).errorReporting.captureException(error, {
        context: 'TeacherPortal',
      });
    }
  }, []);

  return {
    error,
    resetError,
    captureError,
    hasError: error !== null,
  };
}

/**
 * Simple error display component for inline errors
 */
export function TeacherErrorDisplay({ 
  error, 
  onRetry, 
  className = '' 
}: { 
  error: string | Error; 
  onRetry?: () => void;
  className?: string;
}) {
  const errorMessage = typeof error === 'string' ? error : error.message;

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mt-2">
        {errorMessage}
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="mt-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Loading error component for API failures
 */
export function TeacherLoadingError({ 
  message = 'Failed to load data', 
  onRetry,
  showHomeButton = true 
}: { 
  message?: string;
  onRetry?: () => void;
  showHomeButton?: boolean;
}) {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Unable to Load Data</h3>
          <p className="text-muted-foreground mb-6">{message}</p>
          
          <div className="flex flex-col gap-2">
            {onRetry && (
              <Button onClick={onRetry} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            {showHomeButton && (
              <Button variant="outline" asChild className="w-full">
                <Link href="/teacher/dashboard">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
