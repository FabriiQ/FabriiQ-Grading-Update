/**
 * Essay Grader Component
 * 
 * Production-ready grading interface for teachers to grade essays
 * with AI assistance, manual override, and comprehensive feedback.
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Brain, 
  User, 
  FileText, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { BloomsTaxonomyBadge } from '@/features/bloom/components/taxonomy/BloomsTaxonomyBadge';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { EssayActivity, EssaySubmissionData } from '../../models/essay';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { cn } from '@/lib/utils';

interface EssayGraderProps {
  activity: EssayActivity;
  submission: EssaySubmissionData & {
    id: string;
    studentId: string;
    studentName: string;
    aiScore?: number;
    aiFeedback?: string;
    aiConfidence?: number;
    aiBloomsLevel?: BloomsTaxonomyLevel;
    requiresManualReview?: boolean;
  };
  onGrade?: (gradeData: {
    score: number;
    feedback: string;
    bloomsLevel: BloomsTaxonomyLevel;
    overrideAI?: boolean;
  }) => Promise<void>;
  onRequestAIGrading?: () => Promise<void>;
  className?: string;
}

export function EssayGrader({
  activity,
  submission,
  onGrade,
  onRequestAIGrading,
  className
}: EssayGraderProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('submission');
  const [isGrading, setIsGrading] = useState(false);
  const [isRequestingAI, setIsRequestingAI] = useState(false);
  
  // Manual grading state
  const [manualScore, setManualScore] = useState<number>(submission.aiScore || 0);
  const [manualFeedback, setManualFeedback] = useState<string>(submission.aiFeedback || '');
  const [manualBloomsLevel, setManualBloomsLevel] = useState<BloomsTaxonomyLevel>(
    submission.aiBloomsLevel || activity.bloomsLevel
  );

  // Handle manual grading submission
  const handleSubmitGrade = async () => {
    if (!onGrade) return;

    if (manualScore < 0 || manualScore > 100) {
      toast({
        title: 'Invalid score',
        description: 'Score must be between 0 and 100.',
        variant: 'error'
      });
      return;
    }

    if (manualFeedback.trim().length < 10) {
      toast({
        title: 'Feedback required',
        description: 'Please provide detailed feedback (at least 10 characters).',
        variant: 'error'
      });
      return;
    }

    try {
      setIsGrading(true);
      
      await onGrade({
        score: manualScore,
        feedback: manualFeedback,
        bloomsLevel: manualBloomsLevel,
        overrideAI: submission.aiScore !== undefined
      });

      toast({
        title: 'Grade submitted successfully',
        description: 'The essay has been graded and feedback provided.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error submitting grade:', error);
      toast({
        title: 'Error submitting grade',
        description: 'There was an error submitting the grade. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsGrading(false);
    }
  };

  // Handle AI grading request
  const handleRequestAIGrading = async () => {
    if (!onRequestAIGrading) return;

    try {
      setIsRequestingAI(true);
      await onRequestAIGrading();
      
      toast({
        title: 'AI grading requested',
        description: 'AI grading has been initiated. Results will appear shortly.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error requesting AI grading:', error);
      toast({
        title: 'Error requesting AI grading',
        description: 'Could not request AI grading. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsRequestingAI(false);
    }
  };

  // Format time
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
  };

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Grade Essay: {activity.title}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Student: {submission.studentName}
            </Badge>
            <BloomsTaxonomyBadge level={activity.bloomsLevel} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="submission">Submission</TabsTrigger>
            <TabsTrigger value="ai-analysis">AI Analysis</TabsTrigger>
            <TabsTrigger value="manual-grade">Manual Grade</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Student Submission Tab */}
          <TabsContent value="submission" className="space-y-4">
            <div className="space-y-4">
              {/* Submission metadata */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{submission.wordCount}</div>
                  <div className="text-sm text-muted-foreground">Words</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{formatTime(submission.timeSpent)}</div>
                  <div className="text-sm text-muted-foreground">Time Spent</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{submission.revisionCount}</div>
                  <div className="text-sm text-muted-foreground">Revisions</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">
                    {submission.submittedAt.toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Submitted</div>
                </div>
              </div>

              {/* Essay content */}
              <div className="space-y-2">
                <h3 className="font-medium">Essay Content</h3>
                <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
                  <div className="whitespace-pre-wrap text-sm">
                    {submission.essayText}
                  </div>
                </div>
              </div>

              {/* Requirements check */}
              <div className="space-y-2">
                <h3 className="font-medium">Requirements Check</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {submission.wordCount >= activity.settings.minWords && 
                     submission.wordCount <= activity.settings.maxWords ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm">
                      Word count: {submission.wordCount} 
                      (Required: {activity.settings.minWords}-{activity.settings.maxWords})
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Submitted on time: {submission.submittedAt.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="ai-analysis" className="space-y-4">
            {submission.aiScore !== undefined ? (
              <div className="space-y-4">
                {/* AI Score */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{submission.aiScore}</div>
                    <div className="text-sm text-muted-foreground">AI Score</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {Math.round((submission.aiConfidence || 0) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <BloomsTaxonomyBadge level={submission.aiBloomsLevel || activity.bloomsLevel} />
                    <div className="text-sm text-muted-foreground mt-1">Detected Level</div>
                  </div>
                </div>

                {/* AI Feedback */}
                <div className="space-y-2">
                  <h3 className="font-medium">AI Feedback</h3>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="whitespace-pre-wrap text-sm">
                      {submission.aiFeedback}
                    </div>
                  </div>
                </div>

                {/* Manual Review Required */}
                {submission.requiresManualReview && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This submission requires manual review due to low AI confidence or complex content.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No AI Analysis Available</h3>
                <p className="text-muted-foreground mb-4">
                  This essay hasn't been analyzed by AI yet.
                </p>
                <Button 
                  onClick={handleRequestAIGrading}
                  disabled={isRequestingAI}
                >
                  {isRequestingAI ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Request AI Analysis
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Manual Grading Tab */}
          <TabsContent value="manual-grade" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Score Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Score (0-100)</label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={manualScore}
                    onChange={(e) => setManualScore(parseInt(e.target.value) || 0)}
                    placeholder="Enter score..."
                  />
                </div>

                {/* Bloom's Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Demonstrated Bloom's Level</label>
                  <BloomsTaxonomySelector
                    value={manualBloomsLevel}
                    onChange={setManualBloomsLevel}
                  />
                </div>
              </div>

              {/* Feedback */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Detailed Feedback</label>
                <Textarea
                  value={manualFeedback}
                  onChange={(e) => setManualFeedback(e.target.value)}
                  placeholder="Provide detailed feedback on the student's essay..."
                  className="min-h-[200px]"
                />
                <div className="text-xs text-muted-foreground">
                  {manualFeedback.length} characters (minimum 10 required)
                </div>
              </div>

              {/* AI Comparison */}
              {submission.aiScore !== undefined && (
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    <strong>AI suggested:</strong> {submission.aiScore}/100 with {Math.round((submission.aiConfidence || 0) * 100)}% confidence
                    {manualScore !== submission.aiScore && (
                      <span className="text-orange-600 ml-2">
                        (Your score differs by {Math.abs(manualScore - submission.aiScore)} points)
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit Grade */}
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2">
                  {submission.aiScore !== undefined && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setManualScore(submission.aiScore!);
                        setManualFeedback(submission.aiFeedback || '');
                        setManualBloomsLevel(submission.aiBloomsLevel || activity.bloomsLevel);
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Use AI Grade
                    </Button>
                  )}
                </div>

                <Button 
                  onClick={handleSubmitGrade}
                  disabled={isGrading || manualFeedback.trim().length < 10}
                >
                  {isGrading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Submit Grade
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <div className="text-center p-6 bg-muted rounded-lg">
                <div className="text-4xl font-bold mb-2">{manualScore}/100</div>
                <div className="text-lg text-muted-foreground">Final Score</div>
                <BloomsTaxonomyBadge level={manualBloomsLevel} className="mt-2" />
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="font-medium">Feedback Preview</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="whitespace-pre-wrap text-sm">
                    {manualFeedback || 'No feedback provided yet.'}
                  </div>
                </div>
              </div>

              {submission.aiScore !== undefined && manualScore !== submission.aiScore && (
                <Alert>
                  <User className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Manual Override:</strong> Teacher score ({manualScore}) differs from AI score ({submission.aiScore})
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
