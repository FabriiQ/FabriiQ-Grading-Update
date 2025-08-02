# Social Wall Database Schema Design

## Overview

This document defines the database schema for the Social Wall feature, designed for optimal performance, scalability, and integration with the existing FabriiQ LMS system.

## Core Entities

### 1. SocialPost

The main entity for social wall posts with support for various content types.

```prisma
model SocialPost {
  id          String   @id @default(cuid())
  content     String   // Main post content (text)
  contentType PostContentType @default(TEXT)
  mediaUrls   Json?    // Array of media URLs (images, files, links)
  metadata    Json?    // Additional metadata (link previews, file info, etc.)
  
  // Relationships
  classId     String
  authorId    String
  class       Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  author      User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  
  // Post type and status
  postType    PostType @default(REGULAR)
  status      PostStatus @default(ACTIVE)
  
  // Engagement metrics (denormalized for performance)
  commentCount Int     @default(0)
  reactionCount Int    @default(0)
  
  // Moderation
  isModerated Boolean @default(false)
  moderatedBy String?
  moderatedAt DateTime?
  moderationReason String?
  moderator   User?   @relation("ModeratedPosts", fields: [moderatedBy], references: [id])
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime? // Soft delete
  
  // Related entities
  comments    SocialComment[]
  reactions   SocialReaction[]
  userTags    SocialUserTag[]
  moderationLogs SocialModerationLog[]
  
  // Indexes for performance
  @@index([classId, createdAt])
  @@index([authorId, createdAt])
  @@index([status, createdAt])
  @@index([classId, status, createdAt])
  @@map("social_posts")
}

enum PostContentType {
  TEXT
  IMAGE
  FILE
  LINK
  ACHIEVEMENT
  MIXED
}

enum PostType {
  REGULAR
  ACHIEVEMENT
  ANNOUNCEMENT
  POLL
}

enum PostStatus {
  ACTIVE
  HIDDEN
  DELETED
  ARCHIVED
}
```

### 2. SocialComment

Comments on social posts with threading support for replies.

```prisma
model SocialComment {
  id        String   @id @default(cuid())
  content   String
  
  // Relationships
  postId    String
  authorId  String
  parentId  String?  // For threaded comments
  post      SocialPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent    SocialComment? @relation("CommentReplies", fields: [parentId], references: [id])
  replies   SocialComment[] @relation("CommentReplies")
  
  // Status and moderation
  status    CommentStatus @default(ACTIVE)
  isModerated Boolean @default(false)
  moderatedBy String?
  moderatedAt DateTime?
  moderationReason String?
  moderator User?   @relation("ModeratedComments", fields: [moderatedBy], references: [id])
  
  // Engagement
  reactionCount Int @default(0)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  
  // Related entities
  reactions SocialReaction[]
  userTags  SocialUserTag[]
  moderationLogs SocialModerationLog[]
  
  // Indexes
  @@index([postId, createdAt])
  @@index([authorId, createdAt])
  @@index([parentId, createdAt])
  @@index([status, createdAt])
  @@map("social_comments")
}

enum CommentStatus {
  ACTIVE
  HIDDEN
  DELETED
}
```

### 3. SocialReaction

User reactions to posts and comments (like, love, celebrate, etc.).

```prisma
model SocialReaction {
  id        String   @id @default(cuid())
  
  // Reaction details
  reactionType ReactionType
  
  // Relationships
  userId    String
  postId    String?
  commentId String?
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      SocialPost? @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment   SocialComment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Constraints - user can only have one reaction per post/comment
  @@unique([userId, postId])
  @@unique([userId, commentId])
  
  // Indexes
  @@index([postId, reactionType])
  @@index([commentId, reactionType])
  @@index([userId, createdAt])
  @@map("social_reactions")
}

enum ReactionType {
  LIKE
  LOVE
  CELEBRATE
  LAUGH
  SURPRISED
  ANGRY
  SAD
}
```

### 4. SocialUserTag

User mentions/tags in posts and comments.

```prisma
model SocialUserTag {
  id        String   @id @default(cuid())
  
  // Relationships
  userId    String   // Tagged user
  taggerId  String   // User who created the tag
  postId    String?
  commentId String?
  user      User     @relation("TaggedUser", fields: [userId], references: [id], onDelete: Cascade)
  tagger    User     @relation("TaggerUser", fields: [taggerId], references: [id], onDelete: Cascade)
  post      SocialPost? @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment   SocialComment? @relation(fields: [commentId], references: [id], onDelete: Cascade)
  
  // Tag context
  context   String?  // The text context where user was tagged
  position  Int?     // Position in the content where tag occurs
  
  // Notification status
  isNotified Boolean @default(false)
  notifiedAt DateTime?
  
  // Timestamps
  createdAt DateTime @default(now())
  
  // Indexes
  @@index([userId, createdAt])
  @@index([postId, userId])
  @@index([commentId, userId])
  @@index([isNotified])
  @@map("social_user_tags")
}
```

### 5. SocialModerationLog

Audit trail for all moderation actions.

```prisma
model SocialModerationLog {
  id        String   @id @default(cuid())
  
  // Moderation details
  action    ModerationAction
  reason    String?
  notes     String?
  
  // Relationships
  moderatorId String
  postId    String?
  commentId String?
  targetUserId String? // User who was moderated
  moderator User     @relation("ModeratorLogs", fields: [moderatorId], references: [id])
  post      SocialPost? @relation(fields: [postId], references: [id])
  comment   SocialComment? @relation(fields: [commentId], references: [id])
  targetUser User?   @relation("ModeratedUserLogs", fields: [targetUserId], references: [id])
  
  // Context
  classId   String
  class     Class    @relation(fields: [classId], references: [id])
  
  // Timestamps
  createdAt DateTime @default(now())
  
  // Indexes
  @@index([classId, createdAt])
  @@index([moderatorId, createdAt])
  @@index([targetUserId, createdAt])
  @@index([action, createdAt])
  @@map("social_moderation_logs")
}

enum ModerationAction {
  HIDE_POST
  DELETE_POST
  HIDE_COMMENT
  DELETE_COMMENT
  WARN_USER
  RESTRICT_USER
  RESTORE_POST
  RESTORE_COMMENT
}
```

### 6. SocialArchive

Archived posts and comments for long-term storage and performance optimization.

```prisma
model SocialArchive {
  id        String   @id @default(cuid())
  
  // Original entity details
  originalId String  // Original post/comment ID
  entityType ArchiveEntityType
  
  // Archived content (compressed JSON)
  archivedData Json   // Complete original entity data
  
  // Context
  classId   String
  authorId  String
  class     Class    @relation(fields: [classId], references: [id])
  author    User     @relation(fields: [authorId], references: [id])
  
  // Archive metadata
  archivedAt DateTime @default(now())
  originalCreatedAt DateTime
  archiveReason String?
  
  // Indexes
  @@index([classId, originalCreatedAt])
  @@index([authorId, originalCreatedAt])
  @@index([entityType, archivedAt])
  @@map("social_archives")
}

enum ArchiveEntityType {
  POST
  COMMENT
}
```

## Relationships with Existing Models

### User Model Extensions

```prisma
// Add to existing User model
model User {
  // ... existing fields
  
  // Social Wall relationships
  socialPosts     SocialPost[]
  socialComments  SocialComment[]
  socialReactions SocialReaction[]
  taggedIn        SocialUserTag[] @relation("TaggedUser")
  createdTags     SocialUserTag[] @relation("TaggerUser")
  moderatedPosts  SocialPost[]    @relation("ModeratedPosts")
  moderatedComments SocialComment[] @relation("ModeratedComments")
  moderationLogs  SocialModerationLog[] @relation("ModeratorLogs")
  moderatedUserLogs SocialModerationLog[] @relation("ModeratedUserLogs")
  socialArchives  SocialArchive[]
}
```

### Class Model Extensions

```prisma
// Add to existing Class model
model Class {
  // ... existing fields
  
  // Social Wall relationships
  socialPosts     SocialPost[]
  moderationLogs  SocialModerationLog[]
  socialArchives  SocialArchive[]
}
```

## Performance Optimizations

### Indexing Strategy

1. **Composite Indexes**: For common query patterns
   - `(classId, status, createdAt)` for active posts in class
   - `(authorId, createdAt)` for user's posts/comments
   - `(postId, createdAt)` for post comments

2. **Partial Indexes**: For filtered queries
   - Active posts only: `WHERE status = 'ACTIVE'`
   - Non-deleted content: `WHERE deletedAt IS NULL`

3. **Covering Indexes**: Include frequently accessed columns
   - Post list queries with author info
   - Comment counts and reaction summaries

### Denormalization

1. **Engagement Metrics**: Store counts directly on posts
   - `commentCount`, `reactionCount` updated via triggers
   - Reduces need for expensive COUNT queries

2. **User Information**: Cache frequently accessed user data
   - Author name, avatar in post metadata
   - Updated when user profile changes

### Partitioning Strategy

1. **Time-based Partitioning**: Partition by creation date
   - Monthly partitions for posts and comments
   - Automatic partition creation and maintenance

2. **Class-based Partitioning**: For very large installations
   - Separate tables per campus or program
   - Configurable based on scale requirements

## Data Archiving Strategy

### Automatic Archiving

1. **Age-based Archiving**: Posts older than configurable period
   - Default: 1 year for regular posts
   - Extended retention for important announcements

2. **Size-based Archiving**: When tables exceed size limits
   - Configurable thresholds per installation
   - Prioritize older, less-accessed content

### Archive Access

1. **Read-only Access**: Archived content remains searchable
   - Reduced functionality (no new reactions/comments)
   - Clear visual indicators of archived status

2. **Restoration**: Ability to restore archived content
   - Admin-only functionality
   - Full restoration with original timestamps

## Migration Strategy

### Phase 1: Core Tables
1. Create all core social wall tables
2. Add foreign key relationships
3. Create basic indexes

### Phase 2: Integration
1. Add relationships to existing User/Class models
2. Create triggers for denormalized data
3. Set up archiving procedures

### Phase 3: Optimization
1. Add performance indexes based on usage patterns
2. Implement partitioning if needed
3. Fine-tune archiving policies

## Security Considerations

### Data Protection
1. **Soft Deletes**: Preserve data for audit purposes
2. **Encryption**: Sensitive content encrypted at rest
3. **Access Control**: Row-level security for multi-tenant data

### Audit Trail
1. **Complete Logging**: All moderation actions logged
2. **Immutable Logs**: Moderation logs cannot be deleted
3. **Compliance**: GDPR-compliant data handling

This schema design provides a robust foundation for the Social Wall feature while maintaining performance, scalability, and integration with the existing FabriiQ system.
