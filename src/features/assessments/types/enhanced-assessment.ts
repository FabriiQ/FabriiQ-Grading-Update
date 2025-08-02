/**
 * Enhanced Assessment Types
 * 
 * This file contains type definitions for the enhanced quiz assessment system
 * with backward compatibility support.
 */

import { z } from 'zod';
import { BloomsTaxonomyLevel, QuestionType, DifficultyLevel } from '@prisma/client';

/**
 * Question Selection Mode Enum
 */
export enum QuestionSelectionMode {
  MANUAL = 'MANUAL',      // Traditional manual creation (default)
  AUTO = 'AUTO',          // Automatic selection from question bank
  HYBRID = 'HYBRID',      // Mix of manual and auto selection
}

/**
 * Enhanced Assessment Content Structure
 * This replaces storing questions in the rubric field
 */
export interface AssessmentContent {
  assessmentType: string;           // 'QUIZ', 'TEST', 'EXAM', etc.
  description?: string;             // Moved from rubric field
  instructions?: string;            // Moved from rubric field
  questions: AssessmentQuestion[];  // Moved from rubric field
  settings?: AssessmentSettings;    // Assessment-specific settings
  metadata?: AssessmentMetadata;    // Additional metadata
}

/**
 * Enhanced Assessment Question Structure
 */
export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  text: string;
  choices?: Choice[];
  correctAnswer?: string | string[];
  points: number;
  bloomsLevel?: BloomsTaxonomyLevel;
  questionBankRef?: string;         // Reference to question bank question
  isFromQuestionBank: boolean;      // Track source
  metadata?: QuestionMetadata;
  order?: number;                   // Question order in assessment
}

/**
 * Question Choice Structure
 */
export interface Choice {
  id: string;
  text: string;
  isCorrect?: boolean;
  explanation?: string;
}

/**
 * Question Metadata
 */
export interface QuestionMetadata {
  difficulty?: DifficultyLevel;
  estimatedTime?: number;           // Estimated time in minutes
  tags?: string[];
  source?: string;
  lastUsed?: Date;
  usageCount?: number;
  performanceStats?: {
    successRate: number;
    averageTime: number;
    discriminationIndex: number;
  };
}

/**
 * Assessment Settings
 */
export interface AssessmentSettings {
  // Timing & Attempts
  timeLimit?: number;               // Total time limit in minutes
  timePerQuestion?: number;         // Time per question in minutes
  maxAttempts?: number;
  retakePolicy?: 'immediate' | 'after_review' | 'scheduled';
  
  // Question Management
  questionPoolSize?: number;
  randomQuestionSelection?: boolean;
  questionOrderRandomization?: boolean;
  choiceOrderRandomization?: boolean;
  
  // Feedback & Grading
  showFeedbackMode?: 'immediate' | 'after_submission' | 'after_due_date';
  showCorrectAnswers?: boolean;
  showExplanations?: boolean;
  allowReviewAfterSubmission?: boolean;
  
  // Adaptive Features
  adaptiveDifficulty?: boolean;
  minimumPassingScore?: number;
  masteryThreshold?: number;
  
  // Security & Integrity
  preventCheating?: boolean;
  lockdownBrowser?: boolean;
  questionPoolRotation?: boolean;
}

/**
 * Assessment Metadata
 */
export interface AssessmentMetadata {
  version?: string;
  lastModified?: Date;
  estimatedCompletionTime?: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  qualityScore?: number;            // 1-5 rating
  tags?: string[];
  notes?: string;
  bloomsAnalytics?: {
    distribution: BloomsDistribution;
    balance: number;
    coverage: string[];
  };
}

/**
 * Auto-Selection Configuration
 */
export interface AutoSelectionConfig {
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
  qualityThreshold: number;         // Minimum quality score (1-5)
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
  weight: number;               // Preference weight (0-1)
  minCount?: number;            // Minimum questions of this type
  maxCount?: number;            // Maximum questions of this type
}

/**
 * Question Pool Configuration
 */
export interface QuestionPoolConfig {
  poolSize?: number;            // Size of question pool for randomization
  rotationStrategy?: 'random' | 'sequential' | 'weighted';
  refreshInterval?: number;     // How often to refresh pool (in days)
  excludeRecentlyUsed?: boolean;
  maintainDifficulty?: boolean;
  maintainBloomsBalance?: boolean;
}

/**
 * Zod Schemas for Validation
 */
export const assessmentContentSchema = z.object({
  assessmentType: z.string(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  questions: z.array(z.object({
    id: z.string(),
    type: z.nativeEnum(QuestionType),
    text: z.string(),
    choices: z.array(z.object({
      id: z.string(),
      text: z.string(),
      isCorrect: z.boolean().optional(),
      explanation: z.string().optional(),
    })).optional(),
    correctAnswer: z.union([z.string(), z.array(z.string())]).optional(),
    points: z.number(),
    bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
    questionBankRef: z.string().optional(),
    isFromQuestionBank: z.boolean(),
    metadata: z.record(z.any()).optional(),
    order: z.number().optional(),
  })),
  settings: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

export const autoSelectionConfigSchema = z.object({
  subjectId: z.string(),
  topicIds: z.array(z.string()),
  questionCount: z.number().min(1),
  bloomsDistribution: z.record(z.string(), z.number()),
  difficultyDistribution: z.record(z.string(), z.number()),
  questionTypePreferences: z.array(z.object({
    type: z.nativeEnum(QuestionType),
    weight: z.number().min(0).max(1),
    minCount: z.number().optional(),
    maxCount: z.number().optional(),
  })),
  allowedBloomsLevels: z.array(z.nativeEnum(BloomsTaxonomyLevel)),
  allowedDifficulties: z.array(z.nativeEnum(DifficultyLevel)),
  excludeRecentlyUsed: z.boolean(),
  prioritizeHighPerforming: z.boolean(),
  randomizationLevel: z.enum(['none', 'low', 'medium', 'high']),
  qualityThreshold: z.number().min(1).max(5),
});

/**
 * Enhanced Assessment Creation Input
 */
export interface EnhancedAssessmentInput {
  // Basic fields (existing)
  title: string;
  description?: string;
  classId: string;
  subjectId: string;
  topicId?: string;
  category: string;
  maxScore?: number;
  passingScore?: number;
  weightage?: number;
  dueDate?: Date;
  
  // Enhanced fields (new)
  content?: AssessmentContent;
  questionSelectionMode?: QuestionSelectionMode;
  autoSelectionConfig?: AutoSelectionConfig;
  questionPoolConfig?: QuestionPoolConfig;
  enhancedSettings?: AssessmentSettings;
  questionBankRefs?: string[];
  
  // Legacy support
  questions?: any[];            // For backward compatibility
  rubric?: any;                 // For backward compatibility
}

/**
 * Type guard to check if assessment has enhanced content
 */
export function hasEnhancedContent(assessment: any): assessment is { content: AssessmentContent } {
  return assessment.content && typeof assessment.content === 'object';
}

/**
 * Type guard to check if assessment uses question bank
 */
export function usesQuestionBank(assessment: any): boolean {
  return assessment.questionSelectionMode === QuestionSelectionMode.AUTO ||
         assessment.questionSelectionMode === QuestionSelectionMode.HYBRID ||
         (assessment.questionBankRefs && assessment.questionBankRefs.length > 0);
}
