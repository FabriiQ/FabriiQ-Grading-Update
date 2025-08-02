/**
 * Attendance Cache Service
 * 
 * This service provides caching functionality for frequently accessed attendance data,
 * such as class statistics, student attendance records, and performance metrics.
 * 
 * It uses a simple in-memory cache with TTL (time-to-live) for each entry.
 * For production environments, consider using Redis or another distributed cache.
 */

import { logger } from '@/server/api/utils/logger';

// Cache entry interface
interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Timestamp when this entry expires
}

// Cache configuration
interface CacheConfig {
  defaultTtl: number; // Default time-to-live in milliseconds
  maxSize: number; // Maximum number of entries in the cache
}

/**
 * Simple in-memory cache implementation with TTL support
 */
class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private config: CacheConfig;
  private name: string;

  constructor(name: string, defaultTtl: number = 5 * 60 * 1000, maxSize: number = 1000) {
    this.name = name;
    this.config = { defaultTtl, maxSize };
  }

  /**
   * Get a value from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if the entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Set a value in the cache
   */
  set(key: string, value: T, ttl?: number): void {
    const actualTtl = ttl || this.config.defaultTtl;
    const expiresAt = Date.now() + actualTtl;

    // If cache is at max size, remove oldest entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete a value from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get all keys in the cache
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    
    // Remove oldest 10% of entries
    const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Create cache instances for different types of attendance data
const classStatsCache = new MemoryCache<any>("attendance:class-stats", 10 * 60 * 1000); // 10 minutes
const attendanceRecordsCache = new MemoryCache<any>("attendance:records", 5 * 60 * 1000); // 5 minutes
const studentStatsCache = new MemoryCache<any>("attendance:student-stats", 10 * 60 * 1000); // 10 minutes

// Cleanup expired entries every 5 minutes
setInterval(() => {
  classStatsCache.cleanup();
  attendanceRecordsCache.cleanup();
  studentStatsCache.cleanup();
}, 5 * 60 * 1000);

/**
 * Generate cache key for class attendance statistics
 */
function generateClassStatsCacheKey(classId: string, startDate?: Date, endDate?: Date): string {
  const dateRange = startDate && endDate 
    ? `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`
    : 'all';
  return `class-stats:${classId}:${dateRange}`;
}

/**
 * Generate cache key for attendance records
 */
function generateRecordsCacheKey(classId: string, studentId?: string, startDate?: Date, endDate?: Date): string {
  const student = studentId || 'all';
  const dateRange = startDate && endDate 
    ? `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`
    : 'all';
  return `records:${classId}:${student}:${dateRange}`;
}

/**
 * Generate cache key for student attendance statistics
 */
function generateStudentStatsCacheKey(studentId: string, classId?: string, startDate?: Date, endDate?: Date): string {
  const classFilter = classId || 'all';
  const dateRange = startDate && endDate 
    ? `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`
    : 'all';
  return `student-stats:${studentId}:${classFilter}:${dateRange}`;
}

/**
 * Attendance Cache Service
 * 
 * This service provides methods for caching and retrieving attendance-related data.
 */
export class AttendanceCacheService {
  /**
   * Get class attendance statistics from cache or compute them
   */
  static async getCachedClassStats<T>(
    classId: string,
    fetchFn: () => Promise<T>,
    startDate?: Date,
    endDate?: Date,
    ttl: number = 10 * 60 * 1000 // 10 minutes
  ): Promise<T> {
    const cacheKey = generateClassStatsCacheKey(classId, startDate, endDate);
    const cached = classStatsCache.get(cacheKey);

    if (cached !== null) {
      logger.debug('Class stats cache hit', { classId, cacheKey });
      return cached;
    }

    logger.debug('Class stats cache miss, computing', { classId, cacheKey });
    const stats = await fetchFn();
    classStatsCache.set(cacheKey, stats, ttl);
    return stats;
  }

  /**
   * Get attendance records from cache or compute them
   */
  static async getCachedRecords<T>(
    classId: string,
    fetchFn: () => Promise<T>,
    studentId?: string,
    startDate?: Date,
    endDate?: Date,
    ttl: number = 5 * 60 * 1000 // 5 minutes
  ): Promise<T> {
    const cacheKey = generateRecordsCacheKey(classId, studentId, startDate, endDate);
    const cached = attendanceRecordsCache.get(cacheKey);

    if (cached !== null) {
      logger.debug('Attendance records cache hit', { classId, studentId, cacheKey });
      return cached;
    }

    logger.debug('Attendance records cache miss, computing', { classId, studentId, cacheKey });
    const records = await fetchFn();
    attendanceRecordsCache.set(cacheKey, records, ttl);
    return records;
  }

  /**
   * Get student attendance statistics from cache or compute them
   */
  static async getCachedStudentStats<T>(
    studentId: string,
    fetchFn: () => Promise<T>,
    classId?: string,
    startDate?: Date,
    endDate?: Date,
    ttl: number = 10 * 60 * 1000 // 10 minutes
  ): Promise<T> {
    const cacheKey = generateStudentStatsCacheKey(studentId, classId, startDate, endDate);
    const cached = studentStatsCache.get(cacheKey);

    if (cached !== null) {
      logger.debug('Student stats cache hit', { studentId, classId, cacheKey });
      return cached;
    }

    logger.debug('Student stats cache miss, computing', { studentId, classId, cacheKey });
    const stats = await fetchFn();
    studentStatsCache.set(cacheKey, stats, ttl);
    return stats;
  }

  /**
   * Invalidate all caches related to a class
   */
  static invalidateClassCaches(classId: string): void {
    // Clear all class-related caches
    classStatsCache.keys().forEach((key: string) => {
      if (key.includes(`class-stats:${classId}`) || key.includes(`:${classId}:`)) {
        classStatsCache.delete(key);
      }
    });

    attendanceRecordsCache.keys().forEach((key: string) => {
      if (key.includes(`:${classId}:`)) {
        attendanceRecordsCache.delete(key);
      }
    });

    studentStatsCache.keys().forEach((key: string) => {
      if (key.includes(`:${classId}:`)) {
        studentStatsCache.delete(key);
      }
    });

    logger.debug('Invalidated all caches for class', { classId });
  }

  /**
   * Invalidate all caches related to a student
   */
  static invalidateStudentCaches(studentId: string): void {
    attendanceRecordsCache.keys().forEach((key: string) => {
      if (key.includes(`:${studentId}:`)) {
        attendanceRecordsCache.delete(key);
      }
    });

    studentStatsCache.keys().forEach((key: string) => {
      if (key.includes(`student-stats:${studentId}`)) {
        studentStatsCache.delete(key);
      }
    });

    logger.debug('Invalidated all caches for student', { studentId });
  }

  /**
   * Clear all caches
   */
  static clearAllCaches(): void {
    classStatsCache.clear();
    attendanceRecordsCache.clear();
    studentStatsCache.clear();
    logger.debug('Cleared all attendance caches');
  }
}
