# Social Wall API Documentation

## Overview

The Social Wall API provides comprehensive functionality for class-level social interactions within the FabriiQ LMS. It supports real-time communication, content moderation, and engagement tracking.

## Base URL

```
/api/trpc/socialWall
```

## Authentication

All endpoints require authentication via NextAuth.js session. Users must be enrolled in or assigned to the class to access its social wall.

## Endpoints

### Posts

#### `createPost`
Creates a new post in the class social wall.

**Method:** `POST`

**Input:**
```typescript
{
  content: string;           // Post content (1-5000 characters)
  contentType?: string;      // Default: 'TEXT'
  mediaUrls?: string[];      // Optional media attachments
  metadata?: object;         // Additional metadata
  postType?: 'REGULAR' | 'ANNOUNCEMENT' | 'ACHIEVEMENT';
  classId: string;           // Target class ID
  taggedUserIds?: string[];  // Users to mention
}
```

**Response:**
```typescript
{
  success: boolean;
  post: PostWithEngagement;
  notifications: string[];
}
```

**Permissions:**
- Teachers: Can create all post types
- Students: Cannot create posts (read-only access)

#### `getClassPosts`
Retrieves posts for a specific class with pagination.

**Method:** `GET`

**Input:**
```typescript
{
  classId: string;
  limit?: number;      // Max 50, default 20
  cursor?: string;     // For pagination
  postType?: string;   // Filter by post type
  authorId?: string;   // Filter by author
}
```

**Response:**
```typescript
{
  items: PostWithEngagement[];
  nextCursor?: string;
  hasMore: boolean;
}
```

#### `updatePost`
Updates an existing post (author or moderator only).

**Method:** `PATCH`

**Input:**
```typescript
{
  postId: string;
  content?: string;
  metadata?: object;
}
```

#### `deletePost`
Soft deletes a post (author or moderator only).

**Method:** `DELETE`

**Input:**
```typescript
{
  postId: string;
  reason?: string;  // Moderation reason
}
```

### Comments

#### `createComment`
Adds a comment to a post.

**Method:** `POST`

**Input:**
```typescript
{
  postId: string;
  content: string;           // 1-1000 characters
  parentId?: string;         // For threaded replies
  taggedUserIds?: string[];  // Users to mention
}
```

**Response:**
```typescript
{
  success: boolean;
  comment: CommentWithReplies;
  notifications: string[];
}
```

#### `getPostComments`
Retrieves comments for a specific post.

**Method:** `GET`

**Input:**
```typescript
{
  postId: string;
  limit?: number;    // Max 50, default 20
  cursor?: string;   // For pagination
}
```

#### `updateComment`
Updates an existing comment.

**Method:** `PATCH`

**Input:**
```typescript
{
  commentId: string;
  content: string;
}
```

#### `deleteComment`
Soft deletes a comment.

**Method:** `DELETE`

**Input:**
```typescript
{
  commentId: string;
  reason?: string;
}
```

### Reactions

#### `addReaction`
Adds or updates a reaction to a post or comment.

**Method:** `POST`

**Input:**
```typescript
{
  postId?: string;
  commentId?: string;
  reactionType: 'LIKE' | 'LOVE' | 'CELEBRATE' | 'LAUGH' | 'SURPRISED' | 'ANGRY' | 'SAD';
}
```

#### `removeReaction`
Removes a user's reaction.

**Method:** `DELETE`

**Input:**
```typescript
{
  postId?: string;
  commentId?: string;
}
```

### Moderation

#### `moderateContent`
Performs moderation actions on posts or comments.

**Method:** `POST`

**Input:**
```typescript
{
  contentId: string;
  contentType: 'POST' | 'COMMENT';
  action: 'HIDE' | 'RESTORE' | 'DELETE';
  reason?: string;
}
```

**Permissions:** Teachers and Campus Coordinators only

#### `getModerationLogs`
Retrieves moderation history for a class.

**Method:** `GET`

**Input:**
```typescript
{
  classId: string;
  limit?: number;
  cursor?: string;
}
```

## Real-Time Events

The Social Wall uses Socket.IO for real-time updates. Connect to namespace `/class-{classId}`.

### Events

#### Client → Server

- `join_class`: Join class room for updates
- `leave_class`: Leave class room
- `typing_start`: User started typing
- `typing_stop`: User stopped typing

#### Server → Client

- `post_created`: New post created
- `post_updated`: Post updated
- `post_deleted`: Post deleted
- `comment_created`: New comment added
- `comment_updated`: Comment updated
- `comment_deleted`: Comment deleted
- `reaction_added`: Reaction added
- `reaction_removed`: Reaction removed
- `user_typing`: User is typing
- `user_stopped_typing`: User stopped typing
- `moderation_action`: Content moderated

## Rate Limits

- Posts: 10 per hour per user
- Comments: 50 per hour per user
- Reactions: 100 per hour per user

## Error Codes

- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Not authenticated
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error

## Data Models

### PostWithEngagement
```typescript
{
  id: string;
  content: string;
  contentType: string;
  mediaUrls: string[];
  metadata: object;
  postType: string;
  status: string;
  classId: string;
  authorId: string;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  author: UserSummary;
  reactions: ReactionSummary[];
  userReaction?: string;
  userTagged: boolean;
  taggedUsers: UserSummary[];
}
```

### CommentWithReplies
```typescript
{
  id: string;
  content: string;
  postId: string;
  authorId: string;
  parentId?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  author: UserSummary;
  reactions: ReactionSummary[];
  userReaction?: string;
  replies: CommentWithReplies[];
  taggedUsers: UserSummary[];
}
```

### ReactionSummary
```typescript
{
  type: string;
  count: number;
  users: UserSummary[];
}
```

### UserSummary
```typescript
{
  id: string;
  name: string;
  userType: string;
  avatar?: string;
}
```

## Security Features

- Content filtering and spam detection
- Profanity filtering with automatic replacement
- Rate limiting per user and action type
- Role-based access control
- Audit logging for all moderation actions
- Automatic archiving of old content

## Performance Considerations

- Database queries are optimized with proper indexing
- Real-time updates use efficient Socket.IO namespaces
- Content is paginated to prevent large data transfers
- Archived content is automatically cleaned up
- Rate limiting prevents abuse and spam
