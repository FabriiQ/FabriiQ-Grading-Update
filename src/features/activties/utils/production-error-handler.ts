/**
 * Production-Ready Error Handling System
 * 
 * Comprehensive error handling with logging, user-friendly messages,
 * recovery strategies, and monitoring integration.
 */

import React from 'react';
import { toast } from 'sonner';

// Error types and categories
export enum ErrorCategory {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  SERVER = 'SERVER',
  CLIENT = 'CLIENT',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  userAgent: string;
  url: string;
}

export interface AppError {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  originalError?: Error;
  context: ErrorContext;
  userMessage: string;
  recoveryActions: RecoveryAction[];
  shouldReport: boolean;
}

export interface RecoveryAction {
  label: string;
  action: () => void;
  type: 'retry' | 'redirect' | 'refresh' | 'custom';
}

// Error handler class
export class ProductionErrorHandler {
  private static instance: ProductionErrorHandler;
  private errorQueue: AppError[] = [];
  private isOnline = navigator.onLine;
  private retryAttempts = new Map<string, number>();

  private constructor() {
    this.setupGlobalErrorHandlers();
    this.setupNetworkMonitoring();
  }

  public static getInstance(): ProductionErrorHandler {
    if (!ProductionErrorHandler.instance) {
      ProductionErrorHandler.instance = new ProductionErrorHandler();
    }
    return ProductionErrorHandler.instance;
  }

  /**
   * Handle an error with full context and recovery options
   */
  public handleError(
    error: Error | string,
    context: Partial<ErrorContext> = {},
    options: {
      showToUser?: boolean;
      category?: ErrorCategory;
      severity?: ErrorSeverity;
      recoveryActions?: RecoveryAction[];
    } = {}
  ): AppError {
    const appError = this.createAppError(error, context, options);
    
    // Log error
    this.logError(appError);
    
    // Show user notification if requested
    if (options.showToUser !== false) {
      this.showUserNotification(appError);
    }
    
    // Report to monitoring service
    if (appError.shouldReport) {
      this.reportError(appError);
    }
    
    // Queue for offline handling if needed
    if (!this.isOnline && appError.severity !== ErrorSeverity.LOW) {
      this.errorQueue.push(appError);
    }
    
    return appError;
  }

  /**
   * Handle network errors with retry logic
   */
  public async handleNetworkError(
    error: Error,
    context: Partial<ErrorContext> = {},
    retryFunction?: () => Promise<any>
  ): Promise<any> {
    const errorId = this.generateErrorId();
    const attempts = this.retryAttempts.get(errorId) || 0;
    
    if (attempts < 3 && retryFunction) {
      this.retryAttempts.set(errorId, attempts + 1);
      
      // Exponential backoff
      const delay = Math.pow(2, attempts) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        const result = await retryFunction();
        this.retryAttempts.delete(errorId);
        return result;
      } catch (retryError) {
        return this.handleNetworkError(retryError as Error, context, retryFunction);
      }
    }
    
    // Max retries reached
    this.retryAttempts.delete(errorId);
    return this.handleError(error, context, {
      category: ErrorCategory.NETWORK,
      severity: ErrorSeverity.HIGH,
      recoveryActions: [
        {
          label: 'Retry',
          action: () => retryFunction?.(),
          type: 'retry'
        },
        {
          label: 'Refresh Page',
          action: () => window.location.reload(),
          type: 'refresh'
        }
      ]
    });
  }

  /**
   * Handle validation errors
   */
  public handleValidationError(
    errors: Record<string, string[]>,
    context: Partial<ErrorContext> = {}
  ): AppError {
    const errorMessage = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ');
    
    return this.handleError(
      new Error(`Validation failed: ${errorMessage}`),
      context,
      {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.MEDIUM,
        showToUser: true
      }
    );
  }

  /**
   * Handle authentication errors
   */
  public handleAuthError(
    error: Error,
    context: Partial<ErrorContext> = {}
  ): AppError {
    return this.handleError(error, context, {
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.HIGH,
      recoveryActions: [
        {
          label: 'Login Again',
          action: () => { window.location.href = '/login'; },
          type: 'redirect'
        }
      ]
    });
  }

  /**
   * Handle server errors
   */
  public handleServerError(
    error: Error,
    context: Partial<ErrorContext> = {}
  ): AppError {
    return this.handleError(error, context, {
      category: ErrorCategory.SERVER,
      severity: ErrorSeverity.HIGH,
      recoveryActions: [
        {
          label: 'Try Again',
          action: () => window.location.reload(),
          type: 'refresh'
        },
        {
          label: 'Contact Support',
          action: () => { window.open('/support', '_blank'); },
          type: 'custom'
        }
      ]
    });
  }

  // Private methods

  private createAppError(
    error: Error | string,
    context: Partial<ErrorContext>,
    options: any
  ): AppError {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const category = options.category || this.categorizeError(errorObj);
    const severity = options.severity || this.determineSeverity(category, errorObj);
    
    return {
      id: this.generateErrorId(),
      message: errorObj.message,
      category,
      severity,
      originalError: errorObj,
      context: {
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...context
      },
      userMessage: this.generateUserMessage(category, errorObj),
      recoveryActions: options.recoveryActions || this.generateRecoveryActions(category),
      shouldReport: severity !== ErrorSeverity.LOW
    };
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (message.includes('server') || message.includes('500')) {
      return ErrorCategory.SERVER;
    }
    
    return ErrorCategory.UNKNOWN;
  }

  private determineSeverity(category: ErrorCategory, error: Error): ErrorSeverity {
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.SERVER:
        return ErrorSeverity.HIGH;
      case ErrorCategory.NETWORK:
      case ErrorCategory.AUTHORIZATION:
        return ErrorSeverity.MEDIUM;
      case ErrorCategory.VALIDATION:
        return ErrorSeverity.LOW;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  private generateUserMessage(category: ErrorCategory, error: Error): string {
    const messages = {
      [ErrorCategory.NETWORK]: 'Connection problem. Please check your internet connection and try again.',
      [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
      [ErrorCategory.AUTHENTICATION]: 'Your session has expired. Please log in again.',
      [ErrorCategory.AUTHORIZATION]: 'You don\'t have permission to perform this action.',
      [ErrorCategory.SERVER]: 'Server error occurred. Our team has been notified.',
      [ErrorCategory.CLIENT]: 'An unexpected error occurred. Please try refreshing the page.',
      [ErrorCategory.UNKNOWN]: 'Something went wrong. Please try again or contact support.'
    };
    
    return messages[category] || messages[ErrorCategory.UNKNOWN];
  }

  private generateRecoveryActions(category: ErrorCategory): RecoveryAction[] {
    const actions = {
      [ErrorCategory.NETWORK]: [
        {
          label: 'Retry',
          action: () => window.location.reload(),
          type: 'retry' as const
        }
      ],
      [ErrorCategory.AUTHENTICATION]: [
        {
          label: 'Login',
          action: () => window.location.href = '/login',
          type: 'redirect' as const
        }
      ],
      [ErrorCategory.SERVER]: [
        {
          label: 'Refresh',
          action: () => window.location.reload(),
          type: 'refresh' as const
        }
      ]
    };
    
    return actions[category] || [
      {
        label: 'Refresh Page',
        action: () => window.location.reload(),
        type: 'refresh' as const
      }
    ];
  }

  private logError(error: AppError): void {
    const logData = {
      id: error.id,
      message: error.message,
      category: error.category,
      severity: error.severity,
      context: error.context,
      stack: error.originalError?.stack
    };
    
    // Console logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error [${error.severity}]`);
      console.error('Message:', error.message);
      console.error('Category:', error.category);
      console.error('Context:', error.context);
      console.error('Original Error:', error.originalError);
      console.groupEnd();
    }
    
    // Send to logging service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logData);
    }
  }

  private showUserNotification(error: AppError): void {
    const toastOptions = {
      description: error.userMessage,
      duration: error.severity === ErrorSeverity.CRITICAL ? 0 : 5000,
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        toast.error(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(error.userMessage, toastOptions);
        break;
      case ErrorSeverity.LOW:
        toast.info(error.userMessage, toastOptions);
        break;
    }

    // Show recovery actions if available
    if (error.recoveryActions.length > 0) {
      error.recoveryActions.forEach(action => {
        toast(action.label, {
          action: {
            label: action.label,
            onClick: action.action
          }
        });
      });
    }
  }

  private reportError(error: AppError): void {
    // Report to error monitoring service (e.g., Sentry, Bugsnag)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error.originalError, {
        tags: {
          category: error.category,
          severity: error.severity
        },
        extra: {
          context: error.context,
          userMessage: error.userMessage
        }
      });
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { component: 'global' },
        { category: ErrorCategory.CLIENT, severity: ErrorSeverity.HIGH }
      );
    });

    // Global JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError(
        new Error(`Global Error: ${event.message}`),
        { 
          component: 'global',
          metadata: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        },
        { category: ErrorCategory.CLIENT, severity: ErrorSeverity.HIGH }
      );
    });
  }

  private setupNetworkMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      toast.warning('You are offline. Some features may not work properly.');
    });
  }

  private processErrorQueue(): void {
    if (this.errorQueue.length > 0) {
      toast.info(`Processing ${this.errorQueue.length} queued errors...`);
      
      this.errorQueue.forEach(error => {
        if (error.shouldReport) {
          this.reportError(error);
        }
      });
      
      this.errorQueue = [];
    }
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToLoggingService(logData: any): Promise<void> {
    try {
      await fetch('/api/logging/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      // Fallback to console if logging service fails
      console.error('Failed to send error to logging service:', error);
    }
  }
}

// Convenience functions for common error scenarios
export const errorHandler = ProductionErrorHandler.getInstance();

export const handleApiError = (error: any, context?: Partial<ErrorContext>) => {
  if (error.response?.status === 401) {
    return errorHandler.handleAuthError(error, context);
  } else if (error.response?.status >= 500) {
    return errorHandler.handleServerError(error, context);
  } else if (error.code === 'NETWORK_ERROR') {
    return errorHandler.handleNetworkError(error, context);
  } else {
    return errorHandler.handleError(error, context);
  }
};

export const handleFormValidationError = (errors: Record<string, string[]>, context?: Partial<ErrorContext>) => {
  return errorHandler.handleValidationError(errors, context);
};

export const withErrorHandling = <T extends (...args: any[]) => any>(
  fn: T,
  context?: Partial<ErrorContext>
): T => {
  return ((...args: any[]) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          errorHandler.handleError(error, context);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      errorHandler.handleError(error as Error, context);
      throw error;
    }
  }) as T;
};

// React Error Boundary HOC
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallbackComponent?: React.ComponentType<{ error: Error; resetError: () => void }>
) => {
  return class ErrorBoundaryWrapper extends React.Component<P, { hasError: boolean; error?: Error }> {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      errorHandler.handleError(error, {
        component: Component.name,
        metadata: errorInfo
      });
    }

    render(): React.ReactNode {
      if (this.state.hasError) {
        const FallbackComponent = fallbackComponent || DefaultErrorFallback;
        return React.createElement(FallbackComponent, {
          error: this.state.error!,
          resetError: () => this.setState({ hasError: false, error: undefined })
        });
      }

      return React.createElement(Component, this.props);
    }
  };
};

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error; resetError: () => void }> = ({ error, resetError }) =>
  React.createElement('div', { className: 'p-6 text-center' }, [
    React.createElement('h2', {
      key: 'title',
      className: 'text-xl font-semibold text-red-600 mb-2'
    }, 'Something went wrong'),
    React.createElement('p', {
      key: 'message',
      className: 'text-gray-600 mb-4'
    }, error.message),
    React.createElement('button', {
      key: 'button',
      onClick: resetError,
      className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
    }, 'Try Again')
  ]);
