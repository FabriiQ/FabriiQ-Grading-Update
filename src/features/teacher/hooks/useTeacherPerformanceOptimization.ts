'use client';

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import { api } from '@/trpc/react';

/**
 * Hook for optimizing teacher component performance
 * Provides coordinated API calls, intelligent caching, and performance monitoring
 */

interface PerformanceConfig {
  enableCaching?: boolean;
  cacheTTL?: number;
  enableBatching?: boolean;
  batchDelay?: number;
  enablePrefetching?: boolean;
  maxConcurrentRequests?: number;
}

interface PerformanceMetrics {
  renderCount: number;
  apiCallCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  memoryUsage: number;
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enableCaching: true,
  cacheTTL: 5 * 60 * 1000, // 5 minutes
  enableBatching: true,
  batchDelay: 100, // 100ms
  enablePrefetching: true,
  maxConcurrentRequests: 3,
};

/**
 * Performance optimization hook for teacher components
 */
export function useTeacherPerformanceOptimization(
  componentName: string,
  config: PerformanceConfig = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Performance tracking
  const renderCount = useRef(0);
  const apiCallCount = useRef(0);
  const cacheHits = useRef(0);
  const cacheMisses = useRef(0);
  const responseTimeSum = useRef(0);
  const mountTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());

  // Request queue for batching
  const requestQueue = useRef<Array<() => Promise<any>>>([]);
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);
  const activeRequests = useRef(0);

  // Memory cache
  const cache = useRef(new Map<string, { data: any; timestamp: number }>());

  // Performance state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderCount: 0,
    apiCallCount: 0,
    cacheHitRate: 0,
    averageResponseTime: 0,
    memoryUsage: 0,
  });

  // Track renders - use refs to avoid infinite loops
  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Only update performance metrics every 10 renders to prevent infinite loops
    if (renderCount.current % 10 === 0) {
      setPerformanceMetrics(prev => ({
        ...prev,
        renderCount: renderCount.current,
      }));
    }

    // Warn about excessive re-renders in development
    if (process.env.NODE_ENV === 'development') {
      if (renderCount.current > 20 && (now - mountTime.current) < 10000) {
        console.warn(
          `${componentName} has rendered ${renderCount.current} times in ${now - mountTime.current}ms`
        );
      }

      if (timeSinceLastRender < 16) {
        console.warn(
          `${componentName} rendered too quickly: ${timeSinceLastRender}ms (possible render loop)`
        );
      }
    }
  }, []); // Empty dependency array to prevent infinite loops

  // Cache utilities
  const getCachedData = useCallback((key: string) => {
    if (!finalConfig.enableCaching) return null;

    const cached = cache.current.get(key);
    if (!cached) {
      cacheMisses.current++;
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > finalConfig.cacheTTL!;
    if (isExpired) {
      cache.current.delete(key);
      cacheMisses.current++;
      return null;
    }

    cacheHits.current++;
    return cached.data;
  }, [finalConfig.enableCaching, finalConfig.cacheTTL]);

  const setCachedData = useCallback((key: string, data: any) => {
    if (!finalConfig.enableCaching) return;

    cache.current.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Cleanup old entries to prevent memory leaks
    if (cache.current.size > 100) {
      const oldestKey = cache.current.keys().next().value;
      cache.current.delete(oldestKey);
    }
  }, [finalConfig.enableCaching]);

  // Batched API call executor
  const executeBatch = useCallback(async () => {
    if (requestQueue.current.length === 0) return;

    const batch = requestQueue.current.splice(0, finalConfig.maxConcurrentRequests!);
    activeRequests.current += batch.length;

    try {
      const startTime = Date.now();
      await Promise.all(batch.map(request => request()));
      const endTime = Date.now();
      
      responseTimeSum.current += (endTime - startTime);
      apiCallCount.current += batch.length;

      // Update metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        apiCallCount: apiCallCount.current,
        averageResponseTime: responseTimeSum.current / apiCallCount.current,
        cacheHitRate: cacheHits.current / (cacheHits.current + cacheMisses.current),
      }));
    } finally {
      activeRequests.current -= batch.length;
    }

    // Process remaining requests
    if (requestQueue.current.length > 0) {
      setTimeout(executeBatch, finalConfig.batchDelay);
    }
  }, [finalConfig.maxConcurrentRequests, finalConfig.batchDelay]);

  // Optimized API call wrapper
  const optimizedApiCall = useCallback(async <T>(
    key: string,
    apiCall: () => Promise<T>,
    options: { skipCache?: boolean; priority?: 'high' | 'normal' | 'low' } = {}
  ): Promise<T> => {
    // Check cache first
    if (!options.skipCache) {
      const cached = getCachedData(key);
      if (cached) {
        return cached;
      }
    }

    // Create the API call promise
    const apiCallPromise = async () => {
      const result = await apiCall();
      setCachedData(key, result);
      return result;
    };

    // Handle batching
    if (finalConfig.enableBatching && options.priority !== 'high') {
      return new Promise((resolve, reject) => {
        const wrappedCall = async () => {
          try {
            const result = await apiCallPromise();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        };

        if (options.priority === 'low') {
          requestQueue.current.push(wrappedCall);
        } else {
          requestQueue.current.unshift(wrappedCall);
        }

        // Start batch processing
        if (!batchTimeout.current) {
          batchTimeout.current = setTimeout(() => {
            batchTimeout.current = null;
            executeBatch();
          }, finalConfig.batchDelay);
        }
      });
    }

    // Execute immediately for high priority or when batching is disabled
    return apiCallPromise();
  }, [
    getCachedData,
    setCachedData,
    finalConfig.enableBatching,
    finalConfig.batchDelay,
    executeBatch,
  ]);

  // Prefetch utility
  const prefetch = useCallback((key: string, apiCall: () => Promise<any>) => {
    if (!finalConfig.enablePrefetching) return;

    // Only prefetch if not already cached
    if (!getCachedData(key)) {
      optimizedApiCall(key, apiCall, { priority: 'low' }).catch(() => {
        // Ignore prefetch errors
      });
    }
  }, [finalConfig.enablePrefetching, getCachedData, optimizedApiCall]);

  // Memory cleanup
  useEffect(() => {
    return () => {
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
      cache.current.clear();
    };
  }, []);

  // Memory usage monitoring
  useEffect(() => {
    const updateMemoryUsage = () => {
      if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
        const memory = (window.performance as any).memory;
        setPerformanceMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize,
        }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    // Performance utilities
    optimizedApiCall,
    prefetch,
    getCachedData,
    setCachedData,

    // Performance metrics
    performanceMetrics,
    
    // Cache utilities
    clearCache: () => cache.current.clear(),
    getCacheSize: () => cache.current.size,

    // Component info
    componentName,
    renderCount: renderCount.current,
    timeSinceMount: Date.now() - mountTime.current,
  };
}

/**
 * Hook for optimizing teacher class-related API calls
 */
export function useOptimizedTeacherClassData(teacherId: string, classId?: string) {
  const { optimizedApiCall, prefetch, performanceMetrics } = useTeacherPerformanceOptimization(
    'TeacherClassData'
  );

  // Note: For client-side optimization, we'll use the hook-based queries
  // These functions are placeholders for server-side or advanced caching scenarios
  const getClassData = useCallback(async (id: string) => {
    // This would be implemented with server-side fetching or advanced caching
    console.log(`Optimized class data fetch for ${id}`);
    return null;
  }, []);

  const getStudentData = useCallback(async (id: string) => {
    // This would be implemented with server-side fetching or advanced caching
    console.log(`Optimized student data fetch for ${id}`);
    return null;
  }, []);

  // Prefetch related data
  useEffect(() => {
    if (classId) {
      // Prefetch student data when class is loaded (placeholder for future implementation)
      prefetch(`class-students-${classId}`, async () => {
        // This would be implemented with proper API calls
        console.log(`Prefetching student data for class ${classId}`);
        return null;
      });
    }
  }, [classId, prefetch]);

  return {
    getClassData,
    getStudentData,
    performanceMetrics,
  };
}
