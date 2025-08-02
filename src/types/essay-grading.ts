/**
 * Essay Grading Types
 * 
 * Comprehensive type definitions for essay grading system including
 * AI grading, manual override, and hybrid workflows.
 */

import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// ============================================================================
// CORE ESSAY GRADING TYPES
// ============================================================================

/**
 * Essay grading methods
 */
export enum EssayGradingMethod {
  AI = 'AI',
  MANUAL = 'MANUAL',
  HYBRID = 'HYBRID'
}

/**
 * AI analysis categories for essays
 */
export interface EssayAIAnalysis {
  // Content analysis
  contentQuality: {
    score: number; // 0-100
    feedback: string;
    strengths: string[];
    improvements: string[];
  };
  
  // Structure analysis
  structure: {
    score: number; // 0-100
    hasIntroduction: boolean;
    hasConclusion: boolean;
    paragraphCount: number;
    coherence: number; // 0-100
    feedback: string;
  };
  
  // Language analysis
  language: {
    grammarScore: number; // 0-100
    vocabularyScore: number; // 0-100
    clarityScore: number; // 0-100
    grammarErrors: Array<{
      type: string;
      position: number;
      suggestion: string;
    }>;
    feedback: string;
  };
  
  // Bloom's taxonomy analysis
  bloomsAnalysis: {
    detectedLevel: BloomsTaxonomyLevel;
    confidence: number; // 0-1
    evidence: string[];
    reasoning: string;
  };
  
  // Overall metrics
  overall: {
    readabilityScore: number; // 0-100
    originalityScore: number; // 0-100
    relevanceScore: number; // 0-100
  };
}

/**
 * Essay submission data with AI grading fields
 */
export interface EssaySubmissionData {
  id: string;
  activityId: string;
  studentId: string;
  content: string; // Essay text content
  wordCount: number;
  submittedAt: Date;
  
  // AI grading results
  aiScore?: number;
  aiFeedback?: string;
  aiAnalysis?: EssayAIAnalysis;
  aiConfidence?: number;
  aiBloomsLevel?: BloomsTaxonomyLevel;
  
  // Manual grading
  manualOverride: boolean;
  finalScore?: number;
  gradingMethod: EssayGradingMethod;
  reviewRequired: boolean;
  reviewNotes?: string;
  
  // Grading metadata
  gradedAt?: Date;
  gradedById?: string;
}

/**
 * Essay grading request
 */
export interface EssayGradingRequest {
  submissionId: string;
  essayContent: string;
  rubricId?: string;
  maxScore: number;
  gradingCriteria?: EssayGradingCriteria[];
  requireManualReview?: boolean;
}

/**
 * Essay grading criteria
 */
export interface EssayGradingCriteria {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1
  maxPoints: number;
  rubricLevels: Array<{
    level: number;
    description: string;
    points: number;
  }>;
}

/**
 * Essay grading result
 */
export interface EssayGradingResult {
  submissionId: string;
  aiScore: number;
  aiConfidence: number;
  aiFeedback: string;
  aiAnalysis: EssayAIAnalysis;
  aiBloomsLevel: BloomsTaxonomyLevel;
  
  // Criteria-based scoring
  criteriaScores?: Array<{
    criteriaId: string;
    score: number;
    feedback: string;
    aiConfidence: number;
  }>;
  
  // Recommendations
  requiresManualReview: boolean;
  reviewReasons: string[];
  suggestedFinalScore?: number;
  
  // Processing metadata
  processingTime: number; // milliseconds
  modelVersion: string;
  gradedAt: Date;
}

// ============================================================================
// HYBRID GRADING WORKFLOW TYPES
// ============================================================================

/**
 * Manual review status
 */
export enum ManualReviewStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED'
}

/**
 * Manual review data
 */
export interface ManualReviewData {
  submissionId: string;
  reviewerId: string;
  status: ManualReviewStatus;
  
  // Review decisions
  acceptAIScore: boolean;
  manualScore?: number;
  manualFeedback?: string;
  reviewNotes: string;
  
  // Time tracking
  reviewStartedAt: Date;
  reviewCompletedAt?: Date;
  timeSpentMinutes: number;
  
  // AI comparison
  aiScoreDifference?: number;
  disagreementReasons?: string[];
}

/**
 * Grading workflow configuration
 */
export interface EssayGradingWorkflowConfig {
  // AI grading settings
  enableAIGrading: boolean;
  aiConfidenceThreshold: number; // 0-1, below this requires manual review
  
  // Manual review triggers
  requireManualReview: boolean;
  manualReviewTriggers: {
    lowConfidence: boolean;
    highStakes: boolean; // Important assessments
    flaggedContent: boolean;
    studentRequest: boolean;
  };
  
  // Scoring settings
  allowAIOnlyGrading: boolean;
  requireTeacherApproval: boolean;
  enablePeerReview: boolean;
  
  // Quality assurance
  enableSecondReview: boolean; // For high-stakes assessments
  maxScoreDifference: number; // Trigger review if AI/manual differ by this much
}

// ============================================================================
// ANALYTICS AND REPORTING TYPES
// ============================================================================

/**
 * Essay grading analytics
 */
export interface EssayGradingAnalytics {
  totalEssays: number;
  aiGradedCount: number;
  manualGradedCount: number;
  hybridGradedCount: number;
  
  // Performance metrics
  averageAIConfidence: number;
  averageGradingTime: number;
  manualOverrideRate: number;
  
  // Quality metrics
  aiAccuracyRate: number; // When compared to manual grades
  consistencyScore: number;
  
  // Bloom's taxonomy distribution
  bloomsDistribution: Record<BloomsTaxonomyLevel, number>;
  
  // Common issues
  commonGrammarErrors: Array<{
    type: string;
    frequency: number;
  }>;
  
  commonContentIssues: Array<{
    issue: string;
    frequency: number;
  }>;
}

/**
 * Essay performance trends
 */
export interface EssayPerformanceTrends {
  timeRange: {
    start: Date;
    end: Date;
  };
  
  // Score trends
  averageScores: Array<{
    date: Date;
    aiScore: number;
    finalScore: number;
    count: number;
  }>;
  
  // Quality trends
  qualityMetrics: Array<{
    date: Date;
    grammarScore: number;
    contentScore: number;
    structureScore: number;
    count: number;
  }>;
  
  // Bloom's progression
  bloomsProgression: Array<{
    date: Date;
    level: BloomsTaxonomyLevel;
    count: number;
    averageConfidence: number;
  }>;
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// Note: Types are already exported above as interfaces and enums
// No need to re-export them here to avoid conflicts
