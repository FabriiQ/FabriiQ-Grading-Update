'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/feedback/toast';
import {
  Check,
  X,
  Edit,
  Save,
  Plus,
  FileText,
  Trash2,
  Eye
} from 'lucide-react';
import { HardDrive, EyeOff } from '@/components/ui/icons-fix';
import { cn } from '@/lib/utils';
import { GeneratedQuestion } from '../services/ai-question-generator.service';
import { api } from '@/trpc/react';

interface GeneratedQuestionsManagerProps {
  questions: GeneratedQuestion[];
  onQuestionsUpdated?: (questions: GeneratedQuestion[]) => void;
  onAddToQuestionBank?: (questions: GeneratedQuestion[]) => void;
  onCreateNewQuestions?: (questions: GeneratedQuestion[]) => void;
  showQuestionBankOption?: boolean;
  className?: string;
}

export function GeneratedQuestionsManager({
  questions: initialQuestions,
  onQuestionsUpdated,
  onAddToQuestionBank,
  onCreateNewQuestions,
  showQuestionBankOption = true,
  className
}: GeneratedQuestionsManagerProps) {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>(initialQuestions);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [selectedQuestionBank, setSelectedQuestionBank] = useState<string>('');
  const { toast } = useToast();

  // Get available question banks
  const { data: questionBanks } = api.aiQuestionGenerator.getAvailableQuestionBanks.useQuery();

  // Mutation for adding to question bank
  const addToQuestionBankMutation = api.aiQuestionGenerator.addToQuestionBank.useMutation();

  // Update questions when props change
  React.useEffect(() => {
    setQuestions(initialQuestions);
    setSelectedQuestions(new Set());
  }, [initialQuestions]);

  // Toggle question selection
  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  // Select all questions
  const selectAllQuestions = () => {
    if (selectedQuestions.size === questions.length) {
      setSelectedQuestions(new Set());
    } else {
      setSelectedQuestions(new Set(questions.map(q => q.id)));
    }
  };

  // Update question
  const updateQuestion = (questionId: string, updates: Partial<GeneratedQuestion>) => {
    const updatedQuestions = questions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    );
    setQuestions(updatedQuestions);
    if (onQuestionsUpdated) {
      onQuestionsUpdated(updatedQuestions);
    }
  };

  // Delete question
  const deleteQuestion = (questionId: string) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId);
    setQuestions(updatedQuestions);
    setSelectedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
    if (onQuestionsUpdated) {
      onQuestionsUpdated(updatedQuestions);
    }
  };

  // Get selected questions
  const getSelectedQuestions = () => {
    return questions.filter(q => selectedQuestions.has(q.id));
  };

  // Handle add to question bank
  const handleAddToQuestionBank = async () => {
    const selected = getSelectedQuestions();
    if (selected.length === 0) {
      toast({
        title: 'No Questions Selected',
        description: 'Please select at least one question to add to the question bank.',
        variant: 'error'
      });
      return;
    }

    if (!selectedQuestionBank) {
      toast({
        title: 'No Question Bank Selected',
        description: 'Please select a question bank to add the questions to.',
        variant: 'error'
      });
      return;
    }

    try {
      const result = await addToQuestionBankMutation.mutateAsync({
        questionBankId: selectedQuestionBank,
        questions: selected,
      });

      toast({
        title: 'Added to Question Bank',
        description: `${result.questionsAdded} questions added to the question bank successfully.`,
      });

      // Call the callback if provided
      if (onAddToQuestionBank) {
        onAddToQuestionBank(selected);
      }

      // Clear selection
      setSelectedQuestions(new Set());
    } catch (error: any) {
      toast({
        title: 'Failed to Add Questions',
        description: error?.message || 'Failed to add questions to question bank.',
        variant: 'error'
      });
    }
  };

  // Handle create new questions
  const handleCreateNewQuestions = () => {
    const selected = getSelectedQuestions();
    if (selected.length === 0) {
      toast({
        title: 'No Questions Selected',
        description: 'Please select at least one question to create.',
        variant: 'error'
      });
      return;
    }

    if (onCreateNewQuestions) {
      onCreateNewQuestions(selected);
      toast({
        title: 'Questions Created',
        description: `${selected.length} questions created successfully.`,
      });
    }
  };

  if (questions.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No questions generated yet. Use the AI Question Generator to create questions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Questions ({questions.length})</CardTitle>
              <CardDescription>
                Review and manage your AI-generated questions
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAnswers(!showAnswers)}
              >
                {showAnswers ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showAnswers ? 'Hide' : 'Show'} Answers
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedQuestions.size === questions.length}
                onCheckedChange={selectAllQuestions}
              />
              <Label>
                Select All ({selectedQuestions.size} of {questions.length} selected)
              </Label>
            </div>
            
            {selectedQuestions.size > 0 && (
              <div className="flex gap-2 items-center">
                {showQuestionBankOption && questionBanks && questionBanks.length > 0 && (
                  <>
                    <Select value={selectedQuestionBank} onValueChange={setSelectedQuestionBank}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select Question Bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {questionBanks.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddToQuestionBank}
                      disabled={!selectedQuestionBank || addToQuestionBankMutation.isLoading}
                    >
                      <HardDrive className="h-4 w-4 mr-2" />
                      {addToQuestionBankMutation.isLoading ? 'Adding...' : 'Add to Bank'}
                    </Button>
                  </>
                )}
                <Button
                  size="sm"
                  onClick={handleCreateNewQuestions}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Questions
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions list */}
      <div className="space-y-4">
        {questions.map((question, index) => (
          <QuestionCard
            key={question.id}
            question={question}
            index={index}
            isSelected={selectedQuestions.has(question.id)}
            isEditing={editingQuestion === question.id}
            showAnswers={showAnswers}
            onToggleSelection={() => toggleQuestionSelection(question.id)}
            onStartEdit={() => setEditingQuestion(question.id)}
            onStopEdit={() => setEditingQuestion(null)}
            onUpdate={(updates) => updateQuestion(question.id, updates)}
            onDelete={() => deleteQuestion(question.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface QuestionCardProps {
  question: GeneratedQuestion;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  showAnswers: boolean;
  onToggleSelection: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onUpdate: (updates: Partial<GeneratedQuestion>) => void;
  onDelete: () => void;
}

function QuestionCard({
  question,
  index,
  isSelected,
  isEditing,
  showAnswers,
  onToggleSelection,
  onStartEdit,
  onStopEdit,
  onUpdate,
  onDelete
}: QuestionCardProps) {
  const [editedQuestion, setEditedQuestion] = useState(question.question);
  const [editedExplanation, setEditedExplanation] = useState(question.explanation || '');

  const handleSave = () => {
    onUpdate({
      question: editedQuestion,
      explanation: editedExplanation
    });
    onStopEdit();
  };

  const handleCancel = () => {
    setEditedQuestion(question.question);
    setEditedExplanation(question.explanation || '');
    onStopEdit();
  };

  return (
    <Card className={cn('transition-all', isSelected && 'ring-2 ring-primary')}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onToggleSelection}
            className="mt-1"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Q{index + 1}</Badge>
                <Badge variant="secondary">{question.bloomsLevel}</Badge>
                <Badge variant="outline">{question.type}</Badge>
                <Badge variant="outline">{question.difficulty}</Badge>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isEditing ? handleCancel : onStartEdit}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSave}
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Question */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Question</Label>
          {isEditing ? (
            <Textarea
              value={editedQuestion}
              onChange={(e) => setEditedQuestion(e.target.value)}
              rows={3}
            />
          ) : (
            <p className="text-sm">{question.question}</p>
          )}
        </div>

        {/* Options for multiple choice */}
        {question.options && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Options</Label>
            <div className="grid grid-cols-1 gap-2">
              {question.options.map((option, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'p-2 rounded border text-sm',
                    showAnswers && option === question.correctAnswer && 'bg-green-50 border-green-200'
                  )}
                >
                  {String.fromCharCode(65 + idx)}. {option}
                  {showAnswers && option === question.correctAnswer && (
                    <Check className="h-4 w-4 text-green-600 inline ml-2" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Correct Answer (for non-multiple choice) */}
        {!question.options && showAnswers && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Correct Answer</Label>
            <p className="text-sm bg-green-50 p-2 rounded border border-green-200">
              {question.correctAnswer}
            </p>
          </div>
        )}

        {/* Explanation */}
        {showAnswers && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Explanation</Label>
            {isEditing ? (
              <Textarea
                value={editedExplanation}
                onChange={(e) => setEditedExplanation(e.target.value)}
                rows={2}
                placeholder="Add explanation..."
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {question.explanation || 'No explanation provided'}
              </p>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Topic: {question.topic}</span>
          <span>•</span>
          <span>Action Verb: {question.actionVerb}</span>
          <span>•</span>
          <span>Points: {question.points}</span>
        </div>
      </CardContent>
    </Card>
  );
}
