/**
 * Social Wall Archiving and Security Service
 * Handles data archiving, retention policies, and security measures
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';

export interface ArchivingConfig {
  retentionPeriodDays: number;
  archiveInactiveContent: boolean;
  enableDataPartitioning: boolean;
  enableContentEncryption: boolean;
  maxArchiveSize: number; // in MB
}

export interface SecurityConfig {
  enableContentModeration: boolean;
  enableSpamDetection: boolean;
  enableProfanityFilter: boolean;
  maxPostsPerHour: number;
  maxCommentsPerHour: number;
  enableRateLimiting: boolean;
}

export interface ArchiveStats {
  totalArchivedPosts: number;
  totalArchivedComments: number;
  totalArchivedReactions: number;
  archiveSize: number;
  oldestArchiveDate: Date;
  newestArchiveDate: Date;
}

export class SocialWallArchivingService {
  private config: ArchivingConfig;
  private securityConfig: SecurityConfig;

  constructor(
    private prisma: PrismaClient,
    config?: Partial<ArchivingConfig>,
    securityConfig?: Partial<SecurityConfig>
  ) {
    this.config = {
      retentionPeriodDays: 365, // 1 year default
      archiveInactiveContent: true,
      enableDataPartitioning: true,
      enableContentEncryption: false, // Requires additional setup
      maxArchiveSize: 1000, // 1GB default
      ...config,
    };

    this.securityConfig = {
      enableContentModeration: true,
      enableSpamDetection: true,
      enableProfanityFilter: true,
      maxPostsPerHour: 10,
      maxCommentsPerHour: 50,
      enableRateLimiting: true,
      ...securityConfig,
    };
  }

  /**
   * Archive old posts based on retention policy
   */
  async archiveOldPosts(): Promise<{ archivedCount: number; errors: string[] }> {
    const errors: string[] = [];
    let archivedCount = 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriodDays);

      // Find posts to archive
      const postsToArchive = await this.prisma.socialPost.findMany({
        where: {
          createdAt: { lt: cutoffDate },
          status: 'ACTIVE',
          deletedAt: null,
        },
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
        take: 100, // Process in batches
      });

      for (const post of postsToArchive) {
        try {
          await this.prisma.$transaction(async (tx) => {
            // Create archive record
            await tx.socialArchive.create({
              data: {
                originalId: post.id,
                entityType: 'POST',
                archivedData: {
                  post,
                  comments: post.comments,
                  reactions: post.reactions,
                  userTags: post.userTags,
                  metadata: {
                    originalUpdatedAt: post.updatedAt,
                    postType: post.postType,
                  },
                },
                classId: post.classId,
                authorId: post.authorId,
                originalCreatedAt: post.createdAt,
                archiveReason: 'RETENTION_POLICY',
              },
            });

            // Delete related data
            await tx.socialUserTag.deleteMany({
              where: { postId: post.id },
            });

            await tx.socialReaction.deleteMany({
              where: { postId: post.id },
            });

            await tx.socialComment.deleteMany({
              where: { postId: post.id },
            });

            // Delete the post
            await tx.socialPost.delete({
              where: { id: post.id },
            });
          });

          archivedCount++;
          logger.info('Post archived', { postId: post.id, createdAt: post.createdAt });
        } catch (error) {
          const errorMsg = `Failed to archive post ${post.id}: ${error}`;
          errors.push(errorMsg);
          logger.error(errorMsg, { error, postId: post.id });
        }
      }

      logger.info('Post archiving completed', { archivedCount, errors: errors.length });
      return { archivedCount, errors };
    } catch (error) {
      logger.error('Post archiving failed', { error });
      throw error;
    }
  }

  /**
   * Archive inactive content (no engagement for specified period)
   */
  async archiveInactiveContent(inactiveDays: number = 90): Promise<{ archivedCount: number; errors: string[] }> {
    if (!this.config.archiveInactiveContent) {
      return { archivedCount: 0, errors: [] };
    }

    const errors: string[] = [];
    let archivedCount = 0;

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

      // Find posts with no recent engagement
      const inactivePosts = await this.prisma.socialPost.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
          updatedAt: { lt: cutoffDate },
          AND: [
            {
              OR: [
                { commentCount: 0 },
                {
                  comments: {
                    none: {
                      createdAt: { gte: cutoffDate },
                    },
                  },
                },
              ],
            },
            {
              reactions: {
                none: {
                  createdAt: { gte: cutoffDate },
                },
              },
            },
          ],
        },
        take: 50, // Process in smaller batches for inactive content
      });

      for (const post of inactivePosts) {
        try {
          await this.archiveSinglePost(post.id, 'INACTIVE_CONTENT');
          archivedCount++;
        } catch (error) {
          const errorMsg = `Failed to archive inactive post ${post.id}: ${error}`;
          errors.push(errorMsg);
          logger.error(errorMsg, { error, postId: post.id });
        }
      }

      logger.info('Inactive content archiving completed', { archivedCount, errors: errors.length });
      return { archivedCount, errors };
    } catch (error) {
      logger.error('Inactive content archiving failed', { error });
      throw error;
    }
  }

  /**
   * Get archive statistics
   */
  async getArchiveStats(): Promise<ArchiveStats> {
    try {
      const stats = await this.prisma.socialArchive.aggregate({
        _count: {
          id: true,
        },
        _min: {
          archivedAt: true,
        },
        _max: {
          archivedAt: true,
        },
      });

      const entityTypeStats = await this.prisma.socialArchive.groupBy({
        by: ['entityType'],
        _count: {
          id: true,
        },
      });

      const postCount = entityTypeStats.find(s => s.entityType === 'POST')?._count?.id || 0;
      const commentCount = entityTypeStats.find(s => s.entityType === 'COMMENT')?._count?.id || 0;
      const reactionCount = 0; // Reactions are archived with posts/comments

      // Estimate archive size (rough calculation)
      const estimatedSize = stats._count.id * 2; // 2KB average per archived item

      return {
        totalArchivedPosts: postCount,
        totalArchivedComments: commentCount,
        totalArchivedReactions: reactionCount,
        archiveSize: estimatedSize,
        oldestArchiveDate: stats._min.archivedAt || new Date(),
        newestArchiveDate: stats._max.archivedAt || new Date(),
      };
    } catch (error) {
      logger.error('Failed to get archive stats', { error });
      throw error;
    }
  }

  /**
   * Check user rate limits for security
   */
  async checkRateLimit(userId: string, action: 'post' | 'comment'): Promise<{ allowed: boolean; remaining: number }> {
    if (!this.securityConfig.enableRateLimiting) {
      return { allowed: true, remaining: 999 };
    }

    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);

      let count = 0;
      let limit = 0;

      if (action === 'post') {
        count = await this.prisma.socialPost.count({
          where: {
            authorId: userId,
            createdAt: { gte: oneHourAgo },
          },
        });
        limit = this.securityConfig.maxPostsPerHour;
      } else {
        count = await this.prisma.socialComment.count({
          where: {
            authorId: userId,
            createdAt: { gte: oneHourAgo },
          },
        });
        limit = this.securityConfig.maxCommentsPerHour;
      }

      const allowed = count < limit;
      const remaining = Math.max(0, limit - count);

      return { allowed, remaining };
    } catch (error) {
      logger.error('Rate limit check failed', { error, userId, action });
      // Allow on error to prevent blocking users
      return { allowed: true, remaining: 999 };
    }
  }

  /**
   * Clean up old archive data
   */
  async cleanupOldArchives(maxAgeDays: number = 2555): Promise<{ deletedCount: number }> { // 7 years default
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      const result = await this.prisma.socialArchive.deleteMany({
        where: {
          archivedAt: { lt: cutoffDate },
        },
      });

      logger.info('Old archives cleaned up', { deletedCount: result.count });
      return { deletedCount: result.count };
    } catch (error) {
      logger.error('Archive cleanup failed', { error });
      throw error;
    }
  }

  /**
   * Archive a single post
   */
  private async archiveSinglePost(postId: string, reason: string): Promise<void> {
    const post = await this.prisma.socialPost.findUnique({
      where: { id: postId },
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

    if (!post) return;

    await this.prisma.$transaction(async (tx) => {
      // Create archive record
      await tx.socialArchive.create({
        data: {
          originalId: post.id,
          entityType: 'POST',
          archivedData: {
            post,
            comments: post.comments,
            reactions: post.reactions,
            userTags: post.userTags,
            metadata: {
              originalUpdatedAt: post.updatedAt,
              postType: post.postType,
            },
          },
          classId: post.classId,
          authorId: post.authorId,
          originalCreatedAt: post.createdAt,
          archiveReason: reason,
        },
      });

      // Delete related data
      await tx.socialUserTag.deleteMany({
        where: { postId: post.id },
      });

      await tx.socialReaction.deleteMany({
        where: { postId: post.id },
      });

      await tx.socialComment.deleteMany({
        where: { postId: post.id },
      });

      // Delete the post
      await tx.socialPost.delete({
        where: { id: post.id },
      });
    });
  }
}
