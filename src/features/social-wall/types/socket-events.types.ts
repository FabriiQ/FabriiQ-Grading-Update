/**
 * Socket.IO Event Type Definitions for Social Wall
 */

import type { UserType } from '@prisma/client';

// User summary for socket events
export interface UserSummary {
  id: string;
  name: string;
  userType: UserType;
  avatar?: string;
}

// Base event interface
export interface BaseSocketEvent {
  type: string;
  classId: string;
  timestamp: Date;
}

// ==================== CLIENT TO SERVER EVENTS ====================

export interface ClientToServerEvents {
  // Connection management
  'join:class': (data: { classId: string }) => void;
  'leave:class': (data: { classId: string }) => void;
  
  // Real-time interactions
  'typing:start': (data: { postId?: string; commentId?: string }) => void;
  'typing:stop': (data: { postId?: string; commentId?: string }) => void;
  
  // Presence
  'user:active': () => void;
  'user:idle': () => void;
  
  // Content subscriptions
  'subscribe:post': (data: { postId: string }) => void;
  'unsubscribe:post': (data: { postId: string }) => void;
}

// ==================== SERVER TO CLIENT EVENTS ====================

export interface ServerToClientEvents {
  // Post events
  'post:created': (data: PostCreatedEvent) => void;
  'post:updated': (data: PostUpdatedEvent) => void;
  'post:deleted': (data: PostDeletedEvent) => void;
  'post:moderated': (data: PostModeratedEvent) => void;
  
  // Comment events
  'comment:created': (data: CommentCreatedEvent) => void;
  'comment:updated': (data: CommentUpdatedEvent) => void;
  'comment:deleted': (data: CommentDeletedEvent) => void;
  
  // Reaction events
  'reaction:added': (data: ReactionEvent) => void;
  'reaction:removed': (data: ReactionEvent) => void;
  'reaction:updated': (data: ReactionSummaryEvent) => void;
  
  // User interaction events
  'user:tagged': (data: UserTaggedEvent) => void;
  'user:typing': (data: TypingEvent) => void;
  'user:stopped_typing': (data: TypingEvent) => void;
  
  // Presence events
  'user:joined': (data: UserPresenceEvent) => void;
  'user:left': (data: UserPresenceEvent) => void;
  'user:status_changed': (data: UserStatusEvent) => void;
  
  // Moderation events
  'moderation:action': (data: ModerationEvent) => void;
  'content:flagged': (data: ContentFlaggedEvent) => void;
  
  // System events
  'notification:new': (data: NotificationEvent) => void;
  'error': (data: ErrorEvent) => void;
  'connection:status': (data: ConnectionStatusEvent) => void;
}

// ==================== INTER-SERVER EVENTS ====================

export interface InterServerEvents {
  ping: () => void;
}

// ==================== SOCKET DATA ====================

export interface SocketData {
  user: {
    id: string;
    name: string | null;
    userType: UserType;
  };
  userId: string;
  classId?: string;
}

// ==================== EVENT DATA STRUCTURES ====================

// Post Events
export interface PostCreatedEvent extends BaseSocketEvent {
  type: 'post:created';
  post: {
    id: string;
    content: string;
    contentType: string;
    mediaUrls?: string[];
    author: UserSummary;
    postType: string;
    taggedUsers: UserSummary[];
    createdAt: Date;
  };
  metadata: {
    isAnnouncement: boolean;
    priority: 'low' | 'medium' | 'high';
  };
}

export interface PostUpdatedEvent extends BaseSocketEvent {
  type: 'post:updated';
  postId: string;
  changes: {
    content?: string;
    mediaUrls?: string[];
    updatedAt: Date;
  };
  editor: UserSummary;
}

export interface PostDeletedEvent extends BaseSocketEvent {
  type: 'post:deleted';
  postId: string;
  deletedBy: UserSummary;
  reason?: string;
}

export interface PostModeratedEvent extends BaseSocketEvent {
  type: 'post:moderated';
  postId: string;
  action: string;
  moderator: UserSummary;
  reason?: string;
}

// Comment Events
export interface CommentCreatedEvent extends BaseSocketEvent {
  type: 'comment:created';
  comment: {
    id: string;
    content: string;
    postId: string;
    parentId?: string;
    author: UserSummary;
    taggedUsers: UserSummary[];
    createdAt: Date;
  };
}

export interface CommentUpdatedEvent extends BaseSocketEvent {
  type: 'comment:updated';
  commentId: string;
  postId: string;
  changes: {
    content?: string;
    updatedAt: Date;
  };
  editor: UserSummary;
}

export interface CommentDeletedEvent extends BaseSocketEvent {
  type: 'comment:deleted';
  commentId: string;
  postId: string;
  deletedBy: UserSummary;
  reason?: string;
}

// Reaction Events
export interface ReactionEvent extends BaseSocketEvent {
  type: 'reaction:added' | 'reaction:removed';
  targetId: string; // postId or commentId
  targetType: 'post' | 'comment';
  reaction: {
    type: string;
    user: UserSummary;
  };
  newCounts: Record<string, number>;
}

export interface ReactionSummaryEvent extends BaseSocketEvent {
  type: 'reaction:updated';
  targetId: string;
  targetType: 'post' | 'comment';
  summary: {
    total: number;
    breakdown: Record<string, number>;
    recentUsers: UserSummary[];
  };
}

// User Interaction Events
export interface TypingEvent extends BaseSocketEvent {
  type: 'user:typing' | 'user:stopped_typing';
  user: UserSummary;
  context: {
    postId?: string;
    commentId?: string;
    location: 'post' | 'comment' | 'reply';
  };
}

export interface UserTaggedEvent extends BaseSocketEvent {
  type: 'user:tagged';
  taggedUser: UserSummary;
  tagger: UserSummary;
  context: {
    postId?: string;
    commentId?: string;
    content: string;
    position: number;
  };
}

// Presence Events
export interface UserPresenceEvent extends BaseSocketEvent {
  type: 'user:joined' | 'user:left';
  user: UserSummary;
}

export interface UserStatusEvent extends BaseSocketEvent {
  type: 'user:status_changed';
  user: UserSummary;
  status: 'active' | 'idle' | 'away';
}

// Moderation Events
export interface ModerationEvent extends BaseSocketEvent {
  type: 'moderation:action';
  action: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  moderator: UserSummary;
  reason?: string;
  notes?: string;
}

export interface ContentFlaggedEvent extends BaseSocketEvent {
  type: 'content:flagged';
  contentType: 'post' | 'comment';
  contentId: string;
  flaggedBy: UserSummary;
  reason: string;
}

// System Events
export interface NotificationEvent extends BaseSocketEvent {
  type: 'notification:new';
  notification: {
    id: string;
    title: string;
    content: string;
    notificationType: string;
    priority: string;
    actionUrl?: string;
  };
  recipient: UserSummary;
}

export interface ErrorEvent {
  type: 'error';
  code: string;
  message: string;
  details?: any;
}

export interface ConnectionStatusEvent {
  type: 'connection:status';
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  message?: string;
}

// ==================== UTILITY TYPES ====================

// Event batching for performance optimization
export interface BatchedEvent<T> {
  type: string;
  events: T[];
  batchSize: number;
  timestamp: Date;
}

// Event acknowledgment
export interface EventAcknowledgment {
  eventId: string;
  status: 'received' | 'processed' | 'error';
  timestamp: Date;
  error?: string;
}

// Connection metadata
export interface ConnectionMetadata {
  userId: string;
  classId?: string;
  userAgent: string;
  ipAddress: string;
  connectedAt: Date;
  lastActivity: Date;
}

// Room information
export interface RoomInfo {
  name: string;
  memberCount: number;
  members: UserSummary[];
  createdAt: Date;
}

// Typing indicator data
export interface TypingIndicator {
  userId: string;
  user: UserSummary;
  location: {
    postId?: string;
    commentId?: string;
    type: 'post' | 'comment' | 'reply';
  };
  startedAt: Date;
}

// Event filters for subscriptions
export interface EventFilter {
  eventTypes: string[];
  userIds?: string[];
  postIds?: string[];
  excludeOwnEvents?: boolean;
}

// Rate limiting information
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  windowStart: Date;
}

// Export types only - no default export needed for type-only module
