# Quiz Assessment Enhancement - Detailed Implementation Plan

## 🎯 **Implementation Overview**

This document provides a detailed, step-by-step implementation plan for enhancing the Quiz Assessment system with advanced question bank integration, auto-selection capabilities, and intelligent configuration options.

## 📋 **Implementation Phases**

### **Phase 1: Foundation & Question Bank Integration**

#### **1.1 Database Schema Enhancement**
**File**: `prisma/schema.prisma`
```prisma
model Assessment {
  // Existing fields remain unchanged for backward compatibility
  
  // ✅ NEW: Enhanced quiz fields (all optional)
  questionSelectionMode  QuestionSelectionMode?  @default(MANUAL)
  autoSelectionConfig    Json?                   // Auto-selection criteria
  questionPoolConfig     Json?                   // Question pool settings
  enhancedSettings       Json?                   // Advanced quiz configuration
  questionBankRefs       String[]                @default([])
}

enum QuestionSelectionMode {
  MANUAL      // Traditional manual creation (default)
  AUTO        // Automatic selection from question bank
  HYBRID      // Mix of manual and auto selection
}
```

#### **1.2 Enhanced Quiz Question Selector Component**
**File**: `src/features/assessments/components/quiz/QuizQuestionSelector.tsx`
```typescript
interface QuizQuestionSelectorProps {
  selectedQuestions: Question[];
  onQuestionsChange: (questions: Question[]) => void;
  subjectId: string;
  topicIds?: string[];
  maxQuestions?: number;
  targetBloomsDistribution?: BloomsDistribution;
  mode: 'manual' | 'auto' | 'hybrid';
}

export function QuizQuestionSelector({
  selectedQuestions,
  onQuestionsChange,
  subjectId,
  topicIds,
  maxQuestions = 20,
  targetBloomsDistribution,
  mode = 'manual'
}: QuizQuestionSelectorProps) {
  // Implementation with tabbed interface:
  // - Question Bank Browser tab
  // - Auto-Selection Wizard tab
  // - Selected Questions Review tab
  // - Real-time Analytics tab
}
```

#### **1.3 Advanced Question Filtering System**
**File**: `src/features/assessments/components/quiz/QuizQuestionFilters.tsx`
```typescript
interface QuizQuestionFiltersProps {
  filters: QuizQuestionFilters;
  onFiltersChange: (filters: QuizQuestionFilters) => void;
  availableTopics: Topic[];
  availableLearningOutcomes: LearningOutcome[];
}

interface QuizQuestionFilters {
  subjectId: string;
  topicIds: string[];
  bloomsLevels: BloomsTaxonomyLevel[];
  difficulties: DifficultyLevel[];
  questionTypes: QuestionType[];
  learningOutcomeIds: string[];
  usageFrequency: 'low' | 'medium' | 'high' | 'any';
  performanceRating: number; // 1-5 stars
  lastUsedBefore?: Date;
  excludeRecentlyUsed: boolean;
}
```

### **Phase 2: Auto-Selection Engine**

#### **2.1 Quiz Auto-Selection Service**
**File**: `src/features/assessments/services/quiz-auto-selection.service.ts`
```typescript
export class QuizAutoSelectionService {
  constructor(private prisma: PrismaClient) {}

  async autoSelectQuestions(config: AutoSelectionConfig): Promise<{
    questions: Question[];
    analysis: SelectionAnalysis;
    recommendations: string[];
  }> {
    // 1. Filter available questions by criteria
    const availableQuestions = await this.getAvailableQuestions(config);
    
    // 2. Apply Bloom's distribution requirements
    const bloomsBalanced = this.balanceBloomsTaxonomy(availableQuestions, config.bloomsDistribution);
    
    // 3. Balance difficulty levels
    const difficultyBalanced = this.balanceDifficulty(bloomsBalanced, config.difficultyDistribution);
    
    // 4. Ensure question type variety
    const typeBalanced = this.balanceQuestionTypes(difficultyBalanced, config.questionTypePreferences);
    
    // 5. Prioritize high-performing questions
    const qualityFiltered = this.prioritizeQuality(typeBalanced, config.prioritizeHighPerforming);
    
    // 6. Apply randomization if requested
    const finalSelection = this.applyRandomization(qualityFiltered, config);
    
    return {
      questions: finalSelection,
      analysis: this.analyzeSelection(finalSelection, config),
      recommendations: this.generateRecommendations(finalSelection, config)
    };
  }

  private async getAvailableQuestions(config: AutoSelectionConfig): Promise<Question[]> {
    return this.prisma.question.findMany({
      where: {
        subjectId: config.subjectId,
        topicId: { in: config.topicIds },
        bloomsLevel: { in: config.allowedBloomsLevels },
        difficulty: { in: config.allowedDifficulties },
        status: 'ACTIVE',
        // Exclude recently used questions if requested
        ...(config.excludeRecentlyUsed && {
          NOT: {
            id: { in: await this.getRecentlyUsedQuestions(config.subjectId) }
          }
        })
      },
      include: {
        metadata: true,
        usageStats: true,
        performanceMetrics: true
      }
    });
  }

  private balanceBloomsTaxonomy(
    questions: Question[], 
    targetDistribution: BloomsDistribution
  ): Question[] {
    // Algorithm to select questions that match target Bloom's distribution
    const selectedByLevel: Record<BloomsTaxonomyLevel, Question[]> = {};
    
    Object.entries(targetDistribution).forEach(([level, percentage]) => {
      const levelQuestions = questions.filter(q => q.bloomsLevel === level);
      const targetCount = Math.round((percentage / 100) * questions.length);
      selectedByLevel[level as BloomsTaxonomyLevel] = this.selectBestQuestions(levelQuestions, targetCount);
    });
    
    return Object.values(selectedByLevel).flat();
  }

  private selectBestQuestions(questions: Question[], count: number): Question[] {
    // Sort by quality metrics and select top questions
    return questions
      .sort((a, b) => this.calculateQuestionQuality(b) - this.calculateQuestionQuality(a))
      .slice(0, count);
  }

  private calculateQuestionQuality(question: Question): number {
    // Quality scoring algorithm based on:
    // - Performance metrics (success rate, discrimination index)
    // - Usage frequency (not too high, not too low)
    // - Teacher ratings
    // - Student feedback
    // - Recency of updates
    
    const performanceScore = question.performanceMetrics?.successRate || 0.5;
    const usageScore = this.calculateUsageScore(question.usageStats);
    const ratingScore = question.metadata?.teacherRating || 3;
    const freshnessScore = this.calculateFreshnessScore(question.updatedAt);
    
    return (performanceScore * 0.4) + (usageScore * 0.2) + (ratingScore * 0.3) + (freshnessScore * 0.1);
  }
}

interface AutoSelectionConfig {
  subjectId: string;
  topicIds: string[];
  questionCount: number;
  bloomsDistribution: BloomsDistribution;
  difficultyDistribution: DifficultyDistribution;
  questionTypePreferences: QuestionTypePreference[];
  allowedBloomsLevels: BloomsTaxonomyLevel[];
  allowedDifficulties: DifficultyLevel[];
  excludeRecentlyUsed: boolean;
  prioritizeHighPerforming: boolean;
  randomizationLevel: 'none' | 'low' | 'medium' | 'high';
  qualityThreshold: number; // Minimum quality score (1-5)
}
```

#### **2.2 Auto-Selection Wizard Component**
**File**: `src/features/assessments/components/quiz/AutoSelectionWizard.tsx`
```typescript
export function AutoSelectionWizard({
  subjectId,
  onComplete,
  onCancel
}: AutoSelectionWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<Partial<AutoSelectionConfig>>({});

  const steps = [
    { id: 1, title: 'Subject & Topics', component: SubjectTopicStep },
    { id: 2, title: 'Question Count & Distribution', component: DistributionStep },
    { id: 3, title: 'Difficulty & Types', component: DifficultyTypeStep },
    { id: 4, title: 'Advanced Options', component: AdvancedOptionsStep },
    { id: 5, title: 'Preview & Confirm', component: PreviewStep }
  ];

  // Step-by-step wizard implementation with validation
  // Real-time preview of selected questions
  // Configuration validation and recommendations
}
```

### **Phase 3: Enhanced Quiz Creator Interface**

#### **3.1 Enhanced Quiz Creator Component**
**File**: `src/features/assessments/components/quiz/EnhancedQuizCreator.tsx`
```typescript
export function EnhancedQuizCreator({
  initialData,
  onSave,
  onCancel,
  mode = 'create'
}: EnhancedQuizCreatorProps) {
  const [activeTab, setActiveTab] = useState('basic');
  const [quizData, setQuizData] = useState<Partial<Assessment>>(initialData || {});
  const [selectionMode, setSelectionMode] = useState<QuestionSelectionMode>('MANUAL');

  return (
    <div className="enhanced-quiz-creator">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <QuizBasicInfoForm 
            data={quizData}
            onChange={setQuizData}
          />
        </TabsContent>

        <TabsContent value="questions">
          <div className="space-y-4">
            {/* Selection Mode Toggle */}
            <SelectionModeToggle 
              mode={selectionMode}
              onChange={setSelectionMode}
            />

            {/* Question Selection Interface */}
            {selectionMode === 'MANUAL' && (
              <ManualQuestionSelection 
                questions={quizData.questions || []}
                onChange={(questions) => setQuizData({...quizData, questions})}
                subjectId={quizData.subjectId}
              />
            )}

            {selectionMode === 'AUTO' && (
              <AutoSelectionWizard 
                subjectId={quizData.subjectId}
                onComplete={(questions) => setQuizData({...quizData, questions})}
              />
            )}

            {selectionMode === 'HYBRID' && (
              <HybridQuestionSelection 
                questions={quizData.questions || []}
                onChange={(questions) => setQuizData({...quizData, questions})}
                subjectId={quizData.subjectId}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="configuration">
          <QuizAdvancedConfiguration 
            settings={quizData.enhancedSettings}
            onChange={(settings) => setQuizData({...quizData, enhancedSettings: settings})}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <QuizAnalyticsDashboard 
            questions={quizData.questions || []}
            settings={quizData.enhancedSettings}
          />
        </TabsContent>

        <TabsContent value="preview">
          <QuizPreview 
            quiz={quizData}
            mode="teacher"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### **3.2 Real-time Analytics Dashboard**
**File**: `src/features/assessments/components/quiz/QuizAnalyticsDashboard.tsx`
```typescript
export function QuizAnalyticsDashboard({
  questions,
  settings
}: QuizAnalyticsDashboardProps) {
  const analytics = useMemo(() => {
    return {
      bloomsDistribution: calculateBloomsDistribution(questions),
      difficultyBalance: calculateDifficultyBalance(questions),
      questionTypeVariety: calculateQuestionTypeVariety(questions),
      estimatedMetrics: calculateEstimatedMetrics(questions, settings),
      qualityScore: calculateOverallQualityScore(questions),
      recommendations: generateRecommendations(questions, settings)
    };
  }, [questions, settings]);

  return (
    <div className="quiz-analytics-dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bloom's Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Cognitive Level Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <BloomsDistributionChart distribution={analytics.bloomsDistribution} />
          </CardContent>
        </Card>

        {/* Difficulty Balance */}
        <Card>
          <CardHeader>
            <CardTitle>Difficulty Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <DifficultyBalanceChart distribution={analytics.difficultyBalance} />
          </CardContent>
        </Card>

        {/* Question Type Variety */}
        <Card>
          <CardHeader>
            <CardTitle>Question Type Variety</CardTitle>
          </CardHeader>
          <CardContent>
            <QuestionTypeChart distribution={analytics.questionTypeVariety} />
          </CardContent>
        </Card>

        {/* Estimated Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Estimated Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>Completion Time: {analytics.estimatedMetrics.completionTime} min</div>
              <div>Success Rate: {analytics.estimatedMetrics.successRate}%</div>
              <div>Difficulty Level: {analytics.estimatedMetrics.difficultyLevel}</div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Score */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold">{analytics.qualityScore}/5</div>
              <StarRating rating={analytics.qualityScore} />
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {analytics.recommendations.map((rec, index) => (
                <li key={index} className="text-sm">• {rec}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

This implementation plan provides a comprehensive roadmap for enhancing the quiz assessment system while maintaining full backward compatibility and ensuring a smooth transition for all users.
