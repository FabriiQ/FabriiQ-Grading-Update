/**
 * Production Integration Example
 * 
 * This example demonstrates how to integrate the AI Question Generator
 * into production assessment and activity creators with proper error handling,
 * loading states, and user experience considerations.
 */

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/feedback/toast';
import { AIQuestionGeneratorButton, GeneratedQuestionsManager, GeneratedQuestion } from '../components';
import { BloomsTaxonomyLevel } from '@/features/bloom/types';

interface ProductionIntegrationExampleProps {
  // Context from the parent creator
  classId: string;
  subjectId: string;
  topicIds: string[];
  learningOutcomes: string[];
  bloomsLevel: BloomsTaxonomyLevel;
  
  // Callbacks for integration
  onQuestionsAdded: (questions: any[]) => void;
  onError?: (error: string) => void;
}

export function ProductionIntegrationExample({
  classId,
  subjectId,
  topicIds,
  learningOutcomes,
  bloomsLevel,
  onQuestionsAdded,
  onError
}: ProductionIntegrationExampleProps) {
  // State management
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [showGeneratedQuestions, setShowGeneratedQuestions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [generationStats, setGenerationStats] = useState<{
    totalGenerated: number;
    generationTime: number;
    model: string;
  } | null>(null);

  const { toast } = useToast();

  // Get context data for AI generation
  const getContextualTopics = useCallback(() => {
    // In a real implementation, this would fetch topic names from topicIds
    return topicIds.length > 0 ? [`Topic ${topicIds[0]}`] : ['General Topic'];
  }, [topicIds]);

  const getContextualActionVerbs = useCallback(() => {
    // Map Bloom's level to appropriate action verbs
    const verbMap: Record<BloomsTaxonomyLevel, string[]> = {
      'Remember': ['recall', 'identify', 'list', 'name', 'state'],
      'Understand': ['explain', 'describe', 'interpret', 'summarize', 'classify'],
      'Apply': ['solve', 'demonstrate', 'use', 'implement', 'execute'],
      'Analyze': ['analyze', 'examine', 'investigate', 'categorize', 'differentiate'],
      'Evaluate': ['evaluate', 'assess', 'critique', 'judge', 'justify'],
      'Create': ['create', 'design', 'develop', 'compose', 'construct']
    };
    return verbMap[bloomsLevel] || verbMap['Understand'];
  }, [bloomsLevel]);

  // Handle successful question generation
  const handleQuestionsGenerated = useCallback((questions: GeneratedQuestion[]) => {
    setGeneratedQuestions(questions);
    setShowGeneratedQuestions(true);
    
    // Extract generation metadata if available
    // This would come from the API response
    setGenerationStats({
      totalGenerated: questions.length,
      generationTime: 0, // Would be set from API response
      model: 'gemini-2.0-flash'
    });

    toast({
      title: 'Questions Generated Successfully',
      description: `Generated ${questions.length} questions ready for review`,
    });
  }, [toast]);

  // Handle generation errors
  const handleGenerationError = useCallback((error: string) => {
    console.error('AI Question Generation Error:', error);
    
    toast({
      title: 'Generation Failed',
      description: error,
      variant: 'error'
    });

    if (onError) {
      onError(error);
    }
  }, [toast, onError]);

  // Convert generated questions to the format expected by the parent creator
  const convertQuestionsForCreator = useCallback((questions: GeneratedQuestion[]) => {
    return questions.map((q, index) => ({
      id: `ai_${Date.now()}_${index}`,
      text: q.question,
      type: q.type.toUpperCase().replace('-', '_'),
      points: q.points || 1,
      bloomsLevel: q.bloomsLevel,
      difficulty: q.difficulty.toUpperCase(),
      explanation: q.explanation,
      
      // Handle different question types
      ...(q.options && {
        options: q.options.map((option, optIndex) => ({
          id: `opt_${Date.now()}_${index}_${optIndex}`,
          text: option,
          isCorrect: option === q.correctAnswer,
          feedback: option === q.correctAnswer ? 'Correct!' : 'Incorrect.'
        }))
      }),
      
      // Add metadata
      metadata: {
        aiGenerated: true,
        generatedAt: new Date().toISOString(),
        topic: q.topic,
        learningOutcome: q.learningOutcome,
        actionVerb: q.actionVerb,
        originalId: q.id
      }
    }));
  }, []);

  // Handle adding questions to the creator
  const handleAddQuestionsToCreator = useCallback(async (selectedQuestions: GeneratedQuestion[]) => {
    setIsProcessing(true);
    setProcessingStep('Converting questions...');

    try {
      // Convert questions to creator format
      const convertedQuestions = convertQuestionsForCreator(selectedQuestions);
      
      setProcessingStep('Adding to creator...');
      
      // Add to the parent creator
      onQuestionsAdded(convertedQuestions);
      
      // Success feedback
      toast({
        title: 'Questions Added Successfully',
        description: `Added ${selectedQuestions.length} questions to your ${getCreatorType()}`,
      });

      // Clean up
      setShowGeneratedQuestions(false);
      setGeneratedQuestions([]);
      setGenerationStats(null);

    } catch (error) {
      console.error('Error adding questions to creator:', error);
      toast({
        title: 'Failed to Add Questions',
        description: 'There was an error adding the questions. Please try again.',
        variant: 'error'
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  }, [convertQuestionsForCreator, onQuestionsAdded, toast]);

  // Get creator type for user feedback
  const getCreatorType = useCallback(() => {
    // This would be determined by the parent component type
    return 'assessment'; // or 'activity'
  }, []);

  return (
    <div className="space-y-6">
      {/* AI Question Generator Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Question Generator
          </CardTitle>
          <CardDescription>
            Generate questions automatically based on your {getCreatorType()} context
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Context Information */}
          <div className="mb-4 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Generation Context</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Topics:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {getContextualTopics().map((topic, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-medium">Bloom's Level:</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {bloomsLevel}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Learning Outcomes:</span>
                <div className="text-xs text-muted-foreground mt-1">
                  {learningOutcomes.length} outcomes configured
                </div>
              </div>
              <div>
                <span className="font-medium">Action Verbs:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {getContextualActionVerbs().slice(0, 3).map((verb, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {verb}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Generator Button */}
          <AIQuestionGeneratorButton
            selectedTopics={getContextualTopics()}
            selectedLearningOutcomes={learningOutcomes}
            selectedBloomsLevel={bloomsLevel}
            selectedActionVerbs={getContextualActionVerbs()}
            subject="" // Would be fetched from subjectId
            gradeLevel="" // Would be determined from class context
            onQuestionsGenerated={handleQuestionsGenerated}
            onError={handleGenerationError}
          />

          {/* Generation Statistics */}
          {generationStats && (
            <Alert className="mt-4">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Generated {generationStats.totalGenerated} questions using {generationStats.model}
                {generationStats.generationTime > 0 && (
                  <> in {generationStats.generationTime}ms</>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Questions Manager */}
      {showGeneratedQuestions && generatedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Generated Questions</CardTitle>
            <CardDescription>
              Review and select questions to add to your {getCreatorType()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GeneratedQuestionsManager
              questions={generatedQuestions}
              onQuestionsUpdated={setGeneratedQuestions}
              onCreateNewQuestions={handleAddQuestionsToCreator}
              showQuestionBankOption={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      {isProcessing && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>
            {processingStep || 'Processing questions...'}
          </AlertDescription>
        </Alert>
      )}

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">AI Generation Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Review all generated questions before adding to your {getCreatorType()}</p>
          <p>• Verify alignment with your learning objectives</p>
          <p>• Edit questions as needed to match your teaching style</p>
          <p>• Consider the difficulty level for your students</p>
          <p>• Use the question bank feature to save questions for future use</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Example usage in an assessment creator
export function ExampleAssessmentCreatorIntegration() {
  const [assessmentQuestions, setAssessmentQuestions] = useState<any[]>([]);

  const handleQuestionsAdded = (newQuestions: any[]) => {
    setAssessmentQuestions(prev => [...prev, ...newQuestions]);
  };

  return (
    <div className="space-y-6">
      {/* Other assessment creator components */}
      
      <ProductionIntegrationExample
        classId="class-123"
        subjectId="subject-456"
        topicIds={["topic-789"]}
        learningOutcomes={["Students will be able to solve linear equations"]}
        bloomsLevel="Apply"
        onQuestionsAdded={handleQuestionsAdded}
      />

      {/* Display current questions */}
      {assessmentQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment Questions ({assessmentQuestions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {assessmentQuestions.map((question, index) => (
              <div key={question.id} className="p-4 border rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">Q{index + 1}</Badge>
                  <Badge variant="secondary">{question.type}</Badge>
                  {question.metadata?.aiGenerated && (
                    <Badge variant="outline" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                </div>
                <p className="text-sm">{question.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
