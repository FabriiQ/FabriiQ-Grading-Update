# Social Wall API Specification

## Overview

This document defines the tRPC API endpoints for the Social Wall feature, including request/response schemas, authentication requirements, and real-time event specifications.

## tRPC Router Structure

### Social Wall Router (`socialWall`)

```typescript
export const socialWallRouter = createTRPCRouter({
  // Post Operations
  createPost: protectedProcedure,
  updatePost: protectedProcedure,
  deletePost: protectedProcedure,
  getClassPosts: protectedProcedure,
  getPost: protectedProcedure,
  
  // Comment Operations
  createComment: protectedProcedure,
  updateComment: protectedProcedure,
  deleteComment: protectedProcedure,
  getPostComments: protectedProcedure,
  
  // Reaction Operations
  addReaction: protectedProcedure,
  removeReaction: protectedProcedure,
  getPostReactions: protectedProcedure,
  
  // User Tag Operations
  tagUsers: protectedProcedure,
  getTaggedPosts: protectedProcedure,
  getUserMentions: protectedProcedure,
  
  // Moderation Operations
  moderatePost: protectedProcedure,
  moderateComment: protectedProcedure,
  getModerationLogs: protectedProcedure,
  restoreContent: protectedProcedure,
  
  // Analytics Operations
  getClassEngagement: protectedProcedure,
  getUserActivity: protectedProcedure,
  getContentStats: protectedProcedure,
});
```

## API Endpoints

### Post Operations

#### Create Post

```typescript
createPost: protectedProcedure
  .input(z.object({
    classId: z.string(),
    content: z.string().min(1).max(5000),
    contentType: z.enum(['TEXT', 'IMAGE', 'FILE', 'LINK', 'ACHIEVEMENT', 'MIXED']).default('TEXT'),
    mediaUrls: z.array(z.string().url()).optional(),
    metadata: z.record(z.any()).optional(),
    postType: z.enum(['REGULAR', 'ACHIEVEMENT', 'ANNOUNCEMENT', 'POLL']).default('REGULAR'),
    taggedUserIds: z.array(z.string()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Permission check: Only teachers and coordinators can create posts
    // Exception: Students can create achievement posts
    
    // Validation logic
    // Content sanitization
    // File upload validation
    // User tag validation
    
    // Create post with transaction
    // Trigger real-time event
    // Send notifications
    
    return {
      success: true,
      post: CreatedPost,
      notifications: NotificationsSent[]
    };
  })
```

#### Get Class Posts

```typescript
getClassPosts: protectedProcedure
  .input(z.object({
    classId: z.string(),
    limit: z.number().min(1).max(50).default(20),
    cursor: z.string().optional(), // For pagination
    filter: z.object({
      postType: z.enum(['REGULAR', 'ACHIEVEMENT', 'ANNOUNCEMENT', 'POLL']).optional(),
      authorId: z.string().optional(),
      dateRange: z.object({
        from: z.date().optional(),
        to: z.date().optional(),
      }).optional(),
    }).optional(),
  }))
  .query(async ({ ctx, input }) => {
    // Permission check: User must be enrolled in class
    
    // Build query with filters
    // Include engagement metrics
    // Apply pagination
    
    return {
      posts: PostWithEngagement[],
      nextCursor: string | null,
      totalCount: number,
    };
  })
```

### Comment Operations

#### Create Comment

```typescript
createComment: protectedProcedure
  .input(z.object({
    postId: z.string(),
    content: z.string().min(1).max(1000),
    parentId: z.string().optional(), // For threaded replies
    taggedUserIds: z.array(z.string()).optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Permission check: User must have access to post's class
    
    // Validate post exists and is accessible
    // Content sanitization
    // Create comment with transaction
    // Update post comment count
    // Trigger real-time event
    // Send notifications
    
    return {
      success: true,
      comment: CreatedComment,
      notifications: NotificationsSent[]
    };
  })
```

### Reaction Operations

#### Add Reaction

```typescript
addReaction: protectedProcedure
  .input(z.object({
    postId: z.string().optional(),
    commentId: z.string().optional(),
    reactionType: z.enum(['LIKE', 'LOVE', 'CELEBRATE', 'LAUGH', 'SURPRISED', 'ANGRY', 'SAD']),
  }))
  .mutation(async ({ ctx, input }) => {
    // Validation: Must specify either postId or commentId
    // Permission check: User must have access to content
    
    // Upsert reaction (replace existing if different type)
    // Update reaction counts
    // Trigger real-time event
    // Optional notification to content author
    
    return {
      success: true,
      reaction: UpsertedReaction,
      newCounts: ReactionCounts
    };
  })
```

### Moderation Operations

#### Moderate Post

```typescript
moderatePost: protectedProcedure
  .input(z.object({
    postId: z.string(),
    action: z.enum(['HIDE', 'DELETE', 'RESTORE']),
    reason: z.string().optional(),
    notes: z.string().optional(),
  }))
  .mutation(async ({ ctx, input }) => {
    // Permission check: Only teachers can moderate in their classes
    
    // Validate post exists and user has moderation rights
    // Apply moderation action
    // Create moderation log
    // Trigger real-time event
    // Notify affected users
    
    return {
      success: true,
      moderationLog: CreatedModerationLog,
      updatedPost: ModeratedPost
    };
  })
```

## Input/Output Schemas

### Core Data Types

```typescript
// Post with engagement data
interface PostWithEngagement {
  id: string;
  content: string;
  contentType: PostContentType;
  mediaUrls?: string[];
  metadata?: Record<string, any>;
  postType: PostType;
  status: PostStatus;
  
  // Author information
  author: {
    id: string;
    name: string;
    avatar?: string;
    userType: UserType;
  };
  
  // Engagement metrics
  commentCount: number;
  reactionCount: number;
  reactions: ReactionSummary[];
  
  // User's interaction status
  userReaction?: ReactionType;
  userTagged: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Moderation status
  isModerated: boolean;
  moderationReason?: string;
}

// Comment with nested replies
interface CommentWithReplies {
  id: string;
  content: string;
  author: UserSummary;
  reactionCount: number;
  reactions: ReactionSummary[];
  userReaction?: ReactionType;
  replies: CommentWithReplies[];
  createdAt: Date;
  updatedAt: Date;
  isModerated: boolean;
}

// Reaction summary for UI display
interface ReactionSummary {
  type: ReactionType;
  count: number;
  users: UserSummary[]; // First few users for tooltip
}
```

### Permission Validation

```typescript
// Role-based permissions
const SOCIAL_WALL_PERMISSIONS = {
  CREATE_POST: ['TEACHER', 'CAMPUS_COORDINATOR'],
  CREATE_ACHIEVEMENT_POST: ['STUDENT', 'TEACHER', 'CAMPUS_COORDINATOR'],
  CREATE_COMMENT: ['STUDENT', 'TEACHER', 'CAMPUS_COORDINATOR'],
  ADD_REACTION: ['STUDENT', 'TEACHER', 'CAMPUS_COORDINATOR'],
  TAG_USERS: ['STUDENT', 'TEACHER', 'CAMPUS_COORDINATOR'],
  MODERATE_CONTENT: ['TEACHER', 'CAMPUS_COORDINATOR'],
  VIEW_MODERATION_LOGS: ['TEACHER', 'CAMPUS_COORDINATOR'],
} as const;

// Class membership validation
async function validateClassAccess(userId: string, classId: string): Promise<boolean> {
  // Check if user is enrolled as student or assigned as teacher
  // Return true if user has access to class social wall
}
```

## Real-Time Events (Socket.IO)

### Event Namespaces

```typescript
// Class-specific namespace
const classNamespace = `/class-${classId}`;

// Event types
interface SocialWallEvents {
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
  'reaction:added': (data: ReactionAddedEvent) => void;
  'reaction:removed': (data: ReactionRemovedEvent) => void;
  
  // User events
  'user:tagged': (data: UserTaggedEvent) => void;
  'user:joined': (data: UserJoinedEvent) => void;
  'user:left': (data: UserLeftEvent) => void;
  
  // Moderation events
  'moderation:action': (data: ModerationActionEvent) => void;
}
```

### Event Data Structures

```typescript
interface PostCreatedEvent {
  type: 'post:created';
  classId: string;
  post: PostWithEngagement;
  author: UserSummary;
  timestamp: Date;
}

interface ReactionAddedEvent {
  type: 'reaction:added';
  classId: string;
  postId?: string;
  commentId?: string;
  reaction: {
    type: ReactionType;
    user: UserSummary;
  };
  newCounts: ReactionCounts;
  timestamp: Date;
}

interface UserTaggedEvent {
  type: 'user:tagged';
  classId: string;
  taggedUser: UserSummary;
  tagger: UserSummary;
  postId?: string;
  commentId?: string;
  context: string;
  timestamp: Date;
}
```

## Error Handling

### Standard Error Responses

```typescript
// Permission denied
{
  code: 'FORBIDDEN',
  message: 'You do not have permission to perform this action',
  details: {
    requiredRole: 'TEACHER',
    userRole: 'STUDENT',
    action: 'CREATE_POST'
  }
}

// Content validation error
{
  code: 'BAD_REQUEST',
  message: 'Content validation failed',
  details: {
    field: 'content',
    reason: 'Content exceeds maximum length',
    maxLength: 5000,
    actualLength: 5500
  }
}

// Resource not found
{
  code: 'NOT_FOUND',
  message: 'Post not found or access denied',
  details: {
    postId: 'post_123',
    classId: 'class_456'
  }
}
```

## Rate Limiting

### Endpoint Limits

```typescript
const RATE_LIMITS = {
  createPost: { limit: 10, windowInSeconds: 3600 }, // 10 posts per hour
  createComment: { limit: 50, windowInSeconds: 3600 }, // 50 comments per hour
  addReaction: { limit: 100, windowInSeconds: 300 }, // 100 reactions per 5 minutes
  tagUsers: { limit: 20, windowInSeconds: 300 }, // 20 tags per 5 minutes
} as const;
```

## Caching Strategy

### Cache Keys and TTL

```typescript
const CACHE_CONFIG = {
  classPosts: { ttl: 300, key: 'class:posts:{classId}' }, // 5 minutes
  postComments: { ttl: 180, key: 'post:comments:{postId}' }, // 3 minutes
  reactionCounts: { ttl: 60, key: 'reactions:{postId|commentId}' }, // 1 minute
  userActivity: { ttl: 600, key: 'user:activity:{userId}' }, // 10 minutes
} as const;
```

## Integration Points

### Notification System

```typescript
// Trigger notifications for social wall events
interface NotificationTrigger {
  event: SocialWallEvent;
  recipients: string[];
  template: NotificationTemplate;
  channels: NotificationChannel[];
}
```

### File Storage

```typescript
// Integration with existing file storage system
interface MediaUpload {
  file: File;
  classId: string;
  postId?: string;
  allowedTypes: string[];
  maxSize: number;
}
```

This API specification provides a comprehensive foundation for implementing the Social Wall feature with proper security, performance, and integration considerations.
