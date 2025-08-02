/**
 * Essay Activity Viewer Component
 * 
 * Production-ready viewer for students to complete essay activities
 * with real-time word count, auto-save, and submission tracking.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Save,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Eye,
  Target
} from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { BloomsTaxonomyBadge } from '@/features/bloom/components/taxonomy/BloomsTaxonomyBadge';
import { EssayActivity, EssaySubmissionData } from '../../models/essay';
import { cn } from '@/lib/utils';

interface EssayViewerProps {
  activity: EssayActivity;
  initialContent?: string;
  submissionId?: string;
  isReadOnly?: boolean;
  onSave?: (content: string, wordCount: number) => Promise<void>;
  onSubmit?: (submissionData: EssaySubmissionData) => Promise<void>;
  onPreview?: (content: string) => void;
  className?: string;
}

export function EssayViewer({
  activity,
  initialContent = '',
  submissionId,
  isReadOnly = false,
  onSave,
  onSubmit,
  onPreview,
  className
}: EssayViewerProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(initialContent);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [revisionCount, setRevisionCount] = useState(0);
  const [startTime] = useState(new Date());
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const timeTrackingRef = useRef<NodeJS.Timeout>();

  // Calculate word count
  const calculateWordCount = useCallback((text: string): number => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, []);

  // Update word count when content changes
  useEffect(() => {
    const words = calculateWordCount(content);
    setWordCount(words);
  }, [content, calculateWordCount]);

  // Track time spent
  useEffect(() => {
    if (!isReadOnly) {
      timeTrackingRef.current = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);

      return () => {
        if (timeTrackingRef.current) {
          clearInterval(timeTrackingRef.current);
        }
      };
    }
  }, [isReadOnly]);

  // Auto-save functionality
  useEffect(() => {
    if (!isReadOnly && content !== initialContent && onSave && activity.settings.allowSaveProgress !== false) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true);
          await onSave(content, wordCount);
          setLastSaved(new Date());
          setRevisionCount(prev => prev + 1);
        } catch (error) {
          console.error('Auto-save failed:', error);
          toast({
            title: 'Auto-save failed',
            description: 'Your changes could not be saved automatically.',
            variant: 'error'
          });
        } finally {
          setIsSaving(false);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, initialContent, isReadOnly, onSave, wordCount, toast, activity.settings.allowSaveProgress]);

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isReadOnly) {
      setContent(e.target.value);
    }
  };

  // Manual save
  const handleSave = async () => {
    if (!onSave || isReadOnly) return;

    try {
      setIsSaving(true);
      await onSave(content, wordCount);
      setLastSaved(new Date());
      setRevisionCount(prev => prev + 1);
      toast({
        title: 'Saved successfully',
        description: 'Your essay has been saved.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Save failed:', error);
      toast({
        title: 'Save failed',
        description: 'Could not save your essay. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Submit essay
  const handleSubmit = async () => {
    if (!onSubmit || isReadOnly) return;

    // Validation
    if (content.trim().length === 0) {
      toast({
        title: 'Cannot submit empty essay',
        description: 'Please write your essay before submitting.',
        variant: 'error'
      });
      return;
    }

    if (wordCount > activity.settings.maxWords) {
      toast({
        title: 'Word limit exceeded',
        description: `Your essay exceeds the ${activity.settings.maxWords} word limit.`,
        variant: 'error'
      });
      return;
    }

    if (wordCount < activity.settings.minWords) {
      toast({
        title: 'Minimum word count not met',
        description: `Your essay must be at least ${activity.settings.minWords} words.`,
        variant: 'error'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const submissionData: EssaySubmissionData = {
        essayText: content,
        wordCount,
        timeSpent,
        revisionCount,
        submittedAt: new Date(),
        startedAt: startTime,
      };

      await onSubmit(submissionData);
      
      toast({
        title: 'Essay submitted successfully',
        description: 'Your essay has been submitted for grading.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Submit failed:', error);
      toast({
        title: 'Submission failed',
        description: 'Could not submit your essay. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Preview essay
  const handlePreview = () => {
    if (onPreview) {
      onPreview(content);
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  // Calculate progress
  const getWordCountProgress = (): number => {
    if (activity.settings.maxWords) {
      return Math.min((wordCount / activity.settings.maxWords) * 100, 100);
    }
    if (activity.settings.minWords) {
      return Math.min((wordCount / activity.settings.minWords) * 100, 100);
    }
    return 0;
  };

  const getWordCountStatus = (): 'success' | 'warning' | 'error' => {
    if (activity.settings.maxWords && wordCount > activity.settings.maxWords) {
      return 'error';
    }
    if (activity.settings.minWords && wordCount < activity.settings.minWords) {
      return 'warning';
    }
    return 'success';
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {activity.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <BloomsTaxonomyBadge level={activity.bloomsLevel} />
            {!isReadOnly && (
              <>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(timeSpent)}
                </Badge>
                {isSaving && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Save className="h-3 w-3 animate-spin" />
                    Saving...
                  </Badge>
                )}
                {lastSaved && !isSaving && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Saved {lastSaved.toLocaleTimeString()}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
        
        {activity.description && (
          <p className="text-sm text-muted-foreground">{activity.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Essay Prompt */}
        <Alert>
          <Target className="h-4 w-4" />
          <AlertDescription>
            <strong>Essay Prompt:</strong> {activity.prompt}
          </AlertDescription>
        </Alert>

        {/* Instructions */}
        {activity.instructions && (
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Instructions:</strong> {activity.instructions}
            </AlertDescription>
          </Alert>
        )}

        {/* Word count and progress */}
        {(activity.settings.showWordCount !== false || activity.settings.submission?.showWordCount !== false) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Word Count: {wordCount}
                {activity.settings.maxWords && ` / ${activity.settings.maxWords}`}
                {activity.settings.minWords && !activity.settings.maxWords && 
                  ` (min: ${activity.settings.minWords})`}
              </span>
              <span className={cn(
                'flex items-center gap-1',
                getWordCountStatus() === 'error' && 'text-destructive',
                getWordCountStatus() === 'warning' && 'text-warning',
                getWordCountStatus() === 'success' && 'text-success'
              )}>
                {getWordCountStatus() === 'error' && <AlertCircle className="h-4 w-4" />}
                {getWordCountStatus() === 'warning' && <AlertCircle className="h-4 w-4" />}
                {getWordCountStatus() === 'success' && <CheckCircle className="h-4 w-4" />}
                {getWordCountStatus() === 'error' && 'Exceeds limit'}
                {getWordCountStatus() === 'warning' && 'Below minimum'}
                {getWordCountStatus() === 'success' && 'Good'}
              </span>
            </div>
            
            {(activity.settings.maxWords || activity.settings.minWords) && (
              <Progress 
                value={getWordCountProgress()} 
                className={cn(
                  'h-2',
                  getWordCountStatus() === 'error' && 'bg-destructive/20',
                  getWordCountStatus() === 'warning' && 'bg-warning/20'
                )}
              />
            )}
          </div>
        )}

        {/* Essay editor */}
        <div className="space-y-2">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            placeholder={isReadOnly ? 'No content available' : 'Start writing your essay here...'}
            className="min-h-[400px] resize-none"
            readOnly={isReadOnly}
          />
        </div>

        {/* Action buttons */}
        {!isReadOnly && (
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              {activity.settings.allowSaveProgress !== false && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={content.trim().length === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || content.trim().length === 0}
              className="flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Essay'}
            </Button>
          </div>
        )}

        {/* Essay requirements */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Essay Requirements:</h4>
          <ul className="text-sm space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              Word count: {activity.settings.minWords} - {activity.settings.maxWords} words
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground">•</span>
              Cognitive level: {activity.bloomsLevel}
            </li>
            {activity.settings.timeLimit && (
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                Time limit: {activity.settings.timeLimit} minutes
              </li>
            )}
            {activity.settings.aiGrading.enabled && (
              <li className="flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                AI grading enabled with detailed feedback
              </li>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
