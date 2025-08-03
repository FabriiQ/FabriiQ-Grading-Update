'use client';

/**
 * Production Assessment Creator
 * 
 * Unified, production-ready assessment creator that consolidates all previous
 * implementations with consistent schema, proper validation, and no duplicate UI elements.
 */

import React, { useState, useEffect } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Loader2,
  Calendar as CalendarIcon,
  Plus,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { AIQuestionGeneratorButton, GeneratedQuestionsManager, GeneratedQuestion } from '@/features/ai-question-generator/components';
import {
  AssessmentCategory,
  GradingType,
  SystemStatus
} from '@/server/api/constants';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Unified assessment schema that handles all assessment types
const productionAssessmentSchema = z.object({
  // Basic Information
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description too long'),
  instructions: z.string().optional(),
  
  // Classification
  category: z.nativeEnum(AssessmentCategory),
  gradingType: z.nativeEnum(GradingType).default(GradingType.MANUAL),
  
  // Academic Context
  subjectId: z.string().min(1, 'Subject is required'),
  topicId: z.string().optional(),
  classId: z.string().min(1, 'Class is required'),
  
  // Scoring Configuration
  maxScore: z.number().min(1, 'Maximum score must be at least 1').max(1000, 'Maximum score too high').default(100),
  passingScore: z.number().min(0, 'Passing score cannot be negative').max(1000, 'Passing score too high').default(60),
  weightage: z.number().min(0, 'Weightage cannot be negative').max(100, 'Weightage cannot exceed 100').default(10),
  
  // Bloom's Taxonomy
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
  bloomsDistribution: z.record(z.number()).optional(),
  
  // Scheduling
  dueDate: z.date().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  
  // Settings
  allowLateSubmissions: z.boolean().default(false),
  showRubricToStudents: z.boolean().default(true),
  isPublished: z.boolean().default(false),
  
  // Questions (for quiz/test types)
  questions: z.array(z.object({
    id: z.string().optional(),
    text: z.string().min(1, 'Question text is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'FILE_UPLOAD']).default('MULTIPLE_CHOICE'),
    points: z.number().min(1, 'Points must be at least 1').default(10),
    bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
    options: z.array(z.object({
      id: z.string().optional(),
      text: z.string().min(1, 'Option text is required'),
      isCorrect: z.boolean().default(false),
    })).optional().default([]),
  })).default([]),
});

type ProductionAssessmentFormValues = z.infer<typeof productionAssessmentSchema>;

interface ProductionAssessmentCreatorProps {
  classId: string;
  subjectId?: string;
  topicId?: string;
  mode?: 'create' | 'edit';
  assessmentId?: string;
  initialData?: Partial<ProductionAssessmentFormValues>;
  onSuccess?: (assessmentId: string) => void;
  onCancel?: () => void;
}

export function ProductionAssessmentCreator({
  classId,
  subjectId: initialSubjectId,
  topicId: initialTopicId,
  mode = 'create',
  assessmentId,
  initialData,
  onSuccess,
  onCancel
}: ProductionAssessmentCreatorProps) {
  const { toast } = useToast();
  
  // State management
  const [currentStep, setCurrentStep] = useState<'basic' | 'questions' | 'settings' | 'preview'>('basic');
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

  // Form setup
  const form = useForm<ProductionAssessmentFormValues>({
    resolver: zodResolver(productionAssessmentSchema),
    defaultValues: {
      title: '',
      description: '',
      instructions: '',
      category: AssessmentCategory.QUIZ,
      gradingType: GradingType.MANUAL,
      subjectId: initialSubjectId || '',
      topicId: initialTopicId || '',
      classId,
      maxScore: 100,
      passingScore: 60,
      weightage: 10,
      bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
      allowLateSubmissions: false,
      showRubricToStudents: true,
      isPublished: false,
      questions: [],
      ...initialData,
    }
  });

  // Watch form values for dynamic updates
  const watchedValues = form.watch();
  const selectedCategory = watchedValues.category;
  const questions = watchedValues.questions || [];

  // Create assessment mutation
  const createAssessmentMutation = api.assessment.create.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Assessment created successfully",
        variant: "default",
      });
      
      if (onSuccess) {
        onSuccess(data.id);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create assessment: ${error.message}`,
        variant: "error",
      });
      setIsSubmitting(false);
    },
  });

  // Form submission handler
  const onSubmit = async (data: ProductionAssessmentFormValues) => {
    try {
      setIsSubmitting(true);

      // Validate questions for quiz/test types
      if ([AssessmentCategory.QUIZ, AssessmentCategory.EXAM].includes(data.category)) {
        if (data.questions.length === 0) {
          toast({
            title: "Validation Error",
            description: "Please add at least one question for this assessment type",
            variant: "error",
          });
          setIsSubmitting(false);
          return;
        }
      }

      // Calculate total points from questions
      const totalPoints = data.questions.reduce((sum, q) => sum + q.points, 0);
      if (totalPoints > 0 && totalPoints !== data.maxScore) {
        data.maxScore = totalPoints;
      }

      // Prepare assessment data
      const assessmentData = {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        category: data.category,
        gradingType: data.gradingType,
        subjectId: data.subjectId,
        topicId: data.topicId || undefined,
        classId: data.classId,
        maxScore: data.maxScore,
        passingScore: data.passingScore,
        weightage: data.weightage,
        dueDate: data.dueDate,
        bloomsLevel: data.bloomsLevel,
        bloomsDistribution: data.bloomsDistribution,
        // Enhanced fields for quiz/test types
        content: data.questions.length > 0 ? {
          assessmentType: data.category,
          questions: data.questions,
          settings: {
            allowLateSubmissions: data.allowLateSubmissions,
            showRubricToStudents: data.showRubricToStudents,
          }
        } : undefined,
        status: data.isPublished ? SystemStatus.ACTIVE : SystemStatus.INACTIVE,
      };

      await createAssessmentMutation.mutateAsync(assessmentData);
    } catch (error) {
      console.error('Error creating assessment:', error);
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
          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'Create New Assessment' : 'Edit Assessment'}
          </h1>
          <p className="text-muted-foreground">
            Class: {classData.name} • {questions.length} questions
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
        {['basic', 'questions', 'settings', 'preview'].map((step, index) => (
          <React.Fragment key={step}>
            <div className={`flex items-center space-x-2 ${currentStep === step ? 'text-primary' : 'text-muted-foreground'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === step ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {index + 1}
              </div>
              <span className="capitalize">{step}</span>
            </div>
            {index < 3 && <Separator orientation="horizontal" className="flex-1" />}
          </React.Fragment>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step Content */}
          {currentStep === 'basic' && (
            <BasicInfoStep 
              form={form}
              subjects={subjects || []}
              topics={topics?.data || []}
              onNext={() => setCurrentStep('questions')}
            />
          )}

          {currentStep === 'questions' && (
            <QuestionsStep
              form={form}
              selectedCategory={selectedCategory}
              onBack={() => setCurrentStep('basic')}
              onNext={() => setCurrentStep('settings')}
            />
          )}

          {currentStep === 'settings' && (
            <SettingsStep
              form={form}
              onBack={() => setCurrentStep('questions')}
              onNext={() => setCurrentStep('preview')}
            />
          )}

          {currentStep === 'preview' && (
            <PreviewStep
              formData={watchedValues}
              onBack={() => setCurrentStep('settings')}
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
  onNext: () => void;
}

function BasicInfoStep({ form, subjects, topics, onNext }: BasicInfoStepProps) {
  const watchedSubjectId = form.watch('subjectId');
  const watchedCategory = form.watch('category');

  const canProceed = form.formState.isValid && watchedSubjectId;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="h-5 w-5 mr-2" />
          Basic Information
        </CardTitle>
        <CardDescription>
          Set up the fundamental details of your assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Title and Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assessment Title *</FormLabel>
                <FormControl>
                  <Input placeholder="Enter assessment title..." {...field} />
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
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={AssessmentCategory.QUIZ}>Quiz</SelectItem>
                    <SelectItem value={AssessmentCategory.EXAM}>Test</SelectItem>
                    <SelectItem value={AssessmentCategory.ASSIGNMENT}>Assignment</SelectItem>
                    <SelectItem value={AssessmentCategory.PROJECT}>Project</SelectItem>
                    <SelectItem value={AssessmentCategory.EXAM}>Exam</SelectItem>
                    <SelectItem value={AssessmentCategory.ESSAY}>Essay</SelectItem>
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
                  placeholder="Describe the purpose and content of this assessment..."
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

        {/* Scoring Configuration */}
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
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Due Date */}
        <FormField
          control={form.control}
          name="dueDate"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Due Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                Optional: Set a due date for this assessment
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Next Button */}
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
          >
            Next: Questions
            <Settings className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Questions Step Component
interface QuestionsStepProps {
  form: any;
  selectedCategory: AssessmentCategory;
  onBack: () => void;
  onNext: () => void;
}

function QuestionsStep({ form, selectedCategory, onBack, onNext }: QuestionsStepProps) {
  const questions = form.watch('questions') || [];
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [showGeneratedQuestions, setShowGeneratedQuestions] = useState(false);

  const requiresQuestions = [
    AssessmentCategory.QUIZ,
    AssessmentCategory.EXAM
  ].includes(selectedCategory);

  const addQuestion = () => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      text: '',
      type: 'MULTIPLE_CHOICE' as const,
      points: 10,
      bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
      options: [
        { id: `opt_${Date.now()}_1`, text: '', isCorrect: false },
        { id: `opt_${Date.now()}_2`, text: '', isCorrect: false },
      ],
    };

    form.setValue('questions', [...questions, newQuestion]);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_: any, i: number) => i !== index);
    form.setValue('questions', updatedQuestions);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    form.setValue('questions', updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    const newOption = {
      id: `opt_${Date.now()}`,
      text: '',
      isCorrect: false,
    };
    updatedQuestions[questionIndex].options = [
      ...updatedQuestions[questionIndex].options,
      newOption,
    ];
    form.setValue('questions', updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter(
      (_: any, i: number) => i !== optionIndex
    );
    form.setValue('questions', updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = {
      ...updatedQuestions[questionIndex].options[optionIndex],
      [field]: value,
    };
    form.setValue('questions', updatedQuestions);
  };

  // Handle AI-generated questions
  const handleQuestionsGenerated = (aiQuestions: GeneratedQuestion[]) => {
    setGeneratedQuestions(aiQuestions);
    setShowGeneratedQuestions(true);
  };

  const handleAddGeneratedQuestions = (selectedQuestions: GeneratedQuestion[]) => {
    const newQuestions = selectedQuestions.map((q, index) => ({
      id: `ai_${Date.now()}_${index}`,
      text: q.question,
      type: q.type.toUpperCase().replace('-', '_') as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY',
      points: q.points || 10,
      bloomsLevel: q.bloomsLevel,
      options: q.options ? q.options.map((option, optIndex) => ({
        id: `opt_${Date.now()}_${index}_${optIndex}`,
        text: option,
        isCorrect: option === q.correctAnswer
      })) : [
        { id: `opt_${Date.now()}_${index}_1`, text: '', isCorrect: false },
        { id: `opt_${Date.now()}_${index}_2`, text: '', isCorrect: false },
      ],
    }));

    form.setValue('questions', [...questions, ...newQuestions]);
    setShowGeneratedQuestions(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Questions
          </div>
          <Badge variant="outline">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          {requiresQuestions
            ? 'Add questions for your assessment'
            : 'Questions are optional for this assessment type'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {requiresQuestions && questions.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This assessment type requires at least one question. Click "Add Question" to get started.
            </AlertDescription>
          </Alert>
        )}

        {/* Questions List */}
        <div className="space-y-4">
          {questions.map((question: any, questionIndex: number) => (
            <Card key={question.id || questionIndex} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Question {questionIndex + 1}</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(questionIndex)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Question Text */}
                <div>
                  <Label>Question Text</Label>
                  <Textarea
                    placeholder="Enter your question..."
                    value={question.text}
                    onChange={(e) => updateQuestion(questionIndex, 'text', e.target.value)}
                    className="mt-1"
                  />
                </div>

                {/* Question Settings */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Question Type</Label>
                    <Select
                      value={question.type}
                      onValueChange={(value) => updateQuestion(questionIndex, 'type', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MULTIPLE_CHOICE">Multiple Choice</SelectItem>
                        <SelectItem value="SHORT_ANSWER">Short Answer</SelectItem>
                        <SelectItem value="ESSAY">Essay</SelectItem>
                        <SelectItem value="FILE_UPLOAD">File Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Points</Label>
                    <Input
                      type="number"
                      min="1"
                      value={question.points}
                      onChange={(e) => updateQuestion(questionIndex, 'points', Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Bloom's Level</Label>
                    <Select
                      value={question.bloomsLevel}
                      onValueChange={(value) => updateQuestion(questionIndex, 'bloomsLevel', value)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(BloomsTaxonomyLevel).map((level) => (
                          <SelectItem key={level} value={level}>
                            {level.charAt(0) + level.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Multiple Choice Options */}
                {question.type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Answer Options</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(questionIndex)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>

                    {question.options?.map((option: any, optionIndex: number) => (
                      <div key={option.id || optionIndex} className="flex items-center space-x-2">
                        <Switch
                          checked={option.isCorrect}
                          onCheckedChange={(checked) =>
                            updateOption(questionIndex, optionIndex, 'isCorrect', checked)
                          }
                        />
                        <Input
                          placeholder={`Option ${optionIndex + 1}`}
                          value={option.text}
                          onChange={(e) =>
                            updateOption(questionIndex, optionIndex, 'text', e.target.value)
                          }
                          className="flex-1"
                        />
                        {question.options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(questionIndex, optionIndex)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Question Generator */}
        <div className="space-y-4">
          <AIQuestionGeneratorButton
            selectedTopics={[]} // TODO: Get from form context
            selectedLearningOutcomes={[]} // TODO: Get from form context
            selectedBloomsLevel={form.watch('bloomsLevel')}
            selectedActionVerbs={[]}
            subject={''} // TODO: Get from form context
            gradeLevel={''}
            onQuestionsGenerated={handleQuestionsGenerated}
            onError={(error) => {
              console.error('AI Question Generation Error:', error);
            }}
          />

          {showGeneratedQuestions && generatedQuestions.length > 0 && (
            <GeneratedQuestionsManager
              questions={generatedQuestions}
              onQuestionsUpdated={setGeneratedQuestions}
              onCreateNewQuestions={handleAddGeneratedQuestions}
              showQuestionBankOption={false}
            />
          )}
        </div>

        {/* Add Question Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addQuestion}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Question Manually
        </Button>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={onNext}
            disabled={requiresQuestions && questions.length === 0}
          >
            Next: Settings
            <Settings className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Settings Step Component
interface SettingsStepProps {
  form: any;
  onBack: () => void;
  onNext: () => void;
}

function SettingsStep({ form, onBack, onNext }: SettingsStepProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Assessment Settings
        </CardTitle>
        <CardDescription>
          Configure additional settings for your assessment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Grading Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Grading Configuration</h3>

          <FormField
            control={form.control}
            name="gradingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grading Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grading type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={GradingType.MANUAL}>Manual Grading</SelectItem>
                    <SelectItem value={GradingType.AUTOMATIC}>Auto Grading</SelectItem>
                    <SelectItem value={GradingType.HYBRID}>Hybrid (AI + Manual)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose how this assessment will be graded
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Student Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Student Settings</h3>

          <FormField
            control={form.control}
            name="allowLateSubmissions"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Allow Late Submissions</FormLabel>
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
                  <FormLabel className="text-base">Show Rubric to Students</FormLabel>
                  <FormDescription>
                    Students can see the grading rubric before submission
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

        {/* Publication Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Publication Settings</h3>

          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Publish Immediately</FormLabel>
                  <FormDescription>
                    Make this assessment available to students right away
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
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

function PreviewStep({ formData, onBack, onSubmit, isSubmitting }: PreviewStepProps) {
  const totalPoints = formData.questions?.reduce((sum: number, q: any) => sum + q.points, 0) || formData.maxScore;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Assessment Summary
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
              <p className="font-medium">{formData.category}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Total Points</Label>
              <p className="font-medium">{totalPoints} points</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Passing Score</Label>
              <p className="font-medium">{formData.passingScore} points</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Questions</Label>
              <p className="font-medium">{formData.questions?.length || 0} questions</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Grading</Label>
              <p className="font-medium">{formData.gradingType}</p>
            </div>
          </div>

          {formData.description && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-muted-foreground">Description</Label>
              <p className="mt-1">{formData.description}</p>
            </div>
          )}

          {formData.dueDate && (
            <div className="mt-4">
              <Label className="text-sm font-medium text-muted-foreground">Due Date</Label>
              <p className="mt-1">{format(formData.dueDate, "PPP")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions Preview */}
      {formData.questions && formData.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Questions Preview
            </CardTitle>
            <CardDescription>
              This is how questions will appear to students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.questions.map((question: any, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    <Badge variant="outline">{question.points} pts</Badge>
                  </div>
                  <p className="mb-3">{question.text}</p>

                  {question.type === 'MULTIPLE_CHOICE' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option: any, optIndex: number) => (
                        <div key={optIndex} className="flex items-center space-x-2">
                          <div className="w-4 h-4 border rounded-full"></div>
                          <span>{option.text}</span>
                          {option.isCorrect && (
                            <Badge variant="secondary" className="text-xs">Correct</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {question.type === 'SHORT_ANSWER' && (
                    <div className="mt-2">
                      <div className="h-10 border rounded bg-muted/20"></div>
                    </div>
                  )}

                  {question.type === 'ESSAY' && (
                    <div className="mt-2">
                      <div className="h-24 border rounded bg-muted/20"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>

            <div className="flex items-center space-x-3">
              <div className="text-sm text-muted-foreground">
                Ready to create your assessment?
              </div>
              <Button
                onClick={onSubmit}
                disabled={isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Assessment
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
