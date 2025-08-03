'use client';

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { api } from '@/trpc/react';

/**
 * Performance optimization service for teacher dashboard
 * Provides coordinated data fetching, caching, and performance monitoring
 */

interface DashboardData {
  teacherMetrics?: any;
  teacherClasses?: any;
  leaderboardData?: any;
  performanceMetrics?: any;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class TeacherDashboardCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Global cache instance
const dashboardCache = new TeacherDashboardCache();

// Cleanup expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    dashboardCache.cleanup();
  }, 5 * 60 * 1000);
}

/**
 * Hook for optimized teacher dashboard data fetching
 */
export function useOptimizedTeacherDashboard(teacherId: string, campusId?: string) {
  const lastFetchTime = useRef<number>(0);
  const isInitialLoad = useRef(true);

  // Create cache keys
  const cacheKeys = useMemo(() => ({
    metrics: `teacher-metrics-${teacherId}`,
    classes: `teacher-classes-${teacherId}`,
    leaderboard: `teacher-leaderboard-${teacherId}-${campusId}`,
    performance: `teacher-performance-${teacherId}`,
  }), [teacherId, campusId]);

  // Check if we should skip API calls due to recent fetch
  const shouldSkipFetch = useCallback(() => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTime.current;
    return timeSinceLastFetch < 30000 && !isInitialLoad.current; // 30 seconds throttle
  }, []);

  // Fetch teacher metrics with caching
  const teacherMetricsQuery = api.teacherAnalytics.getTeacherMetrics.useQuery(
    { teacherId },
    {
      enabled: !!teacherId && !shouldSkipFetch(),
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      onSuccess: (data) => {
        dashboardCache.set(cacheKeys.metrics, data);
        lastFetchTime.current = Date.now();
      },
    }
  );

  // Fetch teacher classes with caching
  const teacherClassesQuery = api.teacher.getTeacherClasses.useQuery(
    { teacherId },
    {
      enabled: !!teacherId && !shouldSkipFetch(),
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      onSuccess: (data) => {
        dashboardCache.set(cacheKeys.classes, data);
      },
    }
  );

  // Get cached data if available
  const cachedMetrics = dashboardCache.get(cacheKeys.metrics);
  const cachedClasses = dashboardCache.get(cacheKeys.classes);

  // Combine live and cached data
  const dashboardData = useMemo<DashboardData>(() => ({
    teacherMetrics: teacherMetricsQuery.data || cachedMetrics,
    teacherClasses: teacherClassesQuery.data || cachedClasses,
  }), [
    teacherMetricsQuery.data,
    teacherClassesQuery.data,
    cachedMetrics,
    cachedClasses,
  ]);

  // Loading states
  const isLoading = useMemo(() => {
    // If we have cached data, don't show loading
    if (cachedMetrics || cachedClasses) {
      return false;
    }
    return teacherMetricsQuery.isLoading || teacherClassesQuery.isLoading;
  }, [
    teacherMetricsQuery.isLoading,
    teacherClassesQuery.isLoading,
    cachedMetrics,
    cachedClasses,
  ]);

  // Error states
  const error = useMemo(() => {
    return teacherMetricsQuery.error || teacherClassesQuery.error;
  }, [teacherMetricsQuery.error, teacherClassesQuery.error]);

  // Refresh function that clears cache and refetches
  const refresh = useCallback(async () => {
    dashboardCache.clear();
    lastFetchTime.current = 0;
    isInitialLoad.current = true;
    
    await Promise.all([
      teacherMetricsQuery.refetch(),
      teacherClassesQuery.refetch(),
    ]);
    
    isInitialLoad.current = false;
  }, [teacherMetricsQuery, teacherClassesQuery]);

  // Prefetch related data
  const prefetchRelatedData = useCallback(() => {
    // Prefetch data that might be needed soon
    if (dashboardData.teacherClasses?.length > 0) {
      // Prefetch first class details
      const firstClassId = dashboardData.teacherClasses[0]?.id;
      if (firstClassId) {
        // This would prefetch class details in the background
        // api.class.getById.prefetch({ classId: firstClassId });
      }
    }
  }, [dashboardData.teacherClasses]);

  // Effect to prefetch related data after initial load
  useEffect(() => {
    if (!isLoading && dashboardData.teacherMetrics) {
      const timer = setTimeout(prefetchRelatedData, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, dashboardData.teacherMetrics, prefetchRelatedData]);

  // Mark initial load as complete
  useEffect(() => {
    if (!isLoading && isInitialLoad.current) {
      isInitialLoad.current = false;
    }
  }, [isLoading]);

  return {
    data: dashboardData,
    isLoading,
    error,
    refresh,
    // Performance metrics
    isCached: !!(cachedMetrics || cachedClasses),
    cacheHitRate: dashboardCache.has(cacheKeys.metrics) ? 1 : 0,
  };
}

/**
 * Hook for performance monitoring
 */
export function useTeacherDashboardPerformance(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef(Date.now());
  const lastRenderTime = useRef(Date.now());

  useEffect(() => {
    renderCount.current++;
    const now = Date.now();
    const timeSinceMount = now - mountTime.current;
    const timeSinceLastRender = now - lastRenderTime.current;
    lastRenderTime.current = now;

    // Log performance warnings in development
    if (process.env.NODE_ENV === 'development') {
      if (renderCount.current > 10 && timeSinceMount < 5000) {
        console.warn(`${componentName} rendered ${renderCount.current} times in ${timeSinceMount}ms`);
      }

      if (timeSinceLastRender < 16) {
        console.warn(`${componentName} rendered too quickly: ${timeSinceLastRender}ms`);
      }
    }
  });

  return {
    renderCount: renderCount.current,
    timeSinceMount: Date.now() - mountTime.current,
  };
}

/**
 * Memoized component wrapper for teacher dashboard components
 */
export function withTeacherDashboardMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  const MemoizedComponent = React.memo(Component, areEqual);
  MemoizedComponent.displayName = `TeacherDashboardMemo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
}

/**
 * Utility to batch dashboard updates
 */
export function useBatchedDashboardUpdates() {
  const updateQueue = useRef<(() => void)[]>([]);
  const isProcessing = useRef(false);

  const batchUpdate = useCallback((updateFn: () => void) => {
    updateQueue.current.push(updateFn);

    if (!isProcessing.current) {
      isProcessing.current = true;
      
      // Process updates in next tick
      setTimeout(() => {
        const updates = updateQueue.current.splice(0);
        updates.forEach(update => update());
        isProcessing.current = false;
      }, 0);
    }
  }, []);

  return { batchUpdate };
}
