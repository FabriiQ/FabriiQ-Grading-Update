'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';
import { UnifiedAssessmentCreator } from '@/components/teacher/assessments/UnifiedAssessmentCreator';
import { EnhancedAssessmentInput } from '@/features/assessments/types/enhanced-assessment';

export default function QuizCreatorPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const classId = params?.classId as string;
  const assessmentId = params?.assessmentId as string;

  // Fetch assessment data
  const { data: assessment, isLoading: assessmentLoading, error } = api.assessment.getById.useQuery(
    { id: assessmentId },
    { 
      enabled: !!assessmentId,
      onSuccess: (data) => {
        setLoading(false);
      },
      onError: (error) => {
        console.error('Error fetching assessment:', error);
        toast({
          title: "Error",
          description: "Failed to load assessment data.",
          variant: "error",
        });
        setLoading(false);
      }
    }
  );

  // Fetch class data for context
  const { data: classData } = api.class.getById.useQuery(
    { classId, include: { students: false, teachers: false } },
    { enabled: !!classId }
  );

  // Update assessment mutation for saving quiz data
  const updateAssessmentMutation = api.assessment.update.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quiz assessment updated successfully!",
        variant: "success",
      });
      router.push(`/teacher/classes/${classId}/assessments/${assessmentId}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update quiz assessment.",
        variant: "error",
      });
    },
  });

  const handleSaveQuiz = async (quizData: EnhancedAssessmentInput) => {
    try {
      console.log('Saving quiz data:', quizData);
      
      await updateAssessmentMutation.mutateAsync({
        id: assessmentId,
        title: quizData.title,
        description: quizData.description,
        maxScore: quizData.maxScore,
        passingScore: quizData.passingScore,
        weightage: quizData.weightage,
        // Store enhanced quiz content in the rubric field for now
        rubric: {
          type: 'ENHANCED_QUIZ',
          content: quizData.content,
          settings: quizData.enhancedSettings,
          questionBankRefs: quizData.questionBankRefs,
          questionSelectionMode: quizData.questionSelectionMode,
        },
      });
    } catch (error) {
      console.error('Error saving quiz:', error);
    }
  };

  const handleCancel = () => {
    router.push(`/teacher/classes/${classId}/assessments/${assessmentId}`);
  };

  if (loading || assessmentLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading assessment data...</span>
        </div>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link href={`/teacher/classes/${classId}/assessments`}>
            <Button size="sm" variant="ghost">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Assessments
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Assessment Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The assessment you're looking for doesn't exist or you don't have permission to access it.
          </p>
          <Link href={`/teacher/classes/${classId}/assessments`}>
            <Button>Return to Assessments</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check if this is actually a quiz assessment
  if (assessment.category !== 'QUIZ') {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Link href={`/teacher/classes/${classId}/assessments/${assessmentId}`}>
            <Button size="sm" variant="ghost">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Assessment
            </Button>
          </Link>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Not a Quiz Assessment</h2>
          <p className="text-muted-foreground mb-4">
            This assessment is not a quiz type. The enhanced quiz creator is only available for quiz assessments.
          </p>
          <Link href={`/teacher/classes/${classId}/assessments/${assessmentId}`}>
            <Button>View Assessment</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Prepare initial data for the quiz creator
  const initialData: Partial<EnhancedAssessmentInput> = {
    title: assessment.title,
    description: assessment.description || '',
    classId: assessment.classId,
    subjectId: assessment.subjectId,
    category: 'QUIZ',
    maxScore: assessment.maxScore || 100,
    passingScore: assessment.passingScore || 60,
    weightage: assessment.weightage || 10,
    // Extract enhanced settings from rubric if available
    enhancedSettings: (assessment.rubric as any)?.settings || {
      timeLimit: 30,
      maxAttempts: 1,
      showFeedbackMode: 'after_submission',
      questionOrderRandomization: false,
      choiceOrderRandomization: false,
    },
    questionSelectionMode: (assessment.rubric as any)?.questionSelectionMode || 'MANUAL',
    questionBankRefs: (assessment.rubric as any)?.questionBankRefs || [],
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/teacher/classes/${classId}/assessments/${assessmentId}`}>
          <Button size="sm" variant="ghost">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Assessment
          </Button>
        </Link>
        <div className="text-sm text-muted-foreground">
          {classData?.name} • Unified Assessment Creator
        </div>
      </div>

      <UnifiedAssessmentCreator
        classId={classId}
        subjectId={assessment.subjectId}
        topicId={assessment.topicId}
        mode="edit"
        assessmentId={assessmentId}
        initialData={initialData}
        onSuccess={handleSaveQuiz}
        onCancel={handleCancel}
      />
    </div>
  );
}
