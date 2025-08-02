/**
 * Moderation Actions Component
 * Provides action buttons for moderating reported content
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MoreHorizontal,
  MapPin,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';
import { toast } from 'sonner';

interface ModerationActionsProps {
  reportId: string;
  postId?: string;
  commentId?: string;
  currentStatus: string;
  onActionComplete?: () => void;
  className?: string;
}

interface ModerationAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant: 'default' | 'destructive' | 'outline' | 'secondary';
  requiresReason?: boolean;
  description?: string;
}

const MODERATION_ACTIONS: ModerationAction[] = [
  {
    id: 'RESOLVE_REPORT',
    label: 'Resolve Report',
    icon: <CheckCircle className="w-4 h-4" />,
    variant: 'default',
    description: 'Mark this report as resolved without taking action'
  },
  {
    id: 'HIDE_POST',
    label: 'Hide Content',
    icon: <EyeOff className="w-4 h-4" />,
    variant: 'outline',
    requiresReason: true,
    description: 'Hide the content from public view'
  },
  {
    id: 'DELETE_POST',
    label: 'Delete Content',
    icon: <Trash2 className="w-4 h-4" />,
    variant: 'destructive',
    requiresReason: true,
    description: 'Permanently delete the content'
  },
  {
    id: 'WARN_USER',
    label: 'Warn User',
    icon: <AlertTriangle className="w-4 h-4" />,
    variant: 'outline',
    requiresReason: true,
    description: 'Send a warning to the content author'
  },
  {
    id: 'DISMISS_REPORT',
    label: 'Dismiss Report',
    icon: <XCircle className="w-4 h-4" />,
    variant: 'outline',
    requiresReason: true,
    description: 'Dismiss the report as invalid'
  },
  {
    id: 'ESCALATE_REPORT',
    label: 'Escalate',
    icon: <AlertTriangle className="w-4 h-4" />,
    variant: 'secondary',
    requiresReason: true,
    description: 'Escalate to higher authority'
  }
];

export function ModerationActions({
  reportId,
  postId,
  commentId,
  currentStatus,
  onActionComplete,
  className
}: ModerationActionsProps) {
  const [selectedAction, setSelectedAction] = useState<ModerationAction | null>(null);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Moderation mutation
  const moderationMutation = api.socialWall.moderateReport.useMutation({
    onSuccess: () => {
      toast.success('Moderation action completed successfully');
      setSelectedAction(null);
      setReason('');
      setIsSubmitting(false);
      onActionComplete?.();
    },
    onError: (error) => {
      toast.error(`Failed to complete action: ${error.message}`);
      setIsSubmitting(false);
    },
  });

  const handleActionSelect = (action: ModerationAction) => {
    if (action.requiresReason) {
      setSelectedAction(action);
    } else {
      handleActionSubmit(action, '');
    }
  };

  const handleActionSubmit = (action: ModerationAction, actionReason: string) => {
    setIsSubmitting(true);
    moderationMutation.mutate({
      reportId,
      action: action.id as any,
      reason: actionReason || undefined,
      postId,
      commentId,
    });
  };

  const handleDialogSubmit = () => {
    if (selectedAction) {
      handleActionSubmit(selectedAction, reason);
    }
  };

  const handleDialogClose = () => {
    setSelectedAction(null);
    setReason('');
  };

  if (currentStatus === 'RESOLVED' || currentStatus === 'DISMISSED') {
    return (
      <Badge variant="outline" className={className}>
        {currentStatus.toLowerCase()}
      </Badge>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={className}>
            <MoreHorizontal className="w-4 h-4" />
            <span className="ml-1 hidden sm:inline">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {MODERATION_ACTIONS.map((action, index) => (
            <React.Fragment key={action.id}>
              <DropdownMenuItem
                onClick={() => handleActionSelect(action)}
                className={cn(
                  "flex items-center space-x-2",
                  action.variant === 'destructive' && "text-destructive focus:text-destructive"
                )}
              >
                {action.icon}
                <div className="flex flex-col">
                  <span className="text-sm">{action.label}</span>
                  {action.description && (
                    <span className="text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
              {index === 0 && <DropdownMenuSeparator />}
              {index === 3 && <DropdownMenuSeparator />}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!selectedAction} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {selectedAction?.icon}
              <span>{selectedAction?.label}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedAction?.description}
              {selectedAction?.requiresReason && (
                <span className="block mt-2 text-sm">
                  Please provide a reason for this action.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          {selectedAction?.requiresReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you're taking this action..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDialogClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDialogSubmit}
              disabled={
                isSubmitting || 
                (selectedAction?.requiresReason && !reason.trim())
              }
              variant={selectedAction?.variant === 'destructive' ? 'destructive' : 'default'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                selectedAction?.label
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
