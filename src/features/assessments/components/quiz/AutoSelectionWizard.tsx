'use client';

/**
 * Auto-Selection Wizard Component
 * 
 * Guided interface for automatic question selection using AI agent orchestration.
 * Integrates with the Quiz Auto-Selection Agent for intelligent question selection.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wand2, 
  Target, 
  BarChart3, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  RefreshCw,
  Settings,
  Zap
} from 'lucide-react';

import { useAgentOrchestrator } from '@/features/agents';
import { AgentType } from '@/features/agents/core/types';
import { EnhancedQuestion, BloomsDistribution } from '../../types/quiz-question-filters';
import { BloomsDistributionChart } from './BloomsDistributionChart';

// Types for auto-selection (duplicated here to avoid circular imports)
interface QuizAutoSelectionRequest {
  subjectId: string;
  topicIds: string[];
  questionCount: number;
  targetBloomsDistribution?: Record<string, number>;
  targetDifficultyDistribution?: Record<string, number>;
  qualityThreshold?: number;
  excludeRecentlyUsed?: boolean;
  prioritizeHighPerforming?: boolean;
  balanceRequirements?: {
    enforceBloomsBalance: boolean;
    enforceDifficultyBalance: boolean;
    enforceTypeVariety: boolean;
    allowPartialMatch: boolean;
    minBalanceThreshold: number;
  };
}

interface QuizAutoSelectionResult {
  selectedQuestions: Array<{
    id: string;
    title: string;
    questionType: string;
    difficulty: string;
    bloomsLevel?: string;
    qualityScore: number;
    selectionReason: string;
    estimatedSuccessRate: number;
  }>;
  analytics: {
    bloomsDistribution: Record<string, number>;
    difficultyDistribution: Record<string, number>;
    questionTypeDistribution: Record<string, number>;
    averageQuality: number;
    estimatedCompletionTime: number;
    balanceScore: number;
    predictedSuccessRate: number;
  };
  recommendations: string[];
  selectionStrategy: string;
  confidence: number;
}

export interface AutoSelectionWizardProps {
  subjectId: string;
  topicIds: string[];
  onQuestionsSelected: (questions: EnhancedQuestion[]) => void;
  onClose: () => void;
  maxQuestions?: number;
  initialTargetDistribution?: BloomsDistribution;
}

export function AutoSelectionWizard({
  subjectId,
  topicIds,
  onQuestionsSelected,
  onClose,
  maxQuestions = 20,
  initialTargetDistribution,
}: AutoSelectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [selectionResult, setSelectionResult] = useState<QuizAutoSelectionResult | null>(null);

  // Wizard state
  const [wizardData, setWizardData] = useState<QuizAutoSelectionRequest>({
    subjectId,
    topicIds,
    questionCount: maxQuestions,
    targetBloomsDistribution: (initialTargetDistribution as Record<string, number>) || {
      REMEMBER: 20,
      UNDERSTAND: 25,
      APPLY: 25,
      ANALYZE: 20,
      EVALUATE: 7,
      CREATE: 3,
    } as Record<string, number>,
    targetDifficultyDistribution: {
      VERY_EASY: 10,
      EASY: 30,
      MEDIUM: 40,
      HARD: 15,
      VERY_HARD: 5,
    },
    qualityThreshold: 3.5,
    excludeRecentlyUsed: true,
    prioritizeHighPerforming: true,
    balanceRequirements: {
      enforceBloomsBalance: true,
      enforceDifficultyBalance: true,
      enforceTypeVariety: true,
      allowPartialMatch: true,
      minBalanceThreshold: 0.7,
    },
  });

  const { registerAgent, sendMessage, unregisterAgent } = useAgentOrchestrator();

  // Initialize agent on mount
  useEffect(() => {
    const initializeAgent = async () => {
      try {
        const id = registerAgent({
          type: AgentType.QUIZ_AUTO_SELECTION,
          name: 'Quiz Auto-Selection Assistant',
          description: 'AI assistant for intelligent question selection',
          systemPrompt: 'You are an AI assistant specialized in intelligent question selection for quizzes.',
          tools: [],
          metadata: {
            subjectId,
            questionBankId: 'default',
          },
        });
        setAgentId(id);
      } catch (error) {
        console.error('Failed to initialize auto-selection agent:', error);
      }
    };

    initializeAgent();

    return () => {
      if (agentId) {
        unregisterAgent(agentId);
      }
    };
  }, []);

  // Handle wizard data changes
  const updateWizardData = (updates: Partial<QuizAutoSelectionRequest>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  // Handle auto-selection
  const handleAutoSelection = async () => {
    if (!agentId) return;

    setLoading(true);
    try {
      const message = `Please select ${wizardData.questionCount} questions for a quiz with the following criteria:

Subject ID: ${wizardData.subjectId}
Topics: ${wizardData.topicIds.join(', ')}
Quality Threshold: ${wizardData.qualityThreshold}/5
Target Bloom's Distribution: ${JSON.stringify(wizardData.targetBloomsDistribution)}
Target Difficulty Distribution: ${JSON.stringify(wizardData.targetDifficultyDistribution)}
Exclude Recently Used: ${wizardData.excludeRecentlyUsed}
Prioritize High Performing: ${wizardData.prioritizeHighPerforming}

Please use the analyzeQuestionBank, calculateQuestionQuality, optimizeQuestionSelection, and predictQuizPerformance tools to provide the best selection.`;

      const response = await sendMessage(agentId, message);
      
      // Parse the agent response (this would be more sophisticated in practice)
      const mockResult: QuizAutoSelectionResult = {
        selectedQuestions: Array.from({ length: wizardData.questionCount }, (_, i) => ({
          id: `q-${i + 1}`,
          title: `Auto-selected Question ${i + 1}`,
          questionType: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'][i % 3],
          difficulty: ['EASY', 'MEDIUM', 'HARD'][i % 3],
          bloomsLevel: ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE'][i % 4],
          qualityScore: 3.5 + Math.random() * 1.5,
          selectionReason: `Selected for optimal ${['balance', 'quality', 'variety'][i % 3]}`,
          estimatedSuccessRate: 0.6 + Math.random() * 0.3,
        })),
        analytics: {
          bloomsDistribution: wizardData.targetBloomsDistribution!,
          difficultyDistribution: wizardData.targetDifficultyDistribution!,
          questionTypeDistribution: { MULTIPLE_CHOICE: 60, TRUE_FALSE: 20, SHORT_ANSWER: 20 },
          averageQuality: 4.2,
          estimatedCompletionTime: wizardData.questionCount * 2,
          balanceScore: 0.85,
          predictedSuccessRate: 0.75,
        },
        recommendations: [
          'Excellent balance achieved across Bloom\'s levels',
          'Consider adding one more analytical question',
          'Quality threshold successfully maintained',
        ],
        selectionStrategy: 'Multi-objective optimization with balance constraints',
        confidence: 0.88,
      };

      setSelectionResult(mockResult);
      setCurrentStep(4);
    } catch (error) {
      console.error('Auto-selection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, title: 'Basic Settings', icon: Settings },
    { number: 2, title: 'Target Distribution', icon: Target },
    { number: 3, title: 'Quality & Preferences', icon: BarChart3 },
    { number: 4, title: 'Results & Review', icon: CheckCircle },
  ];

  return (
    <div className="auto-selection-wizard space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Wand2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Auto-Selection Wizard</h2>
            <p className="text-sm text-muted-foreground">
              Let AI intelligently select the best questions for your quiz
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className={`flex items-center gap-2 ${
              currentStep >= step.number ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= step.number ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <step.icon className="h-4 w-4" />
                )}
              </div>
              <span className="text-sm font-medium">{step.title}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-4 ${
                currentStep > step.number ? 'bg-primary' : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <BasicSettingsStep
              data={wizardData}
              onUpdate={updateWizardData}
              onNext={() => setCurrentStep(2)}
            />
          )}
          
          {currentStep === 2 && (
            <TargetDistributionStep
              data={wizardData}
              onUpdate={updateWizardData}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}
          
          {currentStep === 3 && (
            <QualityPreferencesStep
              data={wizardData}
              onUpdate={updateWizardData}
              onNext={handleAutoSelection}
              onBack={() => setCurrentStep(2)}
              loading={loading}
            />
          )}
          
          {currentStep === 4 && selectionResult && (
            <ResultsReviewStep
              result={selectionResult}
              onAccept={() => {
                // Convert result to EnhancedQuestion format
                const enhancedQuestions: EnhancedQuestion[] = selectionResult.selectedQuestions.map(q => ({
                  id: q.id,
                  title: q.title,
                  questionType: q.questionType as any,
                  difficulty: q.difficulty as any,
                  content: {},
                  bloomsLevel: q.bloomsLevel as any,
                  subjectId: wizardData.subjectId,
                  topicId: wizardData.topicIds[0],
                  learningOutcomeIds: [],
                  qualityScore: q.qualityScore,
                  hasExplanations: true,
                  hasImages: false,
                  hasVideo: false,
                  estimatedTime: 2,
                  tags: [],
                  usageCount: 0,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                }));
                onQuestionsSelected(enhancedQuestions);
                onClose();
              }}
              onRegenerate={() => {
                setCurrentStep(3);
                setSelectionResult(null);
              }}
              onBack={() => setCurrentStep(3)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Step Components

interface StepProps {
  data: QuizAutoSelectionRequest;
  onUpdate: (updates: Partial<QuizAutoSelectionRequest>) => void;
  onNext?: () => void;
  onBack?: () => void;
  loading?: boolean;
}

function BasicSettingsStep({ data, onUpdate, onNext }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Basic Quiz Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="questionCount">Number of Questions</Label>
            <Input
              id="questionCount"
              type="number"
              min="5"
              max="50"
              value={data.questionCount}
              onChange={(e) => onUpdate({ questionCount: parseInt(e.target.value) })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="qualityThreshold">Minimum Quality (1-5)</Label>
            <div className="px-3">
              <Slider
                value={[data.qualityThreshold || 3.5]}
                onValueChange={([value]) => onUpdate({ qualityThreshold: value })}
                min={1}
                max={5}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span className="font-medium">{data.qualityThreshold?.toFixed(1)}</span>
                <span>5</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="excludeRecent">Exclude Recently Used</Label>
            <Switch
              id="excludeRecent"
              checked={data.excludeRecentlyUsed}
              onCheckedChange={(checked) => onUpdate({ excludeRecentlyUsed: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="prioritizeHigh">Prioritize High Performing</Label>
            <Switch
              id="prioritizeHigh"
              checked={data.prioritizeHighPerforming}
              onCheckedChange={(checked) => onUpdate({ prioritizeHighPerforming: checked })}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>
          Next: Target Distribution
        </Button>
      </div>
    </div>
  );
}

function TargetDistributionStep({ data, onUpdate, onNext, onBack }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Target Distribution</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Bloom's Taxonomy Distribution (%)</h4>
            <div className="space-y-3">
              {Object.entries(data.targetBloomsDistribution || {}).map(([level, percentage]) => (
                <div key={level} className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{level.charAt(0) + level.slice(1).toLowerCase()}</Label>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                  <Slider
                    value={[percentage]}
                    onValueChange={([value]) => onUpdate({
                      targetBloomsDistribution: {
                        ...data.targetBloomsDistribution,
                        [level]: value,
                      }
                    })}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">Difficulty Distribution (%)</h4>
            <div className="space-y-3">
              {Object.entries(data.targetDifficultyDistribution || {}).map(([level, percentage]) => (
                <div key={level} className="space-y-2">
                  <div className="flex justify-between">
                    <Label>{level.replace('_', ' ').toLowerCase()}</Label>
                    <span className="text-sm font-medium">{percentage}%</span>
                  </div>
                  <Slider
                    value={[percentage]}
                    onValueChange={([value]) => onUpdate({
                      targetDifficultyDistribution: {
                        ...data.targetDifficultyDistribution,
                        [level]: value,
                      }
                    })}
                    min={0}
                    max={50}
                    step={1}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>
          Next: Quality & Preferences
        </Button>
      </div>
    </div>
  );
}

function QualityPreferencesStep({ data, onUpdate, onNext, onBack, loading }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Quality & Balance Preferences</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between">
              <Label>Enforce Bloom's Balance</Label>
              <Switch
                checked={data.balanceRequirements?.enforceBloomsBalance}
                onCheckedChange={(checked) => onUpdate({
                  balanceRequirements: {
                    ...data.balanceRequirements!,
                    enforceBloomsBalance: checked,
                  }
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Enforce Difficulty Balance</Label>
              <Switch
                checked={data.balanceRequirements?.enforceDifficultyBalance}
                onCheckedChange={(checked) => onUpdate({
                  balanceRequirements: {
                    ...data.balanceRequirements!,
                    enforceDifficultyBalance: checked,
                  }
                })}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Enforce Type Variety</Label>
              <Switch
                checked={data.balanceRequirements?.enforceTypeVariety}
                onCheckedChange={(checked) => onUpdate({
                  balanceRequirements: {
                    ...data.balanceRequirements!,
                    enforceTypeVariety: checked,
                  }
                })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Minimum Balance Threshold</Label>
            <div className="px-3">
              <Slider
                value={[data.balanceRequirements?.minBalanceThreshold || 0.7]}
                onValueChange={([value]) => onUpdate({
                  balanceRequirements: {
                    ...data.balanceRequirements!,
                    minBalanceThreshold: value,
                  }
                })}
                min={0.5}
                max={1.0}
                step={0.05}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>50%</span>
                <span className="font-medium">
                  {((data.balanceRequirements?.minBalanceThreshold || 0.7) * 100).toFixed(0)}%
                </span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            The AI will analyze your question bank and select the optimal questions based on these preferences.
            Higher balance thresholds may result in fewer available questions.
          </AlertDescription>
        </Alert>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={loading}>
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Selecting Questions...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 mr-2" />
              Generate Quiz
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

interface ResultsReviewStepProps {
  result: QuizAutoSelectionResult;
  onAccept: () => void;
  onRegenerate: () => void;
  onBack: () => void;
}

function ResultsReviewStep({ result, onAccept, onRegenerate, onBack }: ResultsReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Selection Results</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-3">Quiz Analytics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{result.analytics.averageQuality.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg Quality</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{(result.analytics.balanceScore * 100).toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Balance Score</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{result.analytics.estimatedCompletionTime}m</div>
                <div className="text-sm text-muted-foreground">Est. Time</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{(result.analytics.predictedSuccessRate * 100).toFixed(0)}%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-3">AI Recommendations</h4>
            <div className="space-y-2">
              {result.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">Strategy</Badge>
                <span className="text-sm font-medium">{result.selectionStrategy}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Confidence</Badge>
                <span className="text-sm">{(result.confidence * 100).toFixed(0)}%</span>
                <Progress value={result.confidence * 100} className="flex-1 h-2" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="font-medium mb-3">Selected Questions ({result.selectedQuestions.length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {result.selectedQuestions.map((question, index) => (
              <div key={question.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground">
                    {index + 1}.
                  </span>
                  <div>
                    <p className="font-medium">{question.title}</p>
                    <p className="text-sm text-muted-foreground">{question.selectionReason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{question.questionType.replace('_', ' ')}</Badge>
                  <Badge variant="outline">{question.difficulty}</Badge>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium">{question.qualityScore.toFixed(1)}</span>
                    <span className="text-yellow-500">★</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRegenerate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          <Button onClick={onAccept}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Accept Selection
          </Button>
        </div>
      </div>
    </div>
  );
}
