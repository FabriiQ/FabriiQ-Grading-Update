import { useEffect, useRef, useCallback } from 'react';
import { useMemoryLeakPrevention } from '@/features/activties/services/memory-leak-prevention.service';

/**
 * Hook for teacher portal components to prevent memory leaks
 * Provides safe wrappers for common operations that can cause memory leaks
 */
export function useTeacherMemoryCleanup(componentName?: string) {
  const {
    registerCleanup,
    safeSetTimeout,
    safeSetInterval,
    safeAddEventListener,
    isMounted,
    cleanup,
    componentId
  } = useMemoryLeakPrevention(componentName);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Create a new abort controller for API requests
  const createAbortController = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    registerCleanup(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    });
    return abortControllerRef.current;
  }, [registerCleanup]);

  // Safe tRPC query options that prevent memory leaks
  const getSafeTRPCOptions = useCallback((options: any = {}) => {
    return {
      ...options,
      refetchIntervalInBackground: false, // Stop refetching when tab is not active
      enabled: options.enabled !== false && isMounted(), // Only enable when component is mounted
      onSuccess: (data: any) => {
        if (isMounted() && options.onSuccess) {
          options.onSuccess(data);
        }
      },
      onError: (error: any) => {
        if (isMounted() && options.onError) {
          options.onError(error);
        }
      },
    };
  }, [isMounted]);

  // Safe async operation wrapper
  const safeAsync = useCallback(async <T>(
    asyncFn: (signal: AbortSignal) => Promise<T>
  ): Promise<T | null> => {
    if (!isMounted()) return null;

    const controller = createAbortController();
    
    try {
      const result = await asyncFn(controller.signal);
      return isMounted() ? result : null;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return null; // Request was cancelled, which is expected
      }
      throw error;
    }
  }, [isMounted, createAbortController]);

  // Safe state update wrapper
  const safeSetState = useCallback((setState: () => void) => {
    if (isMounted()) {
      setState();
    }
  }, [isMounted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cleanup]);

  return {
    // Memory leak prevention utilities
    registerCleanup,
    safeSetTimeout,
    safeSetInterval,
    safeAddEventListener,
    isMounted,
    componentId,

    // Teacher-specific utilities
    getSafeTRPCOptions,
    safeAsync,
    safeSetState,
    createAbortController,
  };
}

/**
 * Hook for teacher components that need to handle real-time updates
 * Provides safe event listeners for teacher portal events
 */
export function useTeacherRealTimeUpdates(
  onUpdate?: () => void,
  events: string[] = ['activity-submitted', 'dashboard-update-needed', 'analytics-refresh-needed']
) {
  const { safeAddEventListener, isMounted } = useTeacherMemoryCleanup();

  useEffect(() => {
    if (!onUpdate || typeof window === 'undefined') return;

    const handleUpdate = () => {
      if (isMounted()) {
        onUpdate();
      }
    };

    // Add event listeners for all specified events
    events.forEach(event => {
      safeAddEventListener(window, event, handleUpdate);
    });
  }, [onUpdate, events, safeAddEventListener, isMounted]);
}

/**
 * Hook for teacher components that need to handle offline/online status
 * Provides safe online/offline event listeners
 */
export function useTeacherOfflineStatus(
  onOnline?: () => void,
  onOffline?: () => void
) {
  const { safeAddEventListener, isMounted } = useTeacherMemoryCleanup();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      if (isMounted() && onOnline) {
        onOnline();
      }
    };

    const handleOffline = () => {
      if (isMounted() && onOffline) {
        onOffline();
      }
    };

    safeAddEventListener(window, 'online', handleOnline);
    safeAddEventListener(window, 'offline', handleOffline);
  }, [onOnline, onOffline, safeAddEventListener, isMounted]);
}

/**
 * Hook for teacher components that need periodic data refresh
 * Provides safe interval-based data fetching
 */
export function useTeacherPeriodicRefresh(
  refreshFn: () => void,
  intervalMs: number = 30000, // 30 seconds default
  enabled: boolean = true
) {
  const { safeSetInterval, isMounted } = useTeacherMemoryCleanup();

  useEffect(() => {
    if (!enabled || !refreshFn) return;

    const interval = safeSetInterval(() => {
      if (isMounted()) {
        refreshFn();
      }
    }, intervalMs);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [refreshFn, intervalMs, enabled, safeSetInterval, isMounted]);
}
