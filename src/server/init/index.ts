/**
 * Server Initialization
 *
 * This module initializes various server components when the application starts.
 * Optimized for fast startup with non-blocking initialization.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../api/utils/logger';
import { initBackgroundJobs } from './background-jobs';

// Track initialization state
let isInitializing = false;
let isInitialized = false;

/**
 * Initialize server components asynchronously with performance optimizations
 * @param prisma Prisma client instance
 */
export async function initializeServer(prisma: PrismaClient): Promise<void> {
  // Prevent multiple simultaneous initializations
  if (isInitializing || isInitialized) {
    logger.debug('Server initialization already in progress or completed');
    return;
  }

  isInitializing = true;
  const startTime = Date.now();

  try {
    logger.info('Starting optimized server initialization');

    // Only initialize in production or when explicitly enabled
    const shouldInitialize = process.env.NODE_ENV === 'production' ||
                            process.env.ENABLE_BACKGROUND_JOBS === 'true';

    if (!shouldInitialize) {
      logger.info('Background jobs disabled for development - skipping initialization');
      isInitialized = true;
      isInitializing = false;
      return;
    }

    // Initialize background jobs with timeout protection
    const initPromise = initBackgroundJobs(prisma);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Initialization timeout after 10 seconds')), 10000);
    });

    await Promise.race([initPromise, timeoutPromise]);

    const duration = Date.now() - startTime;
    logger.info(`Server initialization completed in ${duration}ms`);
    isInitialized = true;

  } catch (error) {
    logger.error('Error during server initialization', { error });
    // Don't throw - allow server to continue running
  } finally {
    isInitializing = false;
  }
}

/**
 * Get initialization status
 */
export function getInitializationStatus() {
  return {
    isInitializing,
    isInitialized
  };
}
