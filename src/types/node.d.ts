/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      DATABASE_URL: string;
      NEXTAUTH_SECRET: string;
      NEXTAUTH_URL: string;
      DEFAULT_INSTITUTION?: string;
      ENABLE_BACKGROUND_JOBS?: string;
      ENABLE_QUERY_LOGGING?: string;
      ENABLE_PERFORMANCE_MONITORING?: string;
      DISABLE_VIEW_TRANSITIONS?: string;
      NAVIGATION_TIMEOUT?: string;
      USER_CACHE_TTL?: string;
      STATIC_CACHE_TTL?: string;
      SESSION_CLEANUP_INTERVAL?: string;
      CACHE_CLEANUP_INTERVAL?: string;
      PERFORMANCE_MONITOR_INTERVAL?: string;
      SLOW_QUERY_THRESHOLD?: string;
      PERFORMANCE_WARN_THRESHOLD?: string;
      PERFORMANCE_ERROR_THRESHOLD?: string;
      MEMORY_CACHE_MAX_SIZE?: string;
      MEMORY_CACHE_DEFAULT_TTL?: string;
      SESSION_CACHE_MAX_SIZE?: string;
      SESSION_CACHE_TTL?: string;
      QUERY_CACHE_MAX_SIZE?: string;
      QUERY_CACHE_TTL?: string;
      INSTITUTION_CACHE_TTL?: string;
      ENABLE_RLS?: string;
      API_RATE_LIMIT_REQUESTS?: string;
      API_RATE_LIMIT_WINDOW?: string;
      CORS_ORIGIN?: string;
      LOG_LEVEL?: string;
      ENABLE_STRUCTURED_LOGGING?: string;
      LOG_SLOW_OPERATIONS?: string;
      ENABLE_APP_MONITORING?: string;
      ENABLE_ANALYTICS?: string;
      ENABLE_ERROR_TRACKING?: string;
      ENABLE_EXPERIMENTAL_FEATURES?: string;
      ENABLE_OPTIMIZED_QUERIES?: string;
      ENABLE_QUERY_RESULT_CACHING?: string;
      NEXT_PUBLIC_SUPABASE_URL?: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
      SUPABASE_SERVICE_ROLE_KEY?: string;
      MAX_FILE_SIZE?: string;
      MAX_FILES_PER_UPLOAD?: string;
      STORAGE_PROVIDER?: string;
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;
      SMTP_FROM?: string;
      REDIS_URL?: string;
      HEALTH_CHECK_ENABLED?: string;
      HEALTH_CHECK_PATH?: string;
      DB_HEALTH_CHECK_TIMEOUT?: string;
      NEXT_TELEMETRY_DISABLED?: string;
      ANALYZE_BUNDLE?: string;
      NODE_OPTIONS?: string;
      POSTGRES_CONNECTION_LIMIT?: string;
      POSTGRES_POOL_TIMEOUT?: string;
      POSTGRES_IDLE_TIMEOUT?: string;
    }

    interface Global {
      __socialWallSocketIO?: any;
    }
  }

  var global: NodeJS.Global & typeof globalThis;
}

export {};
