/**
 * Caching Middleware
 * 
 * Provides intelligent caching for API routes with automatic invalidation,
 * compression, and multi-layer cache support.
 */

import { Request, Response, NextFunction } from 'express';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum cache size
  keyGenerator?: (req: Request) => string;
  shouldCache?: (req: Request, res: Response) => boolean;
  invalidateOn?: string[]; // Events that should invalidate this cache
  compress?: boolean;
  varyBy?: string[]; // Headers to vary cache by (e.g., ['user-id', 'accept-language'])
}

interface CacheEntry {
  data: any;
  headers: Record<string, string>;
  statusCode: number;
  timestamp: number;
  etag: string;
}

class CacheManager {
  private static instance: CacheManager;
  private cache: LRUCache<string, CacheEntry>;
  private invalidationMap: Map<string, Set<string>>;
  private hitCount: number = 0;
  private missCount: number = 0;

  private constructor() {
    this.cache = new LRUCache({
      max: 10000,
      ttl: 1000 * 60 * 15, // 15 minutes default
      allowStale: true,
      updateAgeOnGet: true
    });
    
    this.invalidationMap = new Map();
  }

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (entry) {
      this.hitCount++;
      return entry;
    } else {
      this.missCount++;
      return undefined;
    }
  }

  public set(key: string, entry: CacheEntry, ttl?: number): void {
    if (ttl) {
      this.cache.set(key, entry, { ttl: ttl * 1000 });
    } else {
      this.cache.set(key, entry);
    }
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public invalidate(event: string): void {
    const keysToInvalidate = this.invalidationMap.get(event);
    if (keysToInvalidate) {
      for (const key of keysToInvalidate) {
        this.cache.delete(key);
      }
      this.invalidationMap.delete(event);
    }
  }

  public registerInvalidation(event: string, key: string): void {
    if (!this.invalidationMap.has(event)) {
      this.invalidationMap.set(event, new Set());
    }
    this.invalidationMap.get(event)!.add(key);
  }

  public getStats() {
    return {
      size: this.cache.size,
      hitRate: this.hitCount / (this.hitCount + this.missCount),
      hitCount: this.hitCount,
      missCount: this.missCount
    };
  }

  public clear(): void {
    this.cache.clear();
    this.invalidationMap.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }
}

const cacheManager = CacheManager.getInstance();

/**
 * Generate cache key based on request
 */
function generateCacheKey(req: Request, options: CacheOptions): string {
  if (options.keyGenerator) {
    return options.keyGenerator(req);
  }

  const baseKey = `${req.method}:${req.path}`;
  const queryString = new URLSearchParams(req.query as any).toString();
  
  let varyParts: string[] = [];
  if (options.varyBy) {
    varyParts = options.varyBy.map(header => {
      const value = req.headers[header.toLowerCase()] || '';
      return `${header}:${value}`;
    });
  }

  const keyParts = [baseKey, queryString, ...varyParts].filter(Boolean);
  const keyString = keyParts.join('|');
  
  // Hash long keys to keep them manageable
  if (keyString.length > 200) {
    return crypto.createHash('md5').update(keyString).digest('hex');
  }
  
  return keyString;
}

/**
 * Generate ETag for response
 */
function generateETag(data: any): string {
  const content = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Check if request should be cached
 */
function shouldCacheRequest(req: Request, res: Response, options: CacheOptions): boolean {
  // Don't cache non-GET requests by default
  if (req.method !== 'GET') {
    return false;
  }

  // Don't cache if response has errors
  if (res.statusCode >= 400) {
    return false;
  }

  // Custom cache condition
  if (options.shouldCache) {
    return options.shouldCache(req, res);
  }

  return true;
}

/**
 * Compress data if needed
 */
function compressData(data: any, compress: boolean): any {
  if (!compress) {
    return data;
  }

  // In production, use actual compression library like zlib
  // For now, just return the data as-is
  return data;
}

/**
 * Decompress data if needed
 */
function decompressData(data: any, compressed: boolean): any {
  if (!compressed) {
    return data;
  }

  // In production, use actual decompression
  // For now, just return the data as-is
  return data;
}

/**
 * Cache middleware factory
 */
export function cache(options: CacheOptions = {}) {
  const {
    ttl = 300, // 5 minutes default
    maxSize = 1000,
    compress = false,
    invalidateOn = [],
    varyBy = []
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = generateCacheKey(req, options);

    // Check cache for existing entry
    const cachedEntry = cacheManager.get(cacheKey);
    
    if (cachedEntry) {
      // Check if client has current version (ETag)
      const clientETag = req.headers['if-none-match'];
      if (clientETag === cachedEntry.etag) {
        return res.status(304).end();
      }

      // Serve from cache
      res.set(cachedEntry.headers);
      res.set('X-Cache', 'HIT');
      res.set('ETag', cachedEntry.etag);
      res.status(cachedEntry.statusCode);
      
      const decompressedData = decompressData(cachedEntry.data, compress);
      return res.json(decompressedData);
    }

    // Cache miss - intercept response
    const originalJson = res.json;
    const originalSend = res.send;
    const originalEnd = res.end;

    let responseData: any;
    let responseSent = false;

    // Override json method
    res.json = function(data: any) {
      if (!responseSent) {
        responseData = data;
        responseSent = true;

        if (shouldCacheRequest(req, res, options)) {
          const etag = generateETag(data);
          const compressedData = compressData(data, compress);
          
          const cacheEntry: CacheEntry = {
            data: compressedData,
            headers: {
              'Content-Type': 'application/json',
              'X-Cache': 'MISS',
              'ETag': etag
            },
            statusCode: res.statusCode,
            timestamp: Date.now(),
            etag
          };

          cacheManager.set(cacheKey, cacheEntry, ttl);

          // Register for invalidation
          invalidateOn.forEach(event => {
            cacheManager.registerInvalidation(event, cacheKey);
          });

          res.set('ETag', etag);
        }

        res.set('X-Cache', 'MISS');
      }

      return originalJson.call(this, data);
    };

    // Override send method
    res.send = function(data: any) {
      if (!responseSent) {
        responseData = data;
        responseSent = true;

        if (shouldCacheRequest(req, res, options)) {
          const etag = generateETag(data);
          const compressedData = compressData(data, compress);
          
          const cacheEntry: CacheEntry = {
            data: compressedData,
            headers: {
              'Content-Type': res.get('Content-Type') || 'text/html',
              'X-Cache': 'MISS',
              'ETag': etag
            },
            statusCode: res.statusCode,
            timestamp: Date.now(),
            etag
          };

          cacheManager.set(cacheKey, cacheEntry, ttl);

          // Register for invalidation
          invalidateOn.forEach(event => {
            cacheManager.registerInvalidation(event, cacheKey);
          });

          res.set('ETag', etag);
        }

        res.set('X-Cache', 'MISS');
      }

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Cache invalidation middleware
 */
export function invalidateCache(events: string | string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const eventsArray = Array.isArray(events) ? events : [events];
    
    // Invalidate after response is sent
    res.on('finish', () => {
      if (res.statusCode < 400) {
        eventsArray.forEach(event => {
          cacheManager.invalidate(event);
        });
      }
    });

    next();
  };
}

/**
 * Cache statistics endpoint
 */
export function getCacheStats() {
  return cacheManager.getStats();
}

/**
 * Clear all cache
 */
export function clearCache() {
  cacheManager.clear();
}

/**
 * Conditional cache middleware based on user role
 */
export function conditionalCache(options: CacheOptions & {
  roles?: string[];
  skipForRoles?: string[];
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req as any).user?.role;

    // Skip caching for certain roles
    if (options.skipForRoles && userRole && options.skipForRoles.includes(userRole)) {
      return next();
    }

    // Only cache for certain roles
    if (options.roles && (!userRole || !options.roles.includes(userRole))) {
      return next();
    }

    return cache(options)(req, res, next);
  };
}

/**
 * Smart cache middleware that adjusts TTL based on data freshness requirements
 */
export function smartCache(options: CacheOptions & {
  freshness?: 'high' | 'medium' | 'low';
}) {
  const ttlMap = {
    high: 60,      // 1 minute
    medium: 300,   // 5 minutes
    low: 1800      // 30 minutes
  };

  const adjustedOptions = {
    ...options,
    ttl: options.ttl || ttlMap[options.freshness || 'medium']
  };

  return cache(adjustedOptions);
}

// Export cache manager for direct access
export { cacheManager };
