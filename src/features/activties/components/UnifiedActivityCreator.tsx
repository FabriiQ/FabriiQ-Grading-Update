'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/forms/input';
import { Textarea } from '@/components/ui/forms/textarea';
import { Button } from '@/components/ui/atoms/button';
import { Switch } from '@/components/ui/forms/switch';
import { DatePicker } from '@/components/ui/forms/date-picker';
import { Spinner } from '@/components/ui/atoms/spinner';
import { useToast } from '@/components/ui/feedback/toast';
import { ErrorBoundary } from 'react-error-boundary';
import { Suspense } from 'react';
import { ActivityErrorBoundary } from './error-handling/ActivityErrorBoundary';
import { handleActivityError, handleTRPCError } from '../services/error-handling.service';
import { ActivityCreatorSkeleton, ProgressiveActivityLoader } from './loading/ActivitySkeletons';
import { useAdvancedLoading, useDebouncedLoading } from '../hooks/useAdvancedLoading';
import { usePerformanceOptimization, useLazyComponent, useDebounce } from '../hooks/usePerformanceOptimization';
import { useSecurity, useInputValidation, useRateLimit, useAuditLog } from '../hooks/useSecurity';
import { Permission } from '../services/security.service';
import { ActivityPurpose } from '@/server/api/constants';
import { api } from '@/trpc/react';

// Import the API integration utilities
import { prepareActivityCreateData, validateActivityData } from '@/components/teacher/activities/enhanced/utils/api-integration';
import { AchievementConfigEditor, type AchievementConfig } from './achievement/AchievementConfigEditor';

// Import enhanced selectors from assessment creator
import { SubjectSelector } from '@/features/assessments/components/creation/dialog-steps/SubjectSelector';
import { TopicSelector } from '@/features/assessments/components/creation/dialog-steps/TopicSelector';

// Define ActivityTypeDefinition interface to replace the old one
interface ActivityTypeDefinition<T> {
  id: string;
  name: string;
  description: string;
  category: string;
  schema: any;
  defaultValue: T;
  capabilities: {
    isGradable: boolean;
    hasSubmission: boolean;
    hasInteraction: boolean;
    hasRealTimeComponents: boolean;
  };
  components: {
    editor: React.ComponentType<any> | null;
    viewer: React.ComponentType<any> | null;
  };
  icon: string;
  version: string;
}

// Define the form schema
const activityCommonFieldsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  purpose: z.nativeEnum(ActivityPurpose),
  isGradable: z.boolean().default(false),
  maxScore: z.number().optional(),
  passingScore: z.number().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
});

type ActivityFormValues = z.infer<typeof activityCommonFieldsSchema>;

interface UnifiedActivityCreatorProps {
  activityTypeId: string;
  classId: string;
  subjectId?: string;
  topicId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function UnifiedActivityCreatorCore({
  activityTypeId,
  classId,
  subjectId,
  topicId,
  onSuccess,
  onCancel
}: UnifiedActivityCreatorProps) {
  // Advanced loading states
  const {
    stage: loadingStage,
    isLoading,
    startLoading,
    forceComplete,
    stopWithError,
    setStage,
  } = useAdvancedLoading({
    stages: [
      { stage: 'initializing', message: 'Initializing activity creator...', duration: 300 },
      { stage: 'loading-data', message: 'Loading activity type data...', duration: 400 },
      { stage: 'processing', message: 'Processing configuration...', duration: 200 },
      { stage: 'rendering', message: 'Rendering components...', duration: 100 },
    ],
    onComplete: () => {
      console.log('Activity creator loaded successfully');
    },
  });

  const { showLoading: showSubmissionLoading, startLoading: startSubmissionLoading, stopLoading: stopSubmissionLoading } = useDebouncedLoading(150);

  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // State for selected subject and topic
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjectId || '');
  const [selectedTopicId, setSelectedTopicId] = useState<string>(topicId || '');

  // Performance optimizations
  const { warmUpCache, preloadData } = usePerformanceOptimization();
  const debouncedClassId = useDebounce(classId, 300);
  const debouncedSubjectId = useDebounce(selectedSubjectId, 300);

  // Security and access control
  const { hasPermission, canAccessResource, userId } = useSecurity();
  const { sanitizeInput, validateFileName } = useInputValidation();
  const { checkRateLimit, isLimited } = useRateLimit(20, 60000); // 20 requests per minute
  const { logAction } = useAuditLog();

  // Create a default activity type definition
  const activityType = useMemo<ActivityTypeDefinition<any> | null>(() => {
    try {
      console.log(`UnifiedActivityCreator: Creating activity type for ${activityTypeId}`);

      // Create a default activity type definition
      return {
        id: activityTypeId,
        name: activityTypeId.charAt(0).toUpperCase() + activityTypeId.slice(1).replace(/-/g, ' '),
        description: `${activityTypeId} activity`,
        category: ActivityPurpose.LEARNING,
        schema: { parse: () => ({}) } as any,
        defaultValue: {},
        capabilities: {
          isGradable: true,
          hasSubmission: true,
          hasInteraction: true,
          hasRealTimeComponents: false
        },
        components: {
          editor: null as any,
          viewer: null as any
        },
        icon: 'activity',
        version: '1.0.0'
      } as ActivityTypeDefinition<any>;
    } catch (err) {
      console.error('Failed to create activity type:', err);
      setError('Failed to create activity type');
      return null;
    }
  }, [activityTypeId]);

  // State for activity configuration
  const [config, setConfig] = useState<any>({});

  // State for achievement configuration
  const [achievementConfig, setAchievementConfig] = useState<AchievementConfig>({
    enableAchievements: true,
    enablePointsAnimation: true,
    celebrationLevel: 'standard',
    basePoints: 20,
    customPointsMultiplier: 1.0,
    bonusPointsForPerfectScore: 10,
    bonusPointsForSpeed: 5,
    bonusPointsForFirstAttempt: 5,
    enablePerfectScoreAchievement: true,
    enableSpeedAchievement: true,
    enableFirstAttemptAchievement: true,
    enableImprovementAchievement: true,
    speedBonusThreshold: 60,
    estimatedPoints: { minimum: 20, average: 30, maximum: 40 }
  });

  // Determine if activity is gradable and requires teacher review
  const isGradable = activityType?.capabilities?.isGradable ?? false;
  const requiresTeacherReview = activityType?.capabilities?.hasSubmission ?? false;

  // Dynamic editor component loading
  const [editorComponent, setEditorComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    const loadActivityType = async () => {
      startLoading();

      try {
        setStage('loading-data', 'Loading activity type configuration...');

        // Simulate some loading time for better UX
        await new Promise(resolve => setTimeout(resolve, 200));

        setStage('processing', 'Processing activity type...');

        // Try to dynamically import the editor component
        try {
          const editorModule = await import(`@/features/activties/components/${activityTypeId}/${activityTypeId.charAt(0).toUpperCase() + activityTypeId.slice(1).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}Editor.tsx`);
          setEditorComponent(() => editorModule.default || editorModule[Object.keys(editorModule)[0]]);
        } catch (error) {
          console.warn(`No specific editor found for ${activityTypeId}, using default configuration`);
        }

        setStage('rendering', 'Finalizing setup...');

        // Small delay before completing
        await new Promise(resolve => setTimeout(resolve, 100));

        forceComplete();
      } catch (error) {
        console.error(`Error loading activity type ${activityTypeId}:`, error);
        stopWithError('Failed to load activity type');
      }
    };

    loadActivityType();
  }, [activityTypeId]); // Only depend on activityTypeId to prevent infinite loops

  // Create activity mutation
  const createActivity = api.activity.create.useMutation({
    onSuccess: () => {
      stopSubmissionLoading();
      toast({
        title: 'Activity created',
        description: 'The activity has been created successfully.',
      });
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: async (error) => {
      stopSubmissionLoading();
      const errorResult = await handleActivityError(new Error(error.message || 'Unknown error'), {
        component: 'UnifiedActivityCreator',
        action: 'createActivity',
        metadata: { activityType: activityTypeId, classId },
      });

      toast({
        title: 'Error',
        description: errorResult.userMessage,
        variant: 'error',
      });
    },
  });

  // Fetch subjects for the class with performance optimization
  const { data: subjects = [] } = api.subject.getAllSubjects.useQuery(
    undefined,
    {
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    }
  );

  // Fetch topics for the selected subject
  const { data: topics } = api.subjectTopic.getHierarchy.useQuery(
    { subjectId: selectedSubjectId },
    {
      enabled: !!selectedSubjectId,
      staleTime: 1000 * 60 * 10, // 10 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    }
  );

  // Form for common fields
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activityCommonFieldsSchema),
    defaultValues: {
      title: '',
      description: '',
      purpose: activityType?.category as ActivityPurpose,
      isGradable,
      maxScore: isGradable ? 100 : undefined,
      passingScore: isGradable ? 60 : undefined,
      startDate: undefined,
      endDate: undefined,
      duration: 30, // Default duration in minutes
    }
  });

  // Update the selected subject ID when the form value changes
  useEffect(() => {
    if (subjectId) {
      setSelectedSubjectId(subjectId);
    }
  }, [subjectId]);

  // Warm up cache when component mounts
  useEffect(() => {
    if (classId) {
      warmUpCache(classId);

      // Preload common activity types
      preloadData([
        `activity-types-${activityTypeId}`,
        `class-subjects-${classId}`,
        `activity-templates-${activityTypeId}`,
      ]);
    }
  }, [classId, activityTypeId]); // Remove function dependencies to prevent infinite loops

  // Handle form submission
  const onSubmit = async (data: ActivityFormValues) => {
    // Security checks
    if (!hasPermission(Permission.CREATE_ACTIVITY)) {
      toast({
        title: 'Access Denied',
        description: 'You do not have permission to create activities',
        variant: 'error',
      });
      return;
    }

    if (!checkRateLimit()) {
      toast({
        title: 'Rate Limit Exceeded',
        description: 'Too many requests. Please wait before trying again.',
        variant: 'error',
      });
      return;
    }

    if (!activityType) {
      toast({
        title: 'Error',
        description: 'Activity type not found',
        variant: 'error',
      });
      return;
    }

    startSubmissionLoading();

    // Sanitize input data for security
    const sanitizedData = {
      ...data,
      title: sanitizeInput(data.title),
      description: data.description ? sanitizeInput(data.description) : undefined,
    };

    // Prepare activity data
    const activityData = {
      ...sanitizedData,
      classId,
      subjectId: selectedSubjectId,
      topicId: selectedTopicId || '',
      activityType: activityTypeId,
      content: config,
      settings: {
        isGradable: sanitizedData.isGradable,
        maxScore: sanitizedData.maxScore,
        passingScore: sanitizedData.passingScore,
        duration: sanitizedData.duration,
      },
      achievementConfig: achievementConfig,
    };

    console.log('Submitting activity data:', activityData);

    const validation = validateActivityData(activityData, activityTypeId);
    if (!validation.isValid) {
      toast({
        title: 'Validation Error',
        description: validation.errors?.join('\n') || 'Please check the form for errors',
        variant: 'error',
      });
      stopSubmissionLoading();
      return;
    }

    try {
      // Prepare activity data for creation
      const preparedData = prepareActivityCreateData(activityData);

      // Log activity creation attempt
      await logAction({
        type: 'ACTIVITY_CREATE_ATTEMPT',
        resource: 'activity',
        details: {
          activityType: activityTypeId,
          classId,
          title: sanitizedData.title,
        },
      });

      // Create activity with prepared data
      const result = await createActivity.mutateAsync(preparedData);

      // Log successful creation
      await logAction({
        type: 'ACTIVITY_CREATED',
        resource: 'activity',
        resourceId: result.id,
        details: {
          activityType: activityTypeId,
          classId,
          title: sanitizedData.title,
        },
      });
    } catch (error) {
      console.error('Error creating activity:', error);

      // Log failed creation
      await logAction({
        type: 'ACTIVITY_CREATE_FAILED',
        resource: 'activity',
        details: {
          activityType: activityTypeId,
          classId,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      stopSubmissionLoading();
    }
  };

  // Handle loading state
  if (isLoading && loadingStage !== 'complete') {
    const validStage = loadingStage === 'idle' || loadingStage === 'error' || loadingStage === 'processing'
      ? 'initializing'
      : loadingStage as 'initializing' | 'loading-data' | 'rendering' | 'complete';
    return <ProgressiveActivityLoader stage={validStage} />;
  }

  // Handle error state
  if (error || !activityType) {
    return (
      <div className="p-4 border rounded-md bg-red-50 text-red-500">
        <h3 className="text-lg font-medium mb-2">Error Loading Activity Type</h3>
        <p className="mb-4">{error || `Activity type with ID ${activityTypeId} not found`}</p>
        <p className="mb-4">This could be because the activity registry hasn't been properly initialized or the activity type doesn't exist.</p>
        <Button className="mt-2" onClick={onCancel}>Go Back</Button>
      </div>
    );
  }

  // Get editor component
  const EditorComponent = activityType?.components?.editor;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Common fields */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the basic details for this activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter activity title" {...field} />
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
                      placeholder="Enter activity description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(date) => field.onChange(date)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={(date) => field.onChange(date)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="30"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>
                    Expected time for students to complete this activity
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Subject Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Subject Selection</CardTitle>
            <CardDescription>Choose the subject for this activity</CardDescription>
          </CardHeader>
          <CardContent>
            <SubjectSelector
              subjects={subjects}
              selectedSubjectId={selectedSubjectId}
              onSelect={setSelectedSubjectId}
              isLoading={!subjects}
            />
          </CardContent>
        </Card>

        {/* Topic Selection */}
        {selectedSubjectId && (
          <Card>
            <CardHeader>
              <CardTitle>Topic Selection</CardTitle>
              <CardDescription>Choose a topic for this activity (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <TopicSelector
                subjectId={selectedSubjectId}
                selectedTopicId={selectedTopicId}
                selectedTopicIds={selectedTopicId ? [selectedTopicId] : []}
                onSelect={setSelectedTopicId}
                onSelectMultiple={(ids) => setSelectedTopicId(ids[0] || '')}
                allowMultiple={false}
                isLoading={!!selectedSubjectId && !topics}
                maxHeight="300px"
              />
            </CardContent>
          </Card>
        )}

        {/* Grading Options */}
        {isGradable && (
          <Card>
            <CardHeader>
              <CardTitle>Grading Settings</CardTitle>
              <CardDescription>Configure how this activity will be graded</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isGradable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Grading</FormLabel>
                      <FormDescription>
                        This activity will be graded and contribute to student scores
                      </FormDescription>
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

              {form.watch('isGradable') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Score</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
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
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="60"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity-specific editor */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Configuration</CardTitle>
            <CardDescription>Configure the specific settings for this {activityType.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="p-4 text-center">Loading editor...</div>}>
              <ErrorBoundary fallback={<div className="p-4 text-red-500">Failed to load editor component</div>}>
                {loadingStage === 'loading-data' || loadingStage === 'processing' ? (
                  <div className="p-4 text-center">
                    <Spinner className="h-8 w-8 mx-auto mb-4" />
                    <p>Loading activity editor...</p>
                  </div>
                ) : EditorComponent ? (
                  <EditorComponent
                    config={config}
                    onChange={setConfig}
                    standalone={false}
                  />
                ) : editorComponent ? (
                  <div className="border p-4 rounded-md">
                    {React.createElement(editorComponent, {
                      config,
                      onChange: setConfig,
                      standalone: false,
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    <p>No editor component available for {activityType.name}</p>
                    <p className="text-sm mt-2">
                      You can still create the activity with basic settings
                    </p>
                  </div>
                )}
              </ErrorBoundary>
            </Suspense>
          </CardContent>
        </Card>

        {/* Achievement Configuration */}
        <AchievementConfigEditor
          activityType={activityTypeId}
          initialConfig={achievementConfig}
          onChange={setAchievementConfig}
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={showSubmissionLoading || createActivity.isLoading}>
            {(showSubmissionLoading || createActivity.isLoading) && <Spinner className="mr-2 h-4 w-4" />}
            {showSubmissionLoading || createActivity.isLoading ? 'Creating...' : 'Create Activity'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

// Export wrapped component with error boundary
export function UnifiedActivityCreator(props: UnifiedActivityCreatorProps) {
  return (
    <ActivityErrorBoundary
      context="UnifiedActivityCreator"
      showErrorDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        handleActivityError(error, {
          component: 'UnifiedActivityCreator',
          metadata: {
            activityType: props.activityTypeId,
            classId: props.classId,
          },
        });
      }}
    >
      <UnifiedActivityCreatorCore {...props} />
    </ActivityErrorBoundary>
  );
}
