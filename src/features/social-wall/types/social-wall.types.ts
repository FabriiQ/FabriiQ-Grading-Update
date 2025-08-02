/**
 * Social Wall Type Definitions
 */

import type { 
  SocialPost, 
  SocialComment, 
  SocialReaction, 
  SocialUserTag, 
  SocialModerationLog,
  User,
  PostContentType,
  PostType,
  PostStatus,
  CommentStatus,
  ReactionType,
  ModerationAction
} from '@prisma/client';

// ==================== CORE TYPES ====================

// User summary for UI display
export interface UserSummary {
  id: string;
  name: string | null;
  userType: string;
  avatar?: string;
}

// Post with all related data for UI
export interface PostWithEngagement extends SocialPost {
  author: UserSummary;
  reactions: ReactionSummary[];
  userReaction?: ReactionType;
  userTagged: boolean;
  taggedUsers: UserSummary[];
  taggedActivities?: ActivitySummary[];
  comments?: CommentWithReplies[];

  // Optimistic update properties (optional for UI state management)
  _optimistic?: boolean;
  _pending?: boolean;
  _error?: string;
}

// Activity summary for UI display
export interface ActivitySummary {
  id: string;
  title: string;
  type: 'ACTIVITY' | 'ASSESSMENT';
  description?: string;
  dueDate?: Date;
  status: 'DRAFT' | 'PUBLISHED' | 'COMPLETED';
  subjectId?: string; // Add subjectId for proper routing
  subjectName?: string;
  topicName?: string;
  participantCount?: number;
  totalParticipants?: number;
  bloomsLevel?: string;
  estimatedDuration?: number;
  maxScore?: number;
  averageScore?: number;
  completionRate?: number;
}

// Comment with nested replies
export interface CommentWithReplies extends SocialComment {
  author: UserSummary;
  reactions: ReactionSummary[];
  userReaction?: ReactionType;
  replies: CommentWithReplies[];
  taggedUsers: UserSummary[];
}

// Reaction summary for UI display
export interface ReactionSummary {
  type: ReactionType;
  count: number;
  users: UserSummary[]; // First few users for tooltip
}

// ==================== INPUT SCHEMAS ====================

// Create post input
export interface CreatePostInput {
  classId: string;
  content: string;
  contentType?: PostContentType;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
  postType?: PostType;
  taggedUserIds?: string[];
  taggedActivityIds?: string[];
}

// Update post input
export interface UpdatePostInput {
  content?: string;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
}

// Create comment input
export interface CreateCommentInput {
  postId: string;
  content: string;
  parentId?: string; // For threaded replies
  taggedUserIds?: string[];
}

// Update comment input
export interface UpdateCommentInput {
  content: string;
}

// Add reaction input
export interface AddReactionInput {
  postId?: string;
  commentId?: string;
  reactionType: ReactionType;
}

// Moderation input
export interface ModerationInput {
  postId?: string;
  commentId?: string;
  action: ModerationAction;
  reason?: string;
  notes?: string;
}

// ==================== QUERY FILTERS ====================

// Post query filters
export interface PostQueryFilter {
  classId: string;
  postType?: PostType;
  authorId?: string;
  status?: PostStatus;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  limit?: number;
  cursor?: string; // For pagination
}

// Comment query filters
export interface CommentQueryFilter {
  postId: string;
  parentId?: string;
  limit?: number;
  cursor?: string;
}

// User activity filters
export interface UserActivityFilter {
  userId: string;
  classId?: string;
  activityTypes?: ('post' | 'comment' | 'reaction')[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  limit?: number;
  cursor?: string;
}

// ==================== RESPONSE TYPES ====================

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  nextCursor?: string;
  hasMore: boolean;
  totalCount?: number;
}

// Post creation response
export interface CreatePostResponse {
  success: boolean;
  post: PostWithEngagement;
  notifications: NotificationSent[];
}

// Comment creation response
export interface CreateCommentResponse {
  success: boolean;
  comment: CommentWithReplies;
  notifications: NotificationSent[];
}

// Reaction response
export interface ReactionResponse {
  success: boolean;
  reaction: SocialReaction;
  newCounts: Record<ReactionType, number>;
}

// Moderation response
export interface ModerationResponse {
  success: boolean;
  moderationLog: SocialModerationLog;
  updatedContent?: PostWithEngagement | CommentWithReplies;
}

// ==================== ANALYTICS TYPES ====================

// Class engagement metrics
export interface ClassEngagementMetrics {
  classId: string;
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  activeUsers: number;
  engagementRate: number;
  topContributors: UserEngagementSummary[];
  activityTimeline: ActivityTimelinePoint[];
}

// User engagement summary
export interface UserEngagementSummary {
  user: UserSummary;
  postsCount: number;
  commentsCount: number;
  reactionsCount: number;
  engagementScore: number;
}

// Activity timeline point
export interface ActivityTimelinePoint {
  date: Date;
  postsCount: number;
  commentsCount: number;
  reactionsCount: number;
}

// ==================== NOTIFICATION TYPES ====================

// Notification sent
export interface NotificationSent {
  id: string;
  recipientId: string;
  type: string;
  title: string;
  content: string;
  actionUrl?: string;
}

// ==================== PERMISSION TYPES ====================

// Social wall permissions
export interface SocialWallPermissions {
  canCreatePost: boolean;
  canCreateAchievementPost: boolean;
  canComment: boolean;
  canReact: boolean;
  canTagUsers: boolean;
  canModerate: boolean;
  canViewModerationLogs: boolean;
}

// ==================== VALIDATION SCHEMAS ====================

// Content validation rules
export interface ContentValidationRules {
  maxPostLength: number;
  maxCommentLength: number;
  allowedMediaTypes: string[];
  maxMediaSize: number;
  maxMediaCount: number;
  profanityFilter: boolean;
  linkValidation: boolean;
}

// ==================== REAL-TIME EVENT TYPES ====================

// Real-time event data
export interface RealTimeEventData {
  eventType: string;
  classId: string;
  data: any;
  timestamp: Date;
  userId: string;
}

// ==================== MODERATION TYPES ====================

// Moderation queue item
export interface ModerationQueueItem {
  id: string;
  contentType: 'post' | 'comment';
  contentId: string;
  content: string;
  author: UserSummary;
  flaggedBy?: UserSummary;
  flagReason?: string;
  flaggedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

// Moderation statistics
export interface ModerationStats {
  classId: string;
  totalActions: number;
  actionsByType: Record<ModerationAction, number>;
  moderators: UserSummary[];
  recentActions: SocialModerationLog[];
}

// ==================== ARCHIVE TYPES ====================

// Archive query filters
export interface ArchiveQueryFilter {
  classId: string;
  entityType?: 'POST' | 'COMMENT';
  authorId?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  limit?: number;
  cursor?: string;
}

// Archived content
export interface ArchivedContent {
  id: string;
  originalId: string;
  entityType: 'POST' | 'COMMENT';
  archivedData: any;
  author: UserSummary;
  archivedAt: Date;
  originalCreatedAt: Date;
  archiveReason?: string;
}

// ==================== UTILITY TYPES ====================

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

// Batch operation result
export interface BatchOperationResult<T = any> {
  successful: T[];
  failed: {
    item: any;
    error: string;
  }[];
  totalProcessed: number;
  successCount: number;
  failureCount: number;
}

// Export all types
export type {
  SocialPost,
  SocialComment,
  SocialReaction,
  SocialUserTag,
  SocialModerationLog,
  PostContentType,
  PostType,
  PostStatus,
  CommentStatus,
  ReactionType,
  ModerationAction,
};
