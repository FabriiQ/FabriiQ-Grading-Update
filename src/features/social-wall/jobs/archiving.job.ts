/**
 * Social Wall Archiving Job
 * Scheduled job for data archiving and cleanup
 */

import { PrismaClient } from '@prisma/client';
import { SocialWallArchivingService } from '../services/social-wall-archiving.service';
import { logger } from '@/server/api/utils/logger';

export class SocialWallArchivingJob {
  private archivingService: SocialWallArchivingService;

  constructor(private prisma: PrismaClient) {
    this.archivingService = new SocialWallArchivingService(prisma);
  }

  /**
   * Run daily archiving job
   */
  async runDailyArchiving(): Promise<void> {
    try {
      logger.info('Starting daily Social Wall archiving job');

      // Archive old posts (based on retention policy)
      const oldPostsResult = await this.archivingService.archiveOldPosts();
      logger.info('Old posts archived', { 
        archivedCount: oldPostsResult.archivedCount, 
        errors: oldPostsResult.errors.length 
      });

      // Archive inactive content
      const inactiveContentResult = await this.archivingService.archiveInactiveContent(90); // 90 days
      logger.info('Inactive content archived', { 
        archivedCount: inactiveContentResult.archivedCount, 
        errors: inactiveContentResult.errors.length 
      });

      // Get archive statistics
      const stats = await this.archivingService.getArchiveStats();
      logger.info('Archive statistics', stats);

      logger.info('Daily Social Wall archiving job completed successfully');
    } catch (error) {
      logger.error('Daily Social Wall archiving job failed', { error });
      throw error;
    }
  }

  /**
   * Run weekly cleanup job
   */
  async runWeeklyCleanup(): Promise<void> {
    try {
      logger.info('Starting weekly Social Wall cleanup job');

      // Clean up very old archives (7 years)
      const cleanupResult = await this.archivingService.cleanupOldArchives(2555);
      logger.info('Old archives cleaned up', { deletedCount: cleanupResult.deletedCount });

      logger.info('Weekly Social Wall cleanup job completed successfully');
    } catch (error) {
      logger.error('Weekly Social Wall cleanup job failed', { error });
      throw error;
    }
  }

  /**
   * Run emergency archiving for specific class
   */
  async runEmergencyArchiving(classId: string, reason: string): Promise<void> {
    try {
      logger.info('Starting emergency Social Wall archiving', { classId, reason });

      // Get all posts for the class
      const posts = await this.prisma.socialPost.findMany({
        where: {
          classId,
          status: 'ACTIVE',
          deletedAt: null,
        },
        select: { id: true },
      });

      let archivedCount = 0;
      const errors: string[] = [];

      // Archive each post
      for (const post of posts) {
        try {
          // Use the private method through a transaction
          await this.prisma.$transaction(async (tx) => {
            const postData = await tx.socialPost.findUnique({
              where: { id: post.id },
              include: {
                comments: {
                  include: {
                    reactions: true,
                    userTags: true,
                  },
                },
                reactions: true,
                userTags: true,
              },
            });

            if (!postData) return;

            // Create archive record
            await tx.socialArchive.create({
              data: {
                originalId: postData.id,
                contentType: 'POST',
                content: JSON.stringify({
                  post: postData,
                  comments: postData.comments,
                  reactions: postData.reactions,
                  userTags: postData.userTags,
                }),
                metadata: {
                  originalCreatedAt: postData.createdAt,
                  originalUpdatedAt: postData.updatedAt,
                  classId: postData.classId,
                  authorId: postData.authorId,
                  postType: postData.postType,
                  emergencyReason: reason,
                },
                archivedAt: new Date(),
                archivedBy: 'emergency_job',
                reason: 'EMERGENCY_ARCHIVING',
              },
            });

            // Delete related data
            await tx.socialUserTag.deleteMany({
              where: { postId: postData.id },
            });

            await tx.socialReaction.deleteMany({
              where: { postId: postData.id },
            });

            await tx.socialComment.deleteMany({
              where: { postId: postData.id },
            });

            // Delete the post
            await tx.socialPost.delete({
              where: { id: postData.id },
            });
          });

          archivedCount++;
        } catch (error) {
          const errorMsg = `Failed to archive post ${post.id}: ${error}`;
          errors.push(errorMsg);
          logger.error(errorMsg, { error, postId: post.id });
        }
      }

      logger.info('Emergency Social Wall archiving completed', { 
        classId, 
        reason, 
        archivedCount, 
        errors: errors.length 
      });
    } catch (error) {
      logger.error('Emergency Social Wall archiving failed', { error, classId, reason });
      throw error;
    }
  }
}

// Export a function to create and run the job
export async function runSocialWallArchivingJob(type: 'daily' | 'weekly' | 'emergency', options?: { classId?: string; reason?: string }): Promise<void> {
  const prisma = new PrismaClient();
  const job = new SocialWallArchivingJob(prisma);

  try {
    switch (type) {
      case 'daily':
        await job.runDailyArchiving();
        break;
      case 'weekly':
        await job.runWeeklyCleanup();
        break;
      case 'emergency':
        if (!options?.classId || !options?.reason) {
          throw new Error('Emergency archiving requires classId and reason');
        }
        await job.runEmergencyArchiving(options.classId, options.reason);
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Example usage:
// await runSocialWallArchivingJob('daily');
// await runSocialWallArchivingJob('weekly');
// await runSocialWallArchivingJob('emergency', { classId: 'class123', reason: 'Data breach investigation' });
