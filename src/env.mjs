import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]),
    DATABASE_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),

    // Database performance configuration
    DATABASE_CONNECTION_LIMIT: z.string().transform(Number).optional(),
    DATABASE_POOL_TIMEOUT: z.string().transform(Number).optional(),
    DATABASE_CONNECT_TIMEOUT: z.string().transform(Number).optional(),
    DATABASE_STATEMENT_TIMEOUT: z.string().transform(Number).optional(),
    DATABASE_MAX_IDLE_TIME: z.string().transform(Number).optional(),

    // Performance monitoring
    ENABLE_PERFORMANCE_MONITORING: z.string().transform(val => val === 'true').optional(),
    ENABLE_BACKGROUND_JOBS: z.string().transform(val => val === 'true').optional(),
    ENABLE_QUERY_LOGGING: z.string().transform(val => val === 'true').optional(),
    SLOW_QUERY_THRESHOLD: z.string().transform(Number).optional(),
    PERFORMANCE_WARN_THRESHOLD: z.string().transform(Number).optional(),
    PERFORMANCE_ERROR_THRESHOLD: z.string().transform(Number).optional(),

    // Cache configuration
    CACHE_TTL_USER_DATA: z.string().transform(Number).optional(),
    CACHE_TTL_ANALYTICS: z.string().transform(Number).optional(),
    CACHE_TTL_CLASS_DATA: z.string().transform(Number).optional(),
    CACHE_TTL_STATIC_DATA: z.string().transform(Number).optional(),
    MEMORY_CACHE_MAX_SIZE: z.string().transform(Number).optional(),
    MEMORY_CACHE_DEFAULT_TTL: z.string().transform(Number).optional(),
    SESSION_CACHE_MAX_SIZE: z.string().transform(Number).optional(),

    // Background jobs and cleanup
    SESSION_CLEANUP_INTERVAL: z.string().transform(Number).optional(),
    CACHE_CLEANUP_INTERVAL: z.string().transform(Number).optional(),
    PERFORMANCE_MONITOR_INTERVAL: z.string().transform(Number).optional(),

    // Navigation optimization
    DISABLE_VIEW_TRANSITIONS: z.string().transform(val => val === 'true').optional(),
    NAVIGATION_TIMEOUT: z.string().transform(Number).optional(),
    USER_CACHE_TTL: z.string().transform(Number).optional(),
    STATIC_CACHE_TTL: z.string().transform(Number).optional(),

    // LLM API keys
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
    GEMINI_API_KEY: z.string().optional(),

    // LLM token limits
    LLM_INPUT_TOKEN_LIMIT: z.string().transform(Number).optional(),
    LLM_OUTPUT_TOKEN_LIMIT: z.string().transform(Number).optional(),
    LLM_MONTHLY_TOKEN_BUDGET: z.string().transform(Number).optional(),

    // LangGraph configuration
    LANGGRAPH_API_URL: z.string().url().optional(),
  },
  client: {
    // Add client-side env variables here if needed
    NEXT_PUBLIC_GEMINI_API_KEY: z.string().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,

    // Database performance configuration
    DATABASE_CONNECTION_LIMIT: process.env.DATABASE_CONNECTION_LIMIT,
    DATABASE_POOL_TIMEOUT: process.env.DATABASE_POOL_TIMEOUT,
    DATABASE_CONNECT_TIMEOUT: process.env.DATABASE_CONNECT_TIMEOUT,
    DATABASE_STATEMENT_TIMEOUT: process.env.DATABASE_STATEMENT_TIMEOUT,
    DATABASE_MAX_IDLE_TIME: process.env.DATABASE_MAX_IDLE_TIME,

    // Performance monitoring
    ENABLE_PERFORMANCE_MONITORING: process.env.ENABLE_PERFORMANCE_MONITORING,
    ENABLE_BACKGROUND_JOBS: process.env.ENABLE_BACKGROUND_JOBS,
    ENABLE_QUERY_LOGGING: process.env.ENABLE_QUERY_LOGGING,
    SLOW_QUERY_THRESHOLD: process.env.SLOW_QUERY_THRESHOLD,
    PERFORMANCE_WARN_THRESHOLD: process.env.PERFORMANCE_WARN_THRESHOLD,
    PERFORMANCE_ERROR_THRESHOLD: process.env.PERFORMANCE_ERROR_THRESHOLD,

    // Cache configuration
    CACHE_TTL_USER_DATA: process.env.CACHE_TTL_USER_DATA,
    CACHE_TTL_ANALYTICS: process.env.CACHE_TTL_ANALYTICS,
    CACHE_TTL_CLASS_DATA: process.env.CACHE_TTL_CLASS_DATA,
    CACHE_TTL_STATIC_DATA: process.env.CACHE_TTL_STATIC_DATA,
    MEMORY_CACHE_MAX_SIZE: process.env.MEMORY_CACHE_MAX_SIZE,
    MEMORY_CACHE_DEFAULT_TTL: process.env.MEMORY_CACHE_DEFAULT_TTL,
    SESSION_CACHE_MAX_SIZE: process.env.SESSION_CACHE_MAX_SIZE,

    // Background jobs and cleanup
    SESSION_CLEANUP_INTERVAL: process.env.SESSION_CLEANUP_INTERVAL,
    CACHE_CLEANUP_INTERVAL: process.env.CACHE_CLEANUP_INTERVAL,
    PERFORMANCE_MONITOR_INTERVAL: process.env.PERFORMANCE_MONITOR_INTERVAL,

    // Navigation optimization
    DISABLE_VIEW_TRANSITIONS: process.env.DISABLE_VIEW_TRANSITIONS,
    NAVIGATION_TIMEOUT: process.env.NAVIGATION_TIMEOUT,
    USER_CACHE_TTL: process.env.USER_CACHE_TTL,
    STATIC_CACHE_TTL: process.env.STATIC_CACHE_TTL,

    // LLM API keys
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,

    // LLM token limits
    LLM_INPUT_TOKEN_LIMIT: process.env.LLM_INPUT_TOKEN_LIMIT,
    LLM_OUTPUT_TOKEN_LIMIT: process.env.LLM_OUTPUT_TOKEN_LIMIT,
    LLM_MONTHLY_TOKEN_BUDGET: process.env.LLM_MONTHLY_TOKEN_BUDGET,

    // LangGraph configuration
    LANGGRAPH_API_URL: process.env.LANGGRAPH_API_URL,

    // Client-side env variables
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },
});