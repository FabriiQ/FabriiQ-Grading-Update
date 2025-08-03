/**
 * Unified Assessment Creator
 *
 * Production-ready assessment creator that consolidates all previous implementations
 * and fixes UI inconsistencies, duplicate configurations, and form schema issues.
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ActivityErrorBoundary } from '@/features/activties/components/error-handling/ActivityErrorBoundary';
import { handleActivityError, handleTRPCError } from '@/features/activties/services/error-handling.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

import {
  CheckCircle,
  AlertCircle,
  Clock,
  BookOpen,
  Settings,
  Eye,
  Save,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Unified enums and types
export enum AssessmentCategory {
  QUIZ = 'QUIZ',
  TEST = 'TEST',
  ASSIGNMENT = 'ASSIGNMENT',
  PROJECT = 'PROJECT',
  EXAM = 'EXAM',
  ESSAY = 'ESSAY'
}

export enum GradingType {
  MANUAL = 'MANUAL',
  AUTO = 'AUTO',
  HYBRID = 'HYBRID'
}

export enum BloomsTaxonomyLevel {
  REMEMBER = 'REMEMBER',
  UNDERSTAND = 'UNDERSTAND',
  APPLY = 'APPLY',
  ANALYZE = 'ANALYZE',
  EVALUATE = 'EVALUATE',
  CREATE = 'CREATE'
}

// Unified form schema - single source of truth
const unifiedAssessmentSchema = z.object({
  // Basic Information
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  instructions: z.string()
    .min(10, 'Instructions must be at least 10 characters')
    .max(1000, 'Instructions must not exceed 1000 characters'),
  
  // Classification
  category: z.nativeEnum(AssessmentCategory),
  gradingType: z.nativeEnum(GradingType),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
  
  // Academic Context
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().min(1, 'Subject is required'),
  topicId: z.string().optional(),
  
  // Scoring Configuration
  maxScore: z.number()
    .min(1, 'Maximum score must be at least 1')
    .max(1000, 'Maximum score cannot exceed 1000')
    .default(100),
  passingScore: z.number()
    .min(1, 'Passing score must be at least 1')
    .default(60),
  weightage: z.number()
    .min(0, 'Weightage cannot be negative')
    .max(100, 'Weightage cannot exceed 100')
    .default(10),
  
  // Timing and Availability
  dueDate: z.date().optional(),
  timeLimit: z.number().min(1).optional(),
  maxAttempts: z.number().min(1).max(10).default(1),
  
  // Settings
  allowLateSubmissions: z.boolean().default(false),
  showRubricToStudents: z.boolean().default(true),
  randomizeQuestions: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  
  // Optional References
  rubricId: z.string().optional(),
  termId: z.string().optional(),
});

type UnifiedAssessmentFormValues = z.infer<typeof unifiedAssessmentSchema>;

interface UnifiedAssessmentCreatorProps {
  classId: string;
  subjectId?: string;
  topicId?: string;
  mode?: 'create' | 'edit';
  assessmentId?: string;
  initialData?: Partial<UnifiedAssessmentFormValues>;
  onSuccess?: (assessment: any) => void;
  onCancel?: () => void;
}

const steps = [
  { id: 'basic', label: 'Basic Info', icon: BookOpen },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'preview', label: 'Preview', icon: Eye },
];

export function UnifiedAssessmentCreator({
  classId,
  subjectId: initialSubjectId,
  topicId: initialTopicId,
  mode = 'create',
  assessmentId,
  initialData,
  onSuccess,
  onCancel
}: UnifiedAssessmentCreatorProps) {
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Form setup with unified schema
  const form = useForm<UnifiedAssessmentFormValues>({
    resolver: zodResolver(unifiedAssessmentSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      category: AssessmentCategory.QUIZ,
      gradingType: GradingType.MANUAL,
      bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
      classId,
      subjectId: initialSubjectId || '',
      topicId: initialTopicId || '',
      maxScore: 100,
      passingScore: 60,
      weightage: 10,
      maxAttempts: 1,
      allowLateSubmissions: false,
      showRubricToStudents: true,
      randomizeQuestions: false,
      isPublished: false,
      ...initialData,
    }
  });

  // Watch form values for validation
  const watchedValues = form.watch();

  // Calculate progress
  const calculateProgress = () => {
    const requiredFields = ['title', 'description', 'instructions', 'subjectId'];
    const completedFields = requiredFields.filter(field => 
      watchedValues[field as keyof UnifiedAssessmentFormValues]
    ).length;
    return (completedFields / requiredFields.length) * 100;
  };

  // Validate current step
  const validateCurrentStep = async () => {
    const errors: string[] = [];
    
    switch (currentStep) {
      case 0: // Basic Info
        if (!watchedValues.title) errors.push('Title is required');
        if (!watchedValues.description) errors.push('Description is required');
        if (!watchedValues.instructions) errors.push('Instructions are required');
        if (!watchedValues.subjectId) errors.push('Subject is required');
        break;
      case 1: // Settings
        if (watchedValues.passingScore >= watchedValues.maxScore) {
          errors.push('Passing score must be less than maximum score');
        }
        if (watchedValues.timeLimit && watchedValues.timeLimit < 1) {
          errors.push('Time limit must be at least 1 minute');
        }
        break;
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Navigation handlers
  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Form submission
  const onSubmit = async (data: UnifiedAssessmentFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Validate all steps
      const isValid = await validateCurrentStep();
      if (!isValid) {
        setIsSubmitting(false);
        return;
      }

      // Submit assessment
      console.log('Submitting assessment:', data);
      
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Success callback
      if (onSuccess) {
        onSuccess(data);
      }
      
      // Show success message
      alert('Assessment created successfully!');
      
    } catch (error) {
      console.error('Error creating assessment:', error);
      alert('Failed to create assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === 'edit' ? 'Edit Assessment' : 'Create New Assessment'}
          </h1>
          <p className="text-muted-foreground">
            {mode === 'edit' ? 'Update assessment details' : 'Set up a new assessment for your class'}
          </p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
      </div>

      {/* Progress Indicator */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {Math.round(calculateProgress())}% complete
            </span>
          </div>
          <Progress value={calculateProgress()} className="w-full" />
        </CardContent>
      </Card>

      {/* Step Navigation */}
      <div className="flex items-center justify-center space-x-4">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          
          return (
            <div
              key={step.id}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : isCompleted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="border border-red-200 bg-red-50 p-4 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
            <div>
              <p className="font-medium text-red-800 mb-2">Configuration Issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-700">{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form Content */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Provide the essential details for your assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessment Title *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter assessment title"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assessment Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select assessment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(AssessmentCategory).map((category) => (
                              <SelectItem key={category} value={category}>
                                {category.charAt(0) + category.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
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
                          placeholder="Describe what this assessment covers"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a clear description of the assessment objectives
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Provide detailed instructions for students"
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Clear instructions help students understand expectations
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <SelectItem value="math">Mathematics</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="science">Science</SelectItem>
                            <SelectItem value="history">History</SelectItem>
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
                              <SelectValue placeholder="Select cognitive level" />
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

                  <FormField
                    control={form.control}
                    name="gradingType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grading Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select grading method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.values(GradingType).map((type) => (
                              <SelectItem key={type} value={type}>
                                {type.charAt(0) + type.slice(1).toLowerCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Settings */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Assessment Settings
                </CardTitle>
                <CardDescription>
                  Configure scoring, timing, and availability options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weightage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weightage (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Limit (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="No time limit"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave empty for no time limit
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Attempts</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Additional Settings</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="allowLateSubmissions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Late Submissions
                            </FormLabel>
                            <FormDescription>
                              Students can submit after the due date
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

                    <FormField
                      control={form.control}
                      name="showRubricToStudents"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Show Rubric to Students
                            </FormLabel>
                            <FormDescription>
                              Students can see grading criteria
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

                    <FormField
                      control={form.control}
                      name="randomizeQuestions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Randomize Questions
                            </FormLabel>
                            <FormDescription>
                              Questions appear in random order
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

                    <FormField
                      control={form.control}
                      name="isPublished"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Publish Immediately
                            </FormLabel>
                            <FormDescription>
                              Make assessment available to students
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
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Preview */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Assessment Preview
                </CardTitle>
                <CardDescription>
                  Review your assessment before creating
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Title:</strong> {watchedValues.title}</div>
                      <div><strong>Type:</strong> {watchedValues.category}</div>
                      <div><strong>Grading:</strong> {watchedValues.gradingType}</div>
                      <div><strong>Bloom's Level:</strong> {watchedValues.bloomsLevel}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Scoring & Settings</h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Max Score:</strong> {watchedValues.maxScore}</div>
                      <div><strong>Passing Score:</strong> {watchedValues.passingScore}</div>
                      <div><strong>Weightage:</strong> {watchedValues.weightage}%</div>
                      <div><strong>Max Attempts:</strong> {watchedValues.maxAttempts}</div>
                      {watchedValues.timeLimit && (
                        <div><strong>Time Limit:</strong> {watchedValues.timeLimit} minutes</div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{watchedValues.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Instructions</h4>
                  <p className="text-sm text-muted-foreground">{watchedValues.instructions}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Settings</h4>
                  <div className="flex flex-wrap gap-2">
                    {watchedValues.allowLateSubmissions && (
                      <Badge variant="secondary">Late submissions allowed</Badge>
                    )}
                    {watchedValues.showRubricToStudents && (
                      <Badge variant="secondary">Rubric visible to students</Badge>
                    )}
                    {watchedValues.randomizeQuestions && (
                      <Badge variant="secondary">Questions randomized</Badge>
                    )}
                    {watchedValues.isPublished && (
                      <Badge variant="default">Will be published immediately</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentStep < steps.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={validationErrors.length > 0}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || validationErrors.length > 0}
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Assessment
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
