/**
 * Quiz Question Bank Service
 * 
 * Enhanced service for selecting and filtering questions from the question bank
 * specifically for quiz assessments with advanced criteria and analytics.
 */

import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
  QuizQuestionFilters,
  QuestionSelectionCriteria,
  EnhancedQuestion,
  BloomsDistribution,
  DifficultyDistribution,
  QuestionUsageStats,
  QuestionPerformanceMetrics,
  validateFilters,
  mergeWithDefaults,
} from '../types/quiz-question-filters';

export interface QuestionSelectionResult {
  questions: EnhancedQuestion[];
  analytics: SelectionAnalytics;
  recommendations: string[];
  totalAvailable: number;
  selectionQuality: number; // 0-1 score
}

export interface SelectionAnalytics {
  bloomsDistribution: BloomsDistribution;
  difficultyDistribution: DifficultyDistribution;
  questionTypeDistribution: Record<string, number>;
  averageQuality: number;
  estimatedCompletionTime: number;
  balanceScore: number;
}

export class QuizQuestionBankService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Get questions for quiz assessment with enhanced filtering
   */
  async getQuestionsForQuiz(criteria: QuestionSelectionCriteria): Promise<QuestionSelectionResult> {
    try {
      // Validate filters
      const validation = validateFilters(criteria.filters);
      if (!validation.valid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Invalid filters: ${validation.errors.join(', ')}`,
        });
      }

      // Merge with defaults
      const filters = mergeWithDefaults(criteria.filters);

      // Build query
      const whereClause = this.buildWhereClause(filters);
      
      // Get total count of available questions
      const totalAvailable = await this.prisma.question.count({ where: whereClause });

      // Get questions with enhanced data
      const questions = await this.getEnhancedQuestions(whereClause, criteria.maxQuestions);

      // Calculate analytics
      const analytics = this.calculateAnalytics(questions);

      // Generate recommendations
      const recommendations = this.generateRecommendations(questions, criteria, analytics);

      // Calculate selection quality
      const selectionQuality = this.calculateSelectionQuality(questions, criteria, analytics);

      return {
        questions,
        analytics,
        recommendations,
        totalAvailable,
        selectionQuality,
      };
    } catch (error) {
      console.error('Error getting questions for quiz:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get questions for quiz',
        cause: error,
      });
    }
  }

  /**
   * Get questions by IDs with enhanced metadata
   */
  async getQuestionsByIds(questionIds: string[]): Promise<EnhancedQuestion[]> {
    try {
      const whereClause = {
        id: { in: questionIds },
        status: 'ACTIVE',
      };

      return this.getEnhancedQuestions(whereClause, questionIds.length);
    } catch (error) {
      console.error('Error getting questions by IDs:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get questions by IDs',
        cause: error,
      });
    }
  }

  /**
   * Search questions with advanced text search
   */
  async searchQuestions(
    filters: QuizQuestionFilters,
    searchQuery: string,
    limit: number = 20
  ): Promise<EnhancedQuestion[]> {
    try {
      const whereClause = {
        ...this.buildWhereClause(filters),
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { content: { path: '$.text', string_contains: searchQuery } },
          { content: { path: '$.explanation', string_contains: searchQuery } },
        ],
      };

      return this.getEnhancedQuestions(whereClause, limit);
    } catch (error) {
      console.error('Error searching questions:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to search questions',
        cause: error,
      });
    }
  }

  /**
   * Get question recommendations based on selected questions
   */
  async getQuestionRecommendations(
    selectedQuestionIds: string[],
    filters: QuizQuestionFilters,
    targetCount: number = 5
  ): Promise<EnhancedQuestion[]> {
    try {
      // Get analytics of selected questions
      const selectedQuestions = await this.getQuestionsByIds(selectedQuestionIds);
      const selectedAnalytics = this.calculateAnalytics(selectedQuestions);

      // Find gaps in coverage
      const gaps = this.identifyGaps(selectedAnalytics, filters);

      // Build query to fill gaps
      const whereClause = {
        ...this.buildWhereClause(filters),
        id: { notIn: selectedQuestionIds },
        ...this.buildGapFillingClause(gaps),
      };

      return this.getEnhancedQuestions(whereClause, targetCount);
    } catch (error) {
      console.error('Error getting question recommendations:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get question recommendations',
        cause: error,
      });
    }
  }

  /**
   * Private helper methods
   */

  private buildWhereClause(filters: QuizQuestionFilters): any {
    const where: any = {
      status: filters.status,
      subjectId: filters.subjectId,
    };

    // Topic filter
    if (filters.topicIds.length > 0) {
      where.topicId = { in: filters.topicIds };
    }

    // Bloom's levels
    if (filters.bloomsLevels.length > 0) {
      where.bloomsLevel = { in: filters.bloomsLevels };
    }

    // Difficulty levels
    if (filters.difficulties.length > 0) {
      where.difficulty = { in: filters.difficulties };
    }

    // Question types
    if (filters.questionTypes.length > 0) {
      where.questionType = { in: filters.questionTypes };
    }

    // Grade level
    if (filters.gradeLevel) {
      where.gradeLevel = filters.gradeLevel;
    }

    // Course filter
    if (filters.courseId) {
      where.courseId = filters.courseId;
    }

    // Question bank filter
    if (filters.questionBankId) {
      where.questionBankId = filters.questionBankId;
    }

    // Year filter
    if (filters.year) {
      where.year = filters.year;
    }

    // Usage frequency filter
    if (filters.usageFrequency !== 'any') {
      // This would require usage statistics - placeholder for now
      // where.usageStats = { ... };
    }

    // Recently used filter
    if (filters.excludeRecentlyUsed && filters.lastUsedBefore) {
      where.OR = [
        { lastUsed: null },
        { lastUsed: { lt: filters.lastUsedBefore } },
      ];
    }

    // Content filters
    if (filters.hasExplanations !== undefined) {
      where.content = {
        ...where.content,
        path: '$.explanation',
        not: filters.hasExplanations ? null : undefined,
      };
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { content: { path: '$.text', string_contains: filters.search } },
      ];
    }

    return where;
  }

  private async getEnhancedQuestions(whereClause: any, limit: number): Promise<EnhancedQuestion[]> {
    const questions = await this.prisma.question.findMany({
      where: whereClause,
      include: {
        subject: true,
        topic: true,
        course: true,
        // Include usage stats and performance metrics if available
        // usageStats: true,
        // performanceMetrics: true,
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    // Transform to enhanced questions
    return questions.map(question => this.transformToEnhancedQuestion(question));
  }

  private transformToEnhancedQuestion(question: any): EnhancedQuestion {
    const content = question.content || {};
    
    return {
      id: question.id,
      title: question.title,
      questionType: question.questionType,
      difficulty: question.difficulty,
      content: question.content,
      bloomsLevel: question.bloomsLevel,
      subjectId: question.subjectId,
      topicId: question.topicId,
      courseId: question.courseId,
      gradeLevel: question.gradeLevel,
      learningOutcomeIds: question.learningOutcomeIds || [],
      
      // Quality metrics (placeholder - would come from actual stats)
      usageStats: this.generateMockUsageStats(),
      performanceMetrics: this.generateMockPerformanceMetrics(),
      qualityScore: this.calculateQuestionQuality(question),
      
      // Content metadata
      hasExplanations: !!(content.explanation),
      hasImages: !!(content.images && content.images.length > 0),
      hasVideo: !!(content.video),
      estimatedTime: this.estimateQuestionTime(question),
      
      // Source and tracking
      sourceType: question.sourceType,
      tags: question.metadata?.tags || [],
      year: question.year,
      lastUsed: question.lastUsed,
      usageCount: question.usageCount || 0,
      
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }

  private calculateAnalytics(questions: EnhancedQuestion[]): SelectionAnalytics {
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

    // Calculate Bloom's distribution
    const bloomsDistribution: BloomsDistribution = {};
    questions.forEach(q => {
      if (q.bloomsLevel) {
        bloomsDistribution[q.bloomsLevel] = (bloomsDistribution[q.bloomsLevel] || 0) + 1;
      }
    });

    // Convert to percentages
    Object.keys(bloomsDistribution).forEach(level => {
      bloomsDistribution[level as keyof BloomsDistribution] = 
        Math.round((bloomsDistribution[level as keyof BloomsDistribution]! / total) * 100);
    });

    // Calculate difficulty distribution
    const difficultyDistribution: DifficultyDistribution = {};
    questions.forEach(q => {
      difficultyDistribution[q.difficulty] = (difficultyDistribution[q.difficulty] || 0) + 1;
    });

    // Convert to percentages
    Object.keys(difficultyDistribution).forEach(level => {
      difficultyDistribution[level as keyof DifficultyDistribution] = 
        Math.round((difficultyDistribution[level as keyof DifficultyDistribution]! / total) * 100);
    });

    // Calculate question type distribution
    const questionTypeDistribution: Record<string, number> = {};
    questions.forEach(q => {
      questionTypeDistribution[q.questionType] = (questionTypeDistribution[q.questionType] || 0) + 1;
    });

    // Convert to percentages
    Object.keys(questionTypeDistribution).forEach(type => {
      questionTypeDistribution[type] = Math.round((questionTypeDistribution[type] / total) * 100);
    });

    // Calculate average quality
    const averageQuality = questions.reduce((sum, q) => sum + (q.qualityScore || 3), 0) / total;

    // Calculate estimated completion time
    const estimatedCompletionTime = questions.reduce((sum, q) => sum + (q.estimatedTime || 2), 0);

    // Calculate balance score
    const balanceScore = this.calculateBalanceScore(bloomsDistribution, difficultyDistribution);

    return {
      bloomsDistribution,
      difficultyDistribution,
      questionTypeDistribution,
      averageQuality,
      estimatedCompletionTime,
      balanceScore,
    };
  }

  private generateRecommendations(
    questions: EnhancedQuestion[],
    criteria: QuestionSelectionCriteria,
    analytics: SelectionAnalytics
  ): string[] {
    const recommendations: string[] = [];

    // Check balance
    if (analytics.balanceScore < 0.7) {
      recommendations.push('Consider adding more questions to improve cognitive level balance');
    }

    // Check quality
    if (analytics.averageQuality < 3.5) {
      recommendations.push('Consider selecting higher quality questions');
    }

    // Check time
    if (analytics.estimatedCompletionTime > 60) {
      recommendations.push('Quiz may be too long - consider reducing question count');
    }

    // Check variety
    const typeCount = Object.keys(analytics.questionTypeDistribution).length;
    if (typeCount < 2) {
      recommendations.push('Consider adding variety in question types');
    }

    return recommendations;
  }

  private calculateSelectionQuality(
    questions: EnhancedQuestion[],
    criteria: QuestionSelectionCriteria,
    analytics: SelectionAnalytics
  ): number {
    let score = 0;

    // Quality score (40%)
    score += (analytics.averageQuality / 5) * 0.4;

    // Balance score (30%)
    score += analytics.balanceScore * 0.3;

    // Variety score (20%)
    const typeVariety = Object.keys(analytics.questionTypeDistribution).length / 5; // Max 5 types
    score += Math.min(typeVariety, 1) * 0.2;

    // Coverage score (10%)
    const coverageScore = questions.length / criteria.maxQuestions;
    score += Math.min(coverageScore, 1) * 0.1;

    return Math.min(score, 1);
  }

  // Mock/placeholder methods - would be replaced with real implementations
  private generateMockUsageStats(): QuestionUsageStats {
    return {
      totalUsage: Math.floor(Math.random() * 100),
      recentUsage: Math.floor(Math.random() * 10),
      averageScore: 0.7 + Math.random() * 0.3,
      successRate: 0.6 + Math.random() * 0.4,
      discriminationIndex: 0.2 + Math.random() * 0.6,
      averageTimeSpent: 60 + Math.random() * 120,
    };
  }

  private generateMockPerformanceMetrics(): QuestionPerformanceMetrics {
    return {
      successRate: 0.6 + Math.random() * 0.4,
      averageScore: 0.7 + Math.random() * 0.3,
      discriminationIndex: 0.2 + Math.random() * 0.6,
      averageTimeSpent: 60 + Math.random() * 120,
      difficultyIndex: 0.3 + Math.random() * 0.4,
      reliabilityIndex: 0.7 + Math.random() * 0.3,
      studentFeedbackRating: 3 + Math.random() * 2,
      teacherRating: 3 + Math.random() * 2,
    };
  }

  private calculateQuestionQuality(question: any): number {
    // Placeholder quality calculation
    let quality = 3; // Base quality

    // Boost for explanations
    if (question.content?.explanation) quality += 0.5;

    // Boost for multimedia
    if (question.content?.images?.length > 0) quality += 0.3;
    if (question.content?.video) quality += 0.2;

    // Boost for recent updates
    const daysSinceUpdate = (Date.now() - new Date(question.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 30) quality += 0.3;

    return Math.min(quality, 5);
  }

  private estimateQuestionTime(question: any): number {
    // Estimate time based on question type and complexity
    const baseTime = {
      MULTIPLE_CHOICE: 1.5,
      TRUE_FALSE: 1,
      SHORT_ANSWER: 3,
      ESSAY: 10,
      MATCHING: 2,
      FILL_IN_THE_BLANKS: 2,
    };

    return baseTime[question.questionType as keyof typeof baseTime] || 2;
  }

  private calculateBalanceScore(
    bloomsDistribution: BloomsDistribution,
    difficultyDistribution: DifficultyDistribution
  ): number {
    // Calculate how well balanced the distributions are
    const bloomsValues = Object.values(bloomsDistribution);
    const difficultyValues = Object.values(difficultyDistribution);

    // Calculate variance (lower is better for balance)
    const bloomsVariance = this.calculateVariance(bloomsValues);
    const difficultyVariance = this.calculateVariance(difficultyValues);

    // Convert variance to balance score (0-1, higher is better)
    const bloomsBalance = Math.max(0, 1 - (bloomsVariance / 1000));
    const difficultyBalance = Math.max(0, 1 - (difficultyVariance / 1000));

    return (bloomsBalance + difficultyBalance) / 2;
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }

  private identifyGaps(analytics: SelectionAnalytics, filters: QuizQuestionFilters): any {
    // Identify gaps in coverage that need to be filled
    const gaps: any = {};

    // Check for missing Bloom's levels
    const missingBlooms = filters.bloomsLevels.filter(level => 
      !analytics.bloomsDistribution[level] || analytics.bloomsDistribution[level]! < 10
    );

    if (missingBlooms.length > 0) {
      gaps.bloomsLevel = { in: missingBlooms };
    }

    return gaps;
  }

  private buildGapFillingClause(gaps: any): any {
    // Build query clause to fill identified gaps
    return gaps;
  }
}
