/**
 * Comment Section Component
 * Displays and manages comments for social wall posts
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  ArrowUp,
  AlertTriangle
} from 'lucide-react';
import { Send, Heart, Flag } from './icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { useSocialWallSocket } from '../hooks/useSocialWallSocket';
import { ReportDialog } from './ReportDialog';
import { useContentModeration } from '@/hooks/useContentModeration';
import { InlineModerationError } from '@/components/ui/moderation-error';
import type { CommentWithReplies } from '../types/social-wall.types';

interface CommentSectionProps {
  postId: string;
  classId: string;
  commentCount: number;
  commentsDisabled?: boolean;
  repliesDisabled?: boolean;
  className?: string;
}

export function CommentSection({
  postId,
  classId,
  commentCount,
  commentsDisabled = false,
  repliesDisabled = false,
  className
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'mostLiked'>('newest');

  // Content moderation
  const { canSubmit, moderateText, getDetailedErrorMessage, moderationResult } = useContentModeration({
    showWarnings: false, // We'll handle warnings manually
    preventSubmission: true,
  });

  // Socket connection for real-time updates
  const { subscribe } = useSocialWallSocket({
    classId,
    enabled: !!session?.user,
    autoConnect: true,
  });

  // Fetch comments query
  const {
    data: commentsData,
    isLoading,
    error,
    refetch,
  } = api.socialWall.getPostComments.useQuery(
    {
      postId,
      limit: showAll ? 50 : 3, // Show more comments initially
      sortBy,
      maxDepth: 10, // Allow deep nesting
      repliesLimit: 20, // Allow more replies per comment
    },
    {
      enabled: !!postId,
      refetchOnWindowFocus: false,
    }
  );

  // Real-time comment updates
  useEffect(() => {
    if (!subscribe) return;

    const unsubscribers = [
      subscribe('comment:created', (event: any) => {
        if (event.postId === postId) {
          // Refetch comments to show new comment
          refetch();
        }
      }),

      subscribe('comment:updated', (event: any) => {
        if (event.postId === postId) {
          // Refetch comments to show updated comment
          refetch();
        }
      }),

      subscribe('comment:deleted', (event: any) => {
        if (event.postId === postId) {
          // Refetch comments to remove deleted comment
          refetch();
        }
      }),
    ];

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe?.());
    };
  }, [subscribe, postId, refetch]);

  // Create comment mutation
  const createCommentMutation = api.socialWall.createComment.useMutation({
    onSuccess: () => {
      setNewComment('');
      setIsSubmitting(false);
      toast.success('Comment added successfully');
      refetch();
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(`Failed to add comment: ${error.message}`);
    },
  });

  const handleSubmitComment = () => {
    if (!newComment.trim()) return;

    // Check content moderation
    const moderationResult = moderateText(newComment.trim());
    if (!moderationResult.isAllowed) {
      // Don't show toast, the inline error will be displayed
      return;
    }

    setIsSubmitting(true);
    createCommentMutation.mutate({
      postId,
      content: newComment.trim(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitComment();
    }
  };

  if (error) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load comments: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={cn("comment-section space-y-4", className)}>
      {/* Comment Input - Only show if comments are not disabled */}
      {session?.user && !commentsDisabled && (
        <div className="flex space-x-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={undefined} />
            <AvatarFallback>
              {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => {
                const value = e.target.value;
                setNewComment(value);
                // Check moderation in real-time
                if (value.trim()) {
                  moderateText(value.trim());
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment..."
              className="min-h-[60px] resize-none"
              maxLength={1000}
              disabled={isSubmitting}
            />

            {/* Moderation Error Display */}
            {newComment.trim() && moderationResult && !moderationResult.isAllowed && (
              <div className="mt-2">
                <InlineModerationError
                  message={getDetailedErrorMessage()?.message || 'Content contains inappropriate language'}
                  blockedWords={getDetailedErrorMessage()?.blockedWords || []}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Press Ctrl+Enter to post
              </span>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  {newComment.length}/1000
                </span>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting || (moderationResult && !moderationResult.isAllowed) || false}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Disabled Message */}
      {commentsDisabled && (
        <div className="text-center py-4">
          <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Comments have been disabled for this post
          </p>
        </div>
      )}

      {/* Comments Header with Sorting */}
      {commentsData?.items && commentsData.items.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-muted-foreground">
            {commentCount} {commentCount === 1 ? 'comment' : 'comments'}
          </h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs">
                <ArrowDown className="w-3 h-3 mr-1" />
                {sortBy === 'newest' ? 'Newest first' :
                 sortBy === 'oldest' ? 'Oldest first' :
                 'Most liked'}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                onClick={() => setSortBy('newest')}
                className={sortBy === 'newest' ? 'bg-accent' : ''}
              >
                Newest first
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('oldest')}
                className={sortBy === 'oldest' ? 'bg-accent' : ''}
              >
                Oldest first
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('mostLiked')}
                className={sortBy === 'mostLiked' ? 'bg-accent' : ''}
              >
                Most liked
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <CommentSkeleton key={index} />
          ))}
        </div>
      ) : commentsData?.items && commentsData.items.length > 0 ? (
        <div className="space-y-4">
          {commentsData.items.map((comment) => {
            // Check if comment is hidden but user is author or moderator
            const isHidden = comment.isHidden || comment.moderationStatus === 'HIDDEN';
            const canViewHidden = comment.author.id === session?.user?.id ||
                                 session?.user?.userType === 'TEACHER' ||
                                 session?.user?.userType === 'COORDINATOR';

            if (isHidden && !canViewHidden) {
              return null; // Don't show hidden content to non-authorized users
            }

            return (
              <CommentCard
                key={comment.id}
                comment={comment}
                postId={postId}
                classId={classId}
                isReply={false}
                depth={0}
                showModerationStatus={isHidden}
                repliesDisabled={repliesDisabled}
              />
            );
          })}
          
          {/* Show more/less button */}
          {commentCount > (commentsData?.items?.length || 0) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  See all {commentCount} comments
                </>
              )}
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            No comments yet. Be the first to comment!
          </p>
        </div>
      )}
    </div>
  );
}

function CommentCard({ comment, postId, classId, isReply = false, depth = 0, showModerationStatus = false, repliesDisabled = false }: {
  comment: CommentWithReplies;
  postId: string;
  classId: string;
  isReply?: boolean;
  depth?: number;
  showModerationStatus?: boolean;
  repliesDisabled?: boolean;
}) {
  const { data: session } = useSession();
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const isAuthor = session?.user?.id === comment.authorId;

  // Content moderation for replies
  const { canSubmit: canSubmitReply, moderateText: moderateReplyText, getDetailedErrorMessage: getReplyErrorMessage, moderationResult: replyModerationResult } = useContentModeration({
    showWarnings: false, // Handle manually
    preventSubmission: true,
  });

  // Add reaction mutation
  const addReactionMutation = api.socialWall.addReaction.useMutation({
    onSuccess: () => {
      toast.success('Reaction added');
      // Refetch comments to update the UI
    },
    onError: (error) => {
      toast.error(`Failed to add reaction: ${error.message}`);
    },
  });

  // Remove reaction mutation
  const removeReactionMutation = api.socialWall.removeReaction.useMutation({
    onSuccess: () => {
      toast.success('Reaction removed');
      // Refetch comments to update the UI
    },
    onError: (error) => {
      toast.error(`Failed to remove reaction: ${error.message}`);
    },
  });

  // Create reply mutation
  const createReplyMutation = api.socialWall.createComment.useMutation({
    onSuccess: () => {
      setReplyContent('');
      setShowReplyInput(false);
      setIsSubmittingReply(false);
      toast.success('Reply added successfully');
      // Refetch comments to update the UI
    },
    onError: (error) => {
      setIsSubmittingReply(false);
      toast.error(`Failed to add reply: ${error.message}`);
    },
  });

  // Report comment mutation
  const reportCommentMutation = api.socialWall.createReport.useMutation({
    onSuccess: () => {
      toast.success('Comment reported successfully. Moderators will review it.');
      setShowReportDialog(false);
    },
    onError: (error) => {
      toast.error(`Failed to report comment: ${error.message}`);
    },
  });

  const handleLike = () => {
    if (comment.userReaction === 'LIKE') {
      // Remove reaction
      removeReactionMutation.mutate({ commentId: comment.id });
    } else {
      // Add or change reaction
      addReactionMutation.mutate({
        commentId: comment.id,
        reactionType: 'LIKE'
      });
    }
  };

  const handleReply = () => {
    if (depth >= maxDepth) {
      toast.error('Maximum reply depth reached. Please start a new comment instead.');
      return;
    }
    setShowReplyInput(!showReplyInput);
  };

  const handleSubmitReply = () => {
    if (!replyContent.trim()) return;

    // Check content moderation
    const moderationResult = moderateReplyText(replyContent.trim());
    if (!moderationResult.isAllowed) {
      // Don't show toast, the inline error will be displayed
      return;
    }

    setIsSubmittingReply(true);
    createReplyMutation.mutate({
      postId,
      content: replyContent.trim(),
      parentId: comment.id,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmitReply();
    }
  };

  const handleReport = (reason: string, description?: string) => {
    reportCommentMutation.mutate({
      commentId: comment.id,
      reason: reason as any,
      description,
    });
  };

  const maxDepth = 10; // Allow up to 10 levels of nesting
  const effectiveDepth = Math.min(depth, maxDepth);

  // Responsive indent size - much smaller on mobile and cap the maximum indent
  const isMobile = windowWidth < 768;
  const isVerySmall = windowWidth < 480;

  // Dynamic indent calculation based on screen size and depth
  const baseIndentSize = isVerySmall ? 4 : isMobile ? 8 : 16;
  const maxIndentSize = isVerySmall ? 20 : isMobile ? 40 : 80;

  // For very deep nesting, use a logarithmic scale instead of linear
  const calculateIndent = (depth: number) => {
    if (depth <= 3) return depth * baseIndentSize;
    // After depth 3, use slower growth
    return 3 * baseIndentSize + Math.log(depth - 2) * baseIndentSize;
  };

  const indentSize = Math.min(calculateIndent(effectiveDepth), maxIndentSize);

  return (
    <div className={cn(
      "relative",
      isReply && "mt-2"
    )} style={{ marginLeft: isReply ? `${indentSize}px` : 0 }}>
      {/* Threading indicator for replies */}
      {isReply && (
        <>
          {/* Vertical line connecting to parent - gets more subtle at deeper levels */}
          <div
            className={cn(
              "absolute top-0 bottom-0 w-0.5 bg-gradient-to-b",
              effectiveDepth <= 3
                ? "from-primary/40 via-primary/20 to-transparent"
                : effectiveDepth <= 6
                ? "from-primary/25 via-primary/15 to-transparent"
                : "from-primary/15 via-primary/10 to-transparent"
            )}
            style={{ left: `-${Math.min(isMobile ? 12 : 20, indentSize - (isMobile ? 4 : 8))}px` }}
          />
          {/* Horizontal connector - also gets more subtle */}
          <div
            className={cn(
              "absolute top-4 h-0.5",
              effectiveDepth <= 3
                ? "bg-primary/30"
                : effectiveDepth <= 6
                ? "bg-primary/20"
                : "bg-primary/15"
            )}
            style={{
              left: `-${Math.min(isMobile ? 12 : 20, indentSize - (isMobile ? 4 : 8))}px`,
              width: `${Math.min(isMobile ? 10 : 16, indentSize - (isMobile ? 2 : 4))}px`
            }}
          />
          {/* Depth indicator - only show for very deep nesting */}
          {effectiveDepth > 5 && (
            <div className="absolute -left-1 top-4 flex space-x-0.5">
              {Array.from({ length: Math.min(3, effectiveDepth - 5) }).map((_, i) => (
                <div
                  key={i}
                  className="w-0.5 h-0.5 bg-primary/30 rounded-full"
                />
              ))}
            </div>
          )}
        </>
      )}

      <div className="flex space-x-3">
        <Avatar className={cn(
          // Responsive avatar sizing based on depth and screen size
          isReply
            ? isMobile
              ? `w-${Math.max(4, 7 - Math.floor(effectiveDepth / 2))} h-${Math.max(4, 7 - Math.floor(effectiveDepth / 2))}`
              : `w-${Math.max(6, 9 - effectiveDepth)} h-${Math.max(6, 9 - effectiveDepth)}`
            : "w-9 h-9",
          isReply && effectiveDepth <= 3 && "ring-1 ring-primary/20",
          effectiveDepth > 3 && "ring-1 ring-primary/10"
        )}>
          <AvatarImage src={comment.author.avatar} />
          <AvatarFallback className={cn(
            isReply ? "text-xs bg-primary/10" : "text-sm",
            effectiveDepth > 3 && "bg-primary/5 text-primary/70",
            effectiveDepth > 6 && "text-xs"
          )}>
            {comment.author.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 space-y-1">
          {/* Deep nesting warning */}
          {effectiveDepth >= 8 && (
            <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded mb-2">
              💡 This conversation is getting deep! Consider starting a new comment for better readability.
            </div>
          )}

          <Card className={cn(
            isReply
              ? effectiveDepth <= 3
                ? "bg-primary/10 border-primary/30 shadow-sm"
                : effectiveDepth <= 6
                ? "bg-primary/8 border-primary/25 shadow-sm"
                : "bg-primary/5 border-primary/20 shadow-sm"
              : "bg-muted/40 border-muted-foreground/20 shadow-sm",
            effectiveDepth > 2 && "border-l-2 border-l-primary/40",
            effectiveDepth > 5 && "border-l border-l-primary/30",
            showModerationStatus && "border-l-4 border-l-orange-400 bg-orange-50/50"
          )}>
            <CardContent className={cn(
              isReply ? "p-2.5" : "p-3"
            )}>
              {/* Moderation Status Banner */}
              {showModerationStatus && (
                <div className="mb-2 p-2 bg-orange-100 border border-orange-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    <span className="text-xs font-medium text-orange-800">
                      This comment was reported and is under review
                    </span>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    Only you and moderators can see this content
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2 mb-1">
                <span className={cn(
                  "font-medium",
                  isReply ? "text-xs text-primary" : "text-sm"
                )}>
                  {comment.author.name || 'Unknown User'}
                </span>
                {isReply && (
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-primary/60 rounded-full" />
                    <span className="text-xs text-primary/70 font-medium italic">
                      replied
                    </span>
                  </div>
                )}
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
                {showModerationStatus && (
                  <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                    Moderated
                  </Badge>
                )}
              </div>
              <p className={cn(
                "whitespace-pre-wrap leading-relaxed",
                isReply ? "text-xs text-muted-foreground" : "text-sm"
              )}>
                {comment.content}
              </p>
            </CardContent>
          </Card>

        {/* Comment actions */}
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-auto p-0 hover:text-primary transition-colors",
              comment.userReaction === 'LIKE' && "text-primary"
            )}
            onClick={handleLike}
            disabled={addReactionMutation.isLoading || removeReactionMutation.isLoading}
          >
            <Heart className={cn(
              "w-3 h-3 mr-1",
              comment.userReaction === 'LIKE' && "fill-current text-primary"
            )} />
            Like {comment.reactionCount > 0 && `(${comment.reactionCount})`}
          </Button>
          {!repliesDisabled && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:text-primary transition-colors"
              onClick={handleReply}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Reply
            </Button>
          )}
          {!isAuthor && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 hover:text-red-600"
              onClick={() => setShowReportDialog(true)}
            >
              <Flag className="w-3 h-3 mr-1" />
              Report
            </Button>
          )}
        </div>

        {/* Reply Input */}
        {showReplyInput && (
          <div className="mt-2 space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => {
                const value = e.target.value;
                setReplyContent(value);
                // Check moderation in real-time
                if (value.trim()) {
                  moderateReplyText(value.trim());
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder="Write a reply..."
              className="min-h-[60px] text-sm"
              disabled={isSubmittingReply}
            />

            {/* Reply Moderation Error Display */}
            {replyContent.trim() && replyModerationResult && !replyModerationResult.isAllowed && (
              <InlineModerationError
                message={getReplyErrorMessage()?.message || 'Content contains inappropriate language'}
                blockedWords={getReplyErrorMessage()?.blockedWords || []}
                className="text-xs"
              />
            )}

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={handleSubmitReply}
                disabled={!replyContent.trim() || isSubmittingReply || (replyModerationResult && !replyModerationResult.isAllowed) || false}
              >
                {isSubmittingReply ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    Replying...
                  </>
                ) : (
                  'Reply'
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowReplyInput(false);
                  setReplyContent('');
                }}
                disabled={isSubmittingReply}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

          {/* Report Dialog */}
          <ReportDialog
            open={showReportDialog}
            onOpenChange={setShowReportDialog}
            onSubmit={handleReport}
            isLoading={reportCommentMutation.isLoading}
            title="Report Comment"
          />
        </div>
      </div>

      {/* Nested Replies - Properly positioned below parent comment */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3 space-y-2">
          {comment.replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              postId={postId}
              classId={classId}
              isReply={true}
              depth={depth + 1}
              repliesDisabled={repliesDisabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex space-x-3">
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-10" />
        </div>
      </div>
    </div>
  );
}

export default CommentSection;
