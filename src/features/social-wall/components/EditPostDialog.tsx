/**
 * Edit Post Dialog Component
 * Dialog for editing existing posts
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Save, X } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { toast } from 'sonner';
import { api } from '@/utils/api';
import type { PostWithEngagement } from '../types/social-wall.types';
import { PostContentType } from '@prisma/client';

interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: PostWithEngagement;
  onSuccess?: (updatedPost: PostWithEngagement) => void;
}

export function EditPostDialog({ 
  open, 
  onOpenChange, 
  post,
  onSuccess
}: EditPostDialogProps) {
  const [content, setContent] = useState(post.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset content when post changes
  useEffect(() => {
    setContent(post.content);
  }, [post.content]);

  // Update post mutation
  const updatePostMutation = api.socialWall.updatePost.useMutation({
    onSuccess: (data) => {
      toast.success('Post updated successfully');
      setIsSubmitting(false);
      // Create a properly typed PostWithEngagement object
      const updatedPost: PostWithEngagement = {
        ...post,
        ...data.post,
        userTagged: post.userTagged || false,
        taggedUsers: post.taggedUsers || [],
        // Ensure reactions are in the correct format
        reactions: post.reactions || [],
        author: post.author,
      };
      onSuccess?.(updatedPost);
      handleClose();
    },
    onError: (error) => {
      toast.error(`Failed to update post: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) {
      toast.error('Post content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    updatePostMutation.mutate({
      postId: post.id,
      data: {
        content: content.trim(),
        contentType: PostContentType.HTML,
      },
    });
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setContent(post.content); // Reset to original content
      onOpenChange(false);
    }
  };

  const hasChanges = content.trim() !== post.content.trim();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>Edit Post</span>
          </DialogTitle>
          <DialogDescription>
            Make changes to your post content. Changes will be visible to all class members.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Content</Label>
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Edit your post content..."
              minHeight="200px"
              disabled={isSubmitting}
              simple={false}
              className="border border-input rounded-md"
            />
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || isSubmitting || !content.trim()}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
