/**
 * Essay Grading Workflow Service
 * 
 * Orchestrates the complete essay grading workflow including
 * AI grading, manual review, and hybrid workflows.
 */

import { PrismaClient } from '@prisma/client';
import { AIEssayGradingService } from './ai-essay-grading.service';
import { EssayGradingDatabaseService } from './essay-grading-database.service';
import { 
  EssayGradingRequest, 
  EssayGradingMethod, 
  EssayGradingWorkflowConfig,
  ManualReviewStatus 
} from '@/types/essay-grading';
import { EssayActivity, EssaySubmissionData } from '@/features/activties/models/essay';

export class EssayGradingWorkflowService {
  private prisma: PrismaClient;
  private aiGradingService: AIEssayGradingService;
  private databaseService: EssayGradingDatabaseService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.aiGradingService = new AIEssayGradingService();
    this.databaseService = new EssayGradingDatabaseService(prisma);
  }

  /**
   * Process essay submission through complete grading workflow
   */
  async processEssaySubmission(
    submissionId: string,
    activity: EssayActivity,
    submissionData: EssaySubmissionData,
    workflowConfig?: EssayGradingWorkflowConfig
  ): Promise<{
    success: boolean;
    gradingMethod: EssayGradingMethod;
    requiresManualReview: boolean;
    score?: number;
    confidence?: number;
    error?: string;
  }> {
    try {
      console.log('Starting essay grading workflow', {
        submissionId,
        activityId: activity.id,
        wordCount: submissionData.wordCount,
        aiEnabled: workflowConfig?.enableAIGrading ?? true
      });

      // Determine grading method based on configuration
      const gradingMethod = this.determineGradingMethod(activity, workflowConfig);

      switch (gradingMethod) {
        case EssayGradingMethod.AI:
          return await this.processAIGrading(submissionId, activity, submissionData, workflowConfig);
        
        case EssayGradingMethod.MANUAL:
          return await this.processManualGrading(submissionId, activity, submissionData);
        
        case EssayGradingMethod.HYBRID:
          return await this.processHybridGrading(submissionId, activity, submissionData, workflowConfig);
        
        default:
          throw new Error(`Unsupported grading method: ${gradingMethod}`);
      }
    } catch (error) {
      console.error('Error in essay grading workflow:', error);
      return {
        success: false,
        gradingMethod: EssayGradingMethod.MANUAL,
        requiresManualReview: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process AI-only grading
   */
  private async processAIGrading(
    submissionId: string,
    activity: EssayActivity,
    submissionData: EssaySubmissionData,
    workflowConfig?: EssayGradingWorkflowConfig
  ): Promise<{
    success: boolean;
    gradingMethod: EssayGradingMethod;
    requiresManualReview: boolean;
    score?: number;
    confidence?: number;
  }> {
    try {
      // Prepare AI grading request
      const gradingRequest: EssayGradingRequest = {
        submissionId,
        essayContent: submissionData.essayText,
        maxScore: 100,
        gradingCriteria: activity.settings.aiGrading.gradingCriteria.map(criterion => ({
          id: criterion.id,
          name: criterion.name,
          description: criterion.description,
          weight: criterion.weight,
          maxPoints: criterion.maxPoints,
          rubricLevels: []
        })),
        requireManualReview: workflowConfig?.requireManualReview ?? false
      };

      // Perform AI grading
      const aiResult = await this.aiGradingService.gradeEssay(gradingRequest);

      // Save results to database
      await this.databaseService.saveAIGradingResult(submissionId, aiResult);
      await this.databaseService.updateEssayWordCount(submissionId, submissionData.wordCount);

      // Check if manual review is required
      const requiresManualReview = this.shouldRequireManualReview(
        aiResult.aiConfidence,
        aiResult.aiScore,
        aiResult.aiAnalysis,
        workflowConfig
      );

      if (requiresManualReview) {
        await this.databaseService.markForReview(
          submissionId,
          `AI confidence: ${Math.round(aiResult.aiConfidence * 100)}%. ${aiResult.reviewReasons.join(', ')}`
        );
      }

      return {
        success: true,
        gradingMethod: requiresManualReview ? EssayGradingMethod.HYBRID : EssayGradingMethod.AI,
        requiresManualReview,
        score: aiResult.aiScore,
        confidence: aiResult.aiConfidence
      };
    } catch (error) {
      console.error('Error in AI grading:', error);
      throw error;
    }
  }

  /**
   * Process manual-only grading
   */
  private async processManualGrading(
    submissionId: string,
    activity: EssayActivity,
    submissionData: EssaySubmissionData
  ): Promise<{
    success: boolean;
    gradingMethod: EssayGradingMethod;
    requiresManualReview: boolean;
  }> {
    try {
      // Update word count
      await this.databaseService.updateEssayWordCount(submissionId, submissionData.wordCount);

      // Mark for manual review
      await this.databaseService.markForReview(
        submissionId,
        'Manual grading required by configuration'
      );

      return {
        success: true,
        gradingMethod: EssayGradingMethod.MANUAL,
        requiresManualReview: true
      };
    } catch (error) {
      console.error('Error in manual grading setup:', error);
      throw error;
    }
  }

  /**
   * Process hybrid grading (AI first, then manual review)
   */
  private async processHybridGrading(
    submissionId: string,
    activity: EssayActivity,
    submissionData: EssaySubmissionData,
    workflowConfig?: EssayGradingWorkflowConfig
  ): Promise<{
    success: boolean;
    gradingMethod: EssayGradingMethod;
    requiresManualReview: boolean;
    score?: number;
    confidence?: number;
  }> {
    try {
      // First, perform AI grading
      const aiResult = await this.processAIGrading(submissionId, activity, submissionData, workflowConfig);

      // Always require manual review for hybrid workflow
      await this.databaseService.markForReview(
        submissionId,
        'Hybrid grading workflow - manual review required'
      );

      return {
        ...aiResult,
        gradingMethod: EssayGradingMethod.HYBRID,
        requiresManualReview: true
      };
    } catch (error) {
      console.error('Error in hybrid grading:', error);
      throw error;
    }
  }

  /**
   * Apply manual override to AI-graded essay
   */
  async applyManualOverride(
    submissionId: string,
    manualScore: number,
    reviewNotes: string,
    reviewerId: string
  ): Promise<void> {
    try {
      await this.databaseService.applyManualOverride(
        submissionId,
        manualScore,
        reviewNotes,
        reviewerId
      );

      console.log('Manual override applied successfully', {
        submissionId,
        manualScore,
        reviewerId
      });
    } catch (error) {
      console.error('Error applying manual override:', error);
      throw error;
    }
  }

  /**
   * Get essays requiring manual review
   */
  async getEssaysForReview(
    teacherId?: string,
    classId?: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    studentName: string;
    activityTitle: string;
    aiScore: number | null;
    aiConfidence: number | null;
    submittedAt: Date;
    wordCount: number | null;
  }>> {
    return await this.databaseService.getEssaysRequiringReview(teacherId, classId, limit);
  }

  /**
   * Get essay grading analytics
   */
  async getGradingAnalytics(
    classId?: string,
    dateRange?: { start: Date; end: Date }
  ) {
    return await this.databaseService.getEssayGradingAnalytics(classId, dateRange);
  }

  /**
   * Determine grading method based on activity and workflow configuration
   */
  private determineGradingMethod(
    activity: EssayActivity,
    workflowConfig?: EssayGradingWorkflowConfig
  ): EssayGradingMethod {
    // Check workflow configuration first
    if (workflowConfig) {
      if (!workflowConfig.enableAIGrading) {
        return EssayGradingMethod.MANUAL;
      }
      if (workflowConfig.requireManualReview && !workflowConfig.allowAIOnlyGrading) {
        return EssayGradingMethod.HYBRID;
      }
    }

    // Check activity settings
    if (!activity.settings.aiGrading.enabled) {
      return EssayGradingMethod.MANUAL;
    }

    if (activity.settings.manualGrading.requiresManualReview) {
      return EssayGradingMethod.HYBRID;
    }

    return EssayGradingMethod.AI;
  }

  /**
   * Determine if manual review is required
   */
  private shouldRequireManualReview(
    confidence: number,
    score: number,
    analysis: any,
    workflowConfig?: EssayGradingWorkflowConfig
  ): boolean {
    const config = workflowConfig || {
      enableAIGrading: true,
      aiConfidenceThreshold: 0.7,
      requireManualReview: false,
      manualReviewTriggers: {
        lowConfidence: true,
        highStakes: false,
        flaggedContent: true,
        studentRequest: false
      },
      allowAIOnlyGrading: true,
      requireTeacherApproval: false,
      enablePeerReview: false,
      enableSecondReview: false,
      maxScoreDifference: 10
    };

    // Force manual review if configured
    if (config.requireManualReview) return true;

    // Low confidence threshold
    if (config.manualReviewTriggers.lowConfidence && confidence < config.aiConfidenceThreshold) {
      return true;
    }

    // Very high or very low scores
    if (score >= 95 || score <= 30) return true;

    // Complex Bloom's levels
    if (['EVALUATE', 'CREATE'].includes(analysis.bloomsAnalysis?.detectedLevel)) {
      return true;
    }

    // Many grammar errors
    if (analysis.language?.grammarErrors?.length > 5) return true;

    return false;
  }
}
