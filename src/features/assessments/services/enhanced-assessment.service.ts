/**
 * Enhanced Assessment Service
 * 
 * This service provides backward-compatible methods for handling both
 * legacy assessments (questions in rubric) and enhanced assessments (questions in content).
 */

import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { 
  AssessmentContent, 
  EnhancedAssessmentInput, 
  QuestionSelectionMode,
  hasEnhancedContent,
  usesQuestionBank,
  AssessmentQuestion
} from '../types/enhanced-assessment';

export class EnhancedAssessmentService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Create an enhanced assessment with backward compatibility
   */
  async createEnhancedAssessment(input: EnhancedAssessmentInput, userId: string) {
    try {
      // Get class details to get institutionId and termId
      const classDetails = await this.prisma.class.findUnique({
        where: { id: input.classId },
        include: {
          campus: {
            select: { institutionId: true }
          },
          term: {
            select: { id: true }
          }
        }
      });

      if (!classDetails) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Class not found',
        });
      }

      // Prepare assessment data with enhanced fields
      const assessmentData: any = {
        title: input.title,
        institutionId: classDetails.campus.institutionId,
        termId: classDetails.term.id,
        classId: input.classId,
        subjectId: input.subjectId,
        topicId: input.topicId,
        category: input.category,
        maxScore: input.maxScore ?? 100,
        passingScore: input.passingScore,
        weightage: input.weightage ?? 0,
        dueDate: input.dueDate,
        createdById: userId,

        // Enhanced fields (all optional for backward compatibility)
        content: input.content ? input.content : null,
        questionSelectionMode: input.questionSelectionMode ?? QuestionSelectionMode.MANUAL,
        autoSelectionConfig: input.autoSelectionConfig ? input.autoSelectionConfig : null,
        questionPoolConfig: input.questionPoolConfig ? input.questionPoolConfig : null,
        enhancedSettings: input.enhancedSettings ? input.enhancedSettings : null,
        questionBankRefs: input.questionBankRefs ?? [],

        // Legacy support - store questions in rubric if provided and no content
        rubric: this.prepareLegacyRubric(input),
      };

      // Create the assessment
      const assessment = await this.prisma.assessment.create({
        data: assessmentData,
        include: {
          subject: true,
          class: true,
          createdBy: true,
        },
      });

      return assessment;
    } catch (error) {
      console.error('Error creating enhanced assessment:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create assessment',
        cause: error,
      });
    }
  }

  /**
   * Get assessment content with backward compatibility
   */
  async getAssessmentContent(assessmentId: string): Promise<AssessmentContent | null> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Assessment not found',
      });
    }

    // Try new content field first
    if (hasEnhancedContent(assessment)) {
      return assessment.content as AssessmentContent;
    }

    // Fallback to extracting content from rubric field (legacy)
    if (assessment.rubric) {
      return this.extractContentFromRubric(assessment.rubric);
    }

    return null;
  }

  /**
   * Get assessment questions with backward compatibility
   */
  async getAssessmentQuestions(assessmentId: string): Promise<AssessmentQuestion[]> {
    const content = await this.getAssessmentContent(assessmentId);
    return content?.questions ?? [];
  }

  /**
   * Update assessment content
   */
  async updateAssessmentContent(
    assessmentId: string, 
    content: AssessmentContent,
    userId: string
  ): Promise<void> {
    try {
      await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          rubric: content as any,
          updatedById: userId,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating assessment content:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update assessment content',
        cause: error,
      });
    }
  }

  /**
   * Migrate legacy assessment to enhanced format
   */
  async migrateLegacyAssessment(assessmentId: string): Promise<void> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment || hasEnhancedContent(assessment)) {
      return; // Already migrated or doesn't exist
    }

    if (assessment.rubric) {
      const content = this.extractContentFromRubric(assessment.rubric);
      
      // Clean rubric (remove non-rubric data)
      const cleanRubric = this.cleanLegacyRubric(assessment.rubric);

      await this.prisma.assessment.update({
        where: { id: assessmentId },
        data: {
          rubric: content as any,
        },
      });
    }
  }

  /**
   * Batch migrate all legacy assessments
   */
  async batchMigrateLegacyAssessments(): Promise<{ migrated: number; errors: number }> {
    let migrated = 0;
    let errors = 0;

    try {
      // Find assessments with rubric but no enhanced content structure
      const legacyAssessments = await this.prisma.assessment.findMany({
        where: {
          rubric: { not: undefined },
        },
        select: { id: true, rubric: true },
      });

      for (const assessment of legacyAssessments) {
        try {
          await this.migrateLegacyAssessment(assessment.id);
          migrated++;
        } catch (error) {
          console.error(`Error migrating assessment ${assessment.id}:`, error);
          errors++;
        }
      }

      return { migrated, errors };
    } catch (error) {
      console.error('Error in batch migration:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to perform batch migration',
        cause: error,
      });
    }
  }

  /**
   * Check if assessment is using enhanced features
   */
  async isEnhancedAssessment(assessmentId: string): Promise<boolean> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      select: {
        rubric: true,
      },
    });

    if (!assessment) return false;

    return hasEnhancedContent(assessment) ||
           usesQuestionBank(assessment);
  }

  /**
   * Private helper methods
   */

  private prepareLegacyRubric(input: EnhancedAssessmentInput): any {
    // Only store in rubric if no content provided and questions exist (legacy support)
    if (!input.content && input.questions) {
      return {
        description: input.description,
        instructions: input.description, // Fallback
        questions: input.questions,
      };
    }

    // Keep existing rubric if provided
    return input.rubric || null;
  }

  private extractContentFromRubric(rubric: any): AssessmentContent {
    const rubricData = typeof rubric === 'string' ? JSON.parse(rubric) : rubric;
    
    return {
      assessmentType: 'QUIZ', // Default type for legacy assessments
      description: rubricData.description,
      instructions: rubricData.instructions,
      questions: rubricData.questions || [],
      settings: {},
      metadata: {
        version: 'legacy',
        lastModified: new Date(),
      },
    };
  }

  private cleanLegacyRubric(rubric: any): any {
    const rubricData = typeof rubric === 'string' ? JSON.parse(rubric) : rubric;
    const cleanRubric = { ...rubricData };
    
    // Remove content-related fields that should be in content field
    delete cleanRubric.description;
    delete cleanRubric.instructions;
    delete cleanRubric.questions;
    
    return cleanRubric;
  }
}

/**
 * Utility functions for backward compatibility
 */

/**
 * Get questions from either content or rubric field
 */
export function getQuestionsFromAssessment(assessment: any): AssessmentQuestion[] {
  // Try new content field first
  if (hasEnhancedContent(assessment)) {
    return assessment.content.questions || [];
  }

  // Fallback to rubric field for legacy assessments
  if (assessment.rubric) {
    const rubricData = typeof assessment.rubric === 'string' 
      ? JSON.parse(assessment.rubric) 
      : assessment.rubric;
    return rubricData.questions || [];
  }

  return [];
}

/**
 * Get assessment instructions from either content or rubric field
 */
export function getInstructionsFromAssessment(assessment: any): string | undefined {
  // Try new content field first
  if (hasEnhancedContent(assessment)) {
    return assessment.content.instructions;
  }

  // Fallback to rubric field for legacy assessments
  if (assessment.rubric) {
    const rubricData = typeof assessment.rubric === 'string' 
      ? JSON.parse(assessment.rubric) 
      : assessment.rubric;
    return rubricData.instructions;
  }

  return undefined;
}

/**
 * Get assessment description from either content or rubric field
 */
export function getDescriptionFromAssessment(assessment: any): string | undefined {
  // Try new content field first
  if (hasEnhancedContent(assessment)) {
    return assessment.content.description;
  }

  // Fallback to rubric field for legacy assessments
  if (assessment.rubric) {
    const rubricData = typeof assessment.rubric === 'string' 
      ? JSON.parse(assessment.rubric) 
      : assessment.rubric;
    return rubricData.description;
  }

  return undefined;
}
