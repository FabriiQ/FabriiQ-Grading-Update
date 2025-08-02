/**
 * Notification Types and Interfaces
 */

export enum NotificationType {
  SOCIAL_POST = 'SOCIAL_POST',
  SOCIAL_COMMENT = 'SOCIAL_COMMENT',
  SOCIAL_REACTION = 'SOCIAL_REACTION',
  SOCIAL_MENTION = 'SOCIAL_MENTION',
  ASSIGNMENT_DUE = 'ASSIGNMENT_DUE',
  GRADE_POSTED = 'GRADE_POSTED',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  SYSTEM = 'SYSTEM'
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  userId: string;
  classId?: string;
  relatedId?: string; // ID of the related entity (post, comment, etc.)
  relatedType?: string; // Type of the related entity
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  socialWallNotifications: boolean;
  assignmentNotifications: boolean;
  gradeNotifications: boolean;
  announcementNotifications: boolean;
  mentionNotifications: boolean;
  reactionNotifications: boolean;
  commentNotifications: boolean;
}

export interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  priority?: NotificationPriority;
  userId: string;
  classId?: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilters {
  type?: NotificationType;
  priority?: NotificationPriority;
  isRead?: boolean;
  classId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byPriority: Record<NotificationPriority, number>;
}
