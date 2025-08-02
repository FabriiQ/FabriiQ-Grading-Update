/**
 * Social Wall tRPC Router
 * API endpoints for Social Wall functionality
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { SocialWallService } from '@/features/social-wall/services/social-wall.service';
import { SupabaseStorageService } from '@/features/social-wall/services/supabase-storage.service';

// Helper function to determine moderation severity
function getModerationSeverity(action: string): 'low' | 'medium' | 'high' {
  switch (action) {
    case 'DELETE_POST':
    case 'DELETE_COMMENT':
    case 'RESTRICT_USER':
      return 'high';
    case 'HIDE_POST':
    case 'HIDE_COMMENT':
    case 'WARN_USER':
      return 'medium';
    case 'RESOLVE_REPORT':
    case 'DISMISS_REPORT':
      return 'low';
    default:
      return 'medium';
  }
}
import { logger } from '@/server/api/utils/logger';

// Input validation schemas
const createPostSchema = z.object({
  classId: z.string(),
  content: z.string().min(1).max(5000),
  contentType: z.enum(['TEXT', 'HTML', 'IMAGE', 'FILE', 'LINK', 'ACHIEVEMENT', 'MIXED']).default('TEXT'),
  mediaUrls: z.array(z.string().url()).optional(),
  metadata: z.object({
    isPinned: z.boolean().optional(),
    commentsDisabled: z.boolean().optional(),
    repliesDisabled: z.boolean().optional(),
  }).optional(),
  postType: z.enum(['REGULAR', 'ACHIEVEMENT', 'ANNOUNCEMENT', 'POLL']).default('REGULAR'),
  taggedUserIds: z.array(z.string()).optional(),
  taggedActivityIds: z.array(z.string()).optional(),
});

const updatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  contentType: z.enum(['TEXT', 'HTML', 'MARKDOWN']).optional(),
  mediaUrls: z.array(z.string().url()).optional(),
  metadata: z.record(z.any()).optional(),
});

const createCommentSchema = z.object({
  postId: z.string(),
  content: z.string().min(1).max(1000),
  parentId: z.string().optional(),
  taggedUserIds: z.array(z.string()).optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

const addReactionSchema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
  reactionType: z.enum(['LIKE', 'LOVE', 'CELEBRATE', 'LAUGH', 'SURPRISED', 'ANGRY', 'SAD']),
}).refine(data => data.postId || data.commentId, {
  message: "Either postId or commentId must be provided",
});

const moderationSchema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
  action: z.enum(['HIDE_POST', 'DELETE_POST', 'HIDE_COMMENT', 'DELETE_COMMENT', 'WARN_USER', 'RESTRICT_USER', 'RESTORE_POST', 'RESTORE_COMMENT']),
  reason: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => data.postId || data.commentId, {
  message: "Either postId or commentId must be provided",
});

const reportSchema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
  reason: z.enum(['INAPPROPRIATE_CONTENT', 'SPAM', 'HARASSMENT', 'BULLYING', 'HATE_SPEECH', 'VIOLENCE', 'MISINFORMATION', 'COPYRIGHT_VIOLATION', 'PRIVACY_VIOLATION', 'OTHER']),
  description: z.string().optional(),
}).refine(data => data.postId || data.commentId, {
  message: "Either postId or commentId must be provided",
});

const getClassPostsSchema = z.object({
  classId: z.string(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
  filter: z.object({
    postType: z.enum(['REGULAR', 'ACHIEVEMENT', 'ANNOUNCEMENT', 'POLL']).optional(),
    authorId: z.string().optional(),
    dateRange: z.object({
      from: z.date().optional(),
      to: z.date().optional(),
    }).optional(),
  }).optional(),
});

const getPostCommentsSchema = z.object({
  postId: z.string(),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
  sortBy: z.enum(['newest', 'oldest', 'mostLiked']).default('newest'),
  maxDepth: z.number().min(1).max(10).default(5), // Allow configurable depth
  repliesLimit: z.number().min(1).max(20).default(10), // Limit replies per comment
});

export const socialWallRouter = createTRPCRouter({
  // ==================== POST OPERATIONS ====================

  createPost: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        logger.debug('createPost called', {
          hasSession: !!ctx.session,
          hasUser: !!ctx.session?.user,
          userId: ctx.session?.user?.id,
          userType: ctx.session?.user?.userType,
          classId: input.classId
        });

        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User session not found'
          });
        }

        const service = new SocialWallService(ctx.prisma);
        const result = await service.createPost(ctx.session.user.id, input);

        // TODO: Trigger real-time event
        // TODO: Send notifications

        logger.info('Post created via API', {
          postId: result.post.id,
          userId: ctx.session.user.id,
          classId: input.classId
        });

        return result;
      } catch (error) {
        logger.error('Error in createPost API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  updatePost: protectedProcedure
    .input(z.object({
      postId: z.string(),
      data: updatePostSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user owns the post or has moderation rights
        const post = await ctx.prisma.socialPost.findUnique({
          where: { id: input.postId },
          include: {
            class: true,
          },
        });

        if (!post) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found',
          });
        }

        const service = new SocialWallService(ctx.prisma);
        const permissions = await service.getUserPermissions(ctx.session.user.id, post.classId);

        if (post.authorId !== ctx.session.user.id && !permissions.canModerate) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit this post',
          });
        }

        const updatedPost = await ctx.prisma.socialPost.update({
          where: { id: input.postId },
          data: {
            content: input.data.content,
            contentType: input.data.contentType as any,
            mediaUrls: input.data.mediaUrls,
            metadata: input.data.metadata,
            updatedAt: new Date(),
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

        // TODO: Trigger real-time event

        logger.info('Post updated via API', { 
          postId: input.postId, 
          userId: ctx.session.user.id 
        });

        return {
          success: true,
          post: updatedPost,
        };
      } catch (error) {
        logger.error('Error in updatePost API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  deletePost: protectedProcedure
    .input(z.object({
      postId: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user owns the post or has moderation rights
        const post = await ctx.prisma.socialPost.findUnique({
          where: { id: input.postId },
          include: {
            class: true,
          },
        });

        if (!post) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found',
          });
        }

        const service = new SocialWallService(ctx.prisma);
        const permissions = await service.getUserPermissions(ctx.session.user.id, post.classId);

        if (post.authorId !== ctx.session.user.id && !permissions.canModerate) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete this post',
          });
        }

        // Soft delete the post
        await ctx.prisma.socialPost.update({
          where: { id: input.postId },
          data: {
            status: 'DELETED',
            deletedAt: new Date(),
          },
        });

        // Create moderation log if deleted by moderator
        if (post.authorId !== ctx.session.user.id) {
          await ctx.prisma.socialModerationLog.create({
            data: {
              action: 'DELETE_POST',
              reason: input.reason,
              moderatorId: ctx.session.user.id,
              postId: input.postId,
              targetUserId: post.authorId,
              classId: post.classId,
            },
          });
        }

        // TODO: Trigger real-time event

        logger.info('Post deleted via API', { 
          postId: input.postId, 
          userId: ctx.session.user.id,
          isModeration: post.authorId !== ctx.session.user.id
        });

        return {
          success: true,
        };
      } catch (error) {
        logger.error('Error in deletePost API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  getClassPosts: protectedProcedure
    .input(getClassPostsSchema)
    .query(async ({ ctx, input }) => {
      try {
        logger.debug('getClassPosts called', {
          hasSession: !!ctx.session,
          hasUser: !!ctx.session?.user,
          userId: ctx.session?.user?.id,
          userType: ctx.session?.user?.userType,
          classId: input.classId,
          sessionKeys: ctx.session ? Object.keys(ctx.session) : [],
          userKeys: ctx.session?.user ? Object.keys(ctx.session.user) : []
        });

        if (!ctx.session?.user?.id) {
          logger.error('No user session found in getClassPosts', {
            hasSession: !!ctx.session,
            hasUser: !!ctx.session?.user,
            sessionData: ctx.session ? JSON.stringify(ctx.session, null, 2) : 'null'
          });
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User session not found'
          });
        }

        const service = new SocialWallService(ctx.prisma);
        const result = await service.getClassPosts(ctx.session.user.id, {
          classId: input.classId,
          limit: input.limit,
          cursor: input.cursor,
          ...input.filter,
        });

        return result;
      } catch (error) {
        logger.error('Error in getClassPosts API', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 5).join('\n')
          } : error,
          userId: ctx.session?.user?.id || 'unknown',
          input,
          hasSession: !!ctx.session,
          hasUser: !!ctx.session?.user
        });
        throw error;
      }
    }),

  getPost: protectedProcedure
    .input(z.object({
      postId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const post = await ctx.prisma.socialPost.findUnique({
          where: { id: input.postId },
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
            class: true,
          },
        });

        if (!post) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found',
          });
        }

        // Check class access
        const service = new SocialWallService(ctx.prisma);
        const hasAccess = await service.checkClassAccess(ctx.session.user.id, post.classId);
        
        if (!hasAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this post',
          });
        }

        return post;
      } catch (error) {
        logger.error('Error in getPost API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  // ==================== COMMENT OPERATIONS ====================

  getPostComments: protectedProcedure
    .input(getPostCommentsSchema)
    .query(async ({ ctx, input }) => {
      try {
        // Get post to check class access
        const post = await ctx.prisma.socialPost.findUnique({
          where: { id: input.postId },
          select: { classId: true },
        });

        if (!post) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Post not found',
          });
        }

        // Check class access
        const service = new SocialWallService(ctx.prisma);
        const hasAccess = await service.checkClassAccess(ctx.session.user.id, post.classId);

        if (!hasAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this post',
          });
        }

        const limit = Math.min(input.limit || 20, 50);
        const maxDepth = Math.min(input.maxDepth || 5, 10);
        const repliesLimit = Math.min(input.repliesLimit || 10, 20);

        // Helper function to recursively fetch replies
        const fetchRepliesRecursively = async (parentId: string, currentDepth: number): Promise<any[]> => {
          if (currentDepth >= maxDepth) {
            return [];
          }

          const replies = await ctx.prisma.socialComment.findMany({
            where: {
              parentId,
              status: 'ACTIVE',
              deletedAt: null,
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
            orderBy: {
              createdAt: 'asc',
            },
            take: repliesLimit,
          });

          // Recursively fetch replies for each reply
          const repliesWithNested = await Promise.all(
            replies.map(async (reply) => ({
              ...reply,
              replies: await fetchRepliesRecursively(reply.id, currentDepth + 1),
            }))
          );

          return repliesWithNested;
        };

        // First, get only top-level comments (no parentId)
        const topLevelWhere: any = {
          postId: input.postId,
          status: 'ACTIVE',
          deletedAt: null,
          parentId: null, // Only top-level comments
        };

        if (input.cursor) {
          topLevelWhere.id = {
            lt: input.cursor,
          };
        }

        const comments = await ctx.prisma.socialComment.findMany({
          where: topLevelWhere,
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
            // Note: Replies will be fetched recursively after the main query
          },
          orderBy: input.sortBy === 'newest' ? { createdAt: 'desc' } :
                   input.sortBy === 'oldest' ? { createdAt: 'asc' } :
                   input.sortBy === 'mostLiked' ? { reactionCount: 'desc' } :
                   { createdAt: 'desc' },
          take: limit + 1,
        });

        // Fetch replies recursively for each top-level comment
        const commentsWithReplies = await Promise.all(
          comments.map(async (comment) => ({
            ...comment,
            replies: await fetchRepliesRecursively(comment.id, 0),
          }))
        );

        const hasMore = commentsWithReplies.length > limit;
        const items = hasMore ? commentsWithReplies.slice(0, -1) : commentsWithReplies;
        const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

        // Helper function to format comment recursively
        const formatComment = (comment: any): any => ({
          ...comment,
          author: {
            id: comment.author.id,
            name: comment.author.name,
            userType: comment.author.userType,
          },
          reactions: [],
          userReaction: comment.reactions.find((r: any) => r.userId === ctx.session.user.id)?.reactionType,
          replies: comment.replies ? comment.replies.map(formatComment) : [],
          taggedUsers: comment.userTags.map((tag: any) => ({
            id: tag.user.id,
            name: tag.user.name,
            userType: tag.user.userType,
          })),
        });

        // Format comments with nested replies
        const formattedComments = items.map(formatComment);

        return {
          items: formattedComments,
          nextCursor,
          hasMore,
        };
      } catch (error) {
        logger.error('Error in getPostComments API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  getClassPostsCount: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User session not found'
          });
        }

        const service = new SocialWallService(ctx.prisma);
        const count = await service.getClassPostsCount(ctx.session.user.id, input.classId);

        return { totalCount: count };
      } catch (error) {
        logger.error('Error in getClassPostsCount API', {
          error: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack?.split('\n').slice(0, 5).join('\n')
          } : error,
          classId: input.classId,
          userId: ctx.session?.user?.id
        });
        throw error;
      }
    }),

  createComment: protectedProcedure
    .input(createCommentSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const service = new SocialWallService(ctx.prisma);
        const result = await service.createComment(ctx.session.user.id, input);

        // TODO: Trigger real-time event
        // TODO: Send notifications

        logger.info('Comment created via API', { 
          commentId: result.comment.id, 
          userId: ctx.session.user.id, 
          postId: input.postId 
        });

        return result;
      } catch (error) {
        logger.error('Error in createComment API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  updateComment: protectedProcedure
    .input(z.object({
      commentId: z.string(),
      data: updateCommentSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user owns the comment or has moderation rights
        const comment = await ctx.prisma.socialComment.findUnique({
          where: { id: input.commentId },
          include: {
            post: {
              select: {
                classId: true,
              },
            },
          },
        });

        if (!comment) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Comment not found',
          });
        }

        const service = new SocialWallService(ctx.prisma);
        const permissions = await service.getUserPermissions(ctx.session.user.id, comment.post.classId);

        if (comment.authorId !== ctx.session.user.id && !permissions.canModerate) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to edit this comment',
          });
        }

        const updatedComment = await ctx.prisma.socialComment.update({
          where: { id: input.commentId },
          data: {
            ...input.data,
            updatedAt: new Date(),
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
          },
        });

        // TODO: Trigger real-time event

        logger.info('Comment updated via API', { 
          commentId: input.commentId, 
          userId: ctx.session.user.id 
        });

        return {
          success: true,
          comment: updatedComment,
        };
      } catch (error) {
        logger.error('Error in updateComment API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  // ==================== REACTION OPERATIONS ====================

  addReaction: protectedProcedure
    .input(addReactionSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the target (post or comment) to check class access
        let classId: string;
        
        if (input.postId) {
          const post = await ctx.prisma.socialPost.findUnique({
            where: { id: input.postId },
            select: { classId: true },
          });
          
          if (!post) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Post not found',
            });
          }
          
          classId = post.classId;
        } else if (input.commentId) {
          const comment = await ctx.prisma.socialComment.findUnique({
            where: { id: input.commentId },
            include: {
              post: {
                select: { classId: true },
              },
            },
          });
          
          if (!comment) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Comment not found',
            });
          }
          
          classId = comment.post.classId;
        } else {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Either postId or commentId must be provided',
          });
        }

        // Check permissions
        const service = new SocialWallService(ctx.prisma);
        const permissions = await service.getUserPermissions(ctx.session.user.id, classId);
        
        if (!permissions.canReact) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to react',
          });
        }

        // Upsert reaction (replace existing if different type)
        const reaction = await ctx.prisma.socialReaction.upsert({
          where: input.postId 
            ? { userId_postId: { userId: ctx.session.user.id, postId: input.postId } }
            : { userId_commentId: { userId: ctx.session.user.id, commentId: input.commentId! } },
          update: {
            reactionType: input.reactionType,
            updatedAt: new Date(),
          },
          create: {
            userId: ctx.session.user.id,
            postId: input.postId,
            commentId: input.commentId,
            reactionType: input.reactionType,
          },
        });

        // Update reaction count
        if (input.postId) {
          const reactionCounts = await ctx.prisma.socialReaction.groupBy({
            by: ['reactionType'],
            where: { postId: input.postId },
            _count: { reactionType: true },
          });

          await ctx.prisma.socialPost.update({
            where: { id: input.postId },
            data: {
              reactionCount: reactionCounts.reduce((sum, group) => sum + group._count.reactionType, 0),
            },
          });
        } else if (input.commentId) {
          const reactionCounts = await ctx.prisma.socialReaction.groupBy({
            by: ['reactionType'],
            where: { commentId: input.commentId },
            _count: { reactionType: true },
          });

          await ctx.prisma.socialComment.update({
            where: { id: input.commentId },
            data: {
              reactionCount: reactionCounts.reduce((sum, group) => sum + group._count.reactionType, 0),
            },
          });
        }

        // TODO: Trigger real-time event

        logger.info('Reaction added via API', { 
          reactionId: reaction.id, 
          userId: ctx.session.user.id,
          postId: input.postId,
          commentId: input.commentId,
          reactionType: input.reactionType
        });

        return {
          success: true,
          reaction,
        };
      } catch (error) {
        logger.error('Error in addReaction API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  removeReaction: protectedProcedure
    .input(z.object({
      postId: z.string().optional(),
      commentId: z.string().optional(),
    }).refine(data => data.postId || data.commentId, {
      message: "Either postId or commentId must be provided",
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Delete the reaction
        const where = input.postId 
          ? { userId_postId: { userId: ctx.session.user.id, postId: input.postId } }
          : { userId_commentId: { userId: ctx.session.user.id, commentId: input.commentId! } };

        const deletedReaction = await ctx.prisma.socialReaction.delete({
          where,
        });

        // Update reaction count
        if (input.postId) {
          await ctx.prisma.socialPost.update({
            where: { id: input.postId },
            data: {
              reactionCount: {
                decrement: 1,
              },
            },
          });
        } else if (input.commentId) {
          await ctx.prisma.socialComment.update({
            where: { id: input.commentId },
            data: {
              reactionCount: {
                decrement: 1,
              },
            },
          });
        }

        // TODO: Trigger real-time event

        logger.info('Reaction removed via API', { 
          userId: ctx.session.user.id,
          postId: input.postId,
          commentId: input.commentId
        });

        return {
          success: true,
        };
      } catch (error) {
        logger.error('Error in removeReaction API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  // ==================== REPORT OPERATIONS ====================

  createReport: protectedProcedure
    .input(reportSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the target (post or comment) to check class access and get class ID
        let classId: string;
        let targetAuthorId: string;

        if (input.postId) {
          const post = await ctx.prisma.socialPost.findUnique({
            where: { id: input.postId },
            select: { classId: true, authorId: true },
          });

          if (!post) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Post not found',
            });
          }

          classId = post.classId;
          targetAuthorId = post.authorId;
        } else if (input.commentId) {
          const comment = await ctx.prisma.socialComment.findUnique({
            where: { id: input.commentId },
            include: {
              post: {
                select: { classId: true },
              },
            },
          });

          if (!comment) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: 'Comment not found',
            });
          }

          classId = comment.post.classId;
          targetAuthorId = comment.authorId;
        } else {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Either postId or commentId must be provided',
          });
        }

        // Check if user has access to the class
        const service = new SocialWallService(ctx.prisma);
        const hasAccess = await service.checkClassAccess(ctx.session.user.id, classId);

        if (!hasAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to report content in this class',
          });
        }

        // Prevent users from reporting their own content
        if (targetAuthorId === ctx.session.user.id) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You cannot report your own content',
          });
        }

        // Check if user has already reported this content
        const existingReport = await ctx.prisma.socialReport.findFirst({
          where: {
            reporterId: ctx.session.user.id,
            ...(input.postId ? { postId: input.postId } : { commentId: input.commentId }),
          },
        });

        if (existingReport) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You have already reported this content',
          });
        }

        // Create the report
        const report = await ctx.prisma.socialReport.create({
          data: {
            reason: input.reason,
            description: input.description,
            reporterId: ctx.session.user.id,
            postId: input.postId,
            commentId: input.commentId,
            classId,
          },
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                userType: true,
              },
            },
            post: input.postId ? {
              select: {
                id: true,
                content: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            } : undefined,
            comment: input.commentId ? {
              select: {
                id: true,
                content: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            } : undefined,
          },
        });

        // TODO: Trigger real-time event for moderators
        // TODO: Send notification to moderators

        logger.info('Content reported via API', {
          reportId: report.id,
          reporterId: ctx.session.user.id,
          postId: input.postId,
          commentId: input.commentId,
          reason: input.reason,
          classId
        });

        return {
          success: true,
          report,
        };
      } catch (error) {
        logger.error('Error in createReport API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  getReports: protectedProcedure
    .input(z.object({
      classId: z.string(),
      status: z.enum(['PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ESCALATED']).optional(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Check if user has moderation permissions for this class
        const service = new SocialWallService(ctx.prisma);
        const permissions = await service.getUserPermissions(ctx.session.user.id, input.classId);

        if (!permissions.canModerate) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to view reports',
          });
        }

        const where: any = {
          classId: input.classId,
        };

        if (input.status) {
          where.status = input.status;
        }

        if (input.cursor) {
          where.id = {
            lt: input.cursor,
          };
        }

        const reports = await ctx.prisma.socialReport.findMany({
          where,
          include: {
            reporter: {
              select: {
                id: true,
                name: true,
                userType: true,
              },
            },
            post: {
              select: {
                id: true,
                content: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                    userType: true,
                  },
                },
              },
            },
            comment: {
              select: {
                id: true,
                content: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                    userType: true,
                  },
                },
              },
            },
            moderator: {
              select: {
                id: true,
                name: true,
                userType: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input.limit + 1,
        });

        const hasMore = reports.length > input.limit;
        const items = hasMore ? reports.slice(0, -1) : reports;
        const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

        return {
          items,
          nextCursor,
          hasMore,
        };
      } catch (error) {
        logger.error('Error in getReports API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  getClassUsers: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Check if user has access to the class
        const service = new SocialWallService(ctx.prisma);
        const hasAccess = await service.checkClassAccess(ctx.session.user.id, input.classId);

        if (!hasAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have access to this class',
          });
        }

        // Get class enrollments (students)
        const enrollments = await ctx.prisma.studentEnrollment.findMany({
          where: {
            classId: input.classId,
            status: 'ACTIVE',
          },
          include: {
            student: {
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

        // Get class teachers
        const classData = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {
            classTeacher: {
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

        // Get teacher assignments for this class
        const teacherAssignments = await ctx.prisma.teacherAssignment.findMany({
          where: {
            classId: input.classId,
            status: 'ACTIVE',
          },
          include: {
            teacher: {
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

        // Combine all users
        const users: Array<{
          id: string;
          name: string;
          userType: string;
        }> = [];

        // Add students
        enrollments.forEach(enrollment => {
          if (enrollment.student?.user) {
            users.push({
              id: enrollment.student.user.id,
              name: enrollment.student.user.name || 'Unknown Student',
              userType: enrollment.student.user.userType,
            });
          }
        });

        // Add class teacher
        if (classData?.classTeacher?.user) {
          users.push({
            id: classData.classTeacher.user.id,
            name: classData.classTeacher.user.name || 'Unknown Teacher',
            userType: classData.classTeacher.user.userType,
          });
        }

        // Add assigned teachers
        teacherAssignments.forEach(assignment => {
          if (assignment.teacher?.user && !users.find(u => u.id === assignment.teacher.user.id)) {
            users.push({
              id: assignment.teacher.user.id,
              name: assignment.teacher.user.name || 'Unknown Teacher',
              userType: assignment.teacher.user.userType,
            });
          }
        });

        // Remove duplicates and sort
        const uniqueUsers = users.filter((user, index, self) =>
          index === self.findIndex(u => u.id === user.id)
        ).sort((a, b) => {
          // Sort teachers first, then students
          if (a.userType === 'TEACHER' && b.userType !== 'TEACHER') return -1;
          if (a.userType !== 'TEACHER' && b.userType === 'TEACHER') return 1;
          return (a.name || '').localeCompare(b.name || '');
        });

        return uniqueUsers;
      } catch (error) {
        logger.error('Error in getClassUsers API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  moderateReport: protectedProcedure
    .input(z.object({
      reportId: z.string(),
      action: z.enum(['RESOLVE_REPORT', 'DISMISS_REPORT', 'ESCALATE_REPORT', 'HIDE_POST', 'DELETE_POST', 'HIDE_COMMENT', 'DELETE_COMMENT', 'WARN_USER']),
      reason: z.string().optional(),
      postId: z.string().optional(),
      commentId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get the report to check permissions
        const report = await ctx.prisma.socialReport.findUnique({
          where: { id: input.reportId },
          include: {
            class: true,
            post: {
              include: {
                author: true,
              },
            },
            comment: {
              include: {
                author: true,
              },
            },
          },
        });

        if (!report) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Report not found',
          });
        }

        // Check if user has moderation permissions
        const service = new SocialWallService(ctx.prisma);
        const permissions = await service.getUserPermissions(ctx.session.user.id, report.classId);

        if (!permissions.canModerate) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to moderate reports',
          });
        }

        // Update report status based on action
        let newStatus: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED' = 'RESOLVED';

        switch (input.action) {
          case 'DISMISS_REPORT':
            newStatus = 'DISMISSED';
            break;
          case 'ESCALATE_REPORT':
            newStatus = 'ESCALATED';
            break;
          case 'RESOLVE_REPORT':
            newStatus = 'RESOLVED';
            break;
          default:
            newStatus = 'RESOLVED';
        }

        // Perform the moderation action
        const moderationPromises: Promise<any>[] = [];

        // Update the report
        moderationPromises.push(
          ctx.prisma.socialReport.update({
            where: { id: input.reportId },
            data: {
              status: newStatus,
              moderatorId: ctx.session.user.id,
              moderationNotes: input.reason,
              resolvedAt: new Date(),
            },
          })
        );

        // Perform content actions
        if (input.action === 'HIDE_POST' && report.postId) {
          moderationPromises.push(
            ctx.prisma.socialPost.update({
              where: { id: report.postId },
              data: { status: 'HIDDEN' },
            })
          );
        }

        if (input.action === 'DELETE_POST' && report.postId) {
          moderationPromises.push(
            ctx.prisma.socialPost.update({
              where: { id: report.postId },
              data: { status: 'DELETED' },
            })
          );
        }

        if (input.action === 'HIDE_COMMENT' && report.commentId) {
          moderationPromises.push(
            ctx.prisma.socialComment.update({
              where: { id: report.commentId },
              data: { status: 'HIDDEN' },
            })
          );
        }

        if (input.action === 'DELETE_COMMENT' && report.commentId) {
          moderationPromises.push(
            ctx.prisma.socialComment.update({
              where: { id: report.commentId },
              data: { status: 'DELETED' },
            })
          );
        }

        // Create moderation log
        const moderationLog = await ctx.prisma.socialModerationLog.create({
          data: {
            action: input.action as any,
            reason: input.reason,
            notes: `Report moderation: ${input.action}`,
            moderatorId: ctx.session.user.id,
            classId: report.classId,
            postId: report.postId,
            commentId: report.commentId,
            targetUserId: report.post?.authorId || report.comment?.authorId,
          },
        });

        moderationPromises.push(Promise.resolve(moderationLog));

        // Execute all actions
        await Promise.all(moderationPromises);

        // Send real-time notifications and create student feedback
        const ModerationNotificationService = (await import('@/features/social-wall/services/moderation-notification.service')).ModerationNotificationService;
        const StudentFeedbackService = (await import('@/features/social-wall/services/student-feedback.service')).default;

        const notificationService = new ModerationNotificationService(ctx.prisma);
        const feedbackService = new StudentFeedbackService(ctx.prisma);

        // Notify content author about moderation action and create feedback
        if (report.post?.authorId || report.comment?.authorId) {
          const authorId = report.post?.authorId || report.comment?.authorId!;
          const contentType = report.post ? 'post' : 'comment';
          const contentId = report.postId || report.commentId!;

          // Send notification
          await notificationService.sendModerationNotification({
            actionType: input.action as any,
            contentId,
            contentType,
            moderatorId: ctx.session.user.id,
            authorId,
            classId: report.classId,
            reason: input.reason,
            isPubliclyHidden: ['HIDE_POST', 'HIDE_COMMENT'].includes(input.action),
          });

          // Create student feedback entry
          await feedbackService.createModerationFeedback({
            studentId: authorId,
            teacherId: ctx.session.user.id,
            classId: report.classId,
            actionType: input.action as any,
            contentType,
            contentId,
            reason: input.reason || 'Community guidelines violation',
            notes: undefined, // Notes not available in current input schema
            severity: getModerationSeverity(input.action),
            isPubliclyHidden: ['HIDE_POST', 'HIDE_COMMENT'].includes(input.action),
          });

          // Send warning notification if action is WARN_USER
          if (input.action === 'WARN_USER') {
            const warningCount = await notificationService.getUserWarningCount(authorId, report.classId);
            await notificationService.sendWarningNotification({
              userId: authorId,
              moderatorId: ctx.session.user.id,
              classId: report.classId,
              reason: input.reason || 'Community guidelines violation',
              warningCount: warningCount + 1,
              maxWarnings: 3,
            });
          }

          // Check if student needs intervention
          const interventionCheck = await feedbackService.checkForInterventionNeeded(authorId, report.classId);
          if (interventionCheck.needsIntervention) {
            logger.info('Student intervention needed', {
              studentId: authorId,
              classId: report.classId,
              reason: interventionCheck.reason,
              severity: interventionCheck.severity,
            });

            // TODO: Notify coordinators/administrators about intervention need
          }
        }

        // Broadcast real-time event
        // TODO: Implement socket.io broadcast
        // socketService.broadcastToClass(report.classId, 'moderation:action_taken', {
        //   reportId: input.reportId,
        //   action: input.action,
        //   moderatorId: ctx.session.user.id,
        //   timestamp: new Date(),
        // });

        logger.info('Report moderated successfully', {
          reportId: input.reportId,
          action: input.action,
          moderatorId: ctx.session.user.id,
          classId: report.classId,
        });

        return {
          success: true,
          action: input.action,
          status: newStatus,
          moderationLog,
        };
      } catch (error) {
        logger.error('Error in moderateReport API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  // ==================== FILE UPLOAD OPERATIONS ====================

  uploadFile: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64 encoded file data
      mimeType: z.string(),
      folder: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const storageService = new SupabaseStorageService();

        // Convert base64 to buffer
        const buffer = Buffer.from(input.fileData, 'base64');

        // Upload to Supabase Storage
        const result = await storageService.uploadFile(buffer, input.fileName, {
          folder: input.folder || 'social-wall',
          allowedTypes: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'video/mp4',
            'video/webm',
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ],
          maxSize: 10 * 1024 * 1024, // 10MB
        });

        logger.info('File uploaded via API', {
          fileName: input.fileName,
          size: result.size,
          url: result.url,
          userId: ctx.session.user.id
        });

        return result;
      } catch (error) {
        logger.error('Error in uploadFile API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          fileName: input.fileName
        });
        throw error;
      }
    }),

  migrateFile: protectedProcedure
    .input(z.object({
      localUrl: z.string().url(),
      fileName: z.string(),
      folder: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Check if user has admin permissions for migration
        if (ctx.session.user.userType !== 'CAMPUS_ADMIN' && ctx.session.user.userType !== 'TEACHER') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to migrate files',
          });
        }

        const storageService = new SupabaseStorageService();

        // Migrate file from local storage to Supabase
        const result = await storageService.migrateFile(
          input.localUrl,
          input.fileName,
          {
            folder: input.folder || 'migrated',
          }
        );

        logger.info('File migrated via API', {
          localUrl: input.localUrl,
          newUrl: result.url,
          userId: ctx.session.user.id
        });

        return result;
      } catch (error) {
        logger.error('Error in migrateFile API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          localUrl: input.localUrl
        });
        throw error;
      }
    }),

  getModerationLogs: protectedProcedure
    .input(z.object({
      classId: z.string(),
      limit: z.number().min(1).max(50).default(20), // Changed from max(100) to max(50) to match other endpoints
      action: z.string().optional(),
      moderatorId: z.string().optional(),
      search: z.string().optional(),
      dateRange: z.object({
        start: z.date(),
        end: z.date(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Check permissions
        const service = new SocialWallService(ctx.prisma);
        const permissions = await service.getUserPermissions(ctx.session.user.id, input.classId);

        if (!permissions.canModerate) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to view moderation logs',
          });
        }

        const whereClause: any = {
          classId: input.classId,
        };

        if (input.action) {
          whereClause.action = input.action;
        }

        if (input.moderatorId) {
          whereClause.moderatorId = input.moderatorId;
        }

        if (input.dateRange) {
          whereClause.createdAt = {
            gte: input.dateRange.start,
            lte: input.dateRange.end,
          };
        }

        if (input.search) {
          whereClause.OR = [
            { reason: { contains: input.search, mode: 'insensitive' } },
            { notes: { contains: input.search, mode: 'insensitive' } },
            { moderator: { name: { contains: input.search, mode: 'insensitive' } } },
            { targetUser: { name: { contains: input.search, mode: 'insensitive' } } },
          ];
        }

        const logs = await ctx.prisma.socialModerationLog.findMany({
          where: whereClause,
          include: {
            moderator: {
              select: {
                id: true,
                name: true,
                userType: true,
              },
            },
            targetUser: {
              select: {
                id: true,
                name: true,
              },
            },
            post: {
              select: {
                id: true,
                content: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            comment: {
              select: {
                id: true,
                content: true,
                author: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: input.limit,
        });

        return {
          logs,
          total: logs.length,
        };
      } catch (error) {
        logger.error('Error in getModerationLogs API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),

  getClassModerators: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get class data
        const classData = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          select: {
            id: true,
            campusId: true,
          },
        });

        if (!classData) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Class not found',
          });
        }

        // Get teachers assigned to this class through TeacherAssignment
        const teacherAssignments = await ctx.prisma.teacherAssignment.findMany({
          where: {
            classId: input.classId,
            status: 'ACTIVE',
          },
          include: {
            teacher: {
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

        const teachers = teacherAssignments.map(ta => ta.teacher.user);

        // Get coordinators for the campus through UserCampusAccess
        const coordinatorAccess = await ctx.prisma.userCampusAccess.findMany({
          where: {
            campusId: classData.campusId,
            roleType: 'COORDINATOR',
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                userType: true,
              },
            },
          },
        });

        const coordinators = coordinatorAccess.map(ca => ca.user);

        // Combine teachers and coordinators
        const moderators = [
          ...teachers,
          ...coordinators,
        ];

        // Remove duplicates
        const uniqueModerators = moderators.filter((moderator, index, self) =>
          index === self.findIndex(m => m.id === moderator.id)
        );

        return {
          moderators: uniqueModerators,
        };
      } catch (error) {
        logger.error('Error in getClassModerators API', {
          error,
          userId: ctx.session?.user?.id || 'unknown',
          input
        });
        throw error;
      }
    }),
});
