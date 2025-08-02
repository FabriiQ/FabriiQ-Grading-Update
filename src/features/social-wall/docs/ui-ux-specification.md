# Social Wall UI/UX Design Specification

## Overview

This document defines the user interface and user experience design for the Social Wall feature, including component specifications, interaction patterns, responsive design, and accessibility requirements.

## Design Principles

### Core UX Psychology Principles

1. **Social Proof**: Display engagement metrics to encourage participation
2. **Reciprocity**: Make it easy to respond and engage with others' content
3. **Gamification**: Achievement sharing and reaction systems
4. **Immediate Feedback**: Real-time updates and optimistic UI
5. **Cognitive Load Reduction**: Clean, organized interface with clear hierarchy

### Visual Design System

```typescript
// Design tokens for Social Wall
const SOCIAL_WALL_TOKENS = {
  colors: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    muted: 'hsl(var(--muted))',
    border: 'hsl(var(--border))',
    
    // Social Wall specific
    postBackground: 'hsl(var(--card))',
    commentBackground: 'hsl(var(--muted) / 0.3)',
    reactionHover: 'hsl(var(--accent) / 0.1)',
    moderationWarning: 'hsl(var(--destructive) / 0.1)',
  },
  
  spacing: {
    postPadding: '1.5rem',
    commentIndent: '2rem',
    reactionSpacing: '0.5rem',
    feedGap: '1rem',
  },
  
  typography: {
    postContent: 'text-sm leading-relaxed',
    authorName: 'text-sm font-medium',
    timestamp: 'text-xs text-muted-foreground',
    commentText: 'text-sm',
  },
  
  animations: {
    postAppear: 'animate-in slide-in-from-top-2 fade-in duration-300',
    reactionPulse: 'animate-pulse duration-200',
    typingIndicator: 'animate-bounce',
  },
} as const;
```

## Component Architecture

### Component Hierarchy

```
SocialWall/
├── SocialWallContainer
│   ├── SocialWallHeader
│   ├── PostCreator (conditional)
│   ├── PostFeed
│   │   ├── PostCard
│   │   │   ├── PostHeader
│   │   │   ├── PostContent
│   │   │   ├── PostMedia
│   │   │   ├── PostActions
│   │   │   ├── ReactionBar
│   │   │   ├── CommentSection
│   │   │   └── ModerationControls (conditional)
│   │   └── PostSkeleton
│   ├── LoadMoreButton
│   └── TypingIndicators
├── Modals/
│   ├── PostCreatorModal
│   ├── MediaViewerModal
│   ├── UserTagModal
│   └── ModerationModal
└── Shared/
    ├── UserAvatar
    ├── ReactionPicker
    ├── UserMentionInput
    └── RichTextEditor
```

## Core Components

### SocialWallContainer

```typescript
interface SocialWallContainerProps {
  classId: string;
  userRole: UserRole;
  className?: string;
}

export function SocialWallContainer({ classId, userRole, className }: SocialWallContainerProps) {
  return (
    <div className={cn("social-wall-container", className)}>
      <SocialWallHeader classId={classId} userRole={userRole} />
      
      {/* Post Creator - Only for teachers/coordinators */}
      {canCreatePost(userRole) && (
        <PostCreator classId={classId} />
      )}
      
      {/* Real-time Post Feed */}
      <PostFeed classId={classId} userRole={userRole} />
      
      {/* Typing Indicators */}
      <TypingIndicators classId={classId} />
    </div>
  );
}
```

### PostCard Component

```typescript
interface PostCardProps {
  post: PostWithEngagement;
  classId: string;
  userRole: UserRole;
  onReaction: (postId: string, reaction: ReactionType) => void;
  onComment: (postId: string, content: string) => void;
  onModerate?: (postId: string, action: ModerationAction) => void;
}

export function PostCard({ post, classId, userRole, ...handlers }: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);

  return (
    <Card className="post-card group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <PostHeader 
          author={post.author}
          timestamp={post.createdAt}
          postType={post.postType}
          isModerated={post.isModerated}
        />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <PostContent 
          content={post.content}
          contentType={post.contentType}
          mediaUrls={post.mediaUrls}
          taggedUsers={post.taggedUsers}
        />
        
        <PostActions
          post={post}
          userRole={userRole}
          onReaction={handlers.onReaction}
          onComment={() => setIsCommenting(true)}
          onShare={() => {/* Share functionality */}}
        />
        
        <ReactionBar
          reactions={post.reactions}
          userReaction={post.userReaction}
          onReactionClick={handlers.onReaction}
        />
        
        {post.commentCount > 0 && (
          <CommentToggle
            commentCount={post.commentCount}
            isExpanded={showComments}
            onToggle={() => setShowComments(!showComments)}
          />
        )}
        
        {showComments && (
          <CommentSection
            postId={post.id}
            classId={classId}
            userRole={userRole}
            onComment={handlers.onComment}
          />
        )}
        
        {isCommenting && (
          <CommentInput
            postId={post.id}
            onSubmit={(content) => {
              handlers.onComment(post.id, content);
              setIsCommenting(false);
            }}
            onCancel={() => setIsCommenting(false)}
          />
        )}
      </CardContent>
      
      {/* Moderation Controls - Teachers only */}
      {canModerate(userRole) && (
        <ModerationControls
          post={post}
          onModerate={handlers.onModerate}
        />
      )}
    </Card>
  );
}
```

### PostCreator Component

```typescript
interface PostCreatorProps {
  classId: string;
  onPostCreated?: (post: PostWithEngagement) => void;
}

export function PostCreator({ classId, onPostCreated }: PostCreatorProps) {
  const [content, setContent] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<UserSummary[]>([]);
  const [postType, setPostType] = useState<PostType>('REGULAR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Card className="post-creator mb-6">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <UserAvatar user={currentUser} size="sm" />
          <div className="flex-1">
            <h3 className="text-sm font-medium">Share with your class</h3>
            <p className="text-xs text-muted-foreground">
              Create a post, share resources, or make announcements
            </p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Post Type Selector */}
        <PostTypeSelector
          value={postType}
          onChange={setPostType}
          options={getAvailablePostTypes(userRole)}
        />
        
        {/* Rich Text Editor */}
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="What would you like to share?"
          maxLength={5000}
          features={['bold', 'italic', 'link', 'mention']}
          onMention={(query) => searchClassMembers(classId, query)}
        />
        
        {/* Media Attachments */}
        <MediaUploader
          files={mediaFiles}
          onFilesChange={setMediaFiles}
          maxFiles={5}
          maxSize={10 * 1024 * 1024} // 10MB
          acceptedTypes={['image/*', 'application/pdf', '.doc', '.docx']}
        />
        
        {/* Tagged Users Display */}
        {taggedUsers.length > 0 && (
          <TaggedUsersDisplay
            users={taggedUsers}
            onRemoveUser={(userId) => 
              setTaggedUsers(prev => prev.filter(u => u.id !== userId))
            }
          />
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <ImageIcon className="w-4 h-4 mr-1" />
            Photo
          </Button>
          <Button variant="ghost" size="sm">
            <FileIcon className="w-4 h-4 mr-1" />
            File
          </Button>
          <Button variant="ghost" size="sm">
            <AtSignIcon className="w-4 h-4 mr-1" />
            Mention
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setContent('');
              setMediaFiles([]);
              setTaggedUsers([]);
            }}
          >
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Posting...
              </>
            ) : (
              'Post'
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
```

### ReactionBar Component

```typescript
interface ReactionBarProps {
  reactions: ReactionSummary[];
  userReaction?: ReactionType;
  onReactionClick: (reaction: ReactionType) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function ReactionBar({ reactions, userReaction, onReactionClick, size = 'md' }: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);

  if (totalReactions === 0) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPicker(!showPicker)}
            className="text-muted-foreground hover:text-foreground"
          >
            <SmileIcon className="w-4 h-4 mr-1" />
            React
          </Button>
        </div>
        
        {showPicker && (
          <ReactionPicker
            onReactionSelect={onReactionClick}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1">
        {reactions.map((reaction) => (
          <ReactionButton
            key={reaction.type}
            reaction={reaction}
            isSelected={userReaction === reaction.type}
            onClick={() => onReactionClick(reaction.type)}
            size={size}
          />
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowPicker(!showPicker)}
          className="text-muted-foreground hover:text-foreground"
        >
          <PlusIcon className="w-3 h-3" />
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
      </div>
      
      {showPicker && (
        <ReactionPicker
          onReactionSelect={onReactionClick}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
```

## Responsive Design

### Breakpoint Strategy

```typescript
const BREAKPOINTS = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
} as const;

// Responsive component variations
const ResponsivePostCard = {
  mobile: {
    padding: '1rem',
    fontSize: '0.875rem',
    avatarSize: '2rem',
    mediaHeight: '200px',
  },
  tablet: {
    padding: '1.25rem',
    fontSize: '0.875rem',
    avatarSize: '2.25rem',
    mediaHeight: '250px',
  },
  desktop: {
    padding: '1.5rem',
    fontSize: '1rem',
    avatarSize: '2.5rem',
    mediaHeight: '300px',
  },
} as const;
```

### Mobile Optimizations

```typescript
// Mobile-specific interactions
const MobilePostCard = () => {
  return (
    <Card className="mobile-post-card">
      {/* Swipe gestures for quick actions */}
      <SwipeableCard
        onSwipeLeft={() => openReactionPicker()}
        onSwipeRight={() => openCommentInput()}
      >
        <PostContent />
      </SwipeableCard>
      
      {/* Bottom sheet for comments on mobile */}
      <BottomSheet
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      >
        <CommentSection />
      </BottomSheet>
    </Card>
  );
};
```

## Accessibility Features

### WCAG 2.1 Compliance

```typescript
// Accessibility props and features
const AccessibilityFeatures = {
  // Keyboard navigation
  keyboardShortcuts: {
    'j': 'Next post',
    'k': 'Previous post',
    'l': 'Like post',
    'c': 'Comment on post',
    'r': 'Reply to comment',
    'Escape': 'Close modal/picker',
  },
  
  // Screen reader support
  ariaLabels: {
    postCard: 'Post by {authorName} at {timestamp}',
    reactionButton: '{reactionType} reaction, {count} users',
    commentButton: 'Comment on post, {count} existing comments',
    moderationButton: 'Moderate post options',
  },
  
  // Focus management
  focusTraps: ['ReactionPicker', 'CommentInput', 'ModerationModal'],
  
  // Color contrast
  contrastRatios: {
    normalText: '4.5:1',
    largeText: '3:1',
    uiComponents: '3:1',
  },
} as const;
```

### Screen Reader Optimizations

```typescript
// Live regions for real-time updates
export function LiveRegion({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
}

// Announce new posts to screen readers
const announceNewPost = (post: PostWithEngagement) => {
  const announcement = `New post from ${post.author.name}: ${post.content.substring(0, 100)}`;
  setLiveRegionContent(announcement);
};
```

## Animation and Micro-interactions

### Animation Specifications

```typescript
const ANIMATIONS = {
  // Post appearance
  postEnter: {
    initial: { opacity: 0, y: -20, scale: 0.95 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  
  // Reaction feedback
  reactionPulse: {
    scale: [1, 1.2, 1],
    transition: { duration: 0.2 },
  },
  
  // Comment slide-in
  commentExpand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: 'auto', opacity: 1 },
    exit: { height: 0, opacity: 0 },
    transition: { duration: 0.2 },
  },
  
  // Typing indicator
  typingDots: {
    animate: {
      scale: [1, 1.2, 1],
      opacity: [0.5, 1, 0.5],
    },
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
} as const;
```

## Performance Optimizations

### Virtual Scrolling

```typescript
// Virtual scrolling for large post feeds
import { FixedSizeList as List } from 'react-window';

export function VirtualizedPostFeed({ posts }: { posts: PostWithEngagement[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <PostCard post={posts[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={posts.length}
      itemSize={200}
      overscanCount={5}
    >
      {Row}
    </List>
  );
}
```

### Image Optimization

```typescript
// Lazy loading and optimization for media content
export function OptimizedImage({ src, alt, ...props }: ImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      {...props}
    />
  );
}
```

This UI/UX specification provides a comprehensive foundation for building an engaging, accessible, and performant Social Wall interface that enhances classroom interaction while maintaining usability across all devices and user abilities.
