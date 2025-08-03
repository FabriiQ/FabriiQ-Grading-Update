/**
 * Essay Activity Editor Component
 * 
 * Production-ready editor for creating essay activities with AI grading,
 * Bloom's taxonomy integration, and rubric support.
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, FileText, Target, Clock } from 'lucide-react';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { RubricSelector } from '@/features/bloom/components/rubrics/RubricSelector';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { EssayActivity, createDefaultEssayActivity } from '../../models/essay';
import { useToast } from '@/components/ui/feedback/toast';
import { AIActivityGeneratorButton } from '@/features/ai-question-generator/components/AIActivityGeneratorButton';

// Form schema for essay activity creation
const essayFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  prompt: z.string().min(20, 'Essay prompt must be at least 20 characters'),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
  minWords: z.number().min(50, 'Minimum words must be at least 50'),
  maxWords: z.number().min(100, 'Maximum words must be at least 100'),
  timeLimit: z.number().min(10, 'Time limit must be at least 10 minutes').optional(),
  rubricId: z.string().optional(),
  enableAIGrading: z.boolean().default(true),
  requireManualReview: z.boolean().default(false),
  aiConfidenceThreshold: z.number().min(0.1).max(1).default(0.7),
  showWordCount: z.boolean().default(true),
  allowSaveProgress: z.boolean().default(true),
});

type EssayFormValues = z.infer<typeof essayFormSchema>;

interface EssayEditorProps {
  initialActivity?: Partial<EssayActivity>;
  onSave: (activity: EssayActivity) => void;
  onCancel?: () => void;
  className?: string;
}

export function EssayEditor({
  initialActivity,
  onSave,
  onCancel,
  className = '',
}: EssayEditorProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize with default values
  const defaultActivity = createDefaultEssayActivity();
  const mergedActivity = { ...defaultActivity, ...initialActivity };

  const form = useForm<EssayFormValues>({
    resolver: zodResolver(essayFormSchema),
    defaultValues: {
      title: mergedActivity.title,
      description: mergedActivity.description || '',
      instructions: mergedActivity.instructions || '',
      prompt: mergedActivity.prompt || '',
      bloomsLevel: mergedActivity.bloomsLevel || BloomsTaxonomyLevel.ANALYZE,
      minWords: mergedActivity.settings.minWords || 200,
      maxWords: mergedActivity.settings.maxWords || 1000,
      timeLimit: mergedActivity.settings.timeLimit,
      rubricId: mergedActivity.settings.rubricId,
      enableAIGrading: mergedActivity.settings.aiGrading.enabled ?? true,
      requireManualReview: mergedActivity.settings.manualGrading.requiresManualReview ?? false,
      aiConfidenceThreshold: mergedActivity.settings.aiGrading.confidenceThreshold ?? 0.7,
      showWordCount: mergedActivity.settings.showWordCount ?? true,
      allowSaveProgress: mergedActivity.settings.allowSaveProgress ?? true,
    },
  });

  const onSubmit = async (values: EssayFormValues) => {
    setIsSubmitting(true);

    try {
      // Validate word count range
      if (values.minWords >= values.maxWords) {
        toast({
          title: 'Invalid word count range',
          description: 'Maximum words must be greater than minimum words.',
          variant: 'error'
        });
        return;
      }

      // Create essay activity
      const activity: EssayActivity = {
        id: mergedActivity.id,
        title: values.title,
        activityType: 'essay',
        description: values.description,
        instructions: values.instructions,
        prompt: values.prompt,
        bloomsLevel: values.bloomsLevel,
        isGradable: true,
        settings: {
          minWords: values.minWords,
          maxWords: values.maxWords,
          timeLimit: values.timeLimit,
          rubricId: values.rubricId,
          showWordCount: values.showWordCount,
          allowSaveProgress: values.allowSaveProgress,

          // Draft and revision settings
          allowDrafts: true,
          allowRevisions: true,
          maxRevisions: 5,

          // Submission settings
          submission: {
            allowLateSubmissions: false,
            latePenalty: 10,
            maxLateDays: 3,
            requireConfirmation: true,
            showWordCount: values.showWordCount,
            showTimeRemaining: true,
            autoSave: true,
            autoSaveInterval: 30,
          },

          // AI grading settings
          aiGrading: {
            enabled: values.enableAIGrading,
            model: 'gpt-4',
            confidenceThreshold: values.aiConfidenceThreshold,
            gradingCriteria: mergedActivity.settings.aiGrading.gradingCriteria || [],
            feedbackLevel: 'detailed',
            enableBloomsDetection: true,
          },

          // Manual grading settings
          manualGrading: {
            enabled: true,
            requiresManualReview: values.requireManualReview,
            rubricId: values.rubricId,
            allowTeacherOverride: true,
            gradingWorkflow: values.enableAIGrading
              ? (values.requireManualReview ? 'hybrid' : 'ai_first')
              : 'manual_only',
          },

          // Advanced features
          advanced: {
            enablePlagiarismCheck: false,
            plagiarismThreshold: 80,
            enableAIDetection: false,
            aiDetectionThreshold: 70,
            enableVersionHistory: true,
            enableCollaboration: false,
            maxCollaborators: 1,
          },

          // Analytics settings
          analytics: {
            trackWritingProcess: true,
            trackRevisions: true,
            generateInsights: true,
            shareInsightsWithStudent: true,
          },
        },
        metadata: {
          difficulty: 'medium',
          estimatedTime: Math.ceil((values.minWords + values.maxWords) / 2 / 20), // Rough estimate: 20 words per minute
          version: mergedActivity.metadata?.version || '1.0.0',
          gradingCriteria: mergedActivity.metadata?.gradingCriteria || [],
          aiGradingEnabled: values.enableAIGrading,
          confidenceThreshold: values.aiConfidenceThreshold,
          expectedLength: {
            min: values.minWords,
            max: values.maxWords,
          },
        },
        createdAt: mergedActivity.createdAt || new Date(),
        updatedAt: new Date(),
      };

      onSave(activity);
      
      toast({
        title: 'Essay activity created',
        description: 'Your essay activity has been created successfully.',
        variant: 'success'
      });
    } catch (error) {
      console.error('Error creating essay activity:', error);
      toast({
        title: 'Error creating activity',
        description: 'There was an error creating your essay activity. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle AI-generated content
  const handleAIContentGenerated = (content: any) => {
    if (content.prompts && Array.isArray(content.prompts) && content.prompts.length > 0) {
      const prompt = content.prompts[0];

      // Update form with AI-generated content
      form.setValue('prompt', prompt.prompt);
      if (prompt.instructions) {
        form.setValue('instructions', prompt.instructions);
      }
      if (prompt.wordLimit) {
        if (prompt.wordLimit.min) form.setValue('minWords', prompt.wordLimit.min);
        if (prompt.wordLimit.max) form.setValue('maxWords', prompt.wordLimit.max);
      }
      if (prompt.timeLimit) {
        form.setValue('timeLimit', prompt.timeLimit);
      }
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Create Essay Activity
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activity Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter essay activity title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what this essay activity is about..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instructions for Students</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Provide clear instructions on how to complete this essay..."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Essay Prompt</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write the essay prompt or question that students will respond to..."
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Essay Prompt Generator */}
              <div className="mt-4">
                <AIActivityGeneratorButton
                  activityType="essay"
                  activityTitle={form.watch('title') || 'Essay Activity'}
                  selectedTopics={[form.watch('title') || 'Essay Topic']}
                  selectedLearningOutcomes={[form.watch('description') || 'Write a comprehensive essay']}
                  selectedBloomsLevel={form.watch('bloomsLevel') || BloomsTaxonomyLevel.ANALYZE}
                  selectedActionVerbs={['analyze', 'evaluate', 'argue', 'discuss', 'explain']}
                  onContentGenerated={handleAIContentGenerated}
                  onError={(error) => {
                    console.error('AI Content Generation Error:', error);
                  }}
                />
              </div>
            </div>

            <Separator />

            {/* Bloom's Taxonomy */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Target className="h-5 w-5" />
                Bloom's Taxonomy Level
              </h3>
              
              <FormField
                control={form.control}
                name="bloomsLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Cognitive Level</FormLabel>
                    <FormControl>
                      <BloomsTaxonomySelector
                        value={field.value}
                        onChange={field.onChange}
                        showDescription={true}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Essay Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Target className="h-5 w-5" />
                Essay Requirements
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minWords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Words</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="200"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxWords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Words</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="1000"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="timeLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Limit (minutes) - Optional</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="60"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* AI Grading Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">AI Grading & Assessment</h3>
              
              <FormField
                control={form.control}
                name="enableAIGrading"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable AI Grading</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Use AI to automatically grade and provide feedback on essays
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch('enableAIGrading') && (
                <>
                  <FormField
                    control={form.control}
                    name="requireManualReview"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Require Manual Review</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Always require teacher review even for high-confidence AI grades
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="aiConfidenceThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>AI Confidence Threshold</FormLabel>
                        <FormControl>
                          <Select value={field.value.toString()} onValueChange={(value) => field.onChange(parseFloat(value))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0.5">50% - Low (More manual reviews)</SelectItem>
                              <SelectItem value="0.7">70% - Medium (Balanced)</SelectItem>
                              <SelectItem value="0.8">80% - High (Fewer manual reviews)</SelectItem>
                              <SelectItem value="0.9">90% - Very High (Minimal manual reviews)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <FormField
                control={form.control}
                name="rubricId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grading Rubric (Optional)</FormLabel>
                    <FormControl>
                      <RubricSelector
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select a rubric for grading..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Student Experience Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Student Experience</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="showWordCount"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Show Word Count</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Display real-time word count to students
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="allowSaveProgress"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Save Progress</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Let students save drafts and continue later
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Est. {Math.ceil((form.watch('minWords') + form.watch('maxWords')) / 2 / 20)} min
                </Badge>
                <Badge variant="outline">
                  {form.watch('bloomsLevel')}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting ? 'Creating...' : 'Create Essay Activity'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
