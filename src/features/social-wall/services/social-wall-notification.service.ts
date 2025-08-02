/**
 * Social Wall Notification Service
 * Handles notification integration for Social Wall events
 */

import { PrismaClient } from '@prisma/client';
import { NotificationService, NotificationDeliveryType, NotificationStatus } from '@/server/api/services/notification.service';
import { logger } from '@/server/api/utils/logger';

export interface SocialWallNotificationConfig {
  enablePostNotifications: boolean;
  enableCommentNotifications: boolean;
  enableReactionNotifications: boolean;
  enableMentionNotifications: boolean;
  enableModerationNotifications: boolean;
}

export class SocialWallNotificationService {
  private notificationService: NotificationService;
  private config: SocialWallNotificationConfig;

  constructor(
    private prisma: PrismaClient,
    config?: Partial<SocialWallNotificationConfig>
  ) {
    this.notificationService = new NotificationService({ prisma });
    this.config = {
      enablePostNotifications: true,
      enableCommentNotifications: true,
      enableReactionNotifications: false, // Usually too noisy
      enableMentionNotifications: true,
      enableModerationNotifications: true,
      ...config,
    };
  }

  /**
   * Send notification when a new post is created
   */
  async notifyNewPost(postId: string, authorId: string, classId: string) {
    if (!this.config.enablePostNotifications) return;

    try {
      // Get post details
      const post = await this.prisma.socialPost.findUnique({
        where: { id: postId },
        include: {
          author: { select: { name: true } },
          class: { select: { name: true } },
        },
      });

      if (!post) return;

      // Get class members (excluding the author)
      const classMembers = await this.getClassMembers(classId, authorId);

      if (classMembers.length === 0) return;

      // Create notification content based on post type
      let title = '';
      let content = '';

      switch (post.postType) {
        case 'ANNOUNCEMENT':
          title = `📢 New Announcement in ${post.class.name}`;
          content = `${post.author.name} posted an announcement: "${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`;
          break;
        case 'ACHIEVEMENT':
          title = `🏆 Achievement Shared in ${post.class.name}`;
          content = `${post.author.name} shared an achievement: "${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`;
          break;
        default:
          title = `💬 New Post in ${post.class.name}`;
          content = `${post.author.name} posted: "${post.content.substring(0, 100)}${post.content.length > 100 ? '...' : ''}"`;
      }

      // Send notification
      await this.notificationService.createNotification({
        title,
        content,
        type: 'SOCIAL_WALL_POST',
        deliveryType: NotificationDeliveryType.IN_APP,
        status: NotificationStatus.PUBLISHED,
        senderId: authorId,
        recipientIds: classMembers,
        metadata: {
          postId,
          classId,
          postType: post.postType,
          actionUrl: `/student/class/${classId}/social-wall`,
        },
      });

      logger.info('New post notification sent', { postId, recipientCount: classMembers.length });
    } catch (error) {
      logger.error('Failed to send new post notification', { error, postId });
    }
  }

  /**
   * Send notification when someone comments on a post
   */
  async notifyNewComment(commentId: string, authorId: string, postId: string) {
    if (!this.config.enableCommentNotifications) return;

    try {
      // Get comment and post details
      const comment = await this.prisma.socialComment.findUnique({
        where: { id: commentId },
        include: {
          author: { select: { name: true } },
          post: {
            include: {
              author: { select: { id: true, name: true } },
              class: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!comment || !comment.post) return;

      // Notify post author (if not the commenter)
      const recipients: string[] = [];
      if (comment.post.author.id !== authorId) {
        recipients.push(comment.post.author.id);
      }

      // Get other commenters on this post (excluding current commenter and post author)
      const otherCommenters = await this.prisma.socialComment.findMany({
        where: {
          postId,
          authorId: { notIn: [authorId, comment.post.author.id] },
          status: 'ACTIVE',
        },
        select: { authorId: true },
        distinct: ['authorId'],
      });

      recipients.push(...otherCommenters.map(c => c.authorId));

      if (recipients.length === 0) return;

      const title = `💬 New Comment in ${comment.post.class.name}`;
      const content = `${comment.author.name} commented: "${comment.content.substring(0, 100)}${comment.content.length > 100 ? '...' : ''}"`;

      // Send notifications with appropriate action URLs based on user type
      for (const recipientId of recipients) {
        // Get recipient user type
        const recipient = await this.prisma.user.findUnique({
          where: { id: recipientId },
          select: { userType: true }
        });

        if (recipient) {
          const actionUrl = this.getActionUrlForUser(recipient.userType, comment.post.class.id);

          await this.notificationService.createNotification({
            title,
            content,
            type: 'SOCIAL_WALL_COMMENT',
            deliveryType: NotificationDeliveryType.IN_APP,
            status: NotificationStatus.PUBLISHED,
            senderId: authorId,
            recipientIds: [recipientId],
            metadata: {
              commentId,
              postId,
              classId: comment.post.class.id,
              actionUrl,
            },
          });
        }
      }

      logger.info('New comment notification sent', { commentId, recipientCount: recipients.length });
    } catch (error) {
      logger.error('Failed to send new comment notification', { error, commentId });
    }
  }

  /**
   * Send notification when someone reacts to a post
   */
  async notifyNewReaction(reactionId: string, userId: string, postId: string, reactionType: string) {
    if (!this.config.enableReactionNotifications) return;

    try {
      // Get reaction and post details
      const reaction = await this.prisma.socialReaction.findUnique({
        where: { id: reactionId },
        include: {
          user: { select: { name: true } },
          post: {
            include: {
              author: { select: { id: true, name: true } },
              class: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (!reaction || !reaction.post) return;

      // Only notify post author if they're not the one reacting
      if (reaction.post.author.id === userId) return;

      const reactionEmoji = this.getReactionEmoji(reactionType);
      const title = `${reactionEmoji} Reaction on Your Post`;
      const content = `${reaction.user.name} reacted to your post in ${reaction.post.class.name}`;

      // Get post author user type
      const postAuthor = await this.prisma.user.findUnique({
        where: { id: reaction.post.author.id },
        select: { userType: true }
      });

      if (postAuthor) {
        const actionUrl = this.getActionUrlForUser(postAuthor.userType, reaction.post.class.id);

        await this.notificationService.createNotification({
          title,
          content,
          type: 'SOCIAL_WALL_REACTION',
          deliveryType: NotificationDeliveryType.IN_APP,
          status: NotificationStatus.PUBLISHED,
          senderId: userId,
          recipientIds: [reaction.post.author.id],
          metadata: {
            reactionId,
            postId,
            reactionType,
            classId: reaction.post.class.id,
            actionUrl,
          },
        });
      }

      logger.info('New reaction notification sent', { reactionId, reactionType });
    } catch (error) {
      logger.error('Failed to send new reaction notification', { error, reactionId });
    }
  }

  /**
   * Send notification when someone is mentioned in a post or comment
   */
  async notifyMention(mentionId: string, mentionedUserId: string, authorId: string, contentType: 'post' | 'comment', contentId: string) {
    if (!this.config.enableMentionNotifications) return;

    try {
      // Get post details for mention context
      let classInfo: { id: string; name: string } | null = null;
      let authorName = 'Someone';

      if (contentType === 'post') {
        const post = await this.prisma.socialPost.findUnique({
          where: { id: contentId },
          include: {
            author: { select: { name: true } },
            class: { select: { id: true, name: true } },
          },
        });
        if (post) {
          classInfo = post.class;
          authorName = post.author.name || 'Someone';
        }
      } else {
        const comment = await this.prisma.socialComment.findUnique({
          where: { id: contentId },
          include: {
            author: { select: { name: true } },
            post: {
              include: {
                class: { select: { id: true, name: true } },
              },
            },
          },
        });
        if (comment?.post) {
          classInfo = comment.post.class;
          authorName = comment.author.name || 'Someone';
        }
      }

      if (!classInfo) return;

      const title = `@️⃣ You were mentioned in ${classInfo.name}`;
      const content = `${authorName} mentioned you in a ${contentType}`;

      // Get mentioned user type
      const mentionedUser = await this.prisma.user.findUnique({
        where: { id: mentionedUserId },
        select: { userType: true }
      });

      if (mentionedUser) {
        const actionUrl = this.getActionUrlForUser(mentionedUser.userType, classInfo.id);

        await this.notificationService.createNotification({
          title,
          content,
          type: 'SOCIAL_WALL_MENTION',
          deliveryType: NotificationDeliveryType.ALL, // Mentions are important
          status: NotificationStatus.PUBLISHED,
          senderId: authorId,
          recipientIds: [mentionedUserId],
          metadata: {
            mentionId,
            contentType,
            contentId,
            classId: classInfo.id,
            actionUrl,
          },
        });
      }

      logger.info('Mention notification sent', { mentionId, mentionedUserId });
    } catch (error) {
      logger.error('Failed to send mention notification', { error, mentionId });
    }
  }

  /**
   * Send notification for moderation actions
   */
  async notifyModerationAction(actionType: string, contentId: string, moderatorId: string, authorId: string, reason?: string) {
    if (!this.config.enableModerationNotifications) return;

    try {
      const moderator = await this.prisma.user.findUnique({
        where: { id: moderatorId },
        select: { name: true },
      });

      if (!moderator) return;

      let title = '';
      let content = '';

      switch (actionType) {
        case 'POST_HIDDEN':
          title = '🚫 Your post was hidden';
          content = `Your post was hidden by ${moderator.name}${reason ? `. Reason: ${reason}` : ''}`;
          break;
        case 'POST_DELETED':
          title = '🗑️ Your post was deleted';
          content = `Your post was deleted by ${moderator.name}${reason ? `. Reason: ${reason}` : ''}`;
          break;
        case 'COMMENT_HIDDEN':
          title = '🚫 Your comment was hidden';
          content = `Your comment was hidden by ${moderator.name}${reason ? `. Reason: ${reason}` : ''}`;
          break;
        case 'COMMENT_DELETED':
          title = '🗑️ Your comment was deleted';
          content = `Your comment was deleted by ${moderator.name}${reason ? `. Reason: ${reason}` : ''}`;
          break;
        default:
          return;
      }

      await this.notificationService.createNotification({
        title,
        content,
        type: 'SOCIAL_WALL_MODERATION',
        deliveryType: NotificationDeliveryType.ALL, // Moderation actions are important
        status: NotificationStatus.PUBLISHED,
        senderId: moderatorId,
        recipientIds: [authorId],
        metadata: {
          actionType,
          contentId,
          moderatorId,
          reason,
        },
      });

      logger.info('Moderation notification sent', { actionType, contentId, authorId });
    } catch (error) {
      logger.error('Failed to send moderation notification', { error, actionType, contentId });
    }
  }

  /**
   * Get class members excluding specified user
   */
  private async getClassMembers(classId: string, excludeUserId?: string): Promise<string[]> {
    const [students, teachers] = await Promise.all([
      // Get students
      this.prisma.studentEnrollment.findMany({
        where: {
          classId,
          status: 'ACTIVE',
          ...(excludeUserId && {
            student: { userId: { not: excludeUserId } },
          }),
        },
        include: { student: { select: { userId: true } } },
      }),
      // Get teachers
      this.prisma.teacherAssignment.findMany({
        where: {
          classId,
          status: 'ACTIVE',
          ...(excludeUserId && {
            teacher: { userId: { not: excludeUserId } },
          }),
        },
        include: { teacher: { select: { userId: true } } },
      }),
    ]);

    const userIds = [
      ...students.map(s => s.student.userId),
      ...teachers.map(t => t.teacher.userId),
    ];

    return userIds;
  }

  /**
   * Get emoji for reaction type
   */
  private getReactionEmoji(reactionType: string): string {
    const emojiMap: Record<string, string> = {
      LIKE: '👍',
      LOVE: '❤️',
      CELEBRATE: '🎉',
      LAUGH: '😂',
      SURPRISED: '😮',
      ANGRY: '😠',
      SAD: '😢',
    };

    return emojiMap[reactionType] || '👍';
  }

  /**
   * Get all members of a class with their user types
   */
  private async getClassMembersWithTypes(classId: string): Promise<Array<{ userId: string; userType: string }>> {
    const members: Array<{ userId: string; userType: string }> = [];

    // Get students
    const students = await this.prisma.studentEnrollment.findMany({
      where: {
        classId,
        status: 'ACTIVE',
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, userType: true } },
          },
        },
      },
    });

    members.push(...students.map(enrollment => ({
      userId: enrollment.student.user.id,
      userType: enrollment.student.user.userType
    })));

    // Get class teacher
    const classInfo = await this.prisma.class.findUnique({
      where: { id: classId },
      include: {
        classTeacher: {
          include: {
            user: { select: { id: true, userType: true } },
          },
        },
      },
    });

    if (classInfo?.classTeacher?.user.id) {
      members.push({
        userId: classInfo.classTeacher.user.id,
        userType: classInfo.classTeacher.user.userType
      });
    }

    // Get assigned teachers
    const teacherAssignments = await this.prisma.teacherAssignment.findMany({
      where: {
        classId,
        status: 'ACTIVE',
      },
      include: {
        teacher: {
          include: {
            user: { select: { id: true, userType: true } },
          },
        },
      },
    });

    members.push(...teacherAssignments.map(assignment => ({
      userId: assignment.teacher.user.id,
      userType: assignment.teacher.user.userType
    })));

    // Remove duplicates based on userId
    const uniqueMembers = members.filter((member, index, self) =>
      index === self.findIndex(m => m.userId === member.userId)
    );

    return uniqueMembers;
  }

  /**
   * Get appropriate action URL based on user type
   */
  private getActionUrlForUser(userType: string, classId: string): string {
    const isStudent = userType === 'STUDENT' || userType === 'CAMPUS_STUDENT';
    return isStudent
      ? `/student/class/${classId}/social-wall`
      : `/teacher/classes/${classId}/social-wall`;
  }
}
