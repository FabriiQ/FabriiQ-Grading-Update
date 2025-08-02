'use client';

/**
 * Manual Grading Activity Model
 *
 * This file defines the model for manual grading activities that integrate
 * with Bloom's Taxonomy and rubrics.
 */

import { BaseActivity, ActivitySettings, ActivityMetadata } from './base';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

/**
 * Manual Grading Activity Interface
 * Represents a complete manual grading activity including offline class activities
 */
export interface ManualGradingActivity extends BaseActivity {
  activityType: 'manual-grading';
  instructions: string;
  description: string;
  bloomsLevel: BloomsTaxonomyLevel;
  rubricId?: string;
  attachments?: ManualGradingAttachment[];
  submissionInstructions?: string;
  isGradable: true; // Always gradable
  maxScore: number; // Maximum score for the activity

  // Offline class activity features - activities conducted in class but graded/feedback added digitally
  activityCategory?: 'online' | 'offline_class' | 'homework' | 'project' | 'presentation';
  isOfflineClassActivity?: boolean; // True for activities conducted in physical classroom
  classroomInstructions?: string; // Instructions for conducting the activity in class

  bloomsAnalytics?: {
    targetLevel: BloomsTaxonomyLevel;
    expectedSkills: string[];
    assessmentCriteria: Array<{
      skill: string;
      bloomsLevel: BloomsTaxonomyLevel;
      weight: number;
    }>;
  };

  settings?: ActivitySettings & {
    allowFileUpload?: boolean;
    allowTextSubmission?: boolean;
    allowLinkSubmission?: boolean;
    maxFileSize?: number; // in MB
    allowedFileTypes?: string[]; // e.g., ['pdf', 'docx', 'jpg']
    maxFiles?: number;
    dueDate?: Date;
    lateSubmissionPolicy?: 'no_late' | 'with_penalty' | 'no_penalty';
    latePenaltyPercentage?: number;
    showRubricToStudents?: boolean;
    gradingMethod?: 'auto' | 'manual'; // Whether to use automatic or manual grading
    gradingType?: 'score' | 'rubric' | 'blooms_based'; // Enhanced grading types

    // Offline class activity specific settings
    offlineClassSettings?: {
      conductedInClass: boolean; // Activity was conducted in physical classroom
      requiresDigitalFeedback: boolean; // Teacher will add feedback digitally later
      allowGrading: boolean; // Whether this activity can be graded or just feedback
      materialsList?: string[]; // Materials needed for classroom activity
      timeAllocation?: number; // Time allocated in class (minutes)
      groupActivity?: boolean;
      maxGroupSize?: number;
      observationPoints?: string[]; // Key points for teacher to observe during activity
    };

    // Enhanced rubric integration
    customRubricCriteria?: Array<{
      id: string;
      name: string;
      description: string;
      bloomsLevel: BloomsTaxonomyLevel;
      maxPoints: number;
      levels: Array<{
        level: number;
        description: string;
        points: number;
      }>;
    }>;
  };
}

/**
 * Manual Grading Attachment
 */
export interface ManualGradingAttachment {
  id: string;
  name: string;
  type: 'file' | 'link' | 'text';
  content: string; // File URL, link URL, or text content
  size?: number; // For files
  createdAt?: Date;
}

/**
 * Manual Grading Submission - Enhanced for offline class activities
 */
export interface ManualGradingSubmission {
  id: string;
  studentId: string;
  activityId: string;
  attachments: ManualGradingAttachment[];
  submittedAt: Date;
  status: 'draft' | 'submitted' | 'graded' | 'returned' | 'conducted_in_class' | 'pending_feedback';
  score?: number;
  feedback?: string;
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;

  // Enhanced for offline class activities
  offlineClassData?: {
    conductedAt?: Date; // When the activity was conducted in class
    attendanceConfirmed: boolean; // Student was present for the activity
    participationLevel?: 'low' | 'medium' | 'high';
    observationNotes?: string; // Teacher's observations during class
    digitalFeedbackAdded?: boolean; // Whether teacher has added digital feedback
    gradingCompleted?: boolean; // Whether grading is complete
  };

  gradingDetails?: {
    criteriaResults?: Array<{
      criterionId: string;
      levelId: string;
      score: number;
      feedback?: string;
      bloomsLevel?: BloomsTaxonomyLevel;
    }>;
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
    overallBloomsLevel?: BloomsTaxonomyLevel; // Demonstrated Bloom's level

    // Points and scoring integration
    pointsEarned?: number;
    pointsBreakdown?: Array<{
      category: string;
      points: number;
      maxPoints: number;
    }>;
  };
}

/**
 * Create a default manual grading activity
 */
export function createDefaultManualGradingActivity(
  id: string = `manual-grading-${Date.now()}`,
  title: string = 'New Manual Grading Activity'
): ManualGradingActivity {
  return {
    id,
    title,
    activityType: 'manual-grading',
    instructions: 'Instructions for completing this activity...',
    description: 'Description of the activity...',
    bloomsLevel: BloomsTaxonomyLevel.APPLY,
    isGradable: true,
    maxScore: 100, // Default max score
    settings: {
      allowFileUpload: true,
      allowTextSubmission: true,
      allowLinkSubmission: false,
      maxFileSize: 10, // 10 MB
      allowedFileTypes: ['pdf', 'docx', 'jpg', 'png'],
      maxFiles: 3,
      showRubricToStudents: true,
      gradingMethod: 'manual', // Default to manual grading
      gradingType: 'score', // Default to score-based grading
    },
    metadata: {
      difficulty: 'medium',
      estimatedTime: 30,
      version: '1.0.0',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
