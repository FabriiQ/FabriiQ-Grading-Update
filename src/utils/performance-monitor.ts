import { logger } from "@/server/api/utils/logger";

/**
 * Performance monitoring utilities for tracking login and navigation performance
 */

interface LoginPerformanceMetrics {
  username: string;
  startTime: number;
  endTime: number;
  targetUrl: string;
  duration: number;
  success: boolean;
  error?: string;
}

interface NavigationPerformanceMetrics {
  fromUrl: string;
  toUrl: string;
  startTime: number;
  endTime: number;
  duration: number;
  userType?: string;
}

/**
 * Log login performance metrics
 */
export const logLoginPerformance = (metrics: Omit<LoginPerformanceMetrics, 'duration'>) => {
  const duration = metrics.endTime - metrics.startTime;
  const fullMetrics: LoginPerformanceMetrics = {
    ...metrics,
    duration
  };

  logger.info("Login performance", {
    username: fullMetrics.username,
    duration: `${duration}ms`,
    targetUrl: fullMetrics.targetUrl,
    success: fullMetrics.success,
    error: fullMetrics.error,
    timestamp: new Date().toISOString()
  });
  
  // Enhanced performance alerting with severity levels
  const severity = duration > 15000 ? 'CRITICAL' :
                  duration > 5000 ? 'HIGH' :
                  duration > 2000 ? 'MEDIUM' : 'LOW';

  if (severity === 'CRITICAL') {
    logger.error("Critical login performance issue", JSON.stringify({
      username: fullMetrics.username,
      duration: `${duration}ms`,
      targetUrl: fullMetrics.targetUrl,
      severity
    }));
  } else if (severity === 'HIGH') {
    logger.warn("High login performance issue", {
      username: fullMetrics.username,
      duration: `${duration}ms`,
      targetUrl: fullMetrics.targetUrl,
      severity
    });
  } else if (severity === 'MEDIUM') {
    logger.warn("Slow login detected", {
      username: fullMetrics.username,
      duration: `${duration}ms`,
      targetUrl: fullMetrics.targetUrl,
      severity
    });
  }

  // Store performance metrics for analysis
  if (typeof window !== 'undefined') {
    const perfKey = `login_perf_${Date.now()}`;
    try {
      localStorage.setItem(perfKey, JSON.stringify(fullMetrics));

      // Keep only last 50 performance entries
      const keys = Object.keys(localStorage).filter(k => k.startsWith('login_perf_'));
      if (keys.length > 50) {
        keys.sort().slice(0, keys.length - 50).forEach(k => localStorage.removeItem(k));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  return fullMetrics;
};

/**
 * Get login performance statistics from localStorage
 */
export const getLoginPerformanceStats = () => {
  if (typeof window === 'undefined') return null;

  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('login_perf_'));
    const metrics = keys.map(k => JSON.parse(localStorage.getItem(k) || '{}'));

    if (metrics.length === 0) return null;

    const durations = metrics.map(m => m.duration).filter(d => d > 0);
    const successfulLogins = metrics.filter(m => m.success);

    return {
      totalLogins: metrics.length,
      successfulLogins: successfulLogins.length,
      averageDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxDuration: Math.max(...durations),
      minDuration: Math.min(...durations),
      slowLogins: metrics.filter(m => m.duration > 5000).length,
      criticalLogins: metrics.filter(m => m.duration > 15000).length,
    };
  } catch (e) {
    return null;
  }
};

/**
 * Clear login performance data
 */
export const clearLoginPerformanceData = () => {
  if (typeof window === 'undefined') return;

  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('login_perf_'));
    keys.forEach(k => localStorage.removeItem(k));
  } catch (e) {
    // Ignore errors
  }
};

/**
 * Log navigation performance metrics
 */
export const logNavigationPerformance = (metrics: Omit<NavigationPerformanceMetrics, 'duration'>) => {
  const duration = metrics.endTime - metrics.startTime;
  const fullMetrics: NavigationPerformanceMetrics = {
    ...metrics,
    duration
  };

  logger.info("Navigation performance", {
    fromUrl: fullMetrics.fromUrl,
    toUrl: fullMetrics.toUrl,
    duration: `${duration}ms`,
    userType: fullMetrics.userType,
    timestamp: new Date().toISOString()
  });
  
  // Alert if navigation takes longer than 1 second
  if (duration > 1000) {
    logger.warn("Slow navigation detected", { 
      fromUrl: fullMetrics.fromUrl,
      toUrl: fullMetrics.toUrl,
      duration: `${duration}ms`,
      userType: fullMetrics.userType
    });
  }

  return fullMetrics;
};

/**
 * Performance timer utility for measuring operations
 */
export class PerformanceTimer {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = performance.now();
  }

  /**
   * End the timer and log the performance
   */
  end(additionalData?: Record<string, any>) {
    const endTime = performance.now();
    const duration = endTime - this.startTime;

    logger.debug(`Performance: ${this.operation}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...additionalData
    });

    return {
      operation: this.operation,
      duration,
      startTime: this.startTime,
      endTime
    };
  }
}

/**
 * Measure async operation performance
 */
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  additionalData?: Record<string, any>
): Promise<T> {
  const timer = new PerformanceTimer(operation);
  try {
    const result = await fn();
    timer.end({ success: true, ...additionalData });
    return result;
  } catch (error) {
    timer.end({ success: false, error: String(error), ...additionalData });
    throw error;
  }
}

/**
 * Client-side performance monitoring utilities
 */
export const clientPerformance = {
  /**
   * Measure page load performance
   */
  measurePageLoad: (pageName: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          pageName,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalTime: navigation.loadEventEnd - navigation.fetchStart,
          timestamp: new Date().toISOString()
        };

        console.log(`[PERFORMANCE] Page load: ${pageName}`, metrics);
        
        // Send to server if needed
        // This could be enhanced to send metrics to an analytics endpoint
        
        return metrics;
      }
    }
    return null;
  },

  /**
   * Measure navigation timing
   */
  measureNavigation: (fromUrl: string, toUrl: string, startTime: number) => {
    const endTime = performance.now();
    const duration = endTime - startTime;

    const metrics = {
      fromUrl,
      toUrl,
      duration,
      timestamp: new Date().toISOString()
    };

    console.log('[PERFORMANCE] Navigation', metrics);
    
    return metrics;
  }
};

/**
 * Performance thresholds for different operations
 */
export const PERFORMANCE_THRESHOLDS = {
  LOGIN: {
    GOOD: 500,      // < 500ms is good
    ACCEPTABLE: 1000, // < 1s is acceptable
    SLOW: 2000,     // < 2s is slow
    CRITICAL: 5000  // > 5s is critical
  },
  NAVIGATION: {
    GOOD: 200,      // < 200ms is good
    ACCEPTABLE: 500, // < 500ms is acceptable
    SLOW: 1000,     // < 1s is slow
    CRITICAL: 2000  // > 2s is critical
  },
  SESSION_LOAD: {
    GOOD: 50,       // < 50ms is good
    ACCEPTABLE: 100, // < 100ms is acceptable
    SLOW: 500,      // < 500ms is slow
    CRITICAL: 1000  // > 1s is critical
  }
} as const;

/**
 * Get performance rating based on duration and thresholds
 */
export function getPerformanceRating(
  duration: number, 
  thresholds: typeof PERFORMANCE_THRESHOLDS.LOGIN
): 'excellent' | 'good' | 'acceptable' | 'slow' | 'critical' {
  if (duration < thresholds.GOOD) return 'excellent';
  if (duration < thresholds.ACCEPTABLE) return 'good';
  if (duration < thresholds.SLOW) return 'acceptable';
  if (duration < thresholds.CRITICAL) return 'slow';
  return 'critical';
}
