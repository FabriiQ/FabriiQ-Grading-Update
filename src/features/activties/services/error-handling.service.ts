/**
 * Comprehensive error handling service for activities system
 * Provides centralized error management, logging, and recovery strategies
 */

import { TRPCClientError } from '@trpc/client';

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  classId?: string;
  activityId?: string;
  assessmentId?: string;
  retryAttempt?: number;
  metadata?: Record<string, any>;
}

export interface ErrorReport {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  message: string;
  stack?: string;
  context: ErrorContext;
  userAgent?: string;
  url?: string;
  resolved?: boolean;
}

export type ErrorRecoveryStrategy = 
  | 'retry'
  | 'fallback'
  | 'redirect'
  | 'refresh'
  | 'manual';

export interface ErrorHandlingConfig {
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
  enableReporting: boolean;
  fallbackComponent?: React.ComponentType;
  recoveryStrategy: ErrorRecoveryStrategy;
}

class ActivityErrorHandlingService {
  private config: ErrorHandlingConfig = {
    maxRetries: 3,
    retryDelay: 1000,
    enableLogging: true,
    enableReporting: true,
    recoveryStrategy: 'retry',
  };

  private errorReports: Map<string, ErrorReport> = new Map();
  private retryAttempts: Map<string, number> = new Map();

  /**
   * Configure error handling behavior
   */
  configure(config: Partial<ErrorHandlingConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Handle errors with appropriate strategy
   */
  async handleError(
    error: Error | TRPCClientError<any>,
    context: ErrorContext = {}
  ): Promise<{
    shouldRetry: boolean;
    strategy: ErrorRecoveryStrategy;
    userMessage: string;
    errorId: string;
  }> {
    const errorId = this.generateErrorId();
    const errorReport = this.createErrorReport(error, context, errorId);
    
    // Store error report
    this.errorReports.set(errorId, errorReport);

    // Log error
    if (this.config.enableLogging) {
      this.logError(errorReport);
    }

    // Report error to monitoring service
    if (this.config.enableReporting) {
      await this.reportError(errorReport);
    }

    // Determine recovery strategy
    const strategy = this.determineRecoveryStrategy(error, context);
    const shouldRetry = this.shouldRetry(errorId, strategy);
    const userMessage = this.getUserFriendlyMessage(error, context);

    return {
      shouldRetry,
      strategy,
      userMessage,
      errorId,
    };
  }

  /**
   * Handle tRPC errors specifically
   */
  handleTRPCError(error: TRPCClientError<any>, context: ErrorContext = {}) {
    const enhancedContext = {
      ...context,
      trpcCode: error.data?.code,
      trpcPath: error.data?.path,
      httpStatus: error.data?.httpStatus,
    };

    return this.handleError(error, enhancedContext);
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: Error, context: ErrorContext = {}) {
    const enhancedContext = {
      ...context,
      errorType: 'network',
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    };

    return this.handleError(error, enhancedContext);
  }

  /**
   * Handle validation errors
   */
  handleValidationError(
    errors: Record<string, string[]>,
    context: ErrorContext = {}
  ) {
    const error = new Error('Validation failed');
    const enhancedContext = {
      ...context,
      errorType: 'validation',
      validationErrors: errors,
    };

    return this.handleError(error, enhancedContext);
  }

  /**
   * Handle permission errors
   */
  handlePermissionError(action: string, context: ErrorContext = {}) {
    const error = new Error(`Permission denied for action: ${action}`);
    const enhancedContext = {
      ...context,
      errorType: 'permission',
      deniedAction: action,
    };

    return this.handleError(error, enhancedContext);
  }

  /**
   * Retry a failed operation
   */
  async retry<T>(
    operation: () => Promise<T>,
    errorId: string,
    context: ErrorContext = {}
  ): Promise<T> {
    const currentAttempts = this.retryAttempts.get(errorId) || 0;
    
    if (currentAttempts >= this.config.maxRetries) {
      throw new Error(`Max retry attempts (${this.config.maxRetries}) exceeded for operation`);
    }

    try {
      // Wait before retry
      if (currentAttempts > 0) {
        await this.delay(this.config.retryDelay * Math.pow(2, currentAttempts - 1));
      }

      this.retryAttempts.set(errorId, currentAttempts + 1);
      const result = await operation();
      
      // Clear retry count on success
      this.retryAttempts.delete(errorId);
      
      return result;
    } catch (error) {
      // Handle retry failure
      await this.handleError(error as Error, {
        ...context,
        retryAttempt: currentAttempts + 1,
      });
      throw error;
    }
  }

  /**
   * Get error report by ID
   */
  getErrorReport(errorId: string): ErrorReport | undefined {
    return this.errorReports.get(errorId);
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string) {
    const report = this.errorReports.get(errorId);
    if (report) {
      report.resolved = true;
      this.errorReports.set(errorId, report);
    }
  }

  /**
   * Clear old error reports
   */
  clearOldErrors(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours
    const now = Date.now();
    let deletedCount = 0;

    for (const [id, report] of this.errorReports.entries()) {
      const reportAge = now - new Date(report.timestamp).getTime();
      if (reportAge > maxAge) {
        this.errorReports.delete(id);
        this.retryAttempts.delete(id);
        deletedCount++;
      }
    }

    // Log cleanup for monitoring
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old error reports`);
    }

    // Force garbage collection if available (Node.js)
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }

  private generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private createErrorReport(
    error: Error | TRPCClientError<any>,
    context: ErrorContext,
    errorId: string
  ): ErrorReport {
    return {
      id: errorId,
      timestamp: new Date().toISOString(),
      level: this.getErrorLevel(error),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      resolved: false,
    };
  }

  private getErrorLevel(error: Error | TRPCClientError<any>): ErrorReport['level'] {
    if (error instanceof TRPCClientError) {
      switch (error.data?.code) {
        case 'UNAUTHORIZED':
        case 'FORBIDDEN':
          return 'warn';
        case 'INTERNAL_SERVER_ERROR':
          return 'critical';
        case 'BAD_REQUEST':
          return 'warn';
        default:
          return 'error';
      }
    }

    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'warn';
    }
    
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'warn';
    }
    
    if (message.includes('database') || message.includes('server')) {
      return 'critical';
    }
    
    return 'error';
  }

  private determineRecoveryStrategy(
    error: Error | TRPCClientError<any>,
    context: ErrorContext
  ): ErrorRecoveryStrategy {
    if (error instanceof TRPCClientError) {
      switch (error.data?.code) {
        case 'UNAUTHORIZED':
          return 'redirect';
        case 'FORBIDDEN':
          return 'fallback';
        case 'TIMEOUT':
          return 'retry';
        case 'INTERNAL_SERVER_ERROR':
          return 'retry';
        default:
          return this.config.recoveryStrategy;
      }
    }

    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('timeout')) {
      return 'retry';
    }
    
    if (message.includes('permission')) {
      return 'fallback';
    }
    
    return this.config.recoveryStrategy;
  }

  private shouldRetry(errorId: string, strategy: ErrorRecoveryStrategy): boolean {
    if (strategy !== 'retry') {
      return false;
    }

    const currentAttempts = this.retryAttempts.get(errorId) || 0;
    return currentAttempts < this.config.maxRetries;
  }

  private getUserFriendlyMessage(
    error: Error | TRPCClientError<any>,
    context: ErrorContext
  ): string {
    if (error instanceof TRPCClientError) {
      switch (error.data?.code) {
        case 'UNAUTHORIZED':
          return 'Please log in to continue.';
        case 'FORBIDDEN':
          return 'You do not have permission to perform this action.';
        case 'NOT_FOUND':
          return 'The requested resource was not found.';
        case 'TIMEOUT':
          return 'The request timed out. Please try again.';
        case 'INTERNAL_SERVER_ERROR':
          return 'A server error occurred. Please try again later.';
        default:
          return 'An error occurred while processing your request.';
      }
    }

    const message = error.message.toLowerCase();
    
    if (message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    if (message.includes('validation')) {
      return 'Please check your input and try again.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  private logError(report: ErrorReport) {
    const logMethod = report.level === 'critical' ? 'error' : 
                     report.level === 'error' ? 'error' :
                     report.level === 'warn' ? 'warn' : 'info';

    console[logMethod](`[${report.level.toUpperCase()}] ${report.message}`, {
      errorId: report.id,
      context: report.context,
      timestamp: report.timestamp,
    });
  }

  private async reportError(report: ErrorReport) {
    try {
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(report),
        });
      }
    } catch (error) {
      console.error('Failed to report error:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const activityErrorHandler = new ActivityErrorHandlingService();

// Export utility functions
export function handleActivityError(error: Error, context?: ErrorContext) {
  return activityErrorHandler.handleError(error, context);
}

export function handleTRPCError(error: TRPCClientError<any>, context?: ErrorContext) {
  return activityErrorHandler.handleTRPCError(error, context);
}

export function retryOperation<T>(
  operation: () => Promise<T>,
  errorId: string,
  context?: ErrorContext
): Promise<T> {
  return activityErrorHandler.retry(operation, errorId, context);
}
