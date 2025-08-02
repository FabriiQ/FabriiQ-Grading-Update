/**
 * Moderation Notification Service
 * Handles real-time notifications for content moderation actions
 */

import { PrismaClient, NotificationType } from '@prisma/client';

// Simple logger implementation
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta),
};

// Simple notification service implementation
class NotificationService {
  constructor(private prisma: PrismaClient) {}

  async createNotification(data: {
    title: string;
    content: string;
    type: string;
    senderId: string;
    recipientIds: string[];
    metadata?: any;
    actionUrl?: string;
  }) {
    // Create notifications for each recipient
    const notifications = await Promise.all(
      data.recipientIds.map(recipientId =>
        this.prisma.notification.create({
          data: {
            title: data.title,
            content: data.content,
            type: data.type as NotificationType,
            userId: recipientId,
            metadata: data.metadata,
            actionUrl: data.actionUrl,
          },
        })
      )
    );
    return notifications;
  }
}

export interface ModerationNotificationData {
  actionType: 'HIDE_POST' | 'DELETE_POST' | 'HIDE_COMMENT' | 'DELETE_COMMENT' | 'WARN_USER' | 'RESTRICT_USER';
  contentId: string;
  contentType: 'post' | 'comment';
  moderatorId: string;
  authorId: string;
  classId: string;
  reason?: string;
  notes?: string;
  isPubliclyHidden?: boolean;
}

export class ModerationNotificationService {
  private prisma: PrismaClient;
  private notificationService: NotificationService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.notificationService = new NotificationService(prisma);
  }

  /**
   * Send notification for moderation action to content author
   */
  async sendModerationNotification(data: ModerationNotificationData): Promise<void> {
    try {
      const { title, content } = this.generateNotificationContent(data);

      await this.notificationService.createNotification({
        title,
        content,
        type: 'SOCIAL_WALL_MODERATION',
        senderId: data.moderatorId,
        recipientIds: [data.authorId],
        metadata: {
          actionType: data.actionType,
          contentId: data.contentId,
          contentType: data.contentType,
          moderatorId: data.moderatorId,
          reason: data.reason,
          isPubliclyHidden: data.isPubliclyHidden,
          classId: data.classId,
          timestamp: new Date().toISOString(),
        },
        actionUrl: `/teacher/classes/${data.classId}/social-wall`,
      });

      logger.info('Moderation notification sent', {
        actionType: data.actionType,
        contentId: data.contentId,
        authorId: data.authorId,
        moderatorId: data.moderatorId,
      });
    } catch (error) {
      logger.error('Failed to send moderation notification', {
        error,
        data,
      });
      throw error;
    }
  }

  /**
   * Send warning notification to user
   */
  async sendWarningNotification(data: {
    userId: string;
    moderatorId: string;
    classId: string;
    reason: string;
    warningCount: number;
    maxWarnings: number;
  }): Promise<void> {
    try {
      const title = `⚠️ Content Warning - Warning ${data.warningCount}/${data.maxWarnings}`;
      const content = `Your content has been flagged for violating community guidelines. Reason: ${data.reason}. Please review our community standards to avoid further warnings.`;

      await this.notificationService.createNotification({
        title,
        content,
        type: 'SOCIAL_WALL_WARNING',
        senderId: data.moderatorId,
        recipientIds: [data.userId],
        metadata: {
          actionType: 'WARN_USER',
          moderatorId: data.moderatorId,
          reason: data.reason,
          warningCount: data.warningCount,
          maxWarnings: data.maxWarnings,
          classId: data.classId,
          timestamp: new Date().toISOString(),
        },
        actionUrl: `/student/classes/${data.classId}/social-wall`,
      });

      logger.info('Warning notification sent', {
        userId: data.userId,
        moderatorId: data.moderatorId,
        warningCount: data.warningCount,
      });
    } catch (error) {
      logger.error('Failed to send warning notification', {
        error,
        data,
      });
      throw error;
    }
  }

  /**
   * Send notification to moderators about new reports
   */
  async sendReportNotification(data: {
    reportId: string;
    reporterId: string;
    contentId: string;
    contentType: 'post' | 'comment';
    classId: string;
    reason: string;
    moderatorIds: string[];
  }): Promise<void> {
    try {
      const title = `🚨 New Content Report`;
      const content = `A ${data.contentType} has been reported for: ${data.reason}. Please review and take appropriate action.`;

      await this.notificationService.createNotification({
        title,
        content,
        type: 'SOCIAL_WALL_REPORT',
        senderId: data.reporterId,
        recipientIds: data.moderatorIds,
        metadata: {
          reportId: data.reportId,
          contentId: data.contentId,
          contentType: data.contentType,
          reason: data.reason,
          classId: data.classId,
          timestamp: new Date().toISOString(),
        },
        actionUrl: `/teacher/classes/${data.classId}/social-wall/moderation`,
      });

      logger.info('Report notification sent to moderators', {
        reportId: data.reportId,
        moderatorIds: data.moderatorIds,
        contentType: data.contentType,
      });
    } catch (error) {
      logger.error('Failed to send report notification', {
        error,
        data,
      });
      throw error;
    }
  }

  /**
   * Generate notification content based on moderation action
   */
  private generateNotificationContent(data: ModerationNotificationData): { title: string; content: string } {
    const contentTypeText = data.contentType === 'post' ? 'post' : 'comment';
    
    switch (data.actionType) {
      case 'HIDE_POST':
      case 'HIDE_COMMENT':
        return {
          title: `📝 Your ${contentTypeText} has been hidden`,
          content: data.isPubliclyHidden 
            ? `Your ${contentTypeText} has been hidden from public view due to: ${data.reason || 'community guidelines violation'}. You can still see it, but others cannot.`
            : `Your ${contentTypeText} has been flagged and is under review. Reason: ${data.reason || 'community guidelines violation'}.`
        };

      case 'DELETE_POST':
      case 'DELETE_COMMENT':
        return {
          title: `🗑️ Your ${contentTypeText} has been removed`,
          content: `Your ${contentTypeText} has been permanently removed due to: ${data.reason || 'community guidelines violation'}. Please review our community standards.`
        };

      case 'WARN_USER':
        return {
          title: `⚠️ Content Warning Issued`,
          content: `You have received a warning for your ${contentTypeText}. Reason: ${data.reason || 'community guidelines violation'}. Please be mindful of our community standards.`
        };

      case 'RESTRICT_USER':
        return {
          title: `🚫 Account Restrictions Applied`,
          content: `Your account has been restricted due to repeated violations. Reason: ${data.reason || 'multiple community guidelines violations'}. Contact your teacher for more information.`
        };

      default:
        return {
          title: `📋 Moderation Action Taken`,
          content: `A moderation action has been taken on your ${contentTypeText}. Please review our community guidelines.`
        };
    }
  }

  /**
   * Get user's warning count for a specific class
   */
  async getUserWarningCount(userId: string, classId: string): Promise<number> {
    try {
      const warningCount = await this.prisma.socialModerationLog.count({
        where: {
          targetUserId: userId,
          classId: classId,
          action: 'WARN_USER',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      });

      return warningCount;
    } catch (error) {
      logger.error('Failed to get user warning count', {
        error,
        userId,
        classId,
      });
      return 0;
    }
  }

  /**
   * Check if user should be automatically restricted
   */
  async checkAutoRestriction(userId: string, classId: string, maxWarnings: number = 3): Promise<boolean> {
    const warningCount = await this.getUserWarningCount(userId, classId);
    return warningCount >= maxWarnings;
  }
}
