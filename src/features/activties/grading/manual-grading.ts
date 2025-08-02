'use client';

/**
 * Manual Grading Activity Grading Function
 *
 * This file contains the grading function for manual grading activities.
 * Since manual grading activities are graded by teachers, this function
 * simply returns a placeholder result.
 */

import { GradingResult } from '../models/base';
import { ManualGradingActivity, ManualGradingSubmission } from '../models/manual-grading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

/**
 * Grade a manual grading activity (including offline class activities)
 *
 * Handles both regular manual grading and offline class activities where
 * teachers add feedback/grading after conducting activities in class.
 *
 * @param activity The manual grading activity
 * @param submission The student's submission
 * @param prisma Database client for updating points and analytics
 * @returns A grading result
 */
export async function gradeManualGradingActivity(
  activity: ManualGradingActivity,
  submission: Partial<ManualGradingSubmission>,
  prisma?: any
): Promise<GradingResult> {
  // If the submission has already been graded, return the existing grade
  if (submission.score !== undefined && submission.gradingDetails) {
    const result: GradingResult = {
      score: submission.score,
      maxScore: activity.maxScore || 100,
      percentage: (submission.score / (activity.maxScore || 100)) * 100,
      passed: submission.score >= 60, // Default passing score
      feedback: submission.feedback || 'This submission has been graded.',
      bloomsLevelScores: submission.gradingDetails.bloomsLevelScores || {
        [activity.bloomsLevel]: submission.score
      },
      requiresManualGrading: false,
      isGraded: true,
    };

    // Update points and analytics if prisma is available
    if (prisma && submission.id) {
      await updateManualGradingPointsAndAnalytics(
        submission.id,
        submission.score,
        submission.gradingDetails.overallBloomsLevel || activity.bloomsLevel,
        activity,
        prisma
      );
    }

    return result;
  }

  // For offline class activities, check if it was conducted in class
  if (activity.isOfflineClassActivity && submission.offlineClassData?.conductedAt) {
    return {
      score: 0,
      maxScore: activity.maxScore || 100,
      percentage: 0,
      passed: false,
      feedback: activity.settings?.offlineClassSettings?.allowGrading
        ? 'This offline class activity is ready for grading and feedback.'
        : 'This offline class activity is ready for teacher feedback.',
      bloomsLevelScores: {
        [activity.bloomsLevel]: 0,
      },
      requiresManualGrading: true,
      isGraded: false,
    };
  }

  // Otherwise, return a placeholder result indicating that manual grading is required
  return {
    score: 0,
    maxScore: activity.maxScore || 100,
    percentage: 0,
    passed: false,
    feedback: activity.isOfflineClassActivity
      ? 'This offline class activity needs to be conducted in class first.'
      : 'This submission requires manual grading by a teacher.',
    bloomsLevelScores: {
      [activity.bloomsLevel]: 0,
    },
    requiresManualGrading: true,
    isGraded: false,
  };
}

/**
 * Update points and analytics for manual grading activities
 */
async function updateManualGradingPointsAndAnalytics(
  submissionId: string,
  score: number,
  bloomsLevel: BloomsTaxonomyLevel,
  activity: ManualGradingActivity,
  prisma: any
): Promise<void> {
  try {
    // Calculate points based on score
    const pointsEarned = Math.round(score);

    // Update the activity grade with points and Bloom's level
    await prisma.activityGrade.update({
      where: { id: submissionId },
      data: {
        pointsEarned,
        bloomsLevel: bloomsLevel,
        gradedAt: new Date(),
      }
    });

    console.log('Manual grading points and analytics updated successfully', {
      submissionId,
      pointsEarned,
      bloomsLevel,
      score,
      activityType: activity.isOfflineClassActivity ? 'offline_class' : 'manual_grading'
    });
  } catch (error) {
    console.error('Error updating manual grading points and analytics:', error);
    // Don't throw - this is a background operation
  }
}
