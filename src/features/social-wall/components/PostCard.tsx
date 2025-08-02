/**
 * Post Card Component
 * Displays individual social wall posts with engagement features
 */

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RichTextDisplay } from '@/features/activties/components/ui/RichTextDisplay';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import {
  Heart,
  Flag,
  EyeOff,
  Trophy,
  Megaphone,
  Type,
  ThumbsUp,
  Smile,
  Frown,
  MessageCircle
} from './icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { UserType, PostContentType } from '@prisma/client';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { ReactionBar } from './ReactionBar';
import { CommentSection } from './CommentSection';
import { ActivityTilesContainer } from './ActivityPreviewTile';
import { ReportDialog } from './ReportDialog';
import { ImageModal } from './ImageModal';
import { PostImage } from './PostImage';
import { EditPostDialog } from './EditPostDialog';
import { PinnedPostWrapper, PinnedPostIndicator } from './PinnedPostIndicator';
import type { PostWithEngagement } from '../types/social-wall.types';

interface PostCardProps {
  post: PostWithEngagement;
  classId: string;
  onUpdate?: (post: PostWithEngagement) => void;
  onDelete?: (postId: string) => void;
  className?: string;
}

export function PostCard({ post, classId, onUpdate, onDelete, className }: PostCardProps) {
  const { data: session } = useSession();
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const userType = session?.user?.userType as UserType;
  const isAuthor = session?.user?.id === post.authorId;
  const canModerate = userType === UserType.TEACHER || userType === UserType.CAMPUS_COORDINATOR;
  const canEdit = isAuthor || canModerate;

  // Content truncation - handle both TEXT and HTML content
  const maxLength = 300;
  const textContent = post.contentType === PostContentType.HTML
    ? post.content.replace(/<[^>]*>/g, '') // Strip HTML tags for length calculation
    : post.content;
  const shouldTruncate = textContent.length > maxLength;

  const displayContent = shouldTruncate && !isExpanded
    ? (post.contentType === PostContentType.HTML
        ? post.content // For HTML, we'll truncate in the display component
        : post.content.substring(0, maxLength) + '...')
    : post.content;

  // Post type styling
  const getPostTypeIcon = () => {
    switch (post.postType) {
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4" />;
      case 'ACHIEVEMENT':
        return <Trophy className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  const getPostTypeColor = () => {
    switch (post.postType) {
      case 'ANNOUNCEMENT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ACHIEVEMENT':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  // Mutations
  const deletePostMutation = api.socialWall.deletePost.useMutation({
    onSuccess: () => {
      toast.success('Post deleted successfully');
      if (onDelete) {
        onDelete(post.id);
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });

  const addReactionMutation = api.socialWall.addReaction.useMutation({
    onSuccess: () => {
      // Optimistic update will be handled by the parent component
    },
    onError: (error) => {
      toast.error(`Failed to add reaction: ${error.message}`);
    },
  });

  const removeReactionMutation = api.socialWall.removeReaction.useMutation({
    onSuccess: () => {
      // Optimistic update will be handled by the parent component
    },
    onError: (error) => {
      toast.error(`Failed to remove reaction: ${error.message}`);
    },
  });

  // Report post mutation
  const reportPostMutation = api.socialWall.createReport.useMutation({
    onSuccess: () => {
      toast.success('Post reported successfully. Moderators will review it.');
      setShowReportDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to report post: ${error.message}`);
    },
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this post?')) {
      deletePostMutation.mutate({ postId: post.id });
    }
  };

  const handleReaction = (reactionType: string) => {
    // Optimistic update - immediately update the UI
    const updatedPost = { ...post };

    if (post.userReaction === reactionType) {
      // Remove reaction
      updatedPost.userReaction = undefined;
      updatedPost.reactions = updatedPost.reactions.map(r =>
        r.type === reactionType
          ? { ...r, count: Math.max(0, r.count - 1) }
          : r
      ).filter(r => r.count > 0);

      removeReactionMutation.mutate({ postId: post.id });
    } else {
      // Add or change reaction
      const existingReactionIndex = updatedPost.reactions.findIndex(r => r.type === reactionType);
      const oldReactionIndex = post.userReaction
        ? updatedPost.reactions.findIndex(r => r.type === post.userReaction)
        : -1;

      // Remove old reaction if exists
      if (oldReactionIndex !== -1) {
        updatedPost.reactions[oldReactionIndex] = {
          ...updatedPost.reactions[oldReactionIndex],
          count: Math.max(0, updatedPost.reactions[oldReactionIndex].count - 1)
        };
        if (updatedPost.reactions[oldReactionIndex].count === 0) {
          updatedPost.reactions = updatedPost.reactions.filter((_, i) => i !== oldReactionIndex);
        }
      }

      // Add new reaction
      if (existingReactionIndex !== -1) {
        updatedPost.reactions[existingReactionIndex] = {
          ...updatedPost.reactions[existingReactionIndex],
          count: updatedPost.reactions[existingReactionIndex].count + 1
        };
      } else {
        updatedPost.reactions.push({
          type: reactionType as any,
          count: 1,
          users: []
        });
      }

      updatedPost.userReaction = reactionType as any;

      addReactionMutation.mutate({
        postId: post.id,
        reactionType: reactionType as any
      });
    }

    // Update the post immediately for better UX
    if (onUpdate) {
      onUpdate(updatedPost);
    }
  };

  const handleReport = (reason: string, description?: string) => {
    reportPostMutation.mutate({
      postId: post.id,
      reason: reason as any,
      description,
    });
  };



  return (
    <PinnedPostWrapper isPinned={post.isPinned || false}>
      <Card className={cn(
        "post-card group hover:shadow-md transition-shadow",
        post.isPinned && "border-blue-200 bg-blue-50/30",
        className
      )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>
                {post.author.name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium truncate">
                  {post.author.name || 'Unknown User'}
                </p>
                <Badge variant="outline" className="text-xs">
                  {post.author.userType.replace('_', ' ').toLowerCase()}
                </Badge>
                {post.postType !== 'REGULAR' && (
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs", getPostTypeColor())}
                  >
                    {getPostTypeIcon()}
                    <span className="ml-1 capitalize">
                      {post.postType.toLowerCase()}
                    </span>
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                {new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 1000 && (
                  <span className="ml-1">(edited)</span>
                )}
              </p>
            </div>
          </div>

          {/* Post Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <>
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Post
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              
              {canModerate && !isAuthor && (
                <>
                  <DropdownMenuItem disabled>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide Post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {!isAuthor && (
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report Post
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Post Content */}
        <div className="space-y-2">
          {post.contentType === PostContentType.HTML ? (
            <div className={cn(
              "prose prose-sm max-w-none dark:prose-invert",
              shouldTruncate && !isExpanded && "line-clamp-6"
            )}>
              <RichTextDisplay content={displayContent} />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {displayContent}
              </p>
            </div>
          )}

          {shouldTruncate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </Button>
          )}
        </div>

        {/* Media Display */}
        {post.mediaUrls && Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && (() => {
          const mediaUrls = post.mediaUrls as string[];
          return (
            <div className="space-y-2">
              <div className={cn(
                "grid gap-2",
                mediaUrls.length === 1 ? "grid-cols-1" :
                mediaUrls.length === 2 ? "grid-cols-1 xs:grid-cols-2" :
                "grid-cols-1 xs:grid-cols-2 sm:grid-cols-3"
              )}>
                {mediaUrls.map((url: string, index: number) => (
                  <PostImage
                    key={index}
                    src={url}
                    alt={`Post media ${index + 1}`}
                    className={cn(
                      mediaUrls.length === 1 ? "max-h-96" : "h-32 sm:h-40"
                    )}
                    objectFit="contain"
                    maintainAspectRatio={true}
                    onClick={() => setSelectedImageUrl(url)}
                  />
                ))}
              </div>
            </div>
          );
        })()}

        {/* Tagged Users */}
        {post.taggedUsers && post.taggedUsers.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-muted-foreground">Tagged:</span>
            <div className="flex flex-wrap gap-1">
              {post.taggedUsers.map((user) => (
                <Badge key={user.id} variant="secondary" className="text-xs">
                  @{user.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tagged Activities */}
        {post.taggedActivities && post.taggedActivities.length > 0 && (
          <ActivityTilesContainer
            activities={post.taggedActivities.map(activity => ({
              ...activity,
              status: activity.status === 'DRAFT' ? 'INACTIVE' as const :
                      activity.status === 'COMPLETED' ? 'ARCHIVED' as const :
                      activity.status === 'PUBLISHED' ? 'ACTIVE' as const :
                      'INACTIVE' as const
            }))}
            classId={classId}
            maxDisplay={2}
            className="my-4"
          />
        )}

        {/* Engagement Bar */}
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between pt-2 border-t gap-2 xs:gap-0">
          <div className="flex items-center space-x-2 xs:space-x-4 flex-wrap">
            {/* Reactions */}
            <ReactionBar
              reactions={post.reactions}
              userReaction={post.userReaction}
              onReactionClick={handleReaction}
            />
            
            {/* Comments - Only show if not disabled */}
            {!post.commentsDisabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                <span className="text-xs">
                  {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
                </span>
              </Button>
            )}

            {/* Reply Button - Only show if comments and replies are not disabled */}
            {!post.commentsDisabled && !post.repliesDisabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(true)}
                className="text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="w-4 h-4 mr-1" />
                <span className="text-xs">Reply</span>
              </Button>
            )}
          </div>

          {/* Report Flag Button */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReportDialog(true)}
              className="text-muted-foreground hover:text-red-500"
            >
              <Flag className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <CommentSection
            postId={post.id}
            classId={classId}
            commentCount={post.commentCount}
            commentsDisabled={post.commentsDisabled}
            repliesDisabled={post.repliesDisabled}
          />
        )}
      </CardContent>

      {/* Report Dialog */}
      <ReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
        onSubmit={handleReport}
        isLoading={reportPostMutation.isLoading}
        title="Report Post"
      />

      {/* Image Modal */}
      {selectedImageUrl && (
        <ImageModal
          isOpen={!!selectedImageUrl}
          onClose={() => setSelectedImageUrl(null)}
          imageUrl={selectedImageUrl}
          imageAlt="Post image"
        />
      )}

      {/* Edit Post Dialog */}
      <EditPostDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        post={post}
        onSuccess={onUpdate}
      />
    </Card>
    </PinnedPostWrapper>
  );
}

export default PostCard;
