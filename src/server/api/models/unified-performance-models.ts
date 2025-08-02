/**
 * Unified Performance Data Models
 * 
 * This module defines standardized data models for performance tracking across
 * all activity types, ensuring consistency and enabling efficient analytics.
 * 
 * Key Features:
 * - Single source of truth for performance data
 * - Standardized metrics across all activity types
 * - Efficient database queries with proper indexing
 * - Type-safe interfaces for all performance data
 * - Bloom's taxonomy integration
 * - Real-time analytics support
 */

import { z } from 'zod';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// ============================================================================
// CORE PERFORMANCE INTERFACES
// ============================================================================

/**
 * Base performance metrics that apply to all activity types
 * These metrics provide a consistent foundation for analytics
 */
export interface BasePerformanceMetrics {
  /** Unique identifier for the performance record */
  id: string;
  
  /** Student who performed the activity */
  studentId: string;
  
  /** Activity that was performed */
  activityId: string;
  
  /** Class context */
  classId: string;
  
  /** Subject context */
  subjectId: string;
  
  /** Optional topic context */
  topicId?: string;
  
  /** Raw score achieved */
  score: number;
  
  /** Maximum possible score */
  maxScore: number;
  
  /** Calculated percentage (score/maxScore * 100) */
  percentage: number;
  
  /** Time spent on activity in seconds */
  timeSpent: number;
  
  /** Number of attempts made */
  attemptCount: number;
  
  /** Calculated engagement score (0-100) */
  engagementScore: number;
  
  /** How the activity was graded */
  gradingType: 'AUTO' | 'MANUAL' | 'AI' | 'HYBRID';
  
  /** Type of activity performed */
  activityType: string;
  
  /** When the activity was submitted */
  submittedAt: Date;
  
  /** When the activity was started */
  startedAt: Date;
  
  /** When the activity was completed */
  completedAt: Date;
  
  /** When the activity was graded */
  gradedAt: Date;
  
  /** Record creation timestamp */
  createdAt: Date;
  
  /** Record last update timestamp */
  updatedAt: Date;
}

/**
 * Bloom's taxonomy specific performance data
 * Tracks cognitive level progression and mastery
 */
export interface BloomsPerformanceData {
  /** Target Bloom's level for the activity */
  bloomsLevel?: BloomsTaxonomyLevel;
  
  /** Demonstrated Bloom's level based on performance */
  demonstratedLevel?: BloomsTaxonomyLevel;
  
  /** Detailed scores for each Bloom's level (0-100) */
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  
  /** Whether the student mastered the target level */
  levelMastered: boolean;
  
  /** Progression from previous attempts */
  levelProgression: number; // -6 to +6 (level difference)
}

/**
 * Extended performance metrics with Bloom's taxonomy integration
 * This is the complete performance record used throughout the system
 */
export interface UnifiedPerformanceRecord extends BasePerformanceMetrics {
  /** Bloom's taxonomy performance data */
  bloomsData: BloomsPerformanceData;
  
  /** Additional metadata specific to activity type */
  metadata: Record<string, any>;
  
  /** Performance flags for quick filtering */
  flags: {
    isExceptional: boolean;    // Score > 95%
    isStruggling: boolean;     // Score < 60%
    isImproving: boolean;      // Significant improvement trend
    needsAttention: boolean;   // Teacher intervention recommended
    isFirstAttempt: boolean;   // First attempt at this activity
    isRetake: boolean;         // Retaking after previous attempt
  };
}

// ============================================================================
// AGGREGATED PERFORMANCE MODELS
// ============================================================================

/**
 * Student performance aggregation across all activities in a subject
 * Provides efficient access to student performance summaries
 */
export interface StudentSubjectPerformance {
  id: string;
  studentId: string;
  subjectId: string;
  classId: string;
  
  /** Aggregate performance metrics */
  metrics: {
    totalActivities: number;
    completedActivities: number;
    averageScore: number;
    averagePercentage: number;
    totalTimeSpent: number;
    averageEngagement: number;
    completionRate: number;
  };
  
  /** Bloom's taxonomy progression */
  bloomsProgression: {
    currentLevel: BloomsTaxonomyLevel;
    levelCounts: Record<BloomsTaxonomyLevel, number>;
    masteredLevels: BloomsTaxonomyLevel[];
    progressionTrend: 'improving' | 'stable' | 'declining';
  };
  
  /** Performance trends */
  trends: {
    scoresTrend: 'improving' | 'stable' | 'declining';
    engagementTrend: 'improving' | 'stable' | 'declining';
    timeTrend: 'faster' | 'stable' | 'slower';
    last7DaysAverage: number;
    last30DaysAverage: number;
  };
  
  /** Last activity information */
  lastActivity: {
    activityId: string;
    score: number;
    percentage: number;
    completedAt: Date;
  };
  
  /** Timestamps */
  firstActivityAt: Date;
  lastActivityAt: Date;
  updatedAt: Date;
}

/**
 * Class activity performance aggregation
 * Provides efficient access to class-wide activity performance
 */
export interface ClassActivityPerformance {
  id: string;
  classId: string;
  activityId: string;
  
  /** Aggregate metrics for the class */
  metrics: {
    totalSubmissions: number;
    averageScore: number;
    averagePercentage: number;
    averageTimeSpent: number;
    completionRate: number;
    passRate: number; // Percentage above passing score
  };
  
  /** Distribution analysis */
  distribution: {
    scoreRanges: {
      excellent: number;    // 90-100%
      good: number;         // 80-89%
      satisfactory: number; // 70-79%
      needsWork: number;    // 60-69%
      failing: number;      // <60%
    };
    bloomsDistribution: Record<BloomsTaxonomyLevel, number>;
  };
  
  /** Performance insights */
  insights: {
    topPerformers: string[];      // Student IDs
    strugglingStudents: string[]; // Student IDs
    averageAttempts: number;
    commonMistakes: string[];     // For auto-graded activities
  };
  
  /** Timestamps */
  firstSubmissionAt: Date;
  lastSubmissionAt: Date;
  updatedAt: Date;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Zod schema for validating base performance metrics
 * Ensures data integrity and type safety
 */
export const BasePerformanceMetricsSchema = z.object({
  id: z.string().cuid(),
  studentId: z.string().cuid(),
  activityId: z.string().cuid(),
  classId: z.string().cuid(),
  subjectId: z.string().cuid(),
  topicId: z.string().cuid().optional(),
  score: z.number().min(0),
  maxScore: z.number().min(1),
  percentage: z.number().min(0).max(100),
  timeSpent: z.number().min(0),
  attemptCount: z.number().min(1),
  engagementScore: z.number().min(0).max(100),
  gradingType: z.enum(['AUTO', 'MANUAL', 'AI', 'HYBRID']),
  activityType: z.string().min(1),
  submittedAt: z.date(),
  startedAt: z.date(),
  completedAt: z.date(),
  gradedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Zod schema for validating Bloom's performance data
 */
export const BloomsPerformanceDataSchema = z.object({
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
  demonstratedLevel: z.nativeEnum(BloomsTaxonomyLevel).optional(),
  bloomsLevelScores: z.record(z.nativeEnum(BloomsTaxonomyLevel), z.number().min(0).max(100)).optional(),
  levelMastered: z.boolean(),
  levelProgression: z.number().min(-6).max(6),
});

/**
 * Complete unified performance record schema
 */
export const UnifiedPerformanceRecordSchema = BasePerformanceMetricsSchema.extend({
  bloomsData: BloomsPerformanceDataSchema,
  metadata: z.record(z.any()),
  flags: z.object({
    isExceptional: z.boolean(),
    isStruggling: z.boolean(),
    isImproving: z.boolean(),
    needsAttention: z.boolean(),
    isFirstAttempt: z.boolean(),
    isRetake: z.boolean(),
  }),
});

// ============================================================================
// QUERY INTERFACES
// ============================================================================

/**
 * Standardized query parameters for performance data
 * Enables consistent and efficient database queries
 */
export interface PerformanceQueryParams {
  /** Filter by student(s) */
  studentIds?: string[];
  
  /** Filter by activity(ies) */
  activityIds?: string[];
  
  /** Filter by class(es) */
  classIds?: string[];
  
  /** Filter by subject(s) */
  subjectIds?: string[];
  
  /** Filter by topic(s) */
  topicIds?: string[];
  
  /** Filter by activity type(s) */
  activityTypes?: string[];
  
  /** Filter by grading type(s) */
  gradingTypes?: ('AUTO' | 'MANUAL' | 'AI' | 'HYBRID')[];
  
  /** Filter by Bloom's level(s) */
  bloomsLevels?: BloomsTaxonomyLevel[];
  
  /** Date range filter */
  dateRange?: {
    from: Date;
    to: Date;
  };
  
  /** Score range filter */
  scoreRange?: {
    min: number;
    max: number;
  };
  
  /** Performance flags filter */
  flags?: {
    isExceptional?: boolean;
    isStruggling?: boolean;
    isImproving?: boolean;
    needsAttention?: boolean;
  };
  
  /** Pagination */
  pagination?: {
    page: number;
    limit: number;
  };
  
  /** Sorting */
  sort?: {
    field: keyof BasePerformanceMetrics;
    direction: 'asc' | 'desc';
  };
  
  /** Include related data */
  include?: {
    student?: boolean;
    activity?: boolean;
    class?: boolean;
    subject?: boolean;
    topic?: boolean;
  };
}

/**
 * Standardized response format for performance queries
 * Ensures consistent API responses across all endpoints
 */
export interface PerformanceQueryResponse<T> {
  /** Query results */
  data: T[];
  
  /** Pagination metadata */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  
  /** Query metadata */
  metadata: {
    queryTime: number; // milliseconds
    cacheHit: boolean;
    filters: Partial<PerformanceQueryParams>;
    aggregations?: Record<string, any>;
  };
  
  /** Performance insights */
  insights?: {
    averageScore: number;
    completionRate: number;
    bloomsDistribution: Record<BloomsTaxonomyLevel, number>;
    trends: {
      scoresTrend: 'improving' | 'stable' | 'declining';
      engagementTrend: 'improving' | 'stable' | 'declining';
    };
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type for performance calculation functions
 * Standardizes how performance metrics are calculated
 */
export type PerformanceCalculator<T = any> = (
  data: T[],
  context: {
    activityType: string;
    maxScore: number;
    bloomsLevel?: BloomsTaxonomyLevel;
  }
) => Partial<UnifiedPerformanceRecord>;

/**
 * Type for performance aggregation functions
 * Standardizes how performance data is aggregated
 */
export type PerformanceAggregator<R = any> = (
  records: UnifiedPerformanceRecord[],
  groupBy: keyof UnifiedPerformanceRecord
) => R[];

/**
 * Type for performance trend analysis functions
 * Standardizes trend calculation across the system
 */
export type TrendAnalyzer = (
  records: UnifiedPerformanceRecord[],
  timeWindow: number // days
) => {
  trend: 'improving' | 'stable' | 'declining';
  confidence: number; // 0-1
  changeRate: number; // percentage change per day
};

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

// Note: These types are already exported above as interfaces
// No need to re-export them here to avoid conflicts
