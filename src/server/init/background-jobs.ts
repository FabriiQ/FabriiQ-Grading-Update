/**
 * Background Jobs Initialization
 *
 * This module initializes the background jobs system when the server starts.
 * Optimized for fast startup with proper error handling.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../api/utils/logger';
import { initializeBackgroundJobs, shutdownBackgroundJobs } from '../jobs';

let initialized = false;
let isInitializing = false;

/**
 * Initialize background jobs system asynchronously with performance optimizations
 * @param prisma Prisma client instance
 */
export async function initBackgroundJobs(prisma: PrismaClient): Promise<void> {
  if (initialized) {
    logger.debug('Background jobs system already initialized');
    return;
  }

  if (isInitializing) {
    logger.debug('Background jobs system initialization already in progress');
    return;
  }

  isInitializing = true;
  const startTime = Date.now();

  try {
    logger.info('Initializing background jobs system');

    // Initialize the background jobs system with enhanced timeout protection
    const initPromise = new Promise<void>((resolve, reject) => {
      try {
        logger.debug('Starting background jobs system initialization');

        // Use setTimeout to make initialization non-blocking
        setTimeout(() => {
          try {
            const result = initializeBackgroundJobs(prisma);
            logger.debug('Background jobs system initialization completed', {
              jobSystemInitialized: !!result.jobSystem,
              rewardJobManagerInitialized: !!result.rewardJobManager,
              systemJobManagerInitialized: !!result.systemJobManager
            });
            resolve();
          } catch (error) {
            logger.error('Background jobs system initialization failed', { error });
            reject(error);
          }
        }, 100); // Small delay to make it non-blocking

      } catch (error) {
        logger.error('Background jobs system initialization setup failed', { error });
        reject(error);
      }
    });

    // Add timeout protection with longer timeout for complex initialization
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => {
        logger.error('Background jobs initialization timeout after 10 seconds');
        reject(new Error('Background jobs initialization timeout after 10 seconds'));
      }, 10000); // Increased to 10 seconds
    });

    // Add graceful degradation - if initialization fails, continue without background jobs
    try {
      await Promise.race([initPromise, timeoutPromise]);
    } catch (error) {
      logger.warn('Background jobs initialization failed, continuing without background jobs', { error });
      // Don't re-throw the error - allow server to continue
    }

    // Set up shutdown handlers (only once)
    setupShutdownHandlers();

    const duration = Date.now() - startTime;
    initialized = true;
    logger.info(`Background jobs system initialized successfully in ${duration}ms`);
  } catch (error) {
    logger.error('Error initializing background jobs system', { error });
    // Don't throw - allow server to continue without background jobs
  } finally {
    isInitializing = false;
  }
}

/**
 * Set up shutdown handlers for graceful cleanup
 */
function setupShutdownHandlers(): void {
  if (!process.listeners('SIGTERM').length) {
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down background jobs system');
      try {
        shutdownBackgroundJobs();
      } catch (error) {
        logger.error('Error during SIGTERM shutdown', { error });
      }
    });
  }

  if (!process.listeners('SIGINT').length) {
    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down background jobs system');
      try {
        shutdownBackgroundJobs();
      } catch (error) {
        logger.error('Error during SIGINT shutdown', { error });
      }
    });
  }
}
