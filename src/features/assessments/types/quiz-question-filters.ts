/**
 * Quiz Question Filters
 * 
 * Enhanced filtering system for selecting questions from the question bank
 * for quiz assessments with advanced criteria and real-time analytics.
 */

import { z } from 'zod';
import { QuestionType, DifficultyLevel, BloomsTaxonomyLevel, SystemStatus } from '@prisma/client';

/**
 * Quiz Question Filters Interface
 */
export interface QuizQuestionFilters {
  // Basic filters
  questionBankId?: string;
  subjectId: string;
  topicIds: string[];
  
  // Question characteristics
  bloomsLevels: BloomsTaxonomyLevel[];
  difficulties: DifficultyLevel[];
  questionTypes: QuestionType[];
  
  // Academic context
  gradeLevel?: number;
  courseId?: string;
  learningOutcomeIds: string[];
  
  // Quality and usage filters
  usageFrequency: 'low' | 'medium' | 'high' | 'any';
  performanceRating: number; // 1-5 stars
  lastUsedBefore?: Date;
  excludeRecentlyUsed: boolean;
  
  // Content filters
  search?: string;
  hasExplanations?: boolean;
  hasImages?: boolean;
  hasVideo?: boolean;
  
  // Source and metadata
  sourceTypes?: string[];
  tags?: string[];
  year?: number;
  
  // Status
  status: SystemStatus;
}

/**
 * Question Selection Criteria
 */
export interface QuestionSelectionCriteria {
  filters: QuizQuestionFilters;
  maxQuestions: number;
  targetBloomsDistribution?: BloomsDistribution;
  targetDifficultyDistribution?: DifficultyDistribution;
  questionTypePreferences?: QuestionTypePreference[];
  balanceRequirements?: BalanceRequirements;
}

/**
 * Bloom's Taxonomy Distribution
 */
export interface BloomsDistribution {
  REMEMBER?: number;
  UNDERSTAND?: number;
  APPLY?: number;
  ANALYZE?: number;
  EVALUATE?: number;
  CREATE?: number;
  [key: string]: number | undefined;
}

/**
 * Difficulty Distribution
 */
export interface DifficultyDistribution {
  VERY_EASY?: number;
  EASY?: number;
  MEDIUM?: number;
  HARD?: number;
  VERY_HARD?: number;
}

/**
 * Question Type Preference
 */
export interface QuestionTypePreference {
  type: QuestionType;
  weight: number; // 0-1, preference weight
  minCount?: number;
  maxCount?: number;
}

/**
 * Balance Requirements
 */
export interface BalanceRequirements {
  enforceBloomsBalance: boolean;
  enforceDifficultyBalance: boolean;
  enforceTypeVariety: boolean;
  allowPartialMatch: boolean; // Allow selection even if perfect balance isn't possible
  minBalanceThreshold: number; // 0-1, minimum balance threshold
}

/**
 * Question with Enhanced Metadata
 */
export interface EnhancedQuestion {
  id: string;
  title: string;
  questionType: QuestionType;
  difficulty: DifficultyLevel;
  content: any;
  bloomsLevel?: BloomsTaxonomyLevel;
  
  // Academic context
  subjectId: string;
  topicId?: string;
  courseId?: string;
  gradeLevel?: number;
  learningOutcomeIds?: string[];
  
  // Quality metrics
  usageStats?: QuestionUsageStats;
  performanceMetrics?: QuestionPerformanceMetrics;
  qualityScore?: number;
  
  // Content metadata
  hasExplanations: boolean;
  hasImages: boolean;
  hasVideo: boolean;
  estimatedTime?: number; // in minutes
  
  // Source and tracking
  sourceType?: string;
  tags?: string[];
  year?: number;
  lastUsed?: Date;
  usageCount?: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Question Usage Statistics
 */
export interface QuestionUsageStats {
  totalUsage: number;
  recentUsage: number; // Last 30 days
  averageScore: number;
  successRate: number;
  discriminationIndex: number;
  averageTimeSpent: number; // in seconds
}

/**
 * Question Performance Metrics
 */
export interface QuestionPerformanceMetrics {
  successRate: number;
  averageScore: number;
  discriminationIndex: number;
  averageTimeSpent: number;
  difficultyIndex: number;
  reliabilityIndex: number;
  studentFeedbackRating?: number;
  teacherRating?: number;
}

/**
 * Filter Validation Schemas
 */
export const quizQuestionFiltersSchema = z.object({
  questionBankId: z.string().optional(),
  subjectId: z.string(),
  topicIds: z.array(z.string()),
  bloomsLevels: z.array(z.nativeEnum(BloomsTaxonomyLevel)),
  difficulties: z.array(z.nativeEnum(DifficultyLevel)),
  questionTypes: z.array(z.nativeEnum(QuestionType)),
  gradeLevel: z.number().min(1).max(12).optional(),
  courseId: z.string().optional(),
  learningOutcomeIds: z.array(z.string()),
  usageFrequency: z.enum(['low', 'medium', 'high', 'any']),
  performanceRating: z.number().min(1).max(5),
  lastUsedBefore: z.date().optional(),
  excludeRecentlyUsed: z.boolean(),
  search: z.string().optional(),
  hasExplanations: z.boolean().optional(),
  hasImages: z.boolean().optional(),
  hasVideo: z.boolean().optional(),
  sourceTypes: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  year: z.number().optional(),
  status: z.nativeEnum(SystemStatus),
});

export const questionSelectionCriteriaSchema = z.object({
  filters: quizQuestionFiltersSchema,
  maxQuestions: z.number().min(1).max(100),
  targetBloomsDistribution: z.record(z.string(), z.number()).optional(),
  targetDifficultyDistribution: z.record(z.string(), z.number()).optional(),
  questionTypePreferences: z.array(z.object({
    type: z.nativeEnum(QuestionType),
    weight: z.number().min(0).max(1),
    minCount: z.number().optional(),
    maxCount: z.number().optional(),
  })).optional(),
  balanceRequirements: z.object({
    enforceBloomsBalance: z.boolean(),
    enforceDifficultyBalance: z.boolean(),
    enforceTypeVariety: z.boolean(),
    allowPartialMatch: z.boolean(),
    minBalanceThreshold: z.number().min(0).max(1),
  }).optional(),
});

/**
 * Default filter values
 */
export const DEFAULT_QUIZ_FILTERS: Partial<QuizQuestionFilters> = {
  bloomsLevels: [
    BloomsTaxonomyLevel.REMEMBER,
    BloomsTaxonomyLevel.UNDERSTAND,
    BloomsTaxonomyLevel.APPLY,
    BloomsTaxonomyLevel.ANALYZE,
  ],
  difficulties: [
    DifficultyLevel.EASY,
    DifficultyLevel.MEDIUM,
    DifficultyLevel.HARD,
  ],
  questionTypes: [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.TRUE_FALSE,
    QuestionType.SHORT_ANSWER,
  ],
  usageFrequency: 'any',
  performanceRating: 3,
  excludeRecentlyUsed: false,
  status: SystemStatus.ACTIVE,
  topicIds: [],
  learningOutcomeIds: [],
};

/**
 * Default balance requirements
 */
export const DEFAULT_BALANCE_REQUIREMENTS: BalanceRequirements = {
  enforceBloomsBalance: true,
  enforceDifficultyBalance: true,
  enforceTypeVariety: true,
  allowPartialMatch: true,
  minBalanceThreshold: 0.7,
};

/**
 * Utility functions for filter management
 */

/**
 * Merge filters with defaults
 */
export function mergeWithDefaults(filters: Partial<QuizQuestionFilters>): QuizQuestionFilters {
  return {
    ...DEFAULT_QUIZ_FILTERS,
    ...filters,
  } as QuizQuestionFilters;
}

/**
 * Validate filter combination
 */
export function validateFilters(filters: QuizQuestionFilters): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!filters.subjectId) {
    errors.push('Subject ID is required');
  }

  // Check arrays are not empty
  if (filters.bloomsLevels.length === 0) {
    errors.push('At least one Bloom\'s level must be selected');
  }

  if (filters.difficulties.length === 0) {
    errors.push('At least one difficulty level must be selected');
  }

  if (filters.questionTypes.length === 0) {
    errors.push('At least one question type must be selected');
  }

  // Check performance rating range
  if (filters.performanceRating < 1 || filters.performanceRating > 5) {
    errors.push('Performance rating must be between 1 and 5');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate filter complexity score
 */
export function calculateFilterComplexity(filters: QuizQuestionFilters): number {
  let complexity = 0;

  // Base complexity
  complexity += 1;

  // Add complexity for each filter type
  if (filters.search) complexity += 1;
  if (filters.gradeLevel) complexity += 1;
  if (filters.courseId) complexity += 1;
  if (filters.year) complexity += 1;
  if (filters.lastUsedBefore) complexity += 1;
  if (filters.excludeRecentlyUsed) complexity += 1;
  if (filters.hasExplanations !== undefined) complexity += 1;
  if (filters.hasImages !== undefined) complexity += 1;
  if (filters.hasVideo !== undefined) complexity += 1;

  // Add complexity for array filters
  complexity += filters.topicIds.length * 0.1;
  complexity += filters.learningOutcomeIds.length * 0.1;
  complexity += (filters.tags?.length || 0) * 0.1;
  complexity += (filters.sourceTypes?.length || 0) * 0.1;

  // Add complexity for restrictive filters
  if (filters.usageFrequency !== 'any') complexity += 0.5;
  if (filters.performanceRating > 3) complexity += 0.5;

  return Math.min(complexity, 10); // Cap at 10
}
