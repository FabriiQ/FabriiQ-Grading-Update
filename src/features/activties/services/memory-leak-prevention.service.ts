'use client';

/**
 * Memory Leak Prevention Service
 * 
 * Provides utilities and hooks to prevent memory leaks in React components,
 * especially for activity components that may have long-running operations,
 * timers, subscriptions, and event listeners.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Cleanup registry for tracking and cleaning up resources
 */
class CleanupRegistry {
  private static instance: CleanupRegistry;
  private cleanupFunctions = new Map<string, (() => void)[]>();
  private timers = new Set<NodeJS.Timeout>();
  private intervals = new Set<NodeJS.Timeout>();
  private eventListeners = new Map<string, { element: EventTarget; event: string; handler: EventListener }[]>();

  private constructor() {}

  public static getInstance(): CleanupRegistry {
    if (!CleanupRegistry.instance) {
      CleanupRegistry.instance = new CleanupRegistry();
    }
    return CleanupRegistry.instance;
  }

  /**
   * Register a cleanup function for a component
   */
  registerCleanup(componentId: string, cleanupFn: () => void): void {
    if (!this.cleanupFunctions.has(componentId)) {
      this.cleanupFunctions.set(componentId, []);
    }
    this.cleanupFunctions.get(componentId)!.push(cleanupFn);
  }

  /**
   * Register a timer for automatic cleanup
   */
  registerTimer(timer: NodeJS.Timeout): void {
    this.timers.add(timer);
  }

  /**
   * Register an interval for automatic cleanup
   */
  registerInterval(interval: NodeJS.Timeout): void {
    this.intervals.add(interval);
  }

  /**
   * Register an event listener for automatic cleanup
   */
  registerEventListener(
    componentId: string,
    element: EventTarget,
    event: string,
    handler: EventListener
  ): void {
    if (!this.eventListeners.has(componentId)) {
      this.eventListeners.set(componentId, []);
    }
    this.eventListeners.get(componentId)!.push({ element, event, handler });
  }

  /**
   * Clean up all resources for a component
   */
  cleanup(componentId: string): void {
    // Run cleanup functions
    const cleanupFns = this.cleanupFunctions.get(componentId);
    if (cleanupFns) {
      cleanupFns.forEach(fn => {
        try {
          fn();
        } catch (error) {
          console.warn('Cleanup function error:', error);
        }
      });
      this.cleanupFunctions.delete(componentId);
    }

    // Remove event listeners
    const listeners = this.eventListeners.get(componentId);
    if (listeners) {
      listeners.forEach(({ element, event, handler }) => {
        try {
          element.removeEventListener(event, handler);
        } catch (error) {
          console.warn('Event listener cleanup error:', error);
        }
      });
      this.eventListeners.delete(componentId);
    }
  }

  /**
   * Clean up all timers and intervals
   */
  cleanupTimers(): void {
    this.timers.forEach(timer => {
      try {
        clearTimeout(timer);
      } catch (error) {
        console.warn('Timer cleanup error:', error);
      }
    });
    this.timers.clear();

    this.intervals.forEach(interval => {
      try {
        clearInterval(interval);
      } catch (error) {
        console.warn('Interval cleanup error:', error);
      }
    });
    this.intervals.clear();
  }

  /**
   * Clean up all resources
   */
  cleanupAll(): void {
    this.cleanupFunctions.forEach((cleanupFns, componentId) => {
      this.cleanup(componentId);
    });
    this.cleanupTimers();
  }
}

/**
 * Hook for automatic memory leak prevention
 */
export function useMemoryLeakPrevention(componentId?: string) {
  const registry = CleanupRegistry.getInstance();
  const componentIdRef = useRef(componentId || `component-${Date.now()}-${Math.random()}`);
  const mountedRef = useRef(true);
  const cleanupFunctionsRef = useRef<(() => void)[]>([]);

  // Register cleanup function
  const registerCleanup = useCallback((cleanupFn: () => void) => {
    if (mountedRef.current) {
      cleanupFunctionsRef.current.push(cleanupFn);
      registry.registerCleanup(componentIdRef.current, cleanupFn);
    }
  }, [registry]);

  // Safe timeout that auto-cleans up
  const safeSetTimeout = useCallback((callback: () => void, delay: number): NodeJS.Timeout | null => {
    if (!mountedRef.current) return null;
    
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        callback();
      }
    }, delay);
    
    registry.registerTimer(timer);
    registerCleanup(() => clearTimeout(timer));
    
    return timer;
  }, [registry, registerCleanup]);

  // Safe interval that auto-cleans up
  const safeSetInterval = useCallback((callback: () => void, delay: number): NodeJS.Timeout | null => {
    if (!mountedRef.current) return null;
    
    const interval = setInterval(() => {
      if (mountedRef.current) {
        callback();
      }
    }, delay);
    
    registry.registerInterval(interval);
    registerCleanup(() => clearInterval(interval));
    
    return interval;
  }, [registry, registerCleanup]);

  // Safe event listener that auto-cleans up
  const safeAddEventListener = useCallback((
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    if (!mountedRef.current) return;
    
    const wrappedHandler = (e: Event) => {
      if (mountedRef.current) {
        handler(e);
      }
    };
    
    element.addEventListener(event, wrappedHandler, options);
    registry.registerEventListener(componentIdRef.current, element, event, wrappedHandler);
  }, [registry]);

  // Check if component is still mounted
  const isMounted = useCallback(() => mountedRef.current, []);

  // Manual cleanup trigger
  const cleanup = useCallback(() => {
    registry.cleanup(componentIdRef.current);
    cleanupFunctionsRef.current = [];
  }, [registry]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      registry.cleanup(componentIdRef.current);
    };
  }, [registry]);

  return {
    registerCleanup,
    safeSetTimeout,
    safeSetInterval,
    safeAddEventListener,
    isMounted,
    cleanup,
    componentId: componentIdRef.current
  };
}

/**
 * Hook for safe async operations
 */
export function useSafeAsync() {
  const { isMounted, registerCleanup } = useMemoryLeakPrevention();
  const pendingPromises = useRef(new Set<Promise<any>>());

  const safeAsync = useCallback(async <T>(
    asyncOperation: () => Promise<T>,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    if (!isMounted()) return null;

    const promise = asyncOperation();
    pendingPromises.current.add(promise);

    try {
      const result = await promise;
      
      if (isMounted()) {
        onSuccess?.(result);
        return result;
      }
      
      return null;
    } catch (error) {
      if (isMounted()) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
    } finally {
      pendingPromises.current.delete(promise);
    }
  }, [isMounted]);

  // Register cleanup for pending promises
  registerCleanup(() => {
    pendingPromises.current.clear();
  });

  return { safeAsync };
}

/**
 * Hook for safe state updates
 */
export function useSafeState<T>(initialState: T): [T, (newState: T | ((prev: T) => T)) => void] {
  const { isMounted } = useMemoryLeakPrevention();
  const [state, setState] = useState(initialState);

  const safeSetState = useCallback((newState: T | ((prev: T) => T)) => {
    if (isMounted()) {
      setState(newState);
    }
  }, [isMounted]);

  return [state, safeSetState];
}

/**
 * Performance monitoring hook
 */
export function usePerformanceMonitoring(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const { registerCleanup } = useMemoryLeakPrevention();

  useEffect(() => {
    renderCount.current++;
    const currentTime = Date.now();
    const timeSinceLastRender = currentTime - lastRenderTime.current;
    lastRenderTime.current = currentTime;

    // Log performance warnings
    if (renderCount.current > 100) {
      console.warn(`${componentName} has rendered ${renderCount.current} times`);
    }

    if (timeSinceLastRender < 16) { // Less than 60fps
      console.warn(`${componentName} rendered too quickly: ${timeSinceLastRender}ms`);
    }
  });

  // Monitor memory usage
  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          console.warn(`${componentName} may be causing memory issues`);
        }
      }
    };

    const interval = setInterval(checkMemory, 10000); // Check every 10 seconds
    registerCleanup(() => clearInterval(interval));
  }, [componentName, registerCleanup]);

  return {
    renderCount: renderCount.current,
    resetRenderCount: () => { renderCount.current = 0; }
  };
}

// Export the cleanup registry for manual use
export const cleanupRegistry = CleanupRegistry.getInstance();

// Global cleanup function for app-level cleanup
export function globalCleanup() {
  cleanupRegistry.cleanupAll();
}
