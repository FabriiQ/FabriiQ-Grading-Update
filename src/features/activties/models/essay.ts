/**
 * Essay Activity Model
 * 
 * This module defines the essay activity model following the features/activties
 * architecture. It integrates with the existing scoring, rewards, and analytics
 * systems while providing AI grading capabilities and manual override support.
 * 
 * Aligned with existing architecture:
 * - Uses BaseActivity interface from models/base
 * - Integrates with existing grading system
 * - Compatible with rewards/points system
 * - Follows established patterns for activity types
 */

import { z } from 'zod';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BaseActivity, ActivitySettings, ActivityMetadata } from './base';
import { EssayGradingMethod, EssayAIAnalysis } from '@/types/essay-grading';

// ============================================================================
// ESSAY ACTIVITY INTERFACES
// ============================================================================

/**
 * Essay grading criterion definition
 * Defines how essays are evaluated with AI and manual grading
 */
export interface EssayGradingCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1, must sum to 1.0 across all criteria
  bloomsLevel?: BloomsTaxonomyLevel;
  maxPoints: number;
}

/**
 * Essay activity settings extending base settings
 * Includes essay-specific configuration for grading and submission
 */
export interface EssayActivitySettings extends ActivitySettings {
  // Word count requirements
  minWords: number;
  maxWords: number;
  
  // Time management
  essayTimeLimit?: number; // in minutes
  allowDrafts: boolean;
  allowRevisions: boolean;
  maxRevisions: number;
  
  // AI Grading Configuration
  aiGrading: {
    enabled: boolean;
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3' | 'custom';
    confidenceThreshold: number; // 0-1, below this requires manual review
    gradingCriteria: EssayGradingCriterion[];
    customPrompt?: string;
    feedbackLevel?: 'basic' | 'detailed' | 'comprehensive';
    enableBloomsDetection?: boolean;
  };
  
  // Manual Grading Configuration
  manualGrading: {
    enabled: boolean;
    requiresManualReview: boolean; // Force manual review for all submissions
    rubricId?: string; // Link to existing rubric
    allowTeacherOverride: boolean; // Allow teachers to override AI grades
    gradingWorkflow: 'ai_first' | 'manual_first' | 'parallel' | 'ai_only' | 'manual_only' | 'hybrid';
  };
  
  // Submission Settings
  submission: {
    allowLateSubmissions: boolean;
    latePenalty: number; // Percentage penalty per day
    maxLateDays: number;
    requireConfirmation: boolean;
    showWordCount: boolean;
    showTimeRemaining: boolean;
    autoSave: boolean;
    autoSaveInterval: number; // seconds
  };

  // Additional UI settings
  showWordCount?: boolean;
  allowSaveProgress?: boolean;
  rubricId?: string;
  
  // Advanced Features
  advanced: {
    enablePlagiarismCheck: boolean;
    plagiarismThreshold: number; // Percentage similarity threshold
    enableAIDetection: boolean; // Detect AI-generated content
    aiDetectionThreshold: number; // Confidence threshold for AI detection
    enableVersionHistory: boolean;
    enableCollaboration: boolean; // Allow collaborative essays
    maxCollaborators: number;
  };
  
  // Analytics and Insights
  analytics: {
    trackWritingProcess: boolean; // Track typing patterns, pauses, etc.
    trackRevisions: boolean;
    generateInsights: boolean; // Generate writing insights for students
    shareInsightsWithStudent: boolean;
  };
}

/**
 * Essay activity metadata extending base metadata
 * Includes essay-specific metadata for analytics and reporting
 */
export interface EssayActivityMetadata extends ActivityMetadata {
  // Essay-specific metadata
  expectedBloomsLevel?: BloomsTaxonomyLevel;
  rubricId?: string;
  gradingCriteria: EssayGradingCriterion[];

  // AI grading metadata
  aiModel?: string;
  aiGradingEnabled: boolean;
  confidenceThreshold: number;

  // Content analysis
  topicKeywords?: string[];
  expectedLength: {
    min: number;
    max: number;
  };
  
  // Submission tracking
  submissionCount?: number;
  averageWordCount?: number;
  averageCompletionTime?: number; // in minutes
}

/**
 * Complete essay activity interface
 * Extends BaseActivity with essay-specific properties
 */
export interface EssayActivity extends BaseActivity {
  activityType: 'essay';

  // Essay content
  prompt: string; // The essay prompt/question
  instructions?: string; // Additional instructions for students

  // Bloom's taxonomy level for this essay
  bloomsLevel: BloomsTaxonomyLevel;

  // Essay configuration
  settings: EssayActivitySettings;
  metadata: EssayActivityMetadata;

  // Grading configuration (inherited from BaseActivity but with essay specifics)
  gradingConfig?: {
    criteria: EssayGradingCriterion[];
    aiGradingEnabled: boolean;
    manualReviewRequired: boolean;
    rubricId?: string;
  };
}

// ============================================================================
// ESSAY SUBMISSION INTERFACES
// ============================================================================

/**
 * Essay submission data structure
 * Contains all information needed for grading an essay
 */
export interface EssaySubmissionData {
  essayText: string; // The student's essay content
  wordCount: number; // Calculated word count
  timeSpent: number; // Time spent writing (seconds)
  revisionCount: number; // Number of revisions made
  submittedAt: Date; // Submission timestamp
  startedAt: Date; // When student started writing
  
  // AI grading fields (from database schema)
  aiScore?: number; // AI-generated score (0-100)
  aiFeedback?: string; // AI-generated feedback text
  aiAnalysis?: EssayAIAnalysis; // Detailed AI analysis
  aiConfidence?: number; // AI confidence score (0-1)
  aiBloomsLevel?: BloomsTaxonomyLevel; // AI-detected Bloom's level

  // Manual grading fields
  manualOverride?: boolean; // Whether teacher manually overrode AI grade
  finalScore?: number; // Final score after manual review
  gradingMethod?: EssayGradingMethod; // AI, MANUAL, or HYBRID
  reviewRequired?: boolean; // Whether manual review is required
  reviewNotes?: string; // Teacher notes during manual review

  // Optional metadata for advanced features
  metadata?: {
    writingProcess?: {
      keystrokeCount: number;
      pauseCount: number;
      averagePauseLength: number;
      typingSpeed: number; // Words per minute
    };
    versionHistory?: Array<{
      content: string;
      timestamp: Date;
      wordCount: number;
    }>;
    collaborators?: string[]; // If collaborative essay
  };
}

/**
 * AI grading result with detailed scoring and feedback
 */
export interface EssayAIGradingResult {
  overallScore: number; // Overall score (0-100)
  confidence: number; // AI confidence (0-1)
  
  // Detailed criterion scores
  criteriaScores: Array<{
    criterionId: string;
    name: string;
    score: number; // Score for this criterion (0-100)
    feedback: string; // Specific feedback for this criterion
    bloomsLevel?: BloomsTaxonomyLevel; // Detected Bloom's level
  }>;
  
  // Bloom's taxonomy analysis
  bloomsAnalysis: {
    detectedLevel: BloomsTaxonomyLevel;
    levelScores: Record<BloomsTaxonomyLevel, number>;
    levelEvidence: Record<BloomsTaxonomyLevel, string[]>; // Evidence for each level
  };
  
  // Comprehensive feedback
  feedback: {
    strengths: string[]; // What the student did well
    improvements: string[]; // Areas for improvement
    suggestions: string[]; // Specific suggestions
    overallComment: string; // General feedback comment
  };
  
  // Quality indicators
  qualityMetrics: {
    coherence: number; // Logical flow and organization (0-100)
    clarity: number; // Clarity of expression (0-100)
    depth: number; // Depth of analysis (0-100)
    originality: number; // Originality of thought (0-100)
    evidenceUse: number; // Use of evidence/examples (0-100)
  };
  
  // Technical analysis
  technicalAnalysis: {
    grammarScore: number; // Grammar quality (0-100)
    vocabularyLevel: number; // Vocabulary sophistication (0-100)
    sentenceVariety: number; // Sentence structure variety (0-100)
    readabilityScore: number; // Readability level
  };
  
  // Metadata
  gradingModel: string; // AI model used
  gradingTime: number; // Time taken to grade (ms)
  tokensUsed: number; // AI tokens consumed
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for essay grading criterion validation
 */
export const EssayGradingCriterionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  weight: z.number().min(0).max(1),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
  maxPoints: z.number().min(1).max(100),
});

/**
 * Zod schema for essay activity settings validation
 */
export const EssayActivitySettingsSchema = z.object({
  // Base settings (inherited from ActivitySettings)
  shuffleQuestions: z.boolean().default(false).optional(),
  shuffleOptions: z.boolean().default(false).optional(),
  showFeedbackImmediately: z.boolean().default(true).optional(),
  showCorrectAnswers: z.boolean().default(false).optional(),
  passingPercentage: z.number().min(0).max(100).default(60).optional(),
  attemptsAllowed: z.number().min(1).max(10).default(1).optional(),
  timeLimit: z.number().min(5).max(480).optional(), // Base time limit
  
  // Essay-specific settings
  minWords: z.number().min(50).max(10000).default(250),
  maxWords: z.number().min(100).max(10000).default(1000),
  essayTimeLimit: z.number().min(5).max(480).optional(), // Essay-specific time limit
  allowDrafts: z.boolean().default(true),
  allowRevisions: z.boolean().default(false),
  maxRevisions: z.number().min(1).max(5).default(1),
  
  aiGrading: z.object({
    enabled: z.boolean().default(true),
    model: z.enum(['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'custom']).default('gpt-4'),
    confidenceThreshold: z.number().min(0.1).max(1.0).default(0.7),
    gradingCriteria: z.array(EssayGradingCriterionSchema).default([]),
    customPrompt: z.string().optional(),
  }),
  
  manualGrading: z.object({
    enabled: z.boolean().default(true),
    requiresManualReview: z.boolean().default(false),
    rubricId: z.string().optional(),
    allowTeacherOverride: z.boolean().default(true),
    gradingWorkflow: z.enum(['ai_first', 'manual_first', 'parallel', 'ai_only', 'manual_only']).default('ai_first'),
  }),
  
  submission: z.object({
    allowLateSubmissions: z.boolean().default(false),
    latePenalty: z.number().min(0).max(100).default(10),
    maxLateDays: z.number().min(1).max(30).default(7),
    requireConfirmation: z.boolean().default(true),
    showWordCount: z.boolean().default(true),
    showTimeRemaining: z.boolean().default(true),
    autoSave: z.boolean().default(true),
    autoSaveInterval: z.number().min(30).max(300).default(60),
  }),
  
  advanced: z.object({
    enablePlagiarismCheck: z.boolean().default(false),
    plagiarismThreshold: z.number().min(0).max(100).default(20),
    enableAIDetection: z.boolean().default(false),
    aiDetectionThreshold: z.number().min(0).max(100).default(80),
    enableVersionHistory: z.boolean().default(true),
    enableCollaboration: z.boolean().default(false),
    maxCollaborators: z.number().min(2).max(10).default(3),
  }),
  
  analytics: z.object({
    trackWritingProcess: z.boolean().default(true),
    trackRevisions: z.boolean().default(true),
    generateInsights: z.boolean().default(true),
    shareInsightsWithStudent: z.boolean().default(true),
  }),
});

/**
 * Complete essay activity schema
 */
export const EssayActivitySchema = z.object({
  // Base activity fields
  id: z.string().cuid(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  instructions: z.string().optional(),
  activityType: z.literal('essay'),
  
  // Essay-specific fields
  prompt: z.string().min(10).max(2000),
  
  // Configuration
  settings: EssayActivitySettingsSchema,
  
  // Grading configuration
  isGradable: z.boolean().default(true),
  maxScore: z.number().min(1).max(1000).default(100),
  passingScore: z.number().min(0).max(100).default(60),
  
  // Metadata
  metadata: z.object({
    aiGenerated: z.boolean().default(false),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    estimatedTime: z.number().min(5).max(480).default(30), // minutes
    expectedBloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
    rubricId: z.string().optional(),
    gradingCriteria: z.array(EssayGradingCriterionSchema).default([]),
    aiModel: z.string().optional(),
    aiGradingEnabled: z.boolean().default(true),
    confidenceThreshold: z.number().min(0.1).max(1.0).default(0.7),
    topicKeywords: z.array(z.string()).optional(),
    expectedLength: z.object({
      min: z.number().min(50),
      max: z.number().min(100),
    }),
  }),
});

/**
 * TypeScript type for essay activity
 */
export type EssayActivityType = z.infer<typeof EssayActivitySchema>;

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default essay activity with sensible defaults
 * Follows the established pattern from other activity types
 */
export function createDefaultEssayActivity(): EssayActivity {
  const defaultCriteria: EssayGradingCriterion[] = [
    {
      id: 'content_quality',
      name: 'Content Quality',
      description: 'Relevance, accuracy, and depth of content',
      weight: 0.4,
      bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
      maxPoints: 40,
    },
    {
      id: 'organization',
      name: 'Organization & Structure',
      description: 'Logical flow, coherence, and structure',
      weight: 0.3,
      bloomsLevel: BloomsTaxonomyLevel.CREATE,
      maxPoints: 30,
    },
    {
      id: 'language_mechanics',
      name: 'Language & Mechanics',
      description: 'Grammar, spelling, and writing mechanics',
      weight: 0.2,
      bloomsLevel: BloomsTaxonomyLevel.APPLY,
      maxPoints: 20,
    },
    {
      id: 'critical_thinking',
      name: 'Critical Thinking',
      description: 'Analysis, evaluation, and original thinking',
      weight: 0.1,
      bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
      maxPoints: 10,
    },
  ];

  return {
    id: '', // Will be generated when saved
    title: 'New Essay Assignment',
    description: 'A comprehensive essay assignment with AI-powered grading',
    instructions: 'Please read the prompt carefully and provide a thoughtful response. Pay attention to organization, content quality, and proper grammar.',
    activityType: 'essay',

    prompt: 'Write a well-structured essay addressing the following topic...',
    bloomsLevel: BloomsTaxonomyLevel.ANALYZE, // Default to ANALYZE level
    
    settings: {
      // Base settings
      shuffleQuestions: false,
      shuffleOptions: false,
      attemptsAllowed: 1,
      showFeedbackImmediately: true,
      passingPercentage: 60,
      
      // Essay-specific settings
      minWords: 250,
      maxWords: 1000,
      essayTimeLimit: 60, // 1 hour
      allowDrafts: true,
      allowRevisions: false,
      maxRevisions: 1,
      
      aiGrading: {
        enabled: true,
        model: 'gpt-4',
        confidenceThreshold: 0.7,
        gradingCriteria: defaultCriteria,
      },
      
      manualGrading: {
        enabled: true,
        requiresManualReview: false,
        allowTeacherOverride: true,
        gradingWorkflow: 'ai_first',
      },
      
      submission: {
        allowLateSubmissions: false,
        latePenalty: 10,
        maxLateDays: 7,
        requireConfirmation: true,
        showWordCount: true,
        showTimeRemaining: true,
        autoSave: true,
        autoSaveInterval: 60,
      },
      
      advanced: {
        enablePlagiarismCheck: false,
        plagiarismThreshold: 20,
        enableAIDetection: false,
        aiDetectionThreshold: 80,
        enableVersionHistory: true,
        enableCollaboration: false,
        maxCollaborators: 3,
      },
      
      analytics: {
        trackWritingProcess: true,
        trackRevisions: true,
        generateInsights: true,
        shareInsightsWithStudent: true,
      },
    },
    
    isGradable: true,
    
    metadata: {
      aiGenerated: false,
      difficulty: 'medium',
      estimatedTime: 30,
      expectedBloomsLevel: BloomsTaxonomyLevel.ANALYZE,
      gradingCriteria: defaultCriteria,
      aiModel: 'gpt-4',
      aiGradingEnabled: true,
      confidenceThreshold: 0.7,
      expectedLength: {
        min: 250,
        max: 1000,
      },
    },
    
    gradingConfig: {
      criteria: defaultCriteria,
      aiGradingEnabled: true,
      manualReviewRequired: false,
    },
  };
}

/**
 * Check if an essay activity is gradable
 * Follows the pattern from other activity types
 */
export function isEssayActivityGradable(activity: EssayActivity): boolean {
  return (activity.isGradable ?? false) && (
    activity.settings.aiGrading.enabled ||
    activity.settings.manualGrading.enabled
  );
}
