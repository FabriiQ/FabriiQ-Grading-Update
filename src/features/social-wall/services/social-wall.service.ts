/**
 * Social Wall Service
 * Business logic for Social Wall operations
 */

import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { logger } from '@/server/api/utils/logger';
import { checkPermission } from '@/server/api/middleware/authorization';
import { SOCIAL_WALL_PERMISSIONS } from '@/server/api/constants/permissions';
import { TeacherRoleService } from '@/server/api/services/teacher-role.service';
import { SocialWallNotificationService } from './social-wall-notification.service';
import { SocialWallArchivingService } from './social-wall-archiving.service';
import { ContentSecurityMiddleware } from '../middleware/content-security.middleware';
import type {
  CreatePostInput,
  CreateCommentInput,
  PostQueryFilter,
  PostWithEngagement,
  CommentWithReplies,
  PaginatedResponse,
  CreatePostResponse,
  CreateCommentResponse,
  SocialWallPermissions,
} from '../types/social-wall.types';

// Socket.IO integration
import type { Server as SocketIOServer } from 'socket.io';

declare global {
  var __socialWallSocketIO: SocketIOServer | undefined;
}

export class SocialWallService {
  private notificationService: SocialWallNotificationService;
  private archivingService: SocialWallArchivingService;
  private securityMiddleware: ContentSecurityMiddleware;

  constructor(private prisma: PrismaClient) {
    this.notificationService = new SocialWallNotificationService(prisma);
    this.archivingService = new SocialWallArchivingService(prisma);
    this.securityMiddleware = new ContentSecurityMiddleware();
  }

  /**
   * Emit real-time event to class namespace
   */
  private emitToClass(classId: string, event: string, data: any) {
    try {
      if (global.__socialWallSocketIO) {
        const namespace = global.__socialWallSocketIO.of(`/class-${classId}`);
        if (namespace) {
          namespace.emit(event, data);
          logger.debug('Emitted real-time event', { classId, event, dataKeys: Object.keys(data) });
        }
      }
    } catch (error) {
      logger.error('Failed to emit real-time event', { error, classId, event });
    }
  }

  // ==================== PERMISSION CHECKS ====================

  async checkClassAccess(userId: string, classId: string): Promise<boolean> {
    try {
      logger.debug('Checking class access', { userId, classId });

      // Get user with profiles - following the exact same pattern as other teacher portal features
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { teacherProfile: true, studentProfile: true }
      });

      if (!user) {
        logger.warn('User not found for class access check', { userId, classId });
        return false;
      }

      logger.debug('User found for class access check', {
        userId,
        classId,
        userType: user.userType,
        hasTeacherProfile: !!user.teacherProfile,
        hasStudentProfile: !!user.studentProfile,
        teacherProfileId: user.teacherProfile?.id
      });

      // For teachers - use the exact same pattern as the server-side page component
      if (user.userType === 'CAMPUS_TEACHER' || user.userType === 'TEACHER') {
        if (!user.teacherProfile) {
          logger.warn('Teacher user without teacher profile', { userId, classId });
          return false;
        }

        // Check both teacher assignment and primary class teacher status in parallel
        const [teacherAssignment, classDetails] = await Promise.all([
          this.prisma.teacherAssignment.findFirst({
            where: {
              teacherId: user.teacherProfile.id,
              classId: classId,
              status: 'ACTIVE'
            }
          }),
          this.prisma.class.findUnique({
            where: { id: classId },
            select: { classTeacherId: true }
          })
        ]);

        const isPrimaryTeacher = classDetails?.classTeacherId === user.teacherProfile.id;
        const hasAssignment = !!teacherAssignment;
        const hasAccess = isPrimaryTeacher || hasAssignment;

        logger.debug('Teacher class access check result', {
          userId,
          classId,
          teacherProfileId: user.teacherProfile.id,
          isPrimaryTeacher,
          hasAssignment,
          hasAccess,
          assignmentId: teacherAssignment?.id,
          classTeacherId: classDetails?.classTeacherId,
          userType: user.userType
        });

        if (!hasAccess) {
          logger.warn('Teacher access denied', {
            userId,
            classId,
            teacherProfileId: user.teacherProfile.id,
            isPrimaryTeacher,
            hasAssignment,
            classTeacherId: classDetails?.classTeacherId,
            userType: user.userType,
            reason: 'Neither primary teacher nor has assignment'
          });
        }

        return hasAccess;
      }

      // For students - check enrollment (matching assessment pattern)
      if (user.userType === 'CAMPUS_STUDENT' || user.userType === 'STUDENT') {
        if (!user.studentProfile) {
          logger.warn('Student user without student profile', { userId, classId });
          return false;
        }

        const studentEnrollment = await this.prisma.studentEnrollment.findFirst({
          where: {
            studentId: user.studentProfile.id,
            classId,
            status: 'ACTIVE',
          },
        });

        const hasAccess = !!studentEnrollment;
        logger.debug('Student class access check result', {
          userId,
          classId,
          studentProfileId: user.studentProfile.id,
          hasAccess
        });

        return hasAccess;
      }

      // For coordinators/admins - check campus access (matching assessment pattern)
      if (user.userType === 'CAMPUS_COORDINATOR' || user.userType === 'SYSTEM_ADMIN') {
        // System admins have access to everything
        if (user.userType === 'SYSTEM_ADMIN') {
          logger.debug('System admin has access to all classes', { userId, classId });
          return true;
        }

        const classInfo = await this.prisma.class.findUnique({
          where: { id: classId },
          select: { campusId: true },
        });

        if (classInfo) {
          const campusAccess = await this.prisma.userCampusAccess.findFirst({
            where: {
              userId,
              campusId: classInfo.campusId,
              status: 'ACTIVE',
            },
          });

          const hasAccess = !!campusAccess;
          logger.debug('Coordinator class access check result', {
            userId,
            classId,
            userType: user.userType,
            campusId: classInfo.campusId,
            hasAccess
          });

          return hasAccess;
        }
      }

      logger.warn('User does not have access to class', {
        userId,
        classId,
        userType: user.userType
      });

      return false;
    } catch (error) {
      logger.error('Error checking class access', { error, userId, classId });
      return false;
    }
  }

  async getUserPermissions(userId: string, classId: string): Promise<SocialWallPermissions> {
    try {
      logger.debug('Getting user permissions', { userId, classId });

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          userType: true
        },
      });

      if (!user) {
        logger.warn('User not found for permissions check', { userId, classId });
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      logger.debug('User found for permissions check', {
        userId,
        classId,
        userType: user.userType
      });

      const hasClassAccess = await this.checkClassAccess(userId, classId);
      if (!hasClassAccess) {
        logger.debug('User does not have class access, returning no permissions', {
          userId,
          classId
        });
        return {
          canCreatePost: false,
          canCreateAchievementPost: false,
          canComment: false,
          canReact: false,
          canTagUsers: false,
          canModerate: false,
          canViewModerationLogs: false,
        };
      }

      // Use the permission system to check user permissions
      const userType = user.userType;

      const permissions = {
        canCreatePost: checkPermission(userType, SOCIAL_WALL_PERMISSIONS.CREATE_POST),
        canCreateAchievementPost: checkPermission(userType, SOCIAL_WALL_PERMISSIONS.CREATE_ACHIEVEMENT_POST),
        canComment: checkPermission(userType, SOCIAL_WALL_PERMISSIONS.CREATE_COMMENT),
        canReact: checkPermission(userType, SOCIAL_WALL_PERMISSIONS.ADD_REACTION),
        canTagUsers: checkPermission(userType, SOCIAL_WALL_PERMISSIONS.TAG_USERS),
        canModerate: checkPermission(userType, SOCIAL_WALL_PERMISSIONS.MODERATE_CONTENT),
        canViewModerationLogs: checkPermission(userType, SOCIAL_WALL_PERMISSIONS.VIEW_MODERATION_LOGS),
      };

      logger.debug('User permissions calculated', {
        userId,
        classId,
        userType,
        permissions
      });

      return permissions;
    } catch (error) {
      logger.error('Error getting user permissions', { error, userId, classId });
      throw error;
    }
  }

  // ==================== POST OPERATIONS ====================

  async createPost(userId: string, input: CreatePostInput): Promise<CreatePostResponse> {
    try {
      // Check permissions
      const permissions = await this.getUserPermissions(userId, input.classId);
      
      if (input.postType === 'ACHIEVEMENT' && !permissions.canCreateAchievementPost) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to share achievements',
        });
      }
      
      if (input.postType !== 'ACHIEVEMENT' && !permissions.canCreatePost) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create posts',
        });
      }

      // Check rate limits
      const rateLimit = await this.archivingService.checkRateLimit(userId, 'post');
      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. You can create ${rateLimit.remaining} more posts this hour.`,
        });
      }

      // Validate and filter content for security
      const securityResult = await this.securityMiddleware.validateContent(input.content, 'post');
      if (!securityResult.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Content validation failed: ${securityResult.violations.join(', ')}`,
        });
      }

      // Use filtered content if available
      const sanitizedContent = securityResult.filteredContent || input.content;

      // Create post in optimized transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the post with tagged activities in metadata
        const postMetadata = {
          ...(input.metadata || {}),
          taggedActivityIds: input.taggedActivityIds || [],
        };

        const post = await tx.socialPost.create({
          data: {
            content: sanitizedContent,
            contentType: input.contentType || 'TEXT',
            mediaUrls: input.mediaUrls || [],
            metadata: postMetadata,
            postType: input.postType || 'REGULAR',
            classId: input.classId,
            authorId: userId,
            isPinned: (input.metadata as any)?.isPinned || false,
            commentsDisabled: (input.metadata as any)?.commentsDisabled || false,
            repliesDisabled: (input.metadata as any)?.repliesDisabled || false,
          },
        });

        // Create user tags if specified (simplified)
        if (input.taggedUserIds && input.taggedUserIds.length > 0) {
          await tx.socialUserTag.createMany({
            data: input.taggedUserIds.map(taggedUserId => ({
              userId: taggedUserId,
              taggerId: userId,
              postId: post.id,
              context: input.content.substring(0, 100),
            })),
          });
        }

        // Create activity tags if specified (simplified)
        if (input.taggedActivityIds && input.taggedActivityIds.length > 0) {
          await tx.socialActivityTag.createMany({
            data: input.taggedActivityIds.map(activityId => ({
              activityId: activityId,
              taggerId: userId,
              postId: post.id,
              context: input.content.substring(0, 100),
            })),
            skipDuplicates: true, // Skip if activity doesn't exist
          });
        }

        return post;
      }, {
        timeout: 10000, // Increase timeout to 10 seconds
      });

      // Fetch additional data outside transaction for better performance
      const [author, taggedUsers, taggedActivities] = await Promise.all([
        // Get author info
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, userType: true },
        }),

        // Get tagged users if any
        input.taggedUserIds && input.taggedUserIds.length > 0
          ? this.prisma.user.findMany({
              where: { id: { in: input.taggedUserIds } },
              select: { id: true, name: true, userType: true },
            })
          : [],

        // Get tagged activities if any
        input.taggedActivityIds && input.taggedActivityIds.length > 0
          ? this.prisma.activity.findMany({
              where: {
                id: { in: input.taggedActivityIds },
                status: 'ACTIVE',
              },
              select: {
                id: true,
                title: true,
                purpose: true,
                status: true,
                subjectId: true,
                subject: { select: { name: true } },
                topic: { select: { title: true } },
                maxScore: true,
                duration: true,
                bloomsLevel: true,
              },
            }).then(activities => activities.map(activity => ({
              id: activity.id,
              title: activity.title,
              type: (activity.purpose === 'LEARNING' ? 'ACTIVITY' : 'ASSESSMENT') as 'ACTIVITY' | 'ASSESSMENT',
              status: (activity.status === 'ACTIVE' ? 'PUBLISHED' : 'DRAFT') as 'DRAFT' | 'PUBLISHED' | 'COMPLETED',
              subjectId: activity.subjectId,
              subjectName: activity.subject?.name,
              topicName: activity.topic?.title,
              maxScore: activity.maxScore ?? undefined,
              estimatedDuration: activity.duration ?? undefined,
              bloomsLevel: activity.bloomsLevel?.toString(),
            })))
          : [],
      ]);

      // Format response with proper null checks
      const postWithEngagement: PostWithEngagement = {
        ...result,
        author: {
          id: author?.id || userId,
          name: author?.name || 'Unknown User',
          userType: author?.userType || 'STUDENT',
        },
        reactions: [],
        userReaction: undefined,
        userTagged: false,
        taggedUsers: taggedUsers.map(user => ({
          id: user.id,
          name: user.name || 'Unknown User',
          userType: user.userType,
        })),
        taggedActivities,
      };

      logger.info('Post created', { postId: result.id, userId, classId: input.classId });

      // Send notifications asynchronously
      this.notificationService.notifyNewPost(result.id, userId, input.classId).catch(error => {
        logger.error('Failed to send post notification', { error, postId: result.id });
      });

      // Send mention notifications if users were tagged
      if (input.taggedUserIds && input.taggedUserIds.length > 0) {
        for (const taggedUserId of input.taggedUserIds) {
          this.notificationService.notifyMention(
            `mention_${result.id}_${taggedUserId}`,
            taggedUserId,
            userId,
            'post',
            result.id
          ).catch(error => {
            logger.error('Failed to send mention notification', { error, taggedUserId });
          });
        }
      }

      // Emit real-time event for new post
      this.emitToClass(input.classId, 'post:created', {
        type: 'post:created',
        post: postWithEngagement,
        classId: input.classId,
        timestamp: new Date(),
      });

      return {
        success: true,
        post: postWithEngagement,
        notifications: [], // Notifications sent asynchronously
      };
    } catch (error) {
      logger.error('Error creating post', { error, userId, input });
      throw error;
    }
  }

  async getClassPosts(userId: string, filter: PostQueryFilter): Promise<PaginatedResponse<PostWithEngagement>> {
    try {
      // Check class access
      const hasAccess = await this.checkClassAccess(userId, filter.classId);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this class',
        });
      }

      const limit = Math.min(filter.limit || 20, 50);
      const where: any = {
        classId: filter.classId,
        status: filter.status || 'ACTIVE',
        deletedAt: null,
      };

      if (filter.postType) {
        where.postType = filter.postType;
      }

      if (filter.authorId) {
        where.authorId = filter.authorId;
      }

      if (filter.dateRange) {
        where.createdAt = {};
        if (filter.dateRange.from) {
          where.createdAt.gte = filter.dateRange.from;
        }
        if (filter.dateRange.to) {
          where.createdAt.lte = filter.dateRange.to;
        }
      }

      if (filter.cursor) {
        where.id = {
          lt: filter.cursor,
        };
      }

      const posts = await this.prisma.socialPost.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              userType: true,
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  userType: true,
                },
              },
            },
          },
          userTags: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  userType: true,
                },
              },
            },
          },
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
        orderBy: [
          {
            isPinned: 'desc', // Pinned posts first
          },
          {
            createdAt: 'desc', // Then by creation date
          },
        ],
        take: limit + 1, // Take one extra to check if there are more
      });

      const hasMore = posts.length > limit;
      const items = hasMore ? posts.slice(0, -1) : posts;
      const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

      // Format posts with tagged activities
      const formattedPosts: PostWithEngagement[] = await Promise.all(
        items.map(async (post) => {
          // Get tagged activities from metadata
          const taggedActivityIds = (post.metadata as any)?.taggedActivityIds || [];
          let taggedActivities: any[] = [];

          if (taggedActivityIds.length > 0) {
            try {
              const activities = await this.prisma.activity.findMany({
                where: {
                  id: { in: taggedActivityIds },
                  status: 'ACTIVE',
                },
                select: {
                  id: true,
                  title: true,
                  purpose: true,
                  status: true,
                  subjectId: true,
                  subject: { select: { name: true } },
                  topic: { select: { title: true } },
                  maxScore: true,
                  duration: true,
                  bloomsLevel: true,
                },
              });

              taggedActivities = activities.map(activity => ({
                id: activity.id,
                title: activity.title,
                type: (activity.purpose === 'LEARNING' ? 'ACTIVITY' : 'ASSESSMENT') as 'ACTIVITY' | 'ASSESSMENT',
                status: (activity.status === 'ACTIVE' ? 'PUBLISHED' : 'DRAFT') as 'DRAFT' | 'PUBLISHED' | 'COMPLETED',
                subjectId: activity.subjectId,
                subjectName: activity.subject?.name,
                topicName: activity.topic?.title,
                maxScore: activity.maxScore ?? undefined,
                estimatedDuration: activity.duration ?? undefined,
                bloomsLevel: activity.bloomsLevel?.toString(),
              }));
            } catch (error) {
              console.error('Error fetching tagged activities:', error);
            }
          }

          // Ensure mediaUrls is properly formatted as an array
          let mediaUrls: string[] = [];
          if (post.mediaUrls) {
            if (Array.isArray(post.mediaUrls)) {
              mediaUrls = post.mediaUrls.filter((url): url is string =>
                typeof url === 'string' && url.trim().length > 0
              );
            } else if (typeof post.mediaUrls === 'string') {
              mediaUrls = [post.mediaUrls];
            }
          }

          return {
            ...post,
            mediaUrls, // Use the properly formatted mediaUrls
            author: {
              id: post.author?.id || '',
              name: post.author?.name || 'Unknown User',
              userType: post.author?.userType || 'STUDENT',
            },
            reactions: this.formatReactionSummary(post.reactions || []),
            userReaction: post.reactions?.find(r => r.userId === userId)?.reactionType,
            userTagged: (post as any).userTags?.some((tag: any) => tag.userId === userId) || false,
            taggedUsers: (post as any).userTags?.map((tag: any) => ({
              id: tag.user?.id || '',
              name: tag.user?.name || 'Unknown User',
              userType: tag.user?.userType || 'STUDENT',
            })) || [],
            taggedActivities,
            commentCount: post._count?.comments || 0,
            reactionCount: post._count?.reactions || 0,
          };
        })
      );

      return {
        items: formattedPosts,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      logger.error('Error getting class posts', { error, userId, filter });
      throw error;
    }
  }

  async getClassPostsCount(userId: string, classId: string): Promise<number> {
    try {
      // Check class access
      const hasAccess = await this.checkClassAccess(userId, classId);
      if (!hasAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this class',
        });
      }

      const count = await this.prisma.socialPost.count({
        where: {
          classId,
          status: 'ACTIVE',
          deletedAt: null,
        },
      });

      return count;
    } catch (error) {
      logger.error('Error getting class posts count', { error, userId, classId });
      throw error;
    }
  }

  // ==================== COMMENT OPERATIONS ====================

  async createComment(userId: string, input: CreateCommentInput): Promise<CreateCommentResponse> {
    try {
      // Get post to check class access
      const post = await this.prisma.socialPost.findUnique({
        where: { id: input.postId },
        select: { classId: true },
      });

      if (!post) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Post not found',
        });
      }

      // Check permissions
      const permissions = await this.getUserPermissions(userId, post.classId);
      if (!permissions.canComment) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to comment',
        });
      }

      // Check rate limits
      const rateLimit = await this.archivingService.checkRateLimit(userId, 'comment');
      if (!rateLimit.allowed) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. You can create ${rateLimit.remaining} more comments this hour.`,
        });
      }

      // Validate and filter content for security
      const securityResult = await this.securityMiddleware.validateContent(input.content, 'comment');
      if (!securityResult.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Content validation failed: ${securityResult.violations.join(', ')}`,
        });
      }

      // Use filtered content if available
      const sanitizedContent = securityResult.filteredContent || input.content;

      // Create comment in transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the comment
        const comment = await tx.socialComment.create({
          data: {
            content: sanitizedContent,
            postId: input.postId,
            authorId: userId,
            parentId: input.parentId,
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                userType: true,
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    userType: true,
                  },
                },
              },
            },
            userTags: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    userType: true,
                  },
                },
              },
            },
          },
        });

        // Update post comment count
        await tx.socialPost.update({
          where: { id: input.postId },
          data: {
            commentCount: {
              increment: 1,
            },
          },
        });

        // Create user tags if specified
        if (input.taggedUserIds && input.taggedUserIds.length > 0) {
          await tx.socialUserTag.createMany({
            data: input.taggedUserIds.map(taggedUserId => ({
              userId: taggedUserId,
              taggerId: userId,
              commentId: comment.id,
              context: input.content.substring(0, 100),
            })),
          });
        }

        return comment;
      });

      // Format response
      const commentWithReplies: CommentWithReplies = {
        ...result,
        author: {
          id: result.author?.id || '',
          name: result.author?.name || 'Unknown User',
          userType: result.author?.userType || 'STUDENT',
        },
        reactions: [],
        userReaction: undefined,
        replies: [],
        taggedUsers: (result as any).userTags?.map((tag: any) => ({
          id: tag.user?.id || '',
          name: tag.user?.name || 'Unknown User',
          userType: tag.user?.userType || 'STUDENT',
        })) || [],
      };

      logger.info('Comment created', { commentId: result.id, userId, postId: input.postId });

      // Send notifications asynchronously
      this.notificationService.notifyNewComment(result.id, userId, input.postId).catch(error => {
        logger.error('Failed to send comment notification', { error, commentId: result.id });
      });

      // Send mention notifications if users were tagged
      if (input.taggedUserIds && input.taggedUserIds.length > 0) {
        for (const taggedUserId of input.taggedUserIds) {
          this.notificationService.notifyMention(
            `mention_${result.id}_${taggedUserId}`,
            taggedUserId,
            userId,
            'comment',
            result.id
          ).catch(error => {
            logger.error('Failed to send mention notification', { error, taggedUserId });
          });
        }
      }

      // Emit real-time event for new comment
      this.emitToClass(post.classId, 'comment:created', {
        type: 'comment:created',
        comment: commentWithReplies,
        postId: input.postId,
        classId: post.classId,
        timestamp: new Date(),
      });

      return {
        success: true,
        comment: commentWithReplies,
        notifications: [], // Notifications sent asynchronously
      };
    } catch (error) {
      logger.error('Error creating comment', { error, userId, input });
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  private formatReactionSummary(reactions: any[]): any[] {
    if (!reactions || !Array.isArray(reactions)) {
      return [];
    }

    const reactionMap = new Map();

    reactions.forEach(reaction => {
      if (!reaction || !reaction.reactionType) {
        return; // Skip invalid reactions
      }

      const type = reaction.reactionType;
      if (!reactionMap.has(type)) {
        reactionMap.set(type, {
          type,
          count: 0,
          users: [],
        });
      }

      const summary = reactionMap.get(type);
      summary.count++;
      if (summary.users.length < 3 && reaction.user) { // Only show first 3 users
        summary.users.push({
          id: reaction.user?.id || '',
          name: reaction.user?.name || 'Unknown User',
          userType: reaction.user?.userType || 'STUDENT',
        });
      }
    });

    return Array.from(reactionMap.values());
  }
}
