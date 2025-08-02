/**
 * Memory Optimization Utilities
 * 
 * This module provides utilities for optimizing memory usage in the FabriQ platform.
 * It includes garbage collection helpers, memory leak detection, and optimization strategies.
 */

import { logger } from '@/server/api/utils/logger';

// Memory thresholds in MB
const MEMORY_THRESHOLDS = {
  LOW: 100,
  MEDIUM: 300,
  HIGH: 500,
  CRITICAL: 800,
} as const;

// Memory optimization state
let lastGCTime = 0;
let gcCooldown = 30000; // 30 seconds between forced GC
let memoryOptimizationEnabled = true;

/**
 * Get current memory usage in a readable format
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
    arrayBuffers: Math.round((usage as any).arrayBuffers / 1024 / 1024) || 0,
  };
}

/**
 * Check if memory usage is above threshold
 */
export function isMemoryHigh(threshold: keyof typeof MEMORY_THRESHOLDS = 'HIGH'): boolean {
  const usage = getMemoryUsage();
  return usage.heapUsed > MEMORY_THRESHOLDS[threshold];
}

/**
 * Force garbage collection if available and conditions are met
 */
export function forceGarbageCollection(force = false): boolean {
  if (!global.gc) {
    logger.debug('Garbage collection not available (run with --expose-gc)');
    return false;
  }

  const now = Date.now();
  if (!force && (now - lastGCTime) < gcCooldown) {
    logger.debug('Garbage collection skipped (cooldown period)');
    return false;
  }

  const beforeUsage = getMemoryUsage();
  
  try {
    global.gc();
    lastGCTime = now;
    
    const afterUsage = getMemoryUsage();
    const freed = beforeUsage.heapUsed - afterUsage.heapUsed;
    
    logger.info('Garbage collection completed', {
      freedMB: freed,
      beforeMB: beforeUsage.heapUsed,
      afterMB: afterUsage.heapUsed,
    });
    
    return true;
  } catch (error) {
    logger.error('Garbage collection failed', { error });
    return false;
  }
}

/**
 * Optimize memory usage based on current conditions
 */
export function optimizeMemory(): void {
  if (!memoryOptimizationEnabled) {
    return;
  }

  const usage = getMemoryUsage();
  
  // Log memory usage if it's concerning
  if (usage.heapUsed > MEMORY_THRESHOLDS.MEDIUM) {
    logger.info('Memory usage check', usage);
  }

  // Force GC if memory is high
  if (usage.heapUsed > MEMORY_THRESHOLDS.HIGH) {
    logger.warn('High memory usage detected, attempting garbage collection', usage);
    forceGarbageCollection();
  }

  // Critical memory usage - more aggressive optimization
  if (usage.heapUsed > MEMORY_THRESHOLDS.CRITICAL) {
    logger.error('Critical memory usage detected', usage);
    
    // Force multiple GC cycles
    for (let i = 0; i < 3; i++) {
      forceGarbageCollection(true);
    }
    
    // Clear any global caches if available
    if (typeof global.clearCaches === 'function') {
      global.clearCaches();
    }
  }
}

/**
 * Memory optimization middleware for API routes
 */
export function memoryOptimizationMiddleware() {
  return (req: any, res: any, next: any) => {
    const startUsage = getMemoryUsage();
    
    res.on('finish', () => {
      const endUsage = getMemoryUsage();
      const memoryDelta = endUsage.heapUsed - startUsage.heapUsed;
      
      // Log significant memory increases
      if (memoryDelta > 50) { // More than 50MB increase
        logger.warn('High memory usage in request', {
          path: req.path,
          method: req.method,
          memoryDelta: `${memoryDelta}MB`,
          finalUsage: endUsage,
        });
        
        // Trigger optimization if memory delta is very high
        if (memoryDelta > 100) {
          setTimeout(optimizeMemory, 1000); // Delay to avoid blocking response
        }
      }
    });
    
    next();
  };
}

/**
 * Start periodic memory optimization
 */
export function startMemoryOptimization(intervalMs = 60000): NodeJS.Timeout {
  logger.info('Starting periodic memory optimization', { intervalMs });
  
  return setInterval(() => {
    try {
      optimizeMemory();
    } catch (error) {
      logger.error('Memory optimization failed', { error });
    }
  }, intervalMs);
}

/**
 * Enable or disable memory optimization
 */
export function setMemoryOptimizationEnabled(enabled: boolean): void {
  memoryOptimizationEnabled = enabled;
  logger.info('Memory optimization', { enabled });
}

/**
 * Get memory optimization status
 */
export function getMemoryOptimizationStatus() {
  return {
    enabled: memoryOptimizationEnabled,
    lastGCTime: new Date(lastGCTime),
    gcCooldown,
    currentUsage: getMemoryUsage(),
    thresholds: MEMORY_THRESHOLDS,
    gcAvailable: !!global.gc,
  };
}

/**
 * Memory-aware cache implementation
 */
export class MemoryAwareCache<T> {
  private cache = new Map<string, { value: T; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize = 1000, ttl = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  set(key: string, value: T): void {
    // Check memory before adding to cache
    if (isMemoryHigh('MEDIUM') && this.cache.size > this.maxSize / 2) {
      this.cleanup();
    }

    // Remove oldest entries if at max size
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// Export a default memory-aware cache instance
export const defaultMemoryCache = new MemoryAwareCache();

// Initialize memory optimization in production
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_MEMORY_OPTIMIZATION === 'true') {
  // Start memory optimization with a longer interval to avoid performance impact
  setTimeout(() => {
    startMemoryOptimization(120000); // 2 minutes
  }, 10000); // Start after 10 seconds
}
