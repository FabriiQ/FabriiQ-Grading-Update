/**
 * Performance Optimization Service
 * 
 * Provides comprehensive performance optimization including caching strategies,
 * database query optimization, memory management, and performance monitoring.
 */

import { PrismaClient } from '@prisma/client';
import { LRUCache } from 'lru-cache';

// Mock Redis interface for development
interface Redis {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<void>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  ttl(key: string): Promise<number>;
}

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in seconds
  maxSize: number; // Maximum number of entries
  layers: ('memory' | 'redis' | 'database')[];
  compression: boolean;
  invalidationEvents: string[];
}

interface PerformanceMetrics {
  queryTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  activeConnections: number;
  requestsPerSecond: number;
  errorRate: number;
}

interface QueryOptimization {
  query: string;
  executionTime: number;
  indexSuggestions: string[];
  optimizedQuery?: string;
}

export class PerformanceOptimizationService {
  private prisma: PrismaClient;
  private redis?: Redis;
  private memoryCache: LRUCache<string, any>;
  private queryCache: LRUCache<string, any>;
  private metricsCache: LRUCache<string, PerformanceMetrics>;
  
  // Cache configurations for different data types
  private cacheConfigs: Record<string, CacheConfig> = {
    activities: {
      ttl: 300, // 5 minutes
      maxSize: 1000,
      layers: ['memory', 'redis'],
      compression: true,
      invalidationEvents: ['activity_updated', 'activity_deleted']
    },
    submissions: {
      ttl: 600, // 10 minutes
      maxSize: 5000,
      layers: ['memory', 'redis'],
      compression: true,
      invalidationEvents: ['submission_graded', 'submission_updated']
    },
    analytics: {
      ttl: 900, // 15 minutes
      maxSize: 500,
      layers: ['memory', 'redis'],
      compression: true,
      invalidationEvents: ['analytics_updated', 'new_submission']
    },
    leaderboard: {
      ttl: 300, // 5 minutes
      maxSize: 100,
      layers: ['memory', 'redis'],
      compression: false,
      invalidationEvents: ['points_awarded', 'rank_changed']
    },
    userProfiles: {
      ttl: 1800, // 30 minutes
      maxSize: 2000,
      layers: ['memory'],
      compression: false,
      invalidationEvents: ['profile_updated', 'preferences_changed']
    }
  };

  constructor(prisma: PrismaClient, redisUrl?: string) {
    this.prisma = prisma;

    // Initialize Redis if URL provided (mock implementation for development)
    if (redisUrl) {
      this.redis = {
        async get(key: string) { return null; },
        async setex(key: string, ttl: number, value: string) { },
        async del(...keys: string[]) { return 0; },
        async keys(pattern: string) { return []; },
        async ttl(key: string) { return -1; }
      };
    }

    // Start periodic cleanup to prevent memory leaks
    this.startPeriodicCleanup();

    // Initialize memory caches
    this.memoryCache = new LRUCache({
      max: 10000,
      ttl: 1000 * 60 * 15, // 15 minutes
      allowStale: true,
      updateAgeOnGet: true
    });

    this.queryCache = new LRUCache({
      max: 5000,
      ttl: 1000 * 60 * 5, // 5 minutes
      allowStale: false
    });

    this.metricsCache = new LRUCache({
      max: 100,
      ttl: 1000 * 60, // 1 minute
      allowStale: true
    });

    this.setupPerformanceMonitoring();
  }

  /**
   * Get cached data with multi-layer fallback
   */
  async getCached<T>(
    key: string,
    dataType: string,
    fetchFunction: () => Promise<T>
  ): Promise<T> {
    const config = this.cacheConfigs[dataType] || this.cacheConfigs.activities;
    const cacheKey = `${dataType}:${key}`;

    try {
      // Layer 1: Memory cache
      if (config.layers.includes('memory')) {
        const memoryResult = this.memoryCache.get(cacheKey);
        if (memoryResult !== undefined) {
          this.updateCacheMetrics(dataType, 'memory', true);
          return memoryResult as T;
        }
      }

      // Layer 2: Redis cache
      if (config.layers.includes('redis') && this.redis) {
        const redisResult = await this.redis.get(cacheKey);
        if (redisResult) {
          const parsed = JSON.parse(redisResult) as T;
          
          // Backfill memory cache
          if (config.layers.includes('memory')) {
            this.memoryCache.set(cacheKey, parsed);
          }
          
          this.updateCacheMetrics(dataType, 'redis', true);
          return parsed;
        }
      }

      // Layer 3: Database with caching
      this.updateCacheMetrics(dataType, 'database', false);
      const result = await fetchFunction();

      // Store in caches
      await this.setCached(cacheKey, result, config);

      return result;
    } catch (error) {
      console.error(`Cache error for key ${cacheKey}:`, error);
      // Fallback to direct fetch
      return await fetchFunction();
    }
  }

  /**
   * Set data in appropriate cache layers
   */
  async setCached(key: string, data: any, config: CacheConfig): Promise<void> {
    try {
      const serialized = config.compression ? 
        JSON.stringify(data) : // In production, use compression library
        JSON.stringify(data);

      // Memory cache
      if (config.layers.includes('memory')) {
        this.memoryCache.set(key, data);
      }

      // Redis cache
      if (config.layers.includes('redis') && this.redis) {
        await this.redis.setex(key, config.ttl, serialized);
      }
    } catch (error) {
      console.error(`Error setting cache for key ${key}:`, error);
    }
  }

  /**
   * Invalidate cache based on events
   */
  async invalidateCache(event: string, relatedKeys?: string[]): Promise<void> {
    try {
      const affectedTypes = Object.entries(this.cacheConfigs)
        .filter(([_, config]) => config.invalidationEvents.includes(event))
        .map(([type]) => type);

      for (const type of affectedTypes) {
        if (relatedKeys) {
          // Invalidate specific keys
          for (const key of relatedKeys) {
            const cacheKey = `${type}:${key}`;
            this.memoryCache.delete(cacheKey);
            if (this.redis) {
              await this.redis.del(cacheKey);
            }
          }
        } else {
          // Invalidate all keys of this type
          await this.invalidateByPattern(`${type}:*`);
        }
      }
    } catch (error) {
      console.error(`Error invalidating cache for event ${event}:`, error);
    }
  }

  /**
   * Optimize database queries
   */
  async optimizeQuery(query: string): Promise<QueryOptimization> {
    const startTime = Date.now();
    
    try {
      // Execute EXPLAIN ANALYZE for the query
      const explanation = await this.prisma.$queryRaw`EXPLAIN ANALYZE ${query}`;
      const executionTime = Date.now() - startTime;

      // Analyze the query plan and suggest optimizations
      const indexSuggestions = this.analyzeQueryPlan(explanation as any[]);
      const optimizedQuery = this.generateOptimizedQuery(query, indexSuggestions);

      return {
        query,
        executionTime,
        indexSuggestions,
        optimizedQuery
      };
    } catch (error) {
      console.error('Query optimization error:', error);
      return {
        query,
        executionTime: Date.now() - startTime,
        indexSuggestions: []
      };
    }
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const cacheKey = 'performance_metrics';
    
    const cached = this.metricsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const metrics: PerformanceMetrics = {
        queryTime: await this.getAverageQueryTime(),
        cacheHitRate: this.calculateCacheHitRate(),
        memoryUsage: this.getMemoryUsage(),
        activeConnections: await this.getActiveConnections(),
        requestsPerSecond: this.getRequestsPerSecond(),
        errorRate: this.getErrorRate()
      };

      this.metricsCache.set(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      return {
        queryTime: 0,
        cacheHitRate: 0,
        memoryUsage: 0,
        activeConnections: 0,
        requestsPerSecond: 0,
        errorRate: 0
      };
    }
  }

  /**
   * Preload frequently accessed data
   */
  async preloadCache(): Promise<void> {
    try {
      console.log('Starting cache preload...');

      // Preload popular activities
      const popularActivities = await this.prisma.activity.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { activityGrades: true }
          }
        }
      });

      for (const activity of popularActivities) {
        await this.setCached(
          `activities:${activity.id}`,
          activity,
          this.cacheConfigs.activities
        );
      }

      // Preload recent analytics
      const recentAnalytics = await this.getRecentAnalytics();
      await this.setCached(
        'analytics:recent',
        recentAnalytics,
        this.cacheConfigs.analytics
      );

      console.log('Cache preload completed');
    } catch (error) {
      console.error('Cache preload error:', error);
    }
  }

  /**
   * Start periodic cleanup to prevent memory leaks
   */
  private startPeriodicCleanup() {
    // Clean up every 30 minutes
    setInterval(() => {
      this.cleanupCache().catch(console.error);
    }, 30 * 60 * 1000);
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupCache(): Promise<void> {
    try {
      // Memory cache cleanup (handled automatically by LRU)
      
      // Redis cleanup for expired keys
      if (this.redis) {
        const keys = await this.redis.keys('*');
        const expiredKeys: string[] = [];

        for (const key of keys) {
          const ttl = await this.redis.ttl(key);
          if (ttl === -1) { // No expiration set
            expiredKeys.push(key);
          }
        }

        if (expiredKeys.length > 0) {
          await this.redis.del(...expiredKeys);
          console.log(`Cleaned up ${expiredKeys.length} expired cache keys`);
        }
      }
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Optimize database connections
   */
  async optimizeConnections(): Promise<void> {
    try {
      // Monitor connection pool
      const activeConnections = await this.getActiveConnections();
      const maxConnections = 100; // Configure based on your setup

      if (activeConnections > maxConnections * 0.8) {
        console.warn(`High connection usage: ${activeConnections}/${maxConnections}`);
        
        // Implement connection pooling optimizations
        await this.optimizeConnectionPool();
      }
    } catch (error) {
      console.error('Connection optimization error:', error);
    }
  }

  // Private helper methods

  private setupPerformanceMonitoring(): void {
    // Set up periodic performance monitoring
    setInterval(async () => {
      try {
        const metrics = await this.getPerformanceMetrics();
        
        // Log performance warnings
        if (metrics.queryTime > 1000) {
          console.warn(`Slow query detected: ${metrics.queryTime}ms average`);
        }
        
        if (metrics.cacheHitRate < 0.7) {
          console.warn(`Low cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
        }
        
        if (metrics.errorRate > 0.05) {
          console.warn(`High error rate: ${(metrics.errorRate * 100).toFixed(1)}%`);
        }
      } catch (error) {
        console.error('Performance monitoring error:', error);
      }
    }, 60000); // Every minute

    // Cleanup cache every hour
    setInterval(() => {
      this.cleanupCache();
    }, 3600000);
  }

  private updateCacheMetrics(dataType: string, layer: string, hit: boolean): void {
    // Update cache hit/miss metrics
    const key = `cache_metrics:${dataType}:${layer}`;
    const current = this.memoryCache.get(key) || { hits: 0, misses: 0 };
    
    if (hit) {
      current.hits++;
    } else {
      current.misses++;
    }
    
    this.memoryCache.set(key, current);
  }

  private calculateCacheHitRate(): number {
    let totalHits = 0;
    let totalRequests = 0;

    // Calculate across all cache types and layers
    for (const [key, value] of this.memoryCache.entries()) {
      if (key.startsWith('cache_metrics:')) {
        const metrics = value as { hits: number; misses: number };
        totalHits += metrics.hits;
        totalRequests += metrics.hits + metrics.misses;
      }
    }

    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return usage.heapUsed / 1024 / 1024; // MB
    }
    return 0;
  }

  private async getActiveConnections(): Promise<number> {
    try {
      // Query database for active connections
      const result = await this.prisma.$queryRaw`
        SELECT count(*) as active_connections 
        FROM pg_stat_activity 
        WHERE state = 'active'
      ` as any[];
      
      return parseInt(result[0]?.active_connections || '0');
    } catch (error) {
      return 0;
    }
  }

  private getRequestsPerSecond(): number {
    // This would be implemented with a request counter
    // For now, return a placeholder
    return 0;
  }

  private getErrorRate(): number {
    // This would be implemented with error tracking
    // For now, return a placeholder
    return 0;
  }

  private async getAverageQueryTime(): Promise<number> {
    // This would be implemented with query time tracking
    // For now, return a placeholder
    return 0;
  }

  private async invalidateByPattern(pattern: string): Promise<void> {
    try {
      // Memory cache pattern invalidation
      const keysToDelete: string[] = [];
      for (const key of this.memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach(key => this.memoryCache.delete(key));

      // Redis pattern invalidation
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      console.error(`Error invalidating pattern ${pattern}:`, error);
    }
  }

  private analyzeQueryPlan(explanation: any[]): string[] {
    const suggestions: string[] = [];
    
    // Analyze query plan for optimization opportunities
    for (const step of explanation) {
      const stepStr = JSON.stringify(step).toLowerCase();
      
      if (stepStr.includes('seq scan')) {
        suggestions.push('Consider adding an index for sequential scan optimization');
      }
      
      if (stepStr.includes('sort') && stepStr.includes('disk')) {
        suggestions.push('Increase work_mem or add index for sort operations');
      }
      
      if (stepStr.includes('nested loop') && stepStr.includes('rows=')) {
        suggestions.push('Consider hash join instead of nested loop for large datasets');
      }
    }
    
    return suggestions;
  }

  private generateOptimizedQuery(originalQuery: string, _suggestions: string[]): string {
    // This would implement query optimization logic
    // For now, return the original query
    return originalQuery;
  }

  private async optimizeConnectionPool(): Promise<void> {
    // Implement connection pool optimization
    console.log('Optimizing database connection pool...');
  }

  private async getRecentAnalytics(): Promise<any> {
    // Get recent analytics data for preloading
    return await this.prisma.activityGrade.findMany({
      take: 100,
      orderBy: { gradedAt: 'desc' },
      where: { gradedAt: { not: null } }
    });
  }
}
