/**
 * Advanced tRPC Procedure Caching System
 * 
 * This system provides intelligent caching for slow tRPC procedures with:
 * - Multi-level caching (memory + Redis-like behavior)
 * - Intelligent cache invalidation
 * - Request deduplication
 * - Performance monitoring
 * - Production-ready scaling
 */

import { LRUCache } from 'lru-cache';
import { logger } from '@/server/api/utils/logger';

// Cache configuration for different procedure types
export const CACHE_CONFIG = {
  // User-specific data (notifications, profile)
  USER_DATA: {
    ttl: 2 * 60 * 1000,      // 2 minutes
    maxSize: 10000,
  },
  
  // Analytics and metrics (slower changing)
  ANALYTICS: {
    ttl: 10 * 60 * 1000,     // 10 minutes
    maxSize: 5000,
  },
  
  // Class and teacher data
  CLASS_DATA: {
    ttl: 5 * 60 * 1000,      // 5 minutes
    maxSize: 15000,
  },
  
  // Leaderboards and rankings
  LEADERBOARDS: {
    ttl: 3 * 60 * 1000,      // 3 minutes
    maxSize: 8000,
  },
  
  // System configuration (rarely changes)
  SYSTEM_CONFIG: {
    ttl: 30 * 60 * 1000,     // 30 minutes
    maxSize: 1000,
  }
};

// Cache instances for different data types - fixed mapping
const caches = {
  USER_DATA: new LRUCache<string, any>(CACHE_CONFIG.USER_DATA),
  ANALYTICS: new LRUCache<string, any>(CACHE_CONFIG.ANALYTICS),
  CLASS_DATA: new LRUCache<string, any>(CACHE_CONFIG.CLASS_DATA),
  LEADERBOARDS: new LRUCache<string, any>(CACHE_CONFIG.LEADERBOARDS),
  SYSTEM_CONFIG: new LRUCache<string, any>(CACHE_CONFIG.SYSTEM_CONFIG),
};

// Request deduplication map to prevent duplicate concurrent requests
const pendingRequests = new Map<string, Promise<any>>();

/**
 * Advanced cache wrapper for tRPC procedures
 */
export class AdvancedProcedureCache {
  /**
   * Cache a procedure result with intelligent categorization
   */
  static async cacheResult<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    category: keyof typeof CACHE_CONFIG = 'CLASS_DATA'
  ): Promise<T> {
    const cache = caches[category];

    // Safety check - if cache is undefined, just execute the function
    if (!cache) {
      logger.warn('Cache not found for category, executing without cache', { category, cacheKey });
      return fetchFn();
    }

    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached !== undefined) {
      logger.debug('Cache hit', { cacheKey, category });
      return cached;
    }

    // Check if request is already pending (deduplication)
    const pendingKey = `${category}:${cacheKey}`;
    if (pendingRequests.has(pendingKey)) {
      logger.debug('Request deduplication', { cacheKey, category });
      return pendingRequests.get(pendingKey)!;
    }

    // Execute the function and cache result
    const promise = this.executeWithMonitoring(cacheKey, fetchFn);
    pendingRequests.set(pendingKey, promise);

    try {
      const result = await promise;
      cache.set(cacheKey, result);
      logger.debug('Cache miss - result cached', { cacheKey, category });
      return result;
    } finally {
      pendingRequests.delete(pendingKey);
    }
  }

  /**
   * Execute function with performance monitoring
   */
  private static async executeWithMonitoring<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await fetchFn();
      const executionTime = performance.now() - startTime;
      
      if (executionTime > 1000) {
        logger.warn('Slow procedure execution (cached)', {
          cacheKey,
          executionTime: `${executionTime.toFixed(2)}ms`
        });
      }
      
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      logger.error('Procedure execution failed', {
        cacheKey,
        executionTime: `${executionTime.toFixed(2)}ms`,
        error: String(error)
      });
      throw error;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  static invalidateByPattern(pattern: string, category?: keyof typeof CACHE_CONFIG) {
    const regex = new RegExp(pattern);
    
    if (category) {
      const cache = caches[category];
      for (const key of cache.keys()) {
        if (regex.test(key)) {
          cache.delete(key);
        }
      }
      logger.debug('Cache invalidated by pattern', { pattern, category });
    } else {
      // Invalidate across all caches
      Object.entries(caches).forEach(([cacheName, cache]) => {
        for (const key of cache.keys()) {
          if (regex.test(key)) {
            cache.delete(key);
          }
        }
      });
      logger.debug('Cache invalidated by pattern (all caches)', { pattern });
    }
  }

  /**
   * Clear all caches
   */
  static clearAll() {
    Object.values(caches).forEach(cache => cache.clear());
    pendingRequests.clear();
    logger.info('All caches cleared');
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    const stats = Object.entries(caches).reduce((acc, [name, cache]) => {
      acc[name] = {
        size: cache.size,
        maxSize: cache.max,
        calculatedSize: cache.calculatedSize,
      };
      return acc;
    }, {} as Record<string, any>);

    return {
      caches: stats,
      pendingRequests: pendingRequests.size,
    };
  }
}

/**
 * Specific cache helpers for common procedures
 */
export const ProcedureCacheHelpers = {
  // User notifications
  async cacheUserNotifications<T>(userId: string, limit: number, includeRead: boolean, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = `notifications:${userId}:${limit}:${includeRead}`;
    return AdvancedProcedureCache.cacheResult(cacheKey, fetchFn, 'USER_DATA');
  },

  // Teacher analytics
  async cacheTeacherMetrics<T>(teacherId: string, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = `teacher-metrics:${teacherId}`;
    return AdvancedProcedureCache.cacheResult(cacheKey, fetchFn, 'ANALYTICS');
  },

  // Teacher classes
  async cacheTeacherClasses<T>(teacherId: string, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = `teacher-classes:${teacherId}`;
    return AdvancedProcedureCache.cacheResult(cacheKey, fetchFn, 'CLASS_DATA');
  },

  // Class details
  async cacheClassById<T>(classId: string, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = `class:${classId}`;
    return AdvancedProcedureCache.cacheResult(cacheKey, fetchFn, 'CLASS_DATA');
  },

  // Class metrics
  async cacheClassMetrics<T>(classId: string, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = `class-metrics:${classId}`;
    return AdvancedProcedureCache.cacheResult(cacheKey, fetchFn, 'ANALYTICS');
  },

  // Leaderboards
  async cacheLeaderboard<T>(campusId: string, timeframe: string, sortBy: string, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = `leaderboard:${campusId}:${timeframe}:${sortBy}`;
    return AdvancedProcedureCache.cacheResult(cacheKey, fetchFn, 'LEADERBOARDS');
  },

  // Teacher stats
  async cacheTeacherStats<T>(teacherId: string, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = `teacher-stats:${teacherId}`;
    return AdvancedProcedureCache.cacheResult(cacheKey, fetchFn, 'ANALYTICS');
  },

  // Attendance stats
  async cacheAttendanceStats<T>(classId: string, startDate: string, endDate: string, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = `attendance-stats:${classId}:${startDate}:${endDate}`;
    return AdvancedProcedureCache.cacheResult(cacheKey, fetchFn, 'CLASS_DATA');
  },

  // Rewards data
  async cacheRewardsData<T>(classId: string, fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = `rewards:${classId}`;
    return AdvancedProcedureCache.cacheResult(cacheKey, fetchFn, 'CLASS_DATA');
  },

  // System branding
  async cacheSystemBranding<T>(fetchFn: () => Promise<T>): Promise<T> {
    const cacheKey = 'system-branding';
    return AdvancedProcedureCache.cacheResult(cacheKey, fetchFn, 'SYSTEM_CONFIG');
  },
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  // Invalidate user-related caches
  invalidateUser(userId: string) {
    AdvancedProcedureCache.invalidateByPattern(`.*${userId}.*`, 'USER_DATA');
  },

  // Invalidate teacher-related caches
  invalidateTeacher(teacherId: string) {
    AdvancedProcedureCache.invalidateByPattern(`.*${teacherId}.*`, 'ANALYTICS');
    AdvancedProcedureCache.invalidateByPattern(`.*${teacherId}.*`, 'CLASS_DATA');
  },

  // Invalidate class-related caches
  invalidateClass(classId: string) {
    AdvancedProcedureCache.invalidateByPattern(`.*${classId}.*`, 'CLASS_DATA');
    AdvancedProcedureCache.invalidateByPattern(`.*${classId}.*`, 'ANALYTICS');
  },

  // Invalidate leaderboards
  invalidateLeaderboards(campusId?: string) {
    const pattern = campusId ? `.*${campusId}.*` : '.*';
    AdvancedProcedureCache.invalidateByPattern(pattern, 'LEADERBOARDS');
  },
};
