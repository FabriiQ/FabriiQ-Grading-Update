'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for performance optimization in React components
 */
export function usePerformanceOptimization() {
  const queryClient = useQueryClient();
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  });
  const renderTimes = useRef<number[]>([]);
  const lastRenderStart = useRef<number>(0);

  // Track render performance - use useRef to avoid infinite loops
  const renderStartRef = useRef<number>(0);

  useEffect(() => {
    renderStartRef.current = performance.now();
  });

  useEffect(() => {
    return () => {
      if (renderStartRef.current > 0) {
        const renderTime = performance.now() - renderStartRef.current;
        renderTimes.current.push(renderTime);

        // Keep only last 50 render times
        if (renderTimes.current.length > 50) {
          renderTimes.current.shift();
        }

        const averageRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;

        // Use a ref to track if we should update metrics to prevent infinite loops
        const shouldUpdate = renderTimes.current.length % 5 === 0; // Only update every 5 renders

        if (shouldUpdate) {
          setMetrics(prev => ({
            renderCount: prev.renderCount + 5,
            lastRenderTime: renderTime,
            averageRenderTime,
          }));
        }
      }
    };
  }, []); // Empty dependency array to prevent infinite loops

  // Preload data
  const preloadData = useCallback(async (keys: string[]) => {
    const preloadPromises = keys.map(key => 
      queryClient.prefetchQuery({
        queryKey: [key],
        queryFn: () => Promise.resolve(null), // This would be replaced with actual fetch
        staleTime: 1000 * 60 * 5, // 5 minutes
      })
    );

    await Promise.allSettled(preloadPromises);
  }, [queryClient]);

  // Invalidate cache
  const invalidateCache = useCallback((keys: string[]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  }, [queryClient]);

  // Warm up cache
  const warmUpCache = useCallback(async (classId: string) => {
    const cacheKeys = [
      `subjects-${classId}`,
      `activities-${classId}`,
      `assessments-${classId}`,
      `topics-${classId}`,
    ];

    await preloadData(cacheKeys);
  }, [preloadData]);

  return {
    metrics,
    preloadData,
    invalidateCache,
    warmUpCache,
  };
}

/**
 * Hook for lazy loading components with performance tracking
 */
export function useLazyComponent<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) {
  const [component, setComponent] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [loadTime, setLoadTime] = useState<number>(0);

  const loadComponent = useCallback(async () => {
    if (component || isLoading) return;

    setIsLoading(true);
    setError(null);
    const startTime = performance.now();

    try {
      const module = await importFn();
      const loadTime = performance.now() - startTime;
      
      setComponent(module.default);
      setLoadTime(loadTime);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [importFn, component, isLoading]);

  useEffect(() => {
    loadComponent();
  }, [loadComponent]);

  return {
    component,
    isLoading,
    error,
    loadTime,
    reload: loadComponent,
  };
}

/**
 * Hook for debounced values with performance optimization
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook for throttled callbacks
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useRef<T>();
  const lastRan = useRef<number>(0);

  useEffect(() => {
    throttledCallback.current = ((...args: Parameters<T>) => {
      if (Date.now() - lastRan.current >= delay) {
        callback(...args);
        lastRan.current = Date.now();
      }
    }) as T;
  }, [callback, delay]);

  return throttledCallback.current || callback;
}

/**
 * Hook for intersection observer with performance optimization
 */
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);
        
        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options, hasIntersected]);

  return { isIntersecting, hasIntersected };
}

/**
 * Hook for virtual scrolling performance
 */
export function useVirtualScrolling<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    visibleStart,
    visibleEnd,
  };
}

/**
 * Hook for memory usage monitoring
 */
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
      // Clear memory info on unmount to prevent memory leaks
      setMemoryInfo(null);
    };
  }, []);

  const memoryUsagePercentage = memoryInfo 
    ? (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
    : 0;

  return {
    memoryInfo,
    memoryUsagePercentage,
    isHighMemoryUsage: memoryUsagePercentage > 80,
  };
}

/**
 * Hook for performance monitoring and optimization suggestions
 */
export function usePerformanceMonitoring() {
  const [performanceData, setPerformanceData] = useState({
    fps: 0,
    renderTime: 0,
    suggestions: [] as string[],
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        frameCount = 0;
        lastTime = currentTime;

        const suggestions: string[] = [];
        
        if (fps < 30) {
          suggestions.push('Low FPS detected. Consider reducing component complexity.');
        }
        
        if (fps < 15) {
          suggestions.push('Very low FPS. Consider implementing virtualization for large lists.');
        }

        setPerformanceData(prev => ({
          ...prev,
          fps,
          suggestions,
        }));
      }

      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
      // Reset performance data on unmount
      setPerformanceData({
        fps: 0,
        renderTime: 0,
        suggestions: [],
      });
    };
  }, []);

  return performanceData;
}

/**
 * Hook for optimized API calls with caching
 */
export function useOptimizedQuery<T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: {
    staleTime?: number;
    cacheTime?: number;
    enabled?: boolean;
  }
) {
  return useQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime || 1000 * 60 * 5, // 5 minutes
    cacheTime: options?.cacheTime || 1000 * 60 * 30, // 30 minutes
    enabled: options?.enabled,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });
}
