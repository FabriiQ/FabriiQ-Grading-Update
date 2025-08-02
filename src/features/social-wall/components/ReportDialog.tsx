/**
 * Report Dialog Component
 * Dialog for reporting inappropriate content
 */

'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string, description?: string) => void;
  isLoading?: boolean;
  title?: string;
}

const REPORT_REASONS = [
  {
    value: 'INAPPROPRIATE_CONTENT',
    label: 'Inappropriate Content',
    description: 'Content not suitable for class',
    icon: '⚠️'
  },
  {
    value: 'BULLYING',
    label: 'Bullying',
    description: 'Targeting or intimidating classmates',
    icon: '🚫'
  },
  {
    value: 'SPAM',
    label: 'Spam',
    description: 'Repetitive or irrelevant content',
    icon: '📧'
  },
  {
    value: 'HARASSMENT',
    label: 'Harassment',
    description: 'Unwanted or aggressive behavior',
    icon: '🛡️'
  },
  {
    value: 'MISINFORMATION',
    label: 'False Information',
    description: 'Misleading academic content',
    icon: '❌'
  },
  {
    value: 'PRIVACY_VIOLATION',
    label: 'Privacy Issue',
    description: 'Sharing personal info without consent',
    icon: '🔒'
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Other classroom policy violations',
    icon: '📝'
  },
];

export function ReportDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isLoading = false,
  title = "Report Content"
}: ReportDialogProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (!selectedReason) return;
    onSubmit(selectedReason, description.trim() || undefined);
  };

  const handleClose = () => {
    setSelectedReason('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
          <DialogDescription className="text-sm">
            Select a reason for reporting this content. Reports are reviewed by class moderators.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reason Selection - Tile Grid */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Reason for reporting</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  type="button"
                  onClick={() => setSelectedReason(reason.value)}
                  className={cn(
                    "p-3 rounded-lg border-2 text-left transition-all duration-200",
                    "hover:border-primary/50 hover:bg-primary/5",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20",
                    selectedReason === reason.value
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background"
                  )}
                >
                  <div className="flex items-start space-x-2">
                    <span className="text-lg flex-shrink-0 mt-0.5">{reason.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{reason.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {reason.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Additional Details */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Additional details (optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context..."
              className="mt-2 min-h-[60px] text-sm"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {description.length}/300 characters
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
