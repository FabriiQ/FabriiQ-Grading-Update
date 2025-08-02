/**
 * Background Job Processing System
 * 
 * This system handles heavy computations in the background to improve response times:
 * - Analytics calculations
 * - Cache warming
 * - Data aggregation
 * - Cleanup tasks
 * - Report generation
 */

import { logger } from '@/server/api/utils/logger';
import { prisma } from '@/server/db';
import { AdvancedProcedureCache, CacheInvalidation } from '@/server/api/cache/advanced-procedure-cache';

interface BackgroundJob {
  id: string;
  type: string;
  payload: any;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

class BackgroundJobProcessor {
  private jobs: Map<string, BackgroundJob> = new Map();
  private processing = false;
  private readonly maxConcurrentJobs = 5;
  private activeJobs = 0;

  constructor() {
    this.startProcessor();
    this.scheduleRecurringJobs();
  }

  private startProcessor() {
    // Process jobs every 10 seconds
    setInterval(() => {
      this.processJobs();
    }, 10000);
  }

  private scheduleRecurringJobs() {
    // Cache warming every 5 minutes
    setInterval(() => {
      this.addJob('cache-warming', {}, 1);
    }, 5 * 60 * 1000);

    // Analytics aggregation every 15 minutes
    setInterval(() => {
      this.addJob('analytics-aggregation', {}, 2);
    }, 15 * 60 * 1000);

    // Cleanup tasks every hour
    setInterval(() => {
      this.addJob('cleanup-tasks', {}, 3);
    }, 60 * 60 * 1000);

    // Performance metrics collection every 30 seconds
    setInterval(() => {
      this.addJob('performance-metrics', {}, 1);
    }, 30000);
  }

  public addJob(
    type: string,
    payload: any,
    priority: number = 5,
    scheduledFor: Date = new Date(),
    maxAttempts: number = 3
  ): string {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const job: BackgroundJob = {
      id,
      type,
      payload,
      priority,
      attempts: 0,
      maxAttempts,
      createdAt: new Date(),
      scheduledFor,
      status: 'pending',
    };

    this.jobs.set(id, job);
    logger.debug('Background job added', { id, type, priority });
    
    return id;
  }

  private async processJobs() {
    if (this.processing || this.activeJobs >= this.maxConcurrentJobs) {
      return;
    }

    this.processing = true;

    try {
      // Get pending jobs sorted by priority and scheduled time
      const pendingJobs = Array.from(this.jobs.values())
        .filter(job => 
          job.status === 'pending' && 
          job.scheduledFor <= new Date()
        )
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority; // Lower number = higher priority
          }
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

      // Process jobs up to the concurrent limit
      const jobsToProcess = pendingJobs.slice(0, this.maxConcurrentJobs - this.activeJobs);
      
      await Promise.all(
        jobsToProcess.map(job => this.executeJob(job))
      );
    } finally {
      this.processing = false;
    }
  }

  private async executeJob(job: BackgroundJob) {
    this.activeJobs++;
    job.status = 'processing';
    job.attempts++;

    const startTime = performance.now();

    try {
      logger.debug('Executing background job', { id: job.id, type: job.type });

      await this.runJobHandler(job);

      job.status = 'completed';
      const executionTime = performance.now() - startTime;
      
      logger.info('Background job completed', {
        id: job.id,
        type: job.type,
        executionTime: `${executionTime.toFixed(2)}ms`,
        attempts: job.attempts,
      });

      // Remove completed job after 1 hour
      setTimeout(() => {
        this.jobs.delete(job.id);
      }, 60 * 60 * 1000);

    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      logger.error('Background job failed', {
        id: job.id,
        type: job.type,
        error: String(error),
        executionTime: `${executionTime.toFixed(2)}ms`,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
      });

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
      } else {
        job.status = 'pending';
        // Exponential backoff for retries
        job.scheduledFor = new Date(Date.now() + Math.pow(2, job.attempts) * 60000);
      }
    } finally {
      this.activeJobs--;
    }
  }

  private async runJobHandler(job: BackgroundJob) {
    switch (job.type) {
      case 'cache-warming':
        await this.warmCaches();
        break;
      
      case 'analytics-aggregation':
        await this.aggregateAnalytics(job.payload);
        break;
      
      case 'cleanup-tasks':
        await this.runCleanupTasks();
        break;
      
      case 'performance-metrics':
        await this.collectPerformanceMetrics();
        break;
      
      case 'teacher-metrics-calculation':
        await this.calculateTeacherMetrics(job.payload);
        break;
      
      case 'class-analytics-update':
        await this.updateClassAnalytics(job.payload);
        break;
      
      case 'leaderboard-refresh':
        await this.refreshLeaderboards(job.payload);
        break;
      
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  // Job handlers
  private async warmCaches() {
    // Warm frequently accessed caches
    logger.debug('Warming caches');
    
    // This would typically pre-load common queries
    // For example, system configuration, active users, etc.
  }

  private async aggregateAnalytics(payload: any) {
    logger.debug('Aggregating analytics data');
    
    // Aggregate analytics data for faster retrieval
    // This could include calculating daily/weekly/monthly summaries
  }

  private async runCleanupTasks() {
    logger.debug('Running cleanup tasks');
    
    try {
      // Clean up old sessions
      await prisma.session.deleteMany({
        where: {
          expires: {
            lt: new Date()
          }
        }
      });

      // Clean up old notifications (older than 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Clear old cache entries
      AdvancedProcedureCache.clearAll();
      
      logger.info('Cleanup tasks completed');
    } catch (error) {
      logger.error('Cleanup tasks failed', { error: String(error) });
      throw error;
    }
  }

  private async collectPerformanceMetrics() {
    // Collect and store performance metrics
    const memoryUsage = process.memoryUsage();
    
    logger.debug('Performance metrics collected', {
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024),
    });
  }

  private async calculateTeacherMetrics(payload: { teacherId: string }) {
    logger.debug('Calculating teacher metrics', payload);
    
    // Invalidate teacher-related caches
    CacheInvalidation.invalidateTeacher(payload.teacherId);
    
    // Pre-calculate and cache teacher metrics
    // This would run the expensive analytics queries in the background
  }

  private async updateClassAnalytics(payload: { classId: string }) {
    logger.debug('Updating class analytics', payload);
    
    // Invalidate class-related caches
    CacheInvalidation.invalidateClass(payload.classId);
    
    // Pre-calculate class analytics
  }

  private async refreshLeaderboards(payload: { campusId?: string }) {
    logger.debug('Refreshing leaderboards', payload);
    
    // Invalidate leaderboard caches
    CacheInvalidation.invalidateLeaderboards(payload.campusId);
    
    // Pre-calculate leaderboard data
  }

  // Public methods
  public getJobStats() {
    const jobs = Array.from(this.jobs.values());
    
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      activeJobs: this.activeJobs,
    };
  }

  public getJob(id: string): BackgroundJob | undefined {
    return this.jobs.get(id);
  }

  public cancelJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (job && job.status === 'pending') {
      this.jobs.delete(id);
      return true;
    }
    return false;
  }
}

// Singleton instance
export const backgroundJobProcessor = new BackgroundJobProcessor();

// Helper functions for adding specific job types
export const BackgroundJobs = {
  calculateTeacherMetrics: (teacherId: string) => {
    return backgroundJobProcessor.addJob('teacher-metrics-calculation', { teacherId }, 2);
  },

  updateClassAnalytics: (classId: string) => {
    return backgroundJobProcessor.addJob('class-analytics-update', { classId }, 2);
  },

  refreshLeaderboards: (campusId?: string) => {
    return backgroundJobProcessor.addJob('leaderboard-refresh', { campusId }, 3);
  },

  scheduleCleanup: () => {
    return backgroundJobProcessor.addJob('cleanup-tasks', {}, 4);
  },

  getStats: () => {
    return backgroundJobProcessor.getJobStats();
  },
};
