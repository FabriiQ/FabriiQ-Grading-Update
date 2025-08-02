/**
 * Performance Optimization Utilities
 * 
 * Comprehensive performance optimization tools including code splitting,
 * lazy loading, memoization, and bundle size optimization.
 */

import React, { 
  Suspense, 
  lazy, 
  memo, 
  useMemo, 
  useCallback, 
  useState, 
  useEffect,
  ComponentType 
} from 'react';
import { LoadingState, LoadingOverlay } from '../components/ui/LoadingStates';

// Lazy loading utilities

/**
 * Enhanced lazy loading with error boundaries and loading states
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType,
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>
) {
  const LazyComponent = lazy(importFn);
  
  return memo((props: React.ComponentProps<T>) => {
    const [error, setError] = useState<Error | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const retry = useCallback(() => {
      setError(null);
      setRetryCount(prev => prev + 1);
    }, []);

    const FallbackComponent = fallback || (() => <LoadingState message="Loading component..." />);
    const ErrorComponent = errorFallback || DefaultErrorFallback;

    if (error) {
      return <ErrorComponent error={error} retry={retry} />;
    }

    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent key={retryCount} {...(props as any)} />
      </Suspense>
    );
  });
}

/**
 * Lazy load components with preloading capability
 */
export function createPreloadableLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  preloadTrigger?: 'hover' | 'visible' | 'idle'
) {
  const LazyComponent = lazy(importFn);
  let preloadPromise: Promise<{ default: T }> | null = null;

  const preload = () => {
    if (!preloadPromise) {
      preloadPromise = importFn();
    }
    return preloadPromise;
  };

  const PreloadableComponent = memo((props: React.ComponentProps<T>) => {
    const [shouldPreload, setShouldPreload] = useState(false);

    useEffect(() => {
      if (preloadTrigger === 'idle') {
        const timeoutId = setTimeout(() => {
          preload();
        }, 2000);
        return () => clearTimeout(timeoutId);
      }
    }, []);

    const handleMouseEnter = useCallback(() => {
      if (preloadTrigger === 'hover') {
        preload();
      }
    }, []);

    const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && preloadTrigger === 'visible') {
        preload();
      }
    }, []);

    useEffect(() => {
      if (preloadTrigger === 'visible') {
        const observer = new IntersectionObserver(handleIntersection, {
          rootMargin: '50px'
        });
        
        const element = document.getElementById('preload-trigger');
        if (element) {
          observer.observe(element);
        }

        return () => observer.disconnect();
      }
    }, [handleIntersection]);

    return (
      <div 
        onMouseEnter={handleMouseEnter}
        id={preloadTrigger === 'visible' ? 'preload-trigger' : undefined}
      >
        <Suspense fallback={<LoadingState message="Loading component..." />}>
          <LazyComponent {...props} />
        </Suspense>
      </div>
    );
  });

  (PreloadableComponent as any).preload = preload;
  return PreloadableComponent;
}

// Memoization utilities

/**
 * Enhanced memo with custom comparison
 */
export function createMemoComponent<T extends ComponentType<any>>(
  Component: T,
  areEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
) {
  return memo(Component, areEqual);
}

/**
 * Deep comparison memo for complex props
 */
export function createDeepMemoComponent<T extends ComponentType<any>>(Component: T) {
  return memo(Component, (prevProps, nextProps) => {
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });
}

/**
 * Selective memo - only compare specific props
 */
export function createSelectiveMemoComponent<T extends ComponentType<any>>(
  Component: T,
  propsToCompare: (keyof React.ComponentProps<T>)[]
) {
  return memo(Component, (prevProps, nextProps) => {
    return propsToCompare.every(prop => prevProps[prop] === nextProps[prop]);
  });
}

// Performance monitoring hooks

/**
 * Hook to measure component render performance
 */
export function useRenderPerformance(componentName: string) {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
        
        if (renderTime > 16) { // More than one frame at 60fps
          console.warn(`${componentName} slow render detected: ${renderTime.toFixed(2)}ms`);
        }
      }
    };
  });
}

/**
 * Hook to track component re-renders
 */
export function useRenderCount(componentName: string) {
  const renderCount = React.useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
}

/**
 * Hook to detect unnecessary re-renders
 */
export function useWhyDidYouUpdate<T extends Record<string, any>>(
  name: string,
  props: T
) {
  const previousProps = React.useRef<T>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key]
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// Bundle optimization utilities

/**
 * Dynamic import with retry logic
 */
export async function dynamicImportWithRetry<T>(
  importFn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await importFn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return dynamicImportWithRetry(importFn, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources() {
  // Preload critical CSS
  const criticalCSS = [
    '/styles/critical.css',
    '/styles/components.css'
  ];

  criticalCSS.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    document.head.appendChild(link);
  });

  // Preload critical JavaScript
  const criticalJS = [
    '/js/polyfills.js',
    '/js/vendor.js'
  ];

  criticalJS.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = src;
    document.head.appendChild(link);
  });
}

/**
 * Optimize images with lazy loading and WebP support
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  ...props
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  [key: string]: any;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  useEffect(() => {
    if (priority) {
      setCurrentSrc(src);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setCurrentSrc(src);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    const imgElement = document.getElementById(`img-${src}`);
    if (imgElement) {
      observer.observe(imgElement);
    }

    return () => observer.disconnect();
  }, [src, priority]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  // Generate WebP source if supported
  const webpSrc = currentSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  return (
    <div 
      id={`img-${src}`}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {currentSrc && !error ? (
        <picture>
          <source srcSet={webpSrc} type="image/webp" />
          <img
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            onLoad={handleLoad}
            onError={handleError}
            className={`transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            {...props}
          />
        </picture>
      ) : error ? (
        <div className="flex items-center justify-center bg-muted text-muted-foreground">
          Failed to load image
        </div>
      ) : (
        <div className="animate-pulse bg-muted" />
      )}
    </div>
  );
}

// Virtual scrolling for large lists

/**
 * Virtual list component for performance with large datasets
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Performance HOCs

/**
 * HOC to add performance monitoring to any component
 */
export function withPerformanceMonitoring<P extends object>(
  Component: ComponentType<P>,
  componentName?: string
) {
  const PerformanceMonitoredComponent = (props: P) => {
    const name = componentName || Component.displayName || Component.name || 'Unknown';
    
    useRenderPerformance(name);
    
    if (process.env.NODE_ENV === 'development') {
      useWhyDidYouUpdate(name, props);
    }

    return <Component {...props} />;
  };

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${componentName || Component.displayName || Component.name})`;
  
  return PerformanceMonitoredComponent;
}

/**
 * HOC to add loading overlay to components
 */
export function withLoadingOverlay<P extends object>(
  Component: ComponentType<P>,
  loadingProp: keyof P = 'isLoading' as keyof P
) {
  return (props: P) => {
    const isLoading = props[loadingProp] as boolean;
    
    return (
      <LoadingOverlay isLoading={isLoading}>
        <Component {...props} />
      </LoadingOverlay>
    );
  };
}

// Default error fallback for lazy components
const DefaultErrorFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="p-6 text-center border border-red-200 rounded-lg bg-red-50">
    <h3 className="text-lg font-semibold text-red-800 mb-2">Failed to load component</h3>
    <p className="text-red-600 mb-4">{error.message}</p>
    <button
      onClick={retry}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
    >
      Retry
    </button>
  </div>
);

// Bundle analyzer utility (development only)
export function analyzeBundleSize() {
  if (process.env.NODE_ENV === 'development') {
    import('webpack-bundle-analyzer').then((_module: any) => {
      console.log('Bundle analyzer available. Run with ANALYZE=true to view bundle composition.');
    }).catch(() => {
      console.log('webpack-bundle-analyzer not available');
    });
  }
}

// Performance metrics collection
export function collectPerformanceMetrics() {
  if (typeof window !== 'undefined' && 'performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    const metrics = {
      // Core Web Vitals
      FCP: 0, // First Contentful Paint
      LCP: 0, // Largest Contentful Paint
      FID: 0, // First Input Delay
      CLS: 0, // Cumulative Layout Shift
      
      // Navigation timing
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // Resource timing
      totalResources: performance.getEntriesByType('resource').length,
      
      // Memory usage (if available)
      memoryUsage: (performance as any).memory ? {
        used: (performance as any).memory.usedJSHeapSize,
        total: (performance as any).memory.totalJSHeapSize,
        limit: (performance as any).memory.jsHeapSizeLimit
      } : null
    };

    // Observe Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        metrics.LCP = lastEntry.startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          metrics.FID = (entry as any).processingStart - entry.startTime;
        });
      }).observe({ entryTypes: ['first-input'] });

      // CLS
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            metrics.CLS += (entry as any).value;
          }
        });
      }).observe({ entryTypes: ['layout-shift'] });
    }

    return metrics;
  }

  return null;
}
