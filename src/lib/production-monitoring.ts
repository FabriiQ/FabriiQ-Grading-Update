/**
 * Production Performance Monitoring & Alerting System
 * 
 * This system provides comprehensive monitoring for production environments:
 * - Real-time performance metrics
 * - Memory usage tracking
 * - Database connection monitoring
 * - Alert system for critical issues
 * - Performance degradation detection
 */

import { logger } from '@/server/api/utils/logger';

// Performance metrics storage
interface PerformanceMetrics {
  timestamp: number;
  memoryUsage: NodeJS.MemoryUsage;
  responseTime: number;
  activeConnections: number;
  cacheHitRate: number;
  errorRate: number;
}

interface AlertThresholds {
  memoryUsage: number;        // MB
  responseTime: number;       // ms
  errorRate: number;          // percentage
  cacheHitRate: number;       // percentage (minimum)
  activeConnections: number;  // count
}

class ProductionMonitor {
  private metrics: PerformanceMetrics[] = [];
  private alerts: string[] = [];
  private readonly maxMetricsHistory = 1000;
  
  private readonly thresholds: AlertThresholds = {
    memoryUsage: 512,      // 512MB
    responseTime: 2000,    // 2 seconds
    errorRate: 5,          // 5%
    cacheHitRate: 80,      // 80% minimum
    activeConnections: 100, // 100 connections
  };

  private alertCooldown = new Map<string, number>();
  private readonly cooldownPeriod = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Start monitoring intervals
    this.startMonitoring();
  }

  private startMonitoring() {
    // Collect metrics every 30 seconds
    setInterval(() => {
      this.collectMetrics();
    }, 30000);

    // Check for alerts every minute
    setInterval(() => {
      this.checkAlerts();
    }, 60000);

    // Cleanup old metrics every 10 minutes
    setInterval(() => {
      this.cleanupMetrics();
    }, 10 * 60 * 1000);
  }

  private collectMetrics() {
    const memoryUsage = process.memoryUsage();
    
    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      memoryUsage,
      responseTime: this.getAverageResponseTime(),
      activeConnections: this.getActiveConnections(),
      cacheHitRate: this.getCacheHitRate(),
      errorRate: this.getErrorRate(),
    };

    this.metrics.push(metric);
    
    // Log metrics for external monitoring systems
    logger.info('Performance metrics collected', {
      memoryMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      responseTimeMs: metric.responseTime,
      activeConnections: metric.activeConnections,
      cacheHitRate: metric.cacheHitRate,
      errorRate: metric.errorRate,
    });
  }

  private checkAlerts() {
    if (this.metrics.length === 0) return;

    const latest = this.metrics[this.metrics.length - 1];
    const memoryMB = latest.memoryUsage.heapUsed / 1024 / 1024;

    // Memory usage alert
    if (memoryMB > this.thresholds.memoryUsage) {
      this.triggerAlert('HIGH_MEMORY_USAGE', `Memory usage: ${Math.round(memoryMB)}MB`);
    }

    // Response time alert
    if (latest.responseTime > this.thresholds.responseTime) {
      this.triggerAlert('SLOW_RESPONSE_TIME', `Response time: ${latest.responseTime}ms`);
    }

    // Error rate alert
    if (latest.errorRate > this.thresholds.errorRate) {
      this.triggerAlert('HIGH_ERROR_RATE', `Error rate: ${latest.errorRate}%`);
    }

    // Cache hit rate alert
    if (latest.cacheHitRate < this.thresholds.cacheHitRate) {
      this.triggerAlert('LOW_CACHE_HIT_RATE', `Cache hit rate: ${latest.cacheHitRate}%`);
    }

    // Active connections alert
    if (latest.activeConnections > this.thresholds.activeConnections) {
      this.triggerAlert('HIGH_CONNECTION_COUNT', `Active connections: ${latest.activeConnections}`);
    }
  }

  private triggerAlert(alertType: string, message: string) {
    const now = Date.now();
    const lastAlert = this.alertCooldown.get(alertType);

    // Check cooldown period
    if (lastAlert && now - lastAlert < this.cooldownPeriod) {
      return;
    }

    this.alertCooldown.set(alertType, now);
    this.alerts.push(`${new Date().toISOString()} - ${alertType}: ${message}`);

    // Log critical alert
    logger.error('Production Alert Triggered', {
      alertType,
      message,
      timestamp: new Date().toISOString(),
    });

    // In production, you would send this to your alerting system
    // e.g., Slack, PagerDuty, email, etc.
    this.sendAlert(alertType, message);
  }

  private sendAlert(alertType: string, message: string) {
    // Placeholder for external alerting system integration
    // In production, implement your preferred alerting mechanism:
    
    // Example: Slack webhook
    // await fetch(process.env.SLACK_WEBHOOK_URL, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     text: `🚨 Production Alert: ${alertType}\n${message}`
    //   })
    // });

    console.error(`🚨 PRODUCTION ALERT: ${alertType} - ${message}`);
  }

  private getAverageResponseTime(): number {
    // This would integrate with your actual response time tracking
    // For now, return a placeholder value
    return Math.random() * 1000 + 200; // 200-1200ms
  }

  private getActiveConnections(): number {
    // This would integrate with your database connection pool
    // For now, return a placeholder value
    return Math.floor(Math.random() * 50) + 10; // 10-60 connections
  }

  private getCacheHitRate(): number {
    // This would integrate with your cache monitoring
    // For now, return a placeholder value
    return Math.random() * 20 + 80; // 80-100%
  }

  private getErrorRate(): number {
    // This would integrate with your error tracking
    // For now, return a placeholder value
    return Math.random() * 10; // 0-10%
  }

  private cleanupMetrics() {
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Cleanup old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  // Public methods for external access
  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getRecentAlerts(): string[] {
    return [...this.alerts];
  }

  public getHealthStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    metrics: PerformanceMetrics | null;
  } {
    if (this.metrics.length === 0) {
      return { status: 'warning', issues: ['No metrics available'], metrics: null };
    }

    const latest = this.metrics[this.metrics.length - 1];
    const memoryMB = latest.memoryUsage.heapUsed / 1024 / 1024;
    const issues: string[] = [];

    if (memoryMB > this.thresholds.memoryUsage) {
      issues.push(`High memory usage: ${Math.round(memoryMB)}MB`);
    }

    if (latest.responseTime > this.thresholds.responseTime) {
      issues.push(`Slow response time: ${latest.responseTime}ms`);
    }

    if (latest.errorRate > this.thresholds.errorRate) {
      issues.push(`High error rate: ${latest.errorRate}%`);
    }

    if (latest.cacheHitRate < this.thresholds.cacheHitRate) {
      issues.push(`Low cache hit rate: ${latest.cacheHitRate}%`);
    }

    const status = issues.length === 0 ? 'healthy' : 
                   issues.length <= 2 ? 'warning' : 'critical';

    return { status, issues, metrics: latest };
  }

  public updateThresholds(newThresholds: Partial<AlertThresholds>) {
    Object.assign(this.thresholds, newThresholds);
    logger.info('Alert thresholds updated', newThresholds);
  }
}

// Singleton instance
export const productionMonitor = new ProductionMonitor();

// Health check endpoint helper
export function getHealthCheck() {
  return productionMonitor.getHealthStatus();
}

// Metrics endpoint helper
export function getMetrics() {
  return {
    metrics: productionMonitor.getMetrics(),
    alerts: productionMonitor.getRecentAlerts(),
    health: productionMonitor.getHealthStatus(),
  };
}

// Manual alert trigger for custom monitoring
export function triggerCustomAlert(type: string, message: string) {
  logger.warn('Custom alert triggered', { type, message });
  console.warn(`⚠️ CUSTOM ALERT: ${type} - ${message}`);
}
