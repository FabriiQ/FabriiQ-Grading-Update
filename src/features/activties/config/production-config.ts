/**
 * Production Configuration
 * 
 * Comprehensive production settings for the Activities System
 * including performance, security, monitoring, and optimization settings.
 */

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  // Caching settings
  cache: {
    defaultTTL: 300, // 5 minutes
    maxSize: 100, // MB
    strategies: {
      activities: { ttl: 600, maxSize: 50 },
      grades: { ttl: 300, maxSize: 30 },
      analytics: { ttl: 180, maxSize: 20 }
    }
  },

  // Bundle optimization
  bundleOptimization: {
    enableCodeSplitting: true,
    enableTreeShaking: true,
    enableMinification: true,
    chunkSizeLimit: 244000, // 244KB
    enableGzip: true,
    enableBrotli: true
  },

  // Lazy loading settings
  lazyLoading: {
    intersectionRootMargin: '50px',
    imageLoadingStrategy: 'lazy',
    componentPreloadStrategy: 'hover',
    enableVirtualScrolling: true,
    virtualScrollThreshold: 100
  },

  // Rendering optimization
  rendering: {
    enableMemoization: true,
    enableVirtualization: true,
    maxRenderTime: 16, // ms (60fps)
    enableConcurrentFeatures: true,
    batchUpdates: true
  }
};

// Security Configuration
export const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com'],
    connectSrc: ["'self'", 'https://api.fabriiq.com']
  },

  // File upload restrictions
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    scanForMalware: true,
    quarantineUnsafe: true
  },

  // Input validation
  validation: {
    enableXSSProtection: true,
    enableSQLInjectionProtection: true,
    maxInputLength: 10000,
    sanitizeHTML: true,
    enableRateLimiting: true
  },

  // Authentication & Authorization
  auth: {
    sessionTimeout: 3600, // 1 hour
    enableMFA: false, // Set to true for production
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    enableAuditLogging: true
  }
};

// Monitoring Configuration
export const MONITORING_CONFIG = {
  // Error tracking
  errorTracking: {
    enableSentry: true,
    sentryDSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enableSourceMaps: false, // Security consideration
    sampleRate: 1.0,
    enablePerformanceMonitoring: true
  },

  // Analytics
  analytics: {
    enableGoogleAnalytics: true,
    gaTrackingId: process.env.NEXT_PUBLIC_GA_TRACKING_ID,
    enableHotjar: false,
    enableFullStory: false,
    enableCustomEvents: true
  },

  // Performance monitoring
  performance: {
    enableWebVitals: true,
    enableRUM: true, // Real User Monitoring
    performanceThresholds: {
      FCP: 1800, // First Contentful Paint (ms)
      LCP: 2500, // Largest Contentful Paint (ms)
      FID: 100,  // First Input Delay (ms)
      CLS: 0.1   // Cumulative Layout Shift
    },
    enableBundleAnalyzer: false // Only for development
  },

  // Health checks
  healthChecks: {
    enableHealthEndpoint: true,
    checkInterval: 30000, // 30 seconds
    services: ['database', 'redis', 'api', 'storage'],
    alertThresholds: {
      responseTime: 5000, // 5 seconds
      errorRate: 0.05,    // 5%
      uptime: 0.99        // 99%
    }
  }
};

// API Configuration
export const API_CONFIG = {
  // Rate limiting
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    enableDistributedLimiting: true,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Caching
  apiCaching: {
    enableResponseCaching: true,
    defaultCacheTTL: 300, // 5 minutes
    enableETags: true,
    enableConditionalRequests: true,
    cacheStrategies: {
      GET: { ttl: 300, vary: ['Authorization'] },
      POST: { ttl: 0 },
      PUT: { ttl: 0 },
      DELETE: { ttl: 0 }
    }
  },

  // Compression
  compression: {
    enableGzip: true,
    enableBrotli: true,
    threshold: 1024, // Minimum size to compress (bytes)
    level: 6 // Compression level (1-9)
  },

  // Timeouts
  timeouts: {
    request: 30000,  // 30 seconds
    response: 30000, // 30 seconds
    idle: 120000     // 2 minutes
  }
};

// Database Configuration
export const DATABASE_CONFIG = {
  // Connection pooling
  connectionPool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 60000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200
  },

  // Query optimization
  queryOptimization: {
    enableQueryLogging: false, // Only for debugging
    slowQueryThreshold: 1000, // 1 second
    enableQueryCache: true,
    maxQueryCacheSize: 100, // MB
    enableIndexHints: true
  },

  // Backup and recovery
  backup: {
    enableAutomaticBackups: true,
    backupInterval: '0 2 * * *', // Daily at 2 AM
    retentionPeriod: 30, // days
    enablePointInTimeRecovery: true
  }
};

// CDN Configuration
export const CDN_CONFIG = {
  // Static assets
  staticAssets: {
    enableCDN: true,
    cdnUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
    enableImageOptimization: true,
    imageFormats: ['webp', 'avif', 'jpeg', 'png'],
    enableLazyLoading: true
  },

  // Caching headers
  cacheHeaders: {
    staticAssets: 'public, max-age=31536000, immutable', // 1 year
    dynamicContent: 'public, max-age=300, s-maxage=600', // 5 min / 10 min
    apiResponses: 'private, max-age=0, no-cache, no-store'
  }
};

// Feature Flags
export const FEATURE_FLAGS = {
  // Core features
  enableAdvancedGrading: true,
  enableAIGrading: true,
  enableBatchGrading: true,
  enableRubricBuilder: true,

  // Analytics features
  enableAdvancedAnalytics: true,
  enablePredictiveAnalytics: true,
  enableRealTimeAnalytics: true,
  enableCustomReports: true,

  // Performance features
  enableVirtualScrolling: true,
  enableLazyLoading: true,
  enableCodeSplitting: true,
  enableServiceWorker: true,

  // Security features
  enableCSP: true,
  enableHSTS: true,
  enableXSSProtection: true,
  enableContentTypeNoSniff: true,

  // Experimental features
  enableConcurrentMode: false,
  enableSuspenseForDataFetching: false,
  enableOfflineMode: false,
  enablePWA: false
};

// Environment-specific overrides
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  const configs = {
    development: {
      performance: {
        ...PERFORMANCE_CONFIG,
        bundleOptimization: {
          ...PERFORMANCE_CONFIG.bundleOptimization,
          enableMinification: false
        }
      },
      monitoring: {
        ...MONITORING_CONFIG,
        errorTracking: {
          ...MONITORING_CONFIG.errorTracking,
          enableSourceMaps: true
        }
      }
    },
    
    test: {
      performance: {
        ...PERFORMANCE_CONFIG,
        cache: {
          ...PERFORMANCE_CONFIG.cache,
          defaultTTL: 0 // Disable caching in tests
        }
      },
      monitoring: {
        ...MONITORING_CONFIG,
        errorTracking: {
          ...MONITORING_CONFIG.errorTracking,
          enableSentry: false
        }
      }
    },
    
    production: {
      performance: PERFORMANCE_CONFIG,
      security: SECURITY_CONFIG,
      monitoring: MONITORING_CONFIG,
      api: API_CONFIG,
      database: DATABASE_CONFIG,
      cdn: CDN_CONFIG
    }
  };

  return configs[env as keyof typeof configs] || configs.production;
};

// Configuration validation
export function validateConfiguration() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL'
  ];

  const missingVars = requiredEnvVars.filter(
    varName => !process.env[varName]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }

  // Validate performance thresholds
  const { performanceThresholds } = MONITORING_CONFIG.performance;
  if (performanceThresholds.FCP > 3000) {
    console.warn('FCP threshold is higher than recommended (3000ms)');
  }
  if (performanceThresholds.LCP > 4000) {
    console.warn('LCP threshold is higher than recommended (4000ms)');
  }

  // Validate security settings
  if (process.env.NODE_ENV === 'production') {
    if (!SECURITY_CONFIG.auth.enableMFA) {
      console.warn('MFA is disabled in production - consider enabling for better security');
    }
    if (MONITORING_CONFIG.errorTracking.enableSourceMaps) {
      console.warn('Source maps are enabled in production - this may expose source code');
    }
  }

  console.log('✅ Configuration validation passed');
}

// Export consolidated configuration
export const PRODUCTION_CONFIG = {
  performance: PERFORMANCE_CONFIG,
  security: SECURITY_CONFIG,
  monitoring: MONITORING_CONFIG,
  api: API_CONFIG,
  database: DATABASE_CONFIG,
  cdn: CDN_CONFIG,
  features: FEATURE_FLAGS,
  environment: getEnvironmentConfig()
};

// Initialize configuration
if (typeof window === 'undefined') {
  // Server-side initialization
  try {
    validateConfiguration();
  } catch (error) {
    console.error('Configuration validation failed:', error);
    process.exit(1);
  }
}
