/**
 * Post Creator Component
 * Allows teachers and coordinators to create posts on the social wall
 */

'use client';

import React, { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RichTextEditor } from '@/features/activties/components/ui/RichTextEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserMentionInput } from './UserMentionInput';
import { SimpleFileUpload } from './SimpleFileUpload';
import { AIVYAssistant } from './AIVYAssistant';
import { ActivitySelector } from './ActivitySelector';
import {
  Loader2,
  X,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { Pin, CornerDownRight } from './icons/social-wall-icons';
import {
  Image as ImageIcon,
  File as FileIcon,
  AtSign as AtSignIcon,
  Send,
  Type,
  Trophy,
  Megaphone
} from './icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import type { PostWithEngagement, CreatePostInput } from '../types/social-wall.types';
import { PostType, PostContentType } from '@prisma/client';

interface PostCreatorProps {
  classId: string;
  onPostCreated?: (post: PostWithEngagement) => void;
  className?: string;
  isExpanded?: boolean;
  showHeader?: boolean;
}

export function PostCreator({
  classId,
  onPostCreated,
  className,
  isExpanded = false,
  showHeader = true
}: PostCreatorProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState<PostType>('REGULAR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taggedUserIds, setTaggedUserIds] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; name: string; type: string }>>([]);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [taggedActivityIds, setTaggedActivityIds] = useState<string[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [postConfig, setPostConfig] = useState({
    isPinned: false,
    commentsDisabled: false,
    repliesDisabled: false,
  });

  // tRPC mutation for creating posts with optimistic updates
  const createPostMutation = api.socialWall.createPost.useMutation({
    onMutate: async (variables) => {
      // Create optimistic post for immediate UI feedback
      if (onPostCreated && session?.user) {
        const optimisticPost: PostWithEngagement = {
          id: `temp-${Date.now()}`, // Temporary ID
          content: variables.content,
          contentType: variables.contentType || 'HTML',
          mediaUrls: variables.mediaUrls || [],
          metadata: variables.metadata || {},
          postType: variables.postType || 'REGULAR',
          status: 'ACTIVE',
          classId: variables.classId,
          authorId: session.user.id,
          isPinned: (variables.metadata as any)?.isPinned || false,
          commentsDisabled: (variables.metadata as any)?.commentsDisabled || false,
          repliesDisabled: (variables.metadata as any)?.repliesDisabled || false,
          createdAt: new Date(),
          updatedAt: new Date(),
          deletedAt: null,
          isModerated: false,
          moderatedBy: null,
          moderatedAt: null,
          moderationReason: null,

          // Engagement data
          author: {
            id: session.user.id,
            name: session.user.name || 'Unknown User',
            userType: session.user.userType || 'STUDENT',
          },
          reactions: [],
          reactionCount: 0,
          commentCount: 0,
          userReaction: undefined,
          userTagged: false,
          taggedUsers: [],

          // Optimistic state indicators
          _optimistic: true,
          _pending: true,
        };

        // Add optimistic post to UI immediately
        onPostCreated(optimisticPost);
      }

      return { optimisticId: `temp-${Date.now()}` };
    },
    onSuccess: (data, variables, context) => {
      if (data.success) {
        // Clear form
        setContent('');
        setPostType('REGULAR');
        setError(null);
        setTaggedUserIds([]);
        setUploadedImages([]);
        setTaggedActivityIds([]);

        toast.success('Post created successfully!');

        // The real post will be updated via socket events
        // No need to call onPostCreated again as the socket will handle it
      }
    },
    onError: (error, variables, context) => {
      setError(error.message);
      toast.error('Failed to create post');

      // Remove optimistic post on error
      // This would need to be handled by the parent component
      console.error('Post creation failed:', error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async () => {
    // Strip HTML tags for length validation but keep original content for storage
    const textContent = content.replace(/<[^>]*>/g, '').trim();

    if (!textContent) {
      setError('Post content cannot be empty');
      return;
    }

    if (textContent.length > 5000) {
      setError('Post content exceeds maximum length of 5000 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const input: CreatePostInput = {
      classId,
      content: content, // Keep HTML content
      postType,
      contentType: PostContentType.HTML, // Use enum value
      taggedUserIds: taggedUserIds.length > 0 ? taggedUserIds : undefined,
      mediaUrls: uploadedImages.length > 0 ? uploadedImages.map(img => img.url) : undefined,
      taggedActivityIds: taggedActivityIds.length > 0 ? taggedActivityIds : undefined,
      metadata: {
        ...postConfig,
      },
    };

    createPostMutation.mutate(input);
  };

  const handleClear = () => {
    setContent('');
    setPostType('REGULAR');
    setError(null);
    setTaggedUserIds([]);
    setUploadedImages([]);
    setTaggedActivityIds([]);
    setPostConfig({
      isPinned: false,
      commentsDisabled: false,
      repliesDisabled: false,
    });
  };

  const getPostTypeIcon = (type: PostType) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4" />;
      case 'ACHIEVEMENT':
        return <Trophy className="w-4 h-4" />;
      default:
        return <Type className="w-4 h-4" />;
    }
  };

  const getPostTypeColor = (type: PostType) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ACHIEVEMENT':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (!session?.user) {
    return null;
  }

  return (
    <Card className={cn("post-creator", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={undefined} />
            <AvatarFallback>
              {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-sm font-medium">Share with your class</h3>
            <p className="text-xs text-muted-foreground">
              Create a post, share resources, or make announcements
            </p>
          </div>
          <Badge 
            variant="outline" 
            className={cn("text-xs", getPostTypeColor(postType))}
          >
            {getPostTypeIcon(postType)}
            <span className="ml-1 capitalize">{postType.toLowerCase()}</span>
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Post Type Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-muted-foreground">
            Post Type:
          </label>
          <Select value={postType} onValueChange={(value) => setPostType(value as PostType)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REGULAR">
                <div className="flex items-center space-x-2">
                  <Type className="w-4 h-4" />
                  <span>Regular</span>
                </div>
              </SelectItem>
              <SelectItem value="ANNOUNCEMENT">
                <div className="flex items-center space-x-2">
                  <Megaphone className="w-4 h-4" />
                  <span>Announcement</span>
                </div>
              </SelectItem>
              <SelectItem value="ACHIEVEMENT">
                <div className="flex items-center space-x-2">
                  <Trophy className="w-4 h-4" />
                  <span>Achievement</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rich Text Content Input with AIVY Assistant */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Content</Label>
            <AIVYAssistant
              onContentGenerated={setContent}
              currentContent={content}
              classId={classId}
            />
          </div>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Share an announcement, lesson update, or engage with your students... Use AIVY for AI-powered content suggestions! Type @ to mention users."
            minHeight="150px"
            disabled={isSubmitting}
            simple={false} // Use comprehensive editor with all formatting options
            className="border border-input rounded-md"
            enableMentions={true}
            onMentionSearch={async (query: string) => {
              // For now, return empty array until we implement proper user search
              // TODO: Implement proper user search API endpoint
              console.log('Mention search query:', query);
              return [];
            }}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Use the comprehensive toolbar for rich formatting</span>
            <span className={cn(
              content.replace(/<[^>]*>/g, '').length > 4500 && "text-orange-600",
              content.replace(/<[^>]*>/g, '').length > 4800 && "text-red-600"
            )}>
              {content.replace(/<[^>]*>/g, '').length}/5000
            </span>
          </div>
        </div>

        {/* User Mentions - Conditionally shown */}
        {showMentions && (
          <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Mention Users</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMentions(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <UserMentionInput
              classId={classId}
              selectedUsers={taggedUserIds}
              onUsersChange={setTaggedUserIds}
              placeholder="@ mention students, teachers, or everyone..."
            />
          </div>
        )}

        {/* Image Upload - Conditionally shown */}
        {showImageUpload && (
          <div className="space-y-2 border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Attach Images</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageUpload(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <SimpleFileUpload
              onFilesChange={setUploadedImages}
              maxFiles={5}
              maxFileSize={10}
              acceptedTypes={['image/*', 'video/*', 'application/pdf', 'text/*']}
            />
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={file.url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity Tagging */}
        <ActivitySelector
          classId={classId}
          selectedActivityIds={taggedActivityIds}
          onActivityChange={setTaggedActivityIds}
        />

        {/* Post Configuration */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Post Settings</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="pin-post"
                checked={postConfig.isPinned}
                onCheckedChange={(checked) =>
                  setPostConfig(prev => ({ ...prev, isPinned: !!checked }))
                }
              />
              <Label htmlFor="pin-post" className="text-sm flex items-center">
                <Pin className="w-3 h-3 mr-1" />
                Pin to top
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="disable-comments"
                checked={postConfig.commentsDisabled}
                onCheckedChange={(checked) =>
                  setPostConfig(prev => ({
                    ...prev,
                    commentsDisabled: !!checked,
                    // If comments are disabled, automatically disable replies too
                    repliesDisabled: !!checked ? true : prev.repliesDisabled
                  }))
                }
              />
              <Label htmlFor="disable-comments" className="text-sm flex items-center">
                <MessageSquare className="w-3 h-3 mr-1" />
                Disable comments
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="disable-replies"
                checked={postConfig.repliesDisabled}
                disabled={postConfig.commentsDisabled} // Disable this option when comments are disabled
                onCheckedChange={(checked) =>
                  setPostConfig(prev => ({ ...prev, repliesDisabled: !!checked }))
                }
              />
              <Label
                htmlFor="disable-replies"
                className={cn(
                  "text-sm flex items-center",
                  postConfig.commentsDisabled && "text-muted-foreground"
                )}
              >
                <CornerDownRight className="w-3 h-3 mr-1" />
                Disable replies
                {postConfig.commentsDisabled && (
                  <span className="text-xs text-muted-foreground ml-1">(disabled when comments are off)</span>
                )}
              </Label>
            </div>
          </div>
        </div>

        <Separator />

        {/* Error Display */}
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Media Attachments */}
        <div className="flex items-center space-x-2 text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="hover:text-foreground"
          >
            <ImageIcon className="w-4 h-4 mr-1" />
            Photo
          </Button>
          <Button variant="ghost" size="sm" disabled>
            <FileIcon className="w-4 h-4 mr-1" />
            File
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMentions(!showMentions)}
            className="hover:text-foreground"
          >
            <AtSignIcon className="w-4 h-4 mr-1" />
            Mention
          </Button>
          <span className="text-xs ml-auto">File upload coming soon</span>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-4">
        <div className="flex items-center space-x-2">
          {postType === 'ANNOUNCEMENT' && (
            <Badge variant="outline" className="text-xs text-orange-600">
              <Megaphone className="w-3 h-3 mr-1" />
              All class members will be notified
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={isSubmitting || !content.replace(/<[^>]*>/g, '').trim()}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.replace(/<[^>]*>/g, '').trim() || isSubmitting || content.replace(/<[^>]*>/g, '').length > 5000}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Post
              </>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export default PostCreator;
