import { logger } from "@/server/api/utils/logger";

/**
 * Memory monitoring and management utilities
 * Helps prevent heap overflow and provides insights into memory usage
 */

interface MemoryStats {
  rss: number;        // Resident Set Size
  heapTotal: number;  // Total heap size
  heapUsed: number;   // Used heap size
  external: number;   // External memory usage
  arrayBuffers: number; // Array buffer usage
  [key: string]: unknown; // Index signature for logger compatibility
}

interface MemoryThresholds {
  warning: number;    // MB - Log warning
  critical: number;   // MB - Log error and trigger GC
  emergency: number;  // MB - Emergency cleanup
}

// Default memory thresholds (in MB)
const DEFAULT_THRESHOLDS: MemoryThresholds = {
  warning: 1024,    // 1GB
  critical: 1536,   // 1.5GB
  emergency: 1800   // 1.8GB (close to 2GB limit)
};

// Memory monitoring state
let monitoringInterval: NodeJS.Timeout | null = null;
let lastGCTime = 0;
let gcCooldown = 30000; // 30 seconds between forced GC

/**
 * Get current memory usage in MB
 */
export function getMemoryUsage(): MemoryStats {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024),
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
    external: Math.round(usage.external / 1024 / 1024),
    arrayBuffers: Math.round((usage as any).arrayBuffers / 1024 / 1024) || 0
  };
}

/**
 * Check if memory usage exceeds thresholds
 */
export function checkMemoryThresholds(
  usage: MemoryStats, 
  thresholds: MemoryThresholds = DEFAULT_THRESHOLDS
): 'normal' | 'warning' | 'critical' | 'emergency' {
  const totalMemory = usage.heapUsed + usage.external;
  
  if (totalMemory >= thresholds.emergency) return 'emergency';
  if (totalMemory >= thresholds.critical) return 'critical';
  if (totalMemory >= thresholds.warning) return 'warning';
  return 'normal';
}

/**
 * Force garbage collection if available
 */
export function forceGarbageCollection(): boolean {
  if (global.gc && Date.now() - lastGCTime > gcCooldown) {
    try {
      global.gc();
      lastGCTime = Date.now();
      logger.info("Forced garbage collection completed");
      return true;
    } catch (error) {
      logger.error("Error during forced garbage collection", { error });
      return false;
    }
  }
  return false;
}

/**
 * Emergency memory cleanup
 */
export async function emergencyMemoryCleanup(): Promise<void> {
  logger.warn("Initiating emergency memory cleanup");
  
  try {
    // Force garbage collection
    forceGarbageCollection();
    
    // Clear any global caches if available
    if (typeof global !== 'undefined') {
      // Clear Next.js cache if available
      if ((global as any).__NEXT_CACHE) {
        (global as any).__NEXT_CACHE.clear?.();
      }
      
      // Clear any other global caches
      Object.keys(global).forEach(key => {
        if (key.includes('cache') || key.includes('Cache')) {
          try {
            const cache = (global as any)[key];
            if (cache && typeof cache.clear === 'function') {
              cache.clear();
            }
          } catch (error) {
            // Ignore errors during cleanup
          }
        }
      });
    }
    
    // Import and destroy cache instances
    try {
      const { destroyAllCaches } = await import('@/server/api/cache/rewards');
      destroyAllCaches();
    } catch (error) {
      logger.debug("Could not destroy rewards caches", { error });
    }
    
    logger.info("Emergency memory cleanup completed");
  } catch (error) {
    logger.error("Error during emergency memory cleanup", { error });
  }
}

/**
 * Handle memory threshold violations
 */
async function handleMemoryThreshold(level: string, usage: MemoryStats): Promise<void> {
  switch (level) {
    case 'warning':
      logger.warn("High memory usage detected", usage);
      break;
      
    case 'critical':
      logger.error("Critical memory usage detected", usage);
      forceGarbageCollection();
      break;
      
    case 'emergency':
      logger.error("Emergency memory usage detected - initiating cleanup", usage);
      await emergencyMemoryCleanup();
      break;
  }
}

/**
 * Start memory monitoring
 */
export function startMemoryMonitoring(
  intervalMs: number = 30000, // 30 seconds
  thresholds: MemoryThresholds = DEFAULT_THRESHOLDS
): void {
  if (monitoringInterval) {
    logger.debug("Memory monitoring already started");
    return;
  }
  
  logger.info("Starting memory monitoring", { 
    intervalMs, 
    thresholds,
    gcAvailable: !!global.gc 
  });
  
  monitoringInterval = setInterval(async () => {
    try {
      const usage = getMemoryUsage();
      const level = checkMemoryThresholds(usage, thresholds);
      
      // Log memory usage periodically (every 5 minutes)
      if (Date.now() % (5 * 60 * 1000) < intervalMs) {
        logger.debug("Memory usage", usage);
      }
      
      // Handle threshold violations
      if (level !== 'normal') {
        await handleMemoryThreshold(level, usage);
      }
      
    } catch (error) {
      logger.error("Error in memory monitoring", { error });
    }
  }, intervalMs);
  
  // Set up process exit handlers using centralized manager
  import('./process-event-manager').then(({ addProcessHandler }) => {
    addProcessHandler('exit', stopMemoryMonitoring);
    addProcessHandler('SIGINT', stopMemoryMonitoring);
    addProcessHandler('SIGTERM', stopMemoryMonitoring);
  }).catch(error => {
    logger.error('Failed to set up process handlers', { error });
  });
}

/**
 * Stop memory monitoring
 */
export function stopMemoryMonitoring(): void {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    logger.info("Memory monitoring stopped");
  }
}

/**
 * Get memory monitoring status
 */
export function getMonitoringStatus(): {
  isActive: boolean;
  currentUsage: MemoryStats;
  thresholdLevel: string;
  gcAvailable: boolean;
} {
  const usage = getMemoryUsage();
  return {
    isActive: !!monitoringInterval,
    currentUsage: usage,
    thresholdLevel: checkMemoryThresholds(usage),
    gcAvailable: !!global.gc
  };
}

/**
 * Memory usage middleware for Express/Next.js
 */
export function memoryUsageMiddleware() {
  return (req: any, res: any, next: any) => {
    const startUsage = getMemoryUsage();
    
    res.on('finish', () => {
      const endUsage = getMemoryUsage();
      const memoryDelta = endUsage.heapUsed - startUsage.heapUsed;
      
      // Log significant memory increases
      if (memoryDelta > 50) { // More than 50MB increase
        logger.warn("High memory usage in request", {
          path: req.path,
          method: req.method,
          memoryDelta: `${memoryDelta}MB`,
          finalUsage: endUsage
        });
      }
    });
    
    next();
  };
}

/**
 * Initialize memory monitoring with production-safe defaults
 */
export function initializeMemoryMonitoring(): void {
  // Only start monitoring in production or when explicitly enabled
  const shouldMonitor = process.env.NODE_ENV === 'production' ||
                       process.env.ENABLE_MEMORY_MONITORING === 'true';

  if (shouldMonitor) {
    // Adjust thresholds based on environment
    const thresholds: MemoryThresholds = {
      warning: parseInt(process.env.MEMORY_WARNING_THRESHOLD || '1024'),
      critical: parseInt(process.env.MEMORY_CRITICAL_THRESHOLD || '1536'),
      emergency: parseInt(process.env.MEMORY_EMERGENCY_THRESHOLD || '1800')
    };

    const interval = parseInt(process.env.MEMORY_MONITOR_INTERVAL || '30000');

    startMemoryMonitoring(interval, thresholds);

    // Log initial memory status
    const status = getMonitoringStatus();
    logger.info("Memory monitoring initialized", status);
  } else {
    // In development, just log current memory usage once
    const usage = getMemoryUsage();
    console.log(`Memory usage (MB):`, usage);
    logger.debug("Memory monitoring disabled (development mode)");
  }
}

// Auto-initialize if this module is imported (with longer delay to prevent blocking)
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  // Delay initialization to allow other modules to load and avoid blocking startup
  setTimeout(() => {
    try {
      initializeMemoryMonitoring();
    } catch (error) {
      console.error('Memory monitoring initialization failed:', error);
    }
  }, 10000); // 10 seconds delay to ensure everything else is loaded
}
