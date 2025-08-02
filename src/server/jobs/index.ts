/**
 * Background Jobs System Initialization
 * 
 * This module initializes and starts the background job system.
 * It registers all job managers and their jobs.
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../api/utils/logger';
import { BackgroundJobSystem } from './background-job-system';
import { RewardJobManager } from './reward-job-manager';
import { SystemJobManager } from './system-job-manager';

// Singleton instance of the background job system
let backgroundJobSystem: BackgroundJobSystem | null = null;
let rewardJobManager: RewardJobManager | null = null;
let systemJobManager: SystemJobManager | null = null;
let isInitializing = false;

/**
 * Initialize the background job system
 * @param prisma Prisma client instance
 * @returns The initialized background job system
 */
export function initializeBackgroundJobs(prisma: PrismaClient): {
  jobSystem: BackgroundJobSystem;
  rewardJobManager: RewardJobManager;
  systemJobManager: SystemJobManager;
} {
  if (backgroundJobSystem) {
    logger.debug('Background job system already initialized');
    return {
      jobSystem: backgroundJobSystem,
      rewardJobManager: rewardJobManager!,
      systemJobManager: systemJobManager!
    };
  }

  if (isInitializing) {
    logger.debug('Background job system is currently initializing, returning existing instance if available');
    // Don't wait - just return existing instance or create a new one
    if (backgroundJobSystem) {
      return {
        jobSystem: backgroundJobSystem,
        rewardJobManager: rewardJobManager!,
        systemJobManager: systemJobManager!
      };
    }
    // If still initializing and no instance, continue with initialization
  }

  logger.info('Initializing background job system');
  isInitializing = true;

  try {
    // Create the background job system
    backgroundJobSystem = new BackgroundJobSystem(prisma);

    // Create job managers
    rewardJobManager = new RewardJobManager(prisma, backgroundJobSystem);
    systemJobManager = new SystemJobManager(prisma, backgroundJobSystem);

    // Register jobs
    rewardJobManager.registerJobs();
    systemJobManager.registerJobs();
  } finally {
    isInitializing = false;
  }

  logger.info('Background job system initialized');

  return {
    jobSystem: backgroundJobSystem,
    rewardJobManager,
    systemJobManager
  };
}

/**
 * Get the background job system instance
 * @returns The background job system instance
 */
export function getBackgroundJobSystem(): BackgroundJobSystem | null {
  return backgroundJobSystem;
}

/**
 * Get the reward job manager instance
 * @returns The reward job manager instance
 */
export function getRewardJobManager(): RewardJobManager | null {
  return rewardJobManager;
}

/**
 * Get the system job manager instance
 * @returns The system job manager instance
 */
export function getSystemJobManager(): SystemJobManager | null {
  return systemJobManager;
}

/**
 * Shutdown the background job system
 */
export function shutdownBackgroundJobs(): void {
  if (backgroundJobSystem) {
    logger.info('Shutting down background job system');
    backgroundJobSystem.shutdown();
    backgroundJobSystem = null;
    rewardJobManager = null;
    systemJobManager = null;
  }
}

// Export job managers and system
export { BackgroundJobSystem } from './background-job-system';
export { RewardJobManager } from './reward-job-manager';
export { SystemJobManager } from './system-job-manager';
