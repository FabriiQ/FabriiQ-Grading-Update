/**
 * Essay Activity Editor Component
 * 
 * Production-ready editor for creating essay activities with AI grading,
 * Bloom's taxonomy integration, and rubric support.
 */

'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Target, Clock } from 'lucide-react';
import { BloomsTaxonomySelector } from '@/features/bloom/components/taxonomy/BloomsTaxonomySelector';
import { RubricSelector } from '@/features/bloom/components/rubrics/RubricSelector';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { EssayActivity, createDefaultEssayActivity } from '../../models/essay';
import { useToast } from '@/components/ui/feedback/toast';

// Simplified form schema for essay-specific configuration only
// Basic fields (title, description, duration) are handled by UnifiedActivityCreator
const essayConfigSchema = z.object({
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  prompt: z.string().min(20, 'Essay prompt must be at least 20 characters'),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
  minWords: z.number().min(50, 'Minimum words must be at least 50'),
  maxWords: z.number().min(100, 'Maximum words must be at least 100'),
  rubricId: z.string().optional(),
  enableAIGrading: z.boolean().default(true),
  requireManualReview: z.boolean().default(false),
  aiConfidenceThreshold: z.number().min(0.1).max(1).default(0.7),
  showWordCount: z.boolean().default(true),
  allowSaveProgress: z.boolean().default(true),
});

type EssayConfigValues = z.infer<typeof essayConfigSchema>;

interface EssayEditorProps {
  initialActivity?: Partial<EssayActivity>;
  onSave?: (activity: EssayActivity) => void;
  onCancel?: () => void;
  className?: string;
  // New props for integration with UnifiedActivityCreator
  config?: any;
  onChange?: (config: any) => void;
  standalone?: boolean; // Whether to render as standalone component with its own form
}

export function EssayEditor({
  initialActivity,
  onSave,
  className = '',
  config,
  onChange,
  standalone = true,
}: EssayEditorProps) {
  const { toast } = useToast();

  // Initialize with default values
  const defaultActivity = createDefaultEssayActivity();
  const mergedActivity = { ...defaultActivity, ...initialActivity, ...config };

  const form = useForm<EssayConfigValues>({
    resolver: zodResolver(essayConfigSchema),
    defaultValues: {
      instructions: mergedActivity.instructions || '',
      prompt: mergedActivity.prompt || '',
      bloomsLevel: mergedActivity.bloomsLevel || BloomsTaxonomyLevel.ANALYZE,
      minWords: mergedActivity.settings?.minWords || 200,
      maxWords: mergedActivity.settings?.maxWords || 1000,
      rubricId: mergedActivity.settings?.rubricId,
      enableAIGrading: mergedActivity.settings?.aiGrading?.enabled ?? true,
      requireManualReview: mergedActivity.settings?.manualGrading?.requiresManualReview ?? false,
      aiConfidenceThreshold: mergedActivity.settings?.aiGrading?.confidenceThreshold ?? 0.7,
      showWordCount: mergedActivity.settings?.showWordCount ?? true,
      allowSaveProgress: mergedActivity.settings?.allowSaveProgress ?? true,
    },
  });

  // Handle form changes for embedded mode
  const handleFormChange = React.useCallback(() => {
    if (onChange && !standalone) {
      const currentValues = form.getValues();
      onChange(currentValues);
    }
  }, [onChange, standalone, form]);

  const onSubmit = async (values: EssayConfigValues) => {
    // Validate word count range
    if (values.minWords >= values.maxWords) {
      toast({
        title: 'Invalid word count range',
        description: 'Maximum words must be greater than minimum words.',
        variant: 'error'
      });
      return;
    }

    // When used in standalone mode, create full activity
    if (standalone && onSave) {
      try {
        const activity: EssayActivity = {
          id: mergedActivity.id,
          title: mergedActivity.title || 'Essay Activity',
          activityType: 'essay',
          description: mergedActivity.description || '',
          instructions: values.instructions,
          prompt: values.prompt,
          bloomsLevel: values.bloomsLevel,
          isGradable: true,
          settings: {
            minWords: values.minWords,
            maxWords: values.maxWords,
            rubricId: values.rubricId,
            showWordCount: values.showWordCount,
            allowSaveProgress: values.allowSaveProgress,
            allowDrafts: true,
            allowRevisions: true,
            maxRevisions: 5,
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
            aiGrading: {
              enabled: values.enableAIGrading,
              model: 'gpt-4',
              confidenceThreshold: values.aiConfidenceThreshold,
              gradingCriteria: [],
              feedbackLevel: 'detailed',
              enableBloomsDetection: true,
            },
            manualGrading: {
              enabled: true,
              requiresManualReview: values.requireManualReview,
              rubricId: values.rubricId,
              allowTeacherOverride: true,
              gradingWorkflow: values.enableAIGrading
                ? (values.requireManualReview ? 'hybrid' : 'ai_first')
                : 'manual_only',
            },
            advanced: {
              enablePlagiarismCheck: false,
              plagiarismThreshold: 80,
              enableAIDetection: false,
              aiDetectionThreshold: 70,
              enableVersionHistory: true,
              enableCollaboration: false,
              maxCollaborators: 1,
            },
            analytics: {
              trackWritingProcess: true,
              trackRevisions: true,
              generateInsights: true,
              shareInsightsWithStudent: true,
            },
          },
          metadata: {
            difficulty: 'medium',
            estimatedTime: Math.ceil((values.minWords + values.maxWords) / 2 / 20),
            version: '1.0.0',
            gradingCriteria: [],
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
      }
    }
  };



  // Create the form content for embedded mode (without FormField components)
  const embeddedContent = (
    <>
      {/* Essay-Specific Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Essay Configuration</h3>

        <div className="space-y-2">
          <label className="text-sm font-medium">Instructions for Students</label>
          <Textarea
            placeholder="Provide clear instructions on how to complete this essay..."
            className="min-h-[100px]"
            value={form.watch('instructions')}
            onChange={(e) => {
              form.setValue('instructions', e.target.value);
              handleFormChange();
            }}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Essay Prompt</label>
          <Textarea
            placeholder="Write the essay prompt or question that students will respond to..."
            className="min-h-[120px]"
            value={form.watch('prompt')}
            onChange={(e) => {
              form.setValue('prompt', e.target.value);
              handleFormChange();
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

        <div className="space-y-2">
          <label className="text-sm font-medium">Target Cognitive Level</label>
          <BloomsTaxonomySelector
            value={form.watch('bloomsLevel')}
            onChange={(value) => {
              form.setValue('bloomsLevel', value);
              handleFormChange();
            }}
            showDescription={true}
          />
        </div>
      </div>

      <Separator />

      {/* Essay Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Target className="h-5 w-5" />
          Essay Requirements
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Minimum Words</label>
            <Input
              type="number"
              placeholder="200"
              value={form.watch('minWords')}
              onChange={(e) => {
                form.setValue('minWords', parseInt(e.target.value) || 0);
                handleFormChange();
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Maximum Words</label>
            <Input
              type="number"
              placeholder="1000"
              value={form.watch('maxWords')}
              onChange={(e) => {
                form.setValue('maxWords', parseInt(e.target.value) || 0);
                handleFormChange();
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Time Limit (minutes) - Optional</label>
          <Input
            type="number"
            placeholder="60"
            value={form.watch('timeLimit') || ''}
            onChange={(e) => {
              form.setValue('timeLimit', e.target.value ? parseInt(e.target.value) : undefined);
              handleFormChange();
            }}
          />
        </div>
      </div>

      <Separator />

      {/* AI Grading Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">AI Grading & Assessment</h3>

        <div className="flex flex-row items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <label className="text-base font-medium">Enable AI Grading</label>
            <div className="text-sm text-muted-foreground">
              Use AI to automatically grade and provide feedback on essays
            </div>
          </div>
          <Switch
            checked={form.watch('enableAIGrading')}
            onCheckedChange={(checked) => {
              form.setValue('enableAIGrading', checked);
              handleFormChange();
            }}
          />
        </div>

        {form.watch('enableAIGrading') && (
          <>
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <label className="text-base font-medium">Require Manual Review</label>
                <div className="text-sm text-muted-foreground">
                  Always require teacher review even for high-confidence AI grades
                </div>
              </div>
              <Switch
                checked={form.watch('requireManualReview')}
                onCheckedChange={(checked) => {
                  form.setValue('requireManualReview', checked);
                  handleFormChange();
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">AI Confidence Threshold</label>
              <Select
                value={form.watch('aiConfidenceThreshold').toString()}
                onValueChange={(value) => {
                  form.setValue('aiConfidenceThreshold', parseFloat(value));
                  handleFormChange();
                }}
              >
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
            </div>
          </>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Grading Rubric (Optional)</label>
          <RubricSelector
            value={form.watch('rubricId')}
            onChange={(value) => {
              form.setValue('rubricId', value);
              handleFormChange();
            }}
            placeholder="Select a rubric for grading..."
          />
        </div>
      </div>

      <Separator />

      {/* Student Experience Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Student Experience</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <label className="text-base font-medium">Show Word Count</label>
              <div className="text-sm text-muted-foreground">
                Display real-time word count to students
              </div>
            </div>
            <Switch
              checked={form.watch('showWordCount')}
              onCheckedChange={(checked) => {
                form.setValue('showWordCount', checked);
                handleFormChange();
              }}
            />
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <label className="text-base font-medium">Allow Save Progress</label>
              <div className="text-sm text-muted-foreground">
                Let students save drafts and continue later
              </div>
            </div>
            <Switch
              checked={form.watch('allowSaveProgress')}
              onCheckedChange={(checked) => {
                form.setValue('allowSaveProgress', checked);
                handleFormChange();
              }}
            />
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div className="flex items-center gap-2 pt-4">
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Est. {Math.ceil((form.watch('minWords') + form.watch('maxWords')) / 2 / 20)} min
        </Badge>
        <Badge variant="outline">
          {form.watch('bloomsLevel')}
        </Badge>
      </div>
    </>
  );

  // Create the standalone form content (with FormField components)
  const standaloneFormContent = (
    <>
      {/* Essay-Specific Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Essay Configuration</h3>

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

      {/* Activity Summary */}
      <div className="flex items-center gap-2 pt-4">
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Est. {Math.ceil((form.watch('minWords') + form.watch('maxWords')) / 2 / 20)} min
        </Badge>
        <Badge variant="outline">
          {form.watch('bloomsLevel')}
        </Badge>
      </div>
    </>
  );

  // Render based on standalone mode
  if (standalone) {
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
              {standaloneFormContent}
            </form>
          </Form>
        </CardContent>
      </Card>
    );
  }

  // When used within UnifiedActivityCreator, return embedded content without form wrapper
  return embeddedContent;
}
