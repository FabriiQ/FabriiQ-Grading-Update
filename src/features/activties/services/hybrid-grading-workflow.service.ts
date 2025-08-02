/**
 * Hybrid AI + Manual Grading Workflow Service
 * 
 * Orchestrates the complete grading workflow including AI grading,
 * confidence thresholds, manual review triggers, and teacher overrides.
 */

import { PrismaClient } from '@prisma/client';
import { AIEssayGradingService } from '@/server/api/services/ai-essay-grading.service';
import { EssayGradingDatabaseService } from '@/server/api/services/essay-grading-database.service';
import { EssayGradingWorkflowService } from '@/server/api/services/essay-grading-workflow.service';
import { EssayActivity, EssaySubmissionData } from '../models/essay';
import { ManualGradingActivity, ManualGradingSubmission } from '../models/manual-grading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { EssayGradingMethod } from '@/types/essay-grading';

export interface GradingWorkflowConfig {
  enableAIGrading: boolean;
  aiConfidenceThreshold: number;
  requireManualReview: boolean;
  allowTeacherOverride: boolean;
  autoPublishHighConfidence: boolean;
  notifyTeacherOnLowConfidence: boolean;
  enableSecondReview: boolean;
  maxScoreDifference: number; // Trigger review if AI and manual scores differ by this amount
}

export interface GradingWorkflowResult {
  success: boolean;
  gradingMethod: EssayGradingMethod;
  finalScore?: number;
  confidence?: number;
  requiresManualReview: boolean;
  isPublished: boolean;
  reviewReasons: string[];
  error?: string;
}

export class HybridGradingWorkflowService {
  private prisma: PrismaClient;
  private aiGradingService: AIEssayGradingService;
  private databaseService: EssayGradingDatabaseService;
  private workflowService: EssayGradingWorkflowService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.aiGradingService = new AIEssayGradingService();
    this.databaseService = new EssayGradingDatabaseService(prisma);
    this.workflowService = new EssayGradingWorkflowService(prisma);
  }

  /**
   * Process essay submission through hybrid grading workflow
   */
  async processEssaySubmission(
    submissionId: string,
    activity: EssayActivity,
    submissionData: EssaySubmissionData,
    config: GradingWorkflowConfig
  ): Promise<GradingWorkflowResult> {
    try {
      console.log('Starting hybrid grading workflow', {
        submissionId,
        activityId: activity.id,
        config
      });

      // Step 1: AI Grading (if enabled)
      let aiResult: any = null;
      if (config.enableAIGrading) {
        aiResult = await this.performAIGrading(submissionId, activity, submissionData);
      }

      // Step 2: Determine if manual review is required
      const requiresManualReview = this.shouldRequireManualReview(aiResult, config);

      // Step 3: Handle workflow based on review requirement
      if (requiresManualReview) {
        return await this.handleManualReviewRequired(
          submissionId,
          activity,
          aiResult,
          config
        );
      } else {
        return await this.handleAutoPublish(
          submissionId,
          activity,
          aiResult!,
          config
        );
      }
    } catch (error) {
      console.error('Error in hybrid grading workflow:', error);
      return {
        success: false,
        gradingMethod: EssayGradingMethod.MANUAL,
        requiresManualReview: true,
        isPublished: false,
        reviewReasons: ['Workflow error occurred'],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process offline class activity feedback/grading
   */
  async processOfflineClassActivity(
    submissionId: string,
    activity: ManualGradingActivity,
    submissionData: ManualGradingSubmission,
    teacherFeedback: {
      score?: number;
      feedback: string;
      bloomsLevel?: BloomsTaxonomyLevel;
      observationNotes?: string;
    }
  ): Promise<GradingWorkflowResult> {
    try {
      console.log('Processing offline class activity', {
        submissionId,
        activityId: activity.id,
        hasScore: teacherFeedback.score !== undefined
      });

      // Update submission with offline class data
      await this.prisma.activityGrade.update({
        where: { id: submissionId },
        data: {
          feedback: teacherFeedback.feedback,
          score: teacherFeedback.score,
          gradedAt: new Date(),
          // Update offline class specific data
          content: JSON.stringify({
            ...submissionData,
            offlineClassData: {
              ...submissionData.offlineClassData,
              digitalFeedbackAdded: true,
              gradingCompleted: teacherFeedback.score !== undefined,
              observationNotes: teacherFeedback.observationNotes,
            }
          }) as any
        }
      });

      // Update points if score provided
      if (teacherFeedback.score !== undefined) {
        await this.updateActivityPoints(
          submissionId,
          teacherFeedback.score,
          teacherFeedback.bloomsLevel || activity.bloomsLevel
        );
      }

      return {
        success: true,
        gradingMethod: EssayGradingMethod.MANUAL,
        finalScore: teacherFeedback.score,
        requiresManualReview: false,
        isPublished: true,
        reviewReasons: []
      };
    } catch (error) {
      console.error('Error processing offline class activity:', error);
      return {
        success: false,
        gradingMethod: EssayGradingMethod.MANUAL,
        requiresManualReview: true,
        isPublished: false,
        reviewReasons: ['Error processing offline activity'],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Apply teacher override to AI-graded submission
   */
  async applyTeacherOverride(
    submissionId: string,
    teacherGrade: {
      score: number;
      feedback: string;
      bloomsLevel: BloomsTaxonomyLevel;
      overrideReason: string;
    },
    teacherId: string
  ): Promise<GradingWorkflowResult> {
    try {
      // Get original AI grade for comparison
      const originalSubmission = await this.databaseService.getEssaySubmissionWithGrading(submissionId);
      
      // Apply manual override
      await this.databaseService.applyManualOverride(
        submissionId,
        teacherGrade.score,
        `${teacherGrade.feedback}\n\nOverride Reason: ${teacherGrade.overrideReason}`,
        teacherId
      );

      // Update points and analytics
      await this.updateActivityPoints(submissionId, teacherGrade.score, teacherGrade.bloomsLevel);

      // Log the override for analytics
      console.log('Teacher override applied', {
        submissionId,
        originalAIScore: originalSubmission?.aiScore,
        newScore: teacherGrade.score,
        scoreDifference: originalSubmission?.aiScore ? Math.abs(teacherGrade.score - originalSubmission.aiScore) : 0,
        teacherId
      });

      return {
        success: true,
        gradingMethod: EssayGradingMethod.HYBRID,
        finalScore: teacherGrade.score,
        requiresManualReview: false,
        isPublished: true,
        reviewReasons: ['Teacher override applied']
      };
    } catch (error) {
      console.error('Error applying teacher override:', error);
      return {
        success: false,
        gradingMethod: EssayGradingMethod.HYBRID,
        requiresManualReview: true,
        isPublished: false,
        reviewReasons: ['Error applying override'],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get submissions requiring manual review
   */
  async getSubmissionsForReview(
    teacherId?: string,
    classId?: string,
    filters?: {
      activityType?: string;
      lowConfidenceOnly?: boolean;
      ungraded?: boolean;
      limit?: number;
    }
  ) {
    const limit = filters?.limit || 50;
    
    // Get essays requiring review
    const essays = await this.databaseService.getEssaysRequiringReview(teacherId, classId, limit);
    
    // Get offline class activities requiring feedback
    const offlineActivities = await this.getOfflineActivitiesRequiringFeedback(classId, limit);
    
    return {
      essays,
      offlineActivities,
      total: essays.length + offlineActivities.length
    };
  }

  /**
   * Perform AI grading
   */
  private async performAIGrading(
    submissionId: string,
    activity: EssayActivity,
    submissionData: EssaySubmissionData
  ) {
    return await this.workflowService.processEssaySubmission(
      submissionId,
      activity,
      submissionData,
      {
        enableAIGrading: true,
        requireManualReview: false,
        allowAIOnlyGrading: true,
        aiConfidenceThreshold: activity.settings.aiGrading.confidenceThreshold || 0.7,
        manualReviewTriggers: {
          lowConfidence: true,
          highStakes: false,
          flaggedContent: true,
          studentRequest: false
        },
        requireTeacherApproval: false,
        enablePeerReview: false,
        enableSecondReview: false,
        maxScoreDifference: 10
      }
    );
  }

  /**
   * Determine if manual review is required
   */
  private shouldRequireManualReview(
    aiResult: any,
    config: GradingWorkflowConfig
  ): boolean {
    if (config.requireManualReview) return true;
    if (!aiResult) return true;

    // Low confidence
    if (aiResult.confidence < config.aiConfidenceThreshold) return true;

    // Very high or very low scores
    if (aiResult.score >= 95 || aiResult.score <= 30) return true;

    return false;
  }

  /**
   * Handle manual review required
   */
  private async handleManualReviewRequired(
    submissionId: string,
    _activity: EssayActivity,
    aiResult: any,
    config: GradingWorkflowConfig
  ): Promise<GradingWorkflowResult> {
    const reviewReasons: string[] = [];
    
    if (config.requireManualReview) reviewReasons.push('Manual review required by configuration');
    if (aiResult && aiResult.confidence < config.aiConfidenceThreshold) {
      reviewReasons.push(`Low AI confidence (${Math.round(aiResult.confidence * 100)}%)`);
    }
    if (aiResult && (aiResult.score >= 95 || aiResult.score <= 30)) {
      reviewReasons.push('Extreme score detected');
    }

    // Mark for review
    await this.databaseService.markForReview(submissionId, reviewReasons.join(', '));

    // Notify teacher if configured
    if (config.notifyTeacherOnLowConfidence) {
      // TODO: Implement teacher notification
    }

    return {
      success: true,
      gradingMethod: aiResult ? EssayGradingMethod.HYBRID : EssayGradingMethod.MANUAL,
      finalScore: undefined,
      confidence: aiResult?.confidence,
      requiresManualReview: true,
      isPublished: false,
      reviewReasons
    };
  }

  /**
   * Handle auto-publish for high confidence AI grades
   */
  private async handleAutoPublish(
    submissionId: string,
    activity: EssayActivity,
    aiResult: any,
    config: GradingWorkflowConfig
  ): Promise<GradingWorkflowResult> {
    if (config.autoPublishHighConfidence) {
      // Update points and analytics
      await this.updateActivityPoints(submissionId, aiResult.score, aiResult.aiBloomsLevel);
      
      return {
        success: true,
        gradingMethod: EssayGradingMethod.AI,
        finalScore: aiResult.score,
        confidence: aiResult.confidence,
        requiresManualReview: false,
        isPublished: true,
        reviewReasons: []
      };
    } else {
      return {
        success: true,
        gradingMethod: EssayGradingMethod.AI,
        finalScore: aiResult.score,
        confidence: aiResult.confidence,
        requiresManualReview: false,
        isPublished: false,
        reviewReasons: ['Awaiting teacher approval']
      };
    }
  }

  /**
   * Update activity points and analytics
   */
  private async updateActivityPoints(
    submissionId: string,
    score: number,
    bloomsLevel: BloomsTaxonomyLevel
  ): Promise<void> {
    try {
      await this.prisma.activityGrade.update({
        where: { id: submissionId },
        data: {
          points: Math.round(score),
          gradedAt: new Date(),
          content: JSON.stringify({ bloomsLevel }) as any
        }
      });
    } catch (error) {
      console.error('Error updating activity points:', error);
    }
  }

  /**
   * Get offline activities requiring feedback
   */
  private async getOfflineActivitiesRequiringFeedback(
    classId?: string,
    limit: number = 50
  ) {
    try {
      const where: any = {
        activity: {
          activityType: 'manual-grading',
          // Filter for offline class activities
          content: {
            path: ['isOfflineClassActivity'],
            equals: true
          }
        },
        // Activities conducted in class but no digital feedback added yet
        content: {
          path: ['offlineClassData', 'conductedAt'],
          not: null
        },
        OR: [
          {
            content: {
              path: ['offlineClassData', 'digitalFeedbackAdded'],
              equals: false
            }
          },
          {
            content: {
              path: ['offlineClassData', 'digitalFeedbackAdded'],
              equals: null
            }
          }
        ]
      };

      if (classId) {
        where.activity.classId = classId;
      }

      const submissions = await this.prisma.activityGrade.findMany({
        where,
        include: {
          activity: {
            select: {
              title: true,
              classId: true,
            }
          },
          student: {
            select: {
              user: {
                select: {
                  name: true,
                }
              }
            }
          }
        },
        orderBy: [
          { submittedAt: 'asc' } // Oldest first
        ],
        take: limit,
      });

      return submissions.map(submission => ({
        id: submission.id,
        studentName: submission.student.user.name || 'Unknown',
        activityTitle: submission.activity.title,
        conductedAt: (submission.content as any)?.offlineClassData?.conductedAt,
        submittedAt: submission.submittedAt,
        requiresFeedback: true,
        allowGrading: (submission.content as any)?.settings?.offlineClassSettings?.allowGrading || false
      }));
    } catch (error) {
      console.error('Error getting offline activities requiring feedback:', error);
      return [];
    }
  }
}
