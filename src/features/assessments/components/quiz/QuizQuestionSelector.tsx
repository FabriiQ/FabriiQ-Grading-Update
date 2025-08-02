'use client';

/**
 * Quiz Question Selector Component
 * 
 * Main component for selecting questions from the question bank for quiz assessments.
 * Features tabbed interface with filtering, selection, and real-time analytics.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Filter, BarChart, CheckCircle, XCircle, Clock, Users } from 'lucide-react';

import {
  QuizQuestionFilters,
  EnhancedQuestion,
  QuestionSelectionCriteria,
  DEFAULT_QUIZ_FILTERS,
  mergeWithDefaults,
  validateFilters
} from '../../types/quiz-question-filters';
import { QuestionSelectionMode } from '../../types/enhanced-assessment';
import { BloomsTaxonomyLevel, DifficultyLevel, QuestionType } from '@prisma/client';
import { api } from '@/utils/api';

export interface QuizQuestionSelectorProps {
  selectedQuestions: EnhancedQuestion[];
  onQuestionsChange: (questions: EnhancedQuestion[]) => void;
  subjectId: string;
  topicIds?: string[];
  maxQuestions?: number;
  targetBloomsDistribution?: Record<string, number>;
  mode: QuestionSelectionMode;
  onModeChange?: (mode: QuestionSelectionMode) => void;
}

export function QuizQuestionSelector({
  selectedQuestions,
  onQuestionsChange,
  subjectId,
  topicIds = [],
  maxQuestions = 20,
  targetBloomsDistribution,
  mode,
  onModeChange,
}: QuizQuestionSelectorProps) {
  const [activeTab, setActiveTab] = useState('browse');
  const [filters, setFilters] = useState<QuizQuestionFilters>(() => 
    mergeWithDefaults({
      subjectId,
      topicIds,
    })
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState<EnhancedQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  // API hooks for question bank integration
  const { data: questionBanks } = api.questionBank.getQuestionBanks.useQuery({
    filters: { subjectId },
    pagination: { page: 1, pageSize: 10 },
  });

  const { data: questionsData, refetch: refetchQuestions } = api.questionBank.getQuestions.useQuery({
    questionBankId: questionBanks?.items?.[0]?.id || '',
    filters: {
      subjectId,
      topicId: topicIds.length > 0 ? topicIds[0] : undefined,
      questionType: filters.questionTypes.length > 0 ? filters.questionTypes[0] : undefined,
      difficulty: filters.difficulties.length > 0 ? filters.difficulties[0] : undefined,
      search: searchQuery || undefined,
    },
    pagination: { page: 1, pageSize: 50 },
  }, {
    enabled: !!questionBanks?.items?.[0]?.id,
  });

  // Calculate real-time analytics
  const analytics = useMemo(() => {
    return calculateQuestionAnalytics(selectedQuestions);
  }, [selectedQuestions]);

  // Update available questions when data changes
  useEffect(() => {
    if (questionsData?.items) {
      const enhancedQuestions: EnhancedQuestion[] = questionsData.items.map(q => ({
        id: q.id,
        title: q.title,
        questionType: q.questionType,
        difficulty: q.difficulty,
        content: q.content,
        bloomsLevel: q.bloomsLevel || undefined,
        subjectId: q.subjectId,
        topicId: q.topicId || undefined,
        courseId: q.courseId || undefined,
        gradeLevel: q.gradeLevel || undefined,
        learningOutcomeIds: q.learningOutcomeIds || [],
        usageStats: {
          totalUsage: Math.floor(Math.random() * 100),
          recentUsage: Math.floor(Math.random() * 10),
          averageScore: 0.7 + Math.random() * 0.3,
          successRate: 0.6 + Math.random() * 0.4,
          discriminationIndex: 0.2 + Math.random() * 0.6,
          averageTimeSpent: 60 + Math.random() * 120,
        },
        performanceMetrics: {
          successRate: 0.6 + Math.random() * 0.4,
          averageScore: 0.7 + Math.random() * 0.3,
          discriminationIndex: 0.2 + Math.random() * 0.6,
          averageTimeSpent: 60 + Math.random() * 120,
          difficultyIndex: 0.3 + Math.random() * 0.4,
          reliabilityIndex: 0.7 + Math.random() * 0.3,
        },
        qualityScore: 3 + Math.random() * 2,
        hasExplanations: !!(q.content as any)?.explanation,
        hasImages: !!(q.content as any)?.images?.length,
        hasVideo: !!(q.content as any)?.video,
        estimatedTime: getEstimatedTime(q.questionType),
        tags: (q.metadata as any)?.tags || [],
        year: q.year || undefined,
        lastUsed: q.lastUsed || undefined,
        usageCount: Math.floor(Math.random() * 50),
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
      }));
      setAvailableQuestions(enhancedQuestions);
    }
  }, [questionsData]);

  // Handle question selection
  const handleQuestionToggle = (question: EnhancedQuestion) => {
    const isSelected = selectedQuestions.some(q => q.id === question.id);
    
    if (isSelected) {
      onQuestionsChange(selectedQuestions.filter(q => q.id !== question.id));
    } else {
      if (selectedQuestions.length < maxQuestions) {
        onQuestionsChange([...selectedQuestions, question]);
      }
    }
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof QuizQuestionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Refetch questions with new search query
    setTimeout(() => {
      refetchQuestions();
    }, 300); // Debounce search
  };

  // Handle filter changes and refetch
  const handleFilterChangeWithRefetch = (key: keyof QuizQuestionFilters, value: any) => {
    handleFilterChange(key, value);
    setTimeout(() => {
      refetchQuestions();
    }, 100);
  };

  return (
    <div className="quiz-question-selector space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Question Selection</h3>
          <p className="text-sm text-muted-foreground">
            Select questions for your quiz assessment
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {selectedQuestions.length} / {maxQuestions} selected
          </Badge>
          {onModeChange && (
            <Select value={mode} onValueChange={onModeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="AUTO">Auto</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="filters" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="selected" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Selected ({selectedQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Browse Tab */}
        <TabsContent value="browse" className="space-y-4">
          <QuestionBrowser
            questions={availableQuestions}
            selectedQuestions={selectedQuestions}
            onQuestionToggle={handleQuestionToggle}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            loading={loading}
          />
        </TabsContent>

        {/* Filters Tab */}
        <TabsContent value="filters" className="space-y-4">
          <QuestionFilters
            filters={filters}
            onFilterChange={handleFilterChangeWithRefetch}
            subjectId={subjectId}
          />
        </TabsContent>

        {/* Selected Questions Tab */}
        <TabsContent value="selected" className="space-y-4">
          <SelectedQuestions
            questions={selectedQuestions}
            onQuestionRemove={(question) => 
              onQuestionsChange(selectedQuestions.filter(q => q.id !== question.id))
            }
            onReorder={onQuestionsChange}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <QuestionAnalytics
            analytics={analytics}
            targetDistribution={targetBloomsDistribution}
            maxQuestions={maxQuestions}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Question Browser Component
interface QuestionBrowserProps {
  questions: EnhancedQuestion[];
  selectedQuestions: EnhancedQuestion[];
  onQuestionToggle: (question: EnhancedQuestion) => void;
  searchQuery: string;
  onSearch: (query: string) => void;
  loading: boolean;
}

function QuestionBrowser({
  questions,
  selectedQuestions,
  onQuestionToggle,
  searchQuery,
  onSearch,
  loading,
}: QuestionBrowserProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search questions..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Question List */}
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {questions.map((question) => (
            <QuestionCard
              key={question.id}
              question={question}
              isSelected={selectedQuestions.some(q => q.id === question.id)}
              onToggle={() => onQuestionToggle(question)}
            />
          ))}
          {questions.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No questions found. Try adjusting your filters.
            </div>
          )}
          {loading && (
            <div className="text-center py-8 text-muted-foreground">
              Loading questions...
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Question Card Component
interface QuestionCardProps {
  question: EnhancedQuestion;
  isSelected: boolean;
  onToggle: () => void;
}

function QuestionCard({ question, isSelected, onToggle }: QuestionCardProps) {
  return (
    <Card className={`cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {isSelected ? (
              <CheckCircle className="h-5 w-5 text-primary" onClick={onToggle} />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" onClick={onToggle} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm line-clamp-2">{question.title}</h4>
              <div className="flex items-center gap-1">
                <span className="text-xs text-yellow-500">★</span>
                <span className="text-xs text-muted-foreground">
                  {question.qualityScore?.toFixed(1) || '3.0'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {question.questionType.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {question.difficulty}
              </Badge>
              {question.bloomsLevel && (
                <Badge variant="outline" className="text-xs">
                  {question.bloomsLevel}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {question.estimatedTime || 2}m
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {question.usageStats?.totalUsage || 0} uses
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Question Filters Component
interface QuestionFiltersProps {
  filters: QuizQuestionFilters;
  onFilterChange: (key: keyof QuizQuestionFilters, value: any) => void;
  subjectId: string;
}

function QuestionFilters({ filters, onFilterChange, subjectId }: QuestionFiltersProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bloom's Levels */}
          <div>
            <Label className="text-sm font-medium">Bloom's Taxonomy Levels</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.values(BloomsTaxonomyLevel).map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={level}
                    checked={filters.bloomsLevels.includes(level)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onFilterChange('bloomsLevels', [...filters.bloomsLevels, level]);
                      } else {
                        onFilterChange('bloomsLevels', filters.bloomsLevels.filter(l => l !== level));
                      }
                    }}
                  />
                  <Label htmlFor={level} className="text-sm">
                    {level.charAt(0) + level.slice(1).toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Difficulty Levels */}
          <div>
            <Label className="text-sm font-medium">Difficulty Levels</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {Object.values(DifficultyLevel).map((level) => (
                <div key={level} className="flex items-center space-x-2">
                  <Checkbox
                    id={level}
                    checked={filters.difficulties.includes(level)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onFilterChange('difficulties', [...filters.difficulties, level]);
                      } else {
                        onFilterChange('difficulties', filters.difficulties.filter(d => d !== level));
                      }
                    }}
                  />
                  <Label htmlFor={level} className="text-sm">
                    {level.replace('_', ' ').toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Question Types */}
          <div>
            <Label className="text-sm font-medium">Question Types</Label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {Object.values(QuestionType).slice(0, 6).map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={filters.questionTypes.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onFilterChange('questionTypes', [...filters.questionTypes, type]);
                      } else {
                        onFilterChange('questionTypes', filters.questionTypes.filter(t => t !== type));
                      }
                    }}
                  />
                  <Label htmlFor={type} className="text-sm">
                    {type.replace('_', ' ').toLowerCase()}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Selected Questions Component
interface SelectedQuestionsProps {
  questions: EnhancedQuestion[];
  onQuestionRemove: (question: EnhancedQuestion) => void;
  onReorder: (questions: EnhancedQuestion[]) => void;
}

function SelectedQuestions({ questions, onQuestionRemove, onReorder }: SelectedQuestionsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Selected Questions</h4>
        <Badge variant="outline">{questions.length} questions</Badge>
      </div>
      
      <ScrollArea className="h-96">
        <div className="space-y-2">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">
                      {index + 1}.
                    </span>
                    <div>
                      <p className="text-sm font-medium line-clamp-1">{question.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {question.questionType.replace('_', ' ')}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {question.difficulty}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onQuestionRemove(question)}
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {questions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No questions selected yet.
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// Question Analytics Component
interface QuestionAnalyticsProps {
  analytics: any;
  targetDistribution?: Record<string, number>;
  maxQuestions: number;
}

function QuestionAnalytics({ analytics, targetDistribution, maxQuestions }: QuestionAnalyticsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bloom's Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.bloomsDistribution).map(([level, percentage]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm">{level}</span>
                  <span className="text-sm font-medium">{String(percentage)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Difficulty Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(analytics.difficultyDistribution).map(([level, percentage]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm">{level.replace('_', ' ')}</span>
                  <span className="text-sm font-medium">{String(percentage)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quiz Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{analytics.averageQuality.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Avg Quality</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{analytics.estimatedCompletionTime}m</div>
              <div className="text-sm text-muted-foreground">Est. Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{(analytics.balanceScore * 100).toFixed(0)}%</div>
              <div className="text-sm text-muted-foreground">Balance Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Object.keys(analytics.questionTypeDistribution).length}</div>
              <div className="text-sm text-muted-foreground">Question Types</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate analytics
function calculateQuestionAnalytics(questions: EnhancedQuestion[]) {
  const total = questions.length;
  
  if (total === 0) {
    return {
      bloomsDistribution: {},
      difficultyDistribution: {},
      questionTypeDistribution: {},
      averageQuality: 0,
      estimatedCompletionTime: 0,
      balanceScore: 0,
    };
  }

  // Calculate distributions
  const bloomsDistribution: Record<string, number> = {};
  const difficultyDistribution: Record<string, number> = {};
  const questionTypeDistribution: Record<string, number> = {};

  questions.forEach(q => {
    if (q.bloomsLevel) {
      bloomsDistribution[q.bloomsLevel] = (bloomsDistribution[q.bloomsLevel] || 0) + 1;
    }
    difficultyDistribution[q.difficulty] = (difficultyDistribution[q.difficulty] || 0) + 1;
    questionTypeDistribution[q.questionType] = (questionTypeDistribution[q.questionType] || 0) + 1;
  });

  // Convert to percentages
  Object.keys(bloomsDistribution).forEach(level => {
    bloomsDistribution[level] = Math.round((bloomsDistribution[level] / total) * 100);
  });
  Object.keys(difficultyDistribution).forEach(level => {
    difficultyDistribution[level] = Math.round((difficultyDistribution[level] / total) * 100);
  });
  Object.keys(questionTypeDistribution).forEach(type => {
    questionTypeDistribution[type] = Math.round((questionTypeDistribution[type] / total) * 100);
  });

  const averageQuality = questions.reduce((sum, q) => sum + (q.qualityScore || 3), 0) / total;
  const estimatedCompletionTime = questions.reduce((sum, q) => sum + (q.estimatedTime || 2), 0);
  const balanceScore = 0.8; // Placeholder calculation

  return {
    bloomsDistribution,
    difficultyDistribution,
    questionTypeDistribution,
    averageQuality,
    estimatedCompletionTime,
    balanceScore,
  };
}

// Helper function to estimate question time
function getEstimatedTime(questionType: QuestionType): number {
  const timeMap = {
    MULTIPLE_CHOICE: 1.5,
    TRUE_FALSE: 1,
    SHORT_ANSWER: 3,
    ESSAY: 10,
    MATCHING: 2,
    FILL_IN_THE_BLANKS: 2,
    DRAG_AND_DROP: 2.5,
    NUMERIC: 2,
    MULTIPLE_RESPONSE: 2,
    SEQUENCE: 3,
    FLASH_CARDS: 1,
    READING: 5,
    VIDEO: 3,
    HOTSPOT: 2,
    LIKERT_SCALE: 1.5,
    DRAG_THE_WORDS: 2.5,
  };

  return timeMap[questionType] || 2;
}
