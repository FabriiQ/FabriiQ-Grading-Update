'use client';

/**
 * Production Activity Creator
 * 
 * Unified, production-ready activity creator that consolidates all previous
 * implementations with consistent API, proper error handling, and real-time validation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/core/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Eye, 
  ChevronLeft,
  Settings, 
  BookOpen, 
  Target,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import {
  ActivityPurpose,
  LearningActivityType,
  AssessmentType
} from '@/server/api/constants';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { activityRegistry } from '@/features/activties/registry';

// Comprehensive form schema that handles all activity types
const productionActivitySchema = z.object({
  // Basic Information
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description too long'),
  instructions: z.string().optional(),
  
  // Classification
  purpose: z.nativeEnum(ActivityPurpose),
  learningType: z.nativeEnum(LearningActivityType).optional(),
  assessmentType: z.nativeEnum(AssessmentType).optional(),
  
  // Academic Context
  subjectId: z.string().min(1, 'Subject is required'),
  topicId: z.string().optional(),
  lessonPlanId: z.string().optional(),
  
  // Grading Configuration
  isGradable: z.boolean().default(false),
  maxScore: z.number().min(1).max(1000).optional(),
  passingScore: z.number().min(0).max(1000).optional(),
  weightage: z.number().min(0).max(100).optional(),
  
  // Bloom's Taxonomy
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
  bloomsDistribution: z.record(z.number()).optional(),
  
  // Scheduling
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  duration: z.number().min(1, 'Duration must be at least 1 minute').max(480, 'Duration too long').default(30),
  
  // Activity Type Specific
  activityTypeId: z.string().min(1, 'Activity type is required'),
  activityConfig: z.record(z.any()).default({}),
});

type ProductionActivityFormValues = z.infer<typeof productionActivitySchema>;

interface ProductionActivityCreatorProps {
  classId: string;
  subjectId?: string;
  topicId?: string;
  lessonPlanId?: string;
  activityTypeId?: string;
  mode?: 'create' | 'edit';
  activityId?: string;
  onSuccess?: (activityId: string) => void;
  onCancel?: () => void;
}

export function ProductionActivityCreator({
  classId,
  subjectId: initialSubjectId,
  topicId: initialTopicId,
  lessonPlanId: initialLessonPlanId,
  activityTypeId: initialActivityTypeId,
  mode = 'create',
  activityId,
  onSuccess,
  onCancel
}: ProductionActivityCreatorProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // State management
  const [currentStep, setCurrentStep] = useState<'basic' | 'config' | 'preview'>('basic');
  const [activityConfig, setActivityConfig] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Data fetching
  const { data: classData, isLoading: isLoadingClass } = api.class.getById.useQuery({
    id: classId
  });

  const { data: subjects, isLoading: isLoadingSubjects } = api.class.getSubjectsForClass.useQuery({
    classId
  });

  const { data: topics, isLoading: isLoadingTopics } = api.subjectTopic.listTopics.useQuery({
    subjectId: initialSubjectId || ''
  }, {
    enabled: !!initialSubjectId
  });

  const { data: lessonPlans, isLoading: isLoadingLessonPlans } = api.lessonPlan.getByClass.useQuery({
    classId,
    subjectId: initialSubjectId
  }, {
    enabled: !!initialSubjectId
  });

  // Activity type registry
  const availableActivityTypes = useMemo(() => {
    return activityRegistry.getAll().filter(type => type.capabilities.isGradable);
  }, []);

  // Form setup
  const form = useForm<ProductionActivityFormValues>({
    resolver: zodResolver(productionActivitySchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      purpose: ActivityPurpose.LEARNING,
      subjectId: initialSubjectId || '',
      topicId: initialTopicId || '',
      lessonPlanId: initialLessonPlanId || '',
      isGradable: true,
      maxScore: 100,
      passingScore: 60,
      weightage: 10,
      bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
      duration: 30,
      activityTypeId: initialActivityTypeId || '',
      activityConfig: {},
    }
  });

  // Watch form values for dynamic updates
  const watchedValues = form.watch();
  const selectedActivityType = availableActivityTypes.find(type => type.id === watchedValues.activityTypeId);

  // Create activity mutation
  const createActivityMutation = api.activity.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Activity created successfully",
        variant: "default",
      });
      
      if (onSuccess) {
        onSuccess(data.id);
      } else {
        router.push(`/teacher/classes/${classId}/activities/${data.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create activity: ${error.message}`,
        variant: "error",
      });
      setIsSubmitting(false);
    },
  });

  // Form submission handler
  const onSubmit = async (data: ProductionActivityFormValues) => {
    try {
      setIsSubmitting(true);

      // Validate activity configuration
      if (selectedActivityType?.configSchema) {
        try {
          selectedActivityType.configSchema.parse(activityConfig);
        } catch (configError) {
          toast({
            title: "Configuration Error",
            description: "Please check your activity configuration",
            variant: "error",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare activity data
      const activityData = {
        title: data.title,
        description: data.description,
        purpose: data.purpose,
        learningType: data.learningType,
        assessmentType: data.assessmentType,
        subjectId: data.subjectId,
        topicId: data.topicId || undefined,
        classId,
        content: {
          version: 1,
          activityType: data.activityTypeId,
          instructions: data.instructions,
          ...activityConfig,
        },
        isGradable: data.isGradable,
        maxScore: data.maxScore,
        passingScore: data.passingScore,
        weightage: data.weightage,
        startDate: data.startDate,
        endDate: data.endDate,
        duration: data.duration,
        bloomsLevel: data.bloomsLevel,
        bloomsDistribution: data.bloomsDistribution,
        useComponentSystem: true,
      };

      await createActivityMutation.mutateAsync(activityData);
    } catch (error) {
      console.error('Error creating activity:', error);
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoadingClass || isLoadingSubjects) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Error state
  if (!classData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Class not found. Please check the URL and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create New Activity</h1>
          <p className="text-muted-foreground">
            Class: {classData.name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">{currentStep}</Badge>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center space-x-4">
        <div className={`flex items-center space-x-2 ${currentStep === 'basic' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'basic' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            1
          </div>
          <span>Basic Info</span>
        </div>
        <Separator orientation="horizontal" className="flex-1" />
        <div className={`flex items-center space-x-2 ${currentStep === 'config' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'config' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            2
          </div>
          <span>Configuration</span>
        </div>
        <Separator orientation="horizontal" className="flex-1" />
        <div className={`flex items-center space-x-2 ${currentStep === 'preview' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            3
          </div>
          <span>Preview</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step Content */}
          {currentStep === 'basic' && (
            <BasicInfoStep 
              form={form}
              subjects={subjects || []}
              topics={topics?.data || []}
              lessonPlans={lessonPlans?.lessonPlans || []}
              availableActivityTypes={availableActivityTypes}
              onNext={() => setCurrentStep('config')}
            />
          )}

          {currentStep === 'config' && selectedActivityType && (
            <ConfigurationStep
              activityType={selectedActivityType}
              config={activityConfig}
              onConfigChange={setActivityConfig}
              onBack={() => setCurrentStep('basic')}
              onNext={() => setCurrentStep('preview')}
            />
          )}

          {currentStep === 'preview' && (
            <PreviewStep
              formData={watchedValues}
              activityType={selectedActivityType}
              config={activityConfig}
              onBack={() => setCurrentStep('config')}
              onSubmit={form.handleSubmit(onSubmit)}
              isSubmitting={isSubmitting}
            />
          )}
        </form>
      </Form>
    </div>
  );
}

// Basic Information Step Component
interface BasicInfoStepProps {
  form: any;
  subjects: any[];
  topics: any[];
  lessonPlans: any[];
  availableActivityTypes: any[];
  onNext: () => void;
}

function BasicInfoStep({
  form,
  subjects,
  topics,
  lessonPlans,
  availableActivityTypes,
  onNext
}: BasicInfoStepProps) {
  const watchedSubjectId = form.watch('subjectId');
  const watchedActivityTypeId = form.watch('activityTypeId');
  const watchedIsGradable = form.watch('isGradable');

  const canProceed = form.formState.isValid && watchedActivityTypeId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Basic Information
        </CardTitle>
        <CardDescription>
          Set up the fundamental details of your activity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title and Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Activity Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter activity title..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ActivityPurpose.LEARNING}>Learning</SelectItem>
                    <SelectItem value={ActivityPurpose.ASSESSMENT}>Assessment</SelectItem>
                    <SelectItem value={ActivityPurpose.PRACTICE}>Practice</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe what students will learn or do in this activity..."
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
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide specific instructions for students..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Clear instructions help students understand what's expected
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Academic Context */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="topicId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Topic</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bloomsLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bloom's Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(BloomsTaxonomyLevel).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level.charAt(0) + level.slice(1).toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Activity Type Selection */}
        <FormField
          control={form.control}
          name="activityTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activity Type *</FormLabel>
              <FormControl>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {availableActivityTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        field.value === type.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => field.onChange(type.id)}
                    >
                      <div className="font-medium">{type.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {type.description}
                      </div>
                      <div className="flex items-center mt-2 space-x-2">
                        {type.capabilities.isGradable && (
                          <Badge variant="secondary" className="text-xs">Gradable</Badge>
                        )}
                        {type.capabilities.hasInteraction && (
                          <Badge variant="outline" className="text-xs">Interactive</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Grading Configuration */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="isGradable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Gradable Activity</FormLabel>
                  <FormDescription>
                    Enable grading and scoring for this activity
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

          {watchedIsGradable && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Score</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="1000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
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
                        min="0"
                        max="1000"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="480"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* Next Button */}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
          >
            Next: Configuration
            <Settings className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Configuration Step Component
interface ConfigurationStepProps {
  activityType: any;
  config: Record<string, any>;
  onConfigChange: (config: Record<string, any>) => void;
  onBack: () => void;
  onNext: () => void;
}

function ConfigurationStep({
  activityType,
  config,
  onConfigChange,
  onBack,
  onNext
}: ConfigurationStepProps) {
  const EditorComponent = activityType?.components?.editor;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Activity Configuration
        </CardTitle>
        <CardDescription>
          Configure the specific settings for {activityType?.name}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {EditorComponent ? (
          <EditorComponent
            config={config}
            onChange={onConfigChange}
          />
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No configuration editor available for this activity type.
              You can proceed to preview and create the activity.
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext}>
            Next: Preview
            <Eye className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Preview Step Component
interface PreviewStepProps {
  formData: any;
  activityType: any;
  config: Record<string, any>;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function PreviewStep({
  formData,
  activityType,
  config,
  onBack,
  onSubmit,
  isSubmitting
}: PreviewStepProps) {
  const ViewerComponent = activityType?.components?.viewer;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Activity Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Title</Label>
              <p className="font-medium">{formData.title}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Type</Label>
              <p className="font-medium">{activityType?.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Purpose</Label>
              <p className="font-medium">{formData.purpose}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
              <p className="font-medium">{formData.duration} minutes</p>
            </div>
            {formData.isGradable && (
              <>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Max Score</Label>
                  <p className="font-medium">{formData.maxScore} points</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Passing Score</Label>
                  <p className="font-medium">{formData.passingScore} points</p>
                </div>
              </>
            )}
          </div>

          {formData.description && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="mt-1">{formData.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Student View Preview
          </CardTitle>
          <CardDescription>
            This is how the activity will appear to students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {formData.instructions && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <strong>Instructions:</strong> {formData.instructions}
            </div>
          )}

          {ViewerComponent ? (
            <ViewerComponent
              config={config}
              mode="preview"
            />
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No preview available for this activity type.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Final Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Configuration
            </Button>

            <div className="flex items-center space-x-3">
              <div className="text-sm text-muted-foreground">
                Ready to create your activity?
              </div>
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Activity
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
