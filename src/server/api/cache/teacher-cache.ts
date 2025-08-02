/**
 * Teacher Portal Caching System
 * 
 * Advanced caching system for teacher portal with offline capabilities
 * and intelligent cache invalidation
 */

import { logger } from '@/server/api/utils/logger';

// Cache TTLs in milliseconds
export const TEACHER_CACHE_TTL = {
  // Teacher data
  TEACHER_PROFILE: 30 * 60 * 1000, // 30 minutes
  TEACHER_CLASSES: 15 * 60 * 1000, // 15 minutes
  TEACHER_METRICS: 10 * 60 * 1000, // 10 minutes
  TEACHER_STATS: 5 * 60 * 1000, // 5 minutes
  
  // Class data
  CLASS_DETAILS: 10 * 60 * 1000, // 10 minutes
  CLASS_STUDENTS: 15 * 60 * 1000, // 15 minutes
  CLASS_METRICS: 5 * 60 * 1000, // 5 minutes
  CLASS_ACTIVITIES: 3 * 60 * 1000, // 3 minutes
  
  // Analytics
  TEACHER_ANALYTICS: 15 * 60 * 1000, // 15 minutes
  LEADERBOARD: 10 * 60 * 1000, // 10 minutes
  NOTIFICATIONS: 2 * 60 * 1000, // 2 minutes
  
  // Attendance
  ATTENDANCE_STATS: 10 * 60 * 1000, // 10 minutes
  ATTENDANCE_RECORDS: 5 * 60 * 1000, // 5 minutes
  
  // Assessments
  ASSESSMENTS: 30 * 60 * 1000, // 30 minutes
  ASSESSMENT_RESULTS: 15 * 60 * 1000, // 15 minutes
};

interface CacheItem<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
  accessCount: number;
}

/**
 * Advanced teacher cache with LRU eviction and access tracking
 */
export class TeacherCache {
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private maxSize: number;
  private cleanupInterval: NodeJS.Timeout;
  private namespace: string;

  constructor(namespace: string, maxSize = 5000) {
    this.namespace = namespace;
    this.maxSize = maxSize;
    
    // Set up periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanup(), 2 * 60 * 1000); // Every 2 minutes
    
    logger.debug(`Initialized teacher cache: ${namespace} (max size: ${maxSize})`);
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    if (!item) {
      return null;
    }
    
    // Check expiration
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access tracking
    item.lastAccessed = Date.now();
    item.accessCount++;
    
    return item.value;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, ttl: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    const now = Date.now();
    this.cache.set(key, {
      value,
      expiresAt: now + ttl,
      lastAccessed: now,
      accessCount: 1,
    });
  }

  /**
   * Get or set with fetch function
   */
  async getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Teacher cache hit: ${this.namespace}:${key}`);
      return cached;
    }
    
    logger.debug(`Teacher cache miss: ${this.namespace}:${key}`);
    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    logger.debug(`Teacher cache cleared: ${this.namespace}`);
  }

  /**
   * Evict least recently used item
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug(`Evicted LRU item: ${this.namespace}:${oldestKey}`);
    }
  }

  /**
   * Clean up expired items
   */
  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt < now) {
        this.cache.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      logger.debug(`Teacher cache cleanup: ${this.namespace} - removed ${expiredCount} expired items`);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let totalAccess = 0;
    
    for (const item of this.cache.values()) {
      if (item.expiresAt < now) expired++;
      totalAccess += item.accessCount;
    }
    
    return {
      namespace: this.namespace,
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      totalAccess,
      hitRate: totalAccess > 0 ? (this.cache.size / totalAccess) : 0,
    };
  }

  /**
   * Destroy the cache
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
    logger.debug(`Teacher cache destroyed: ${this.namespace}`);
  }
}

// Singleton cache instances
let teacherDataCache: TeacherCache | null = null;
let teacherAnalyticsCache: TeacherCache | null = null;
let teacherClassCache: TeacherCache | null = null;
let teacherNotificationCache: TeacherCache | null = null;

// Getter functions
export function getTeacherDataCache(): TeacherCache {
  if (!teacherDataCache) {
    teacherDataCache = new TeacherCache('teacher-data', 3000);
  }
  return teacherDataCache;
}

export function getTeacherAnalyticsCache(): TeacherCache {
  if (!teacherAnalyticsCache) {
    teacherAnalyticsCache = new TeacherCache('teacher-analytics', 2000);
  }
  return teacherAnalyticsCache;
}

export function getTeacherClassCache(): TeacherCache {
  if (!teacherClassCache) {
    teacherClassCache = new TeacherCache('teacher-class', 4000);
  }
  return teacherClassCache;
}

export function getTeacherNotificationCache(): TeacherCache {
  if (!teacherNotificationCache) {
    teacherNotificationCache = new TeacherCache('teacher-notifications', 1000);
  }
  return teacherNotificationCache;
}

/**
 * Cache helper functions
 */
export async function cacheTeacherClasses<T>(
  teacherId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return getTeacherDataCache().getOrSet(
    `classes:${teacherId}`,
    fetchFn,
    TEACHER_CACHE_TTL.TEACHER_CLASSES
  );
}

export async function cacheTeacherMetrics<T>(
  teacherId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return getTeacherAnalyticsCache().getOrSet(
    `metrics:${teacherId}`,
    fetchFn,
    TEACHER_CACHE_TTL.TEACHER_METRICS
  );
}

export async function cacheTeacherStats<T>(
  teacherId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return getTeacherAnalyticsCache().getOrSet(
    `stats:${teacherId}`,
    fetchFn,
    TEACHER_CACHE_TTL.TEACHER_STATS
  );
}

export async function cacheTeacherNotifications<T>(
  userId: string,
  fetchFn: () => Promise<T>
): Promise<T> {
  return getTeacherNotificationCache().getOrSet(
    `notifications:${userId}`,
    fetchFn,
    TEACHER_CACHE_TTL.NOTIFICATIONS
  );
}

/**
 * Cache invalidation functions
 */
export function invalidateTeacherCache(teacherId: string): void {
  getTeacherDataCache().delete(`classes:${teacherId}`);
  getTeacherAnalyticsCache().delete(`metrics:${teacherId}`);
  getTeacherAnalyticsCache().delete(`stats:${teacherId}`);
  logger.debug(`Invalidated teacher cache for ${teacherId}`);
}

export function invalidateClassCache(classId: string): void {
  // Invalidate all class-related cache entries
  const caches = [getTeacherDataCache(), getTeacherClassCache()];
  
  caches.forEach(cache => {
    const stats = cache.getStats();
    // This is a simplified approach - in production you'd want a more efficient way
    cache.clear(); // Clear all for now, could be optimized to only clear class-specific entries
  });
  
  logger.debug(`Invalidated class cache for ${classId}`);
}

/**
 * Cleanup function
 */
export function destroyTeacherCaches(): void {
  if (teacherDataCache) {
    teacherDataCache.destroy();
    teacherDataCache = null;
  }
  if (teacherAnalyticsCache) {
    teacherAnalyticsCache.destroy();
    teacherAnalyticsCache = null;
  }
  if (teacherClassCache) {
    teacherClassCache.destroy();
    teacherClassCache = null;
  }
  if (teacherNotificationCache) {
    teacherNotificationCache.destroy();
    teacherNotificationCache = null;
  }
  logger.debug('All teacher caches destroyed');
}

// Set up cleanup on process exit
if (typeof process !== 'undefined') {
  import('@/utils/process-event-manager').then(({ addProcessHandler }) => {
    addProcessHandler('exit', destroyTeacherCaches);
    addProcessHandler('SIGINT', destroyTeacherCaches);
    addProcessHandler('SIGTERM', destroyTeacherCaches);
  }).catch(() => {
    // Fallback
    process.on('exit', destroyTeacherCaches);
  });
}
