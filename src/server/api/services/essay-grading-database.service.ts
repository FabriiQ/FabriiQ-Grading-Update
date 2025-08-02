/**
 * Essay Grading Database Service
 * 
 * Handles all database operations for essay grading including
 * AI scores, manual overrides, and grading workflow management.
 */

import { PrismaClient } from '@prisma/client';
import { 
  EssaySubmissionData, 
  EssayGradingResult, 
  EssayGradingMethod,
  EssayAIAnalysis 
} from '@/types/essay-grading';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

export class EssayGradingDatabaseService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Save AI grading result to database
   */
  async saveAIGradingResult(
    submissionId: string,
    gradingResult: EssayGradingResult
  ): Promise<void> {
    try {
      await this.prisma.activityGrade.update({
        where: { id: submissionId },
        data: {
          aiScore: gradingResult.aiScore,
          aiFeedback: gradingResult.aiFeedback,
          aiAnalysis: gradingResult.aiAnalysis as any,
          aiConfidence: gradingResult.aiConfidence,
          aiBloomsLevel: gradingResult.aiBloomsLevel,
          gradingMethod: EssayGradingMethod.AI,
          reviewRequired: gradingResult.requiresManualReview,
          gradedAt: gradingResult.gradedAt,
          
          // Set final score if AI confidence is high enough
          finalScore: gradingResult.requiresManualReview 
            ? null 
            : gradingResult.aiScore,
        }
      });
    } catch (error) {
      console.error('Error saving AI grading result:', error);
      throw new Error('Failed to save AI grading result');
    }
  }

  /**
   * Apply manual override to essay grade
   */
  async applyManualOverride(
    submissionId: string,
    manualScore: number,
    reviewNotes: string,
    reviewerId: string
  ): Promise<void> {
    try {
      await this.prisma.activityGrade.update({
        where: { id: submissionId },
        data: {
          finalScore: manualScore,
          manualOverride: true,
          reviewRequired: false,
          reviewNotes,
          gradedById: reviewerId,
          gradedAt: new Date(),
          gradingMethod: EssayGradingMethod.HYBRID,
        }
      });
    } catch (error) {
      console.error('Error applying manual override:', error);
      throw new Error('Failed to apply manual override');
    }
  }

  /**
   * Get essay submission with grading data
   */
  async getEssaySubmissionWithGrading(submissionId: string): Promise<EssaySubmissionData | null> {
    try {
      const submission = await this.prisma.activityGrade.findUnique({
        where: { id: submissionId },
        include: {
          activity: true,
          student: true,
          gradedBy: true,
        }
      });

      if (!submission) {
        return null;
      }

      return {
        essayText: (submission.content as any)?.essayText || '',
        wordCount: submission.wordCount || 0,
        timeSpent: submission.timeSpentMinutes ? submission.timeSpentMinutes * 60 : 0,
        revisionCount: (submission.content as any)?.revisionCount || 0,
        submittedAt: submission.submittedAt,
        startedAt: submission.learningStartedAt || submission.submittedAt,
        
        // AI grading data
        aiScore: submission.aiScore || undefined,
        aiFeedback: submission.aiFeedback || undefined,
        aiAnalysis: submission.aiAnalysis as EssayAIAnalysis || undefined,
        aiConfidence: submission.aiConfidence || undefined,
        aiBloomsLevel: submission.aiBloomsLevel as BloomsTaxonomyLevel || undefined,
        
        // Manual grading data
        manualOverride: submission.manualOverride,
        finalScore: submission.finalScore || undefined,
        gradingMethod: submission.gradingMethod as EssayGradingMethod || undefined,
        reviewRequired: submission.reviewRequired,
        reviewNotes: submission.reviewNotes || undefined,
      };
    } catch (error) {
      console.error('Error getting essay submission:', error);
      throw new Error('Failed to get essay submission');
    }
  }

  /**
   * Get essays requiring manual review
   */
  async getEssaysRequiringReview(
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
    try {
      const where: any = {
        reviewRequired: true,
        gradedAt: null,
        wordCount: { not: null }, // Only essays
      };

      if (classId) {
        where.activity = { classId };
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
          { aiConfidence: 'asc' }, // Low confidence first
          { submittedAt: 'asc' }   // Older submissions first
        ],
        take: limit,
      });

      return submissions.map(submission => ({
        id: submission.id,
        studentName: submission.student.user.name || 'Unknown',
        activityTitle: submission.activity.title,
        aiScore: submission.aiScore,
        aiConfidence: submission.aiConfidence,
        submittedAt: submission.submittedAt,
        wordCount: submission.wordCount,
      }));
    } catch (error) {
      console.error('Error getting essays requiring review:', error);
      throw new Error('Failed to get essays requiring review');
    }
  }

  /**
   * Get essay grading analytics
   */
  async getEssayGradingAnalytics(
    classId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    totalEssays: number;
    aiGradedCount: number;
    manualGradedCount: number;
    hybridGradedCount: number;
    averageAIConfidence: number;
    manualOverrideRate: number;
    averageWordCount: number;
    bloomsDistribution: Record<string, number>;
  }> {
    try {
      const where: any = {
        wordCount: { not: null }, // Only essays
      };

      if (classId) {
        where.activity = { classId };
      }

      if (dateRange) {
        where.submittedAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      const [
        totalEssays,
        aiGraded,
        manualGraded,
        hybridGraded,
        avgConfidence,
        avgWordCount,
        bloomsData
      ] = await Promise.all([
        // Total essays
        this.prisma.activityGrade.count({ where }),
        
        // AI graded
        this.prisma.activityGrade.count({
          where: { ...where, gradingMethod: EssayGradingMethod.AI }
        }),
        
        // Manual graded
        this.prisma.activityGrade.count({
          where: { ...where, gradingMethod: EssayGradingMethod.MANUAL }
        }),
        
        // Hybrid graded
        this.prisma.activityGrade.count({
          where: { ...where, gradingMethod: EssayGradingMethod.HYBRID }
        }),
        
        // Average AI confidence
        this.prisma.activityGrade.aggregate({
          where: { ...where, aiConfidence: { not: null } },
          _avg: { aiConfidence: true }
        }),
        
        // Average word count
        this.prisma.activityGrade.aggregate({
          where,
          _avg: { wordCount: true }
        }),
        
        // Bloom's distribution
        this.prisma.activityGrade.groupBy({
          by: ['aiBloomsLevel'],
          where: { ...where, aiBloomsLevel: { not: null } },
          _count: true,
        })
      ]);

      const manualOverrideCount = await this.prisma.activityGrade.count({
        where: { ...where, manualOverride: true }
      });

      const bloomsDistribution: Record<string, number> = {};
      bloomsData.forEach(item => {
        if (item.aiBloomsLevel) {
          bloomsDistribution[item.aiBloomsLevel] = item._count;
        }
      });

      return {
        totalEssays,
        aiGradedCount: aiGraded,
        manualGradedCount: manualGraded,
        hybridGradedCount: hybridGraded,
        averageAIConfidence: avgConfidence._avg.aiConfidence || 0,
        manualOverrideRate: totalEssays > 0 ? manualOverrideCount / totalEssays : 0,
        averageWordCount: avgWordCount._avg.wordCount || 0,
        bloomsDistribution,
      };
    } catch (error) {
      console.error('Error getting essay grading analytics:', error);
      throw new Error('Failed to get essay grading analytics');
    }
  }

  /**
   * Update essay word count
   */
  async updateEssayWordCount(submissionId: string, wordCount: number): Promise<void> {
    try {
      await this.prisma.activityGrade.update({
        where: { id: submissionId },
        data: { wordCount }
      });
    } catch (error) {
      console.error('Error updating word count:', error);
      throw new Error('Failed to update word count');
    }
  }

  /**
   * Mark essay as requiring review
   */
  async markForReview(submissionId: string, reason: string): Promise<void> {
    try {
      await this.prisma.activityGrade.update({
        where: { id: submissionId },
        data: {
          reviewRequired: true,
          reviewNotes: reason,
        }
      });
    } catch (error) {
      console.error('Error marking essay for review:', error);
      throw new Error('Failed to mark essay for review');
    }
  }
}
