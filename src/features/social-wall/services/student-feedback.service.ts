/**
 * Student Feedback Service for Moderation Actions
 * Handles creating feedback entries when moderation actions are taken
 */

import { PrismaClient } from '@prisma/client';

// Simple logger implementation
const logger = {
  info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta),
  error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta),
};

export interface ModerationFeedbackData {
  studentId: string;
  teacherId: string;
  classId: string;
  actionType: 'HIDE_POST' | 'DELETE_POST' | 'HIDE_COMMENT' | 'DELETE_COMMENT' | 'WARN_USER' | 'RESTRICT_USER';
  contentType: 'post' | 'comment';
  contentId: string;
  reason: string;
  notes?: string;
  severity: 'low' | 'medium' | 'high';
  isPubliclyHidden?: boolean;
}

export class StudentFeedbackService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create feedback entry for moderation action
   */
  async createModerationFeedback(data: ModerationFeedbackData): Promise<void> {
    try {
      const feedbackContent = this.generateFeedbackContent(data);
      const feedbackType = this.getFeedbackType(data.actionType);
      const priority = this.getFeedbackPriority(data.severity);

      await this.prisma.studentFeedback.create({
        data: {
          studentId: data.studentId,
          teacherId: data.teacherId,
          classId: data.classId,
          type: feedbackType,
          category: 'BEHAVIOR',
          title: `Content Moderation: ${this.formatActionType(data.actionType)}`,
          content: feedbackContent,
          priority: priority,
          status: 'ACTIVE',
          isPositive: false, // Moderation actions are typically corrective
          metadata: {
            moderationAction: {
              actionType: data.actionType,
              contentType: data.contentType,
              contentId: data.contentId,
              reason: data.reason,
              notes: data.notes,
              severity: data.severity,
              isPubliclyHidden: data.isPubliclyHidden,
              timestamp: new Date().toISOString(),
            },
          },
        },
      });

      logger.info('Moderation feedback created', {
        studentId: data.studentId,
        actionType: data.actionType,
        contentType: data.contentType,
        severity: data.severity,
      });
    } catch (error) {
      logger.error('Failed to create moderation feedback', {
        error,
        data,
      });
      throw error;
    }
  }

  /**
   * Create positive feedback for good behavior
   */
  async createPositiveFeedback(data: {
    studentId: string;
    teacherId: string;
    classId: string;
    reason: string;
    notes?: string;
  }): Promise<void> {
    try {
      await this.prisma.studentFeedback.create({
        data: {
          studentId: data.studentId,
          teacherId: data.teacherId,
          classId: data.classId,
          type: 'COMMENDATION',
          category: 'BEHAVIOR',
          title: 'Positive Social Wall Behavior',
          content: `Student demonstrated positive behavior in social wall interactions: ${data.reason}`,
          priority: 'MEDIUM',
          status: 'ACTIVE',
          isPositive: true,
          metadata: {
            positiveBehavior: {
              reason: data.reason,
              notes: data.notes,
              timestamp: new Date().toISOString(),
            },
          },
        },
      });

      logger.info('Positive feedback created', {
        studentId: data.studentId,
        reason: data.reason,
      });
    } catch (error) {
      logger.error('Failed to create positive feedback', {
        error,
        data,
      });
      throw error;
    }
  }

  /**
   * Get student's moderation history
   */
  async getStudentModerationHistory(
    studentId: string,
    classId: string,
    limit: number = 10
  ): Promise<any[]> {
    try {
      const feedback = await this.prisma.studentFeedback.findMany({
        where: {
          studentId,
          classId,
          category: 'BEHAVIOR',
          metadata: {
            path: ['moderationAction'],
            not: null,
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return feedback;
    } catch (error) {
      logger.error('Failed to get student moderation history', {
        error,
        studentId,
        classId,
      });
      return [];
    }
  }

  /**
   * Generate feedback content based on moderation action
   */
  private generateFeedbackContent(data: ModerationFeedbackData): string {
    const actionText = this.formatActionType(data.actionType);
    const contentTypeText = data.contentType === 'post' ? 'post' : 'comment';
    
    let content = `Your ${contentTypeText} was ${actionText.toLowerCase()} due to: ${data.reason}.`;
    
    switch (data.actionType) {
      case 'HIDE_POST':
      case 'HIDE_COMMENT':
        content += data.isPubliclyHidden 
          ? ' The content is now hidden from other students but remains visible to you.'
          : ' The content has been flagged for review.';
        break;
      
      case 'DELETE_POST':
      case 'DELETE_COMMENT':
        content += ' The content has been permanently removed from the platform.';
        break;
      
      case 'WARN_USER':
        content += ' This serves as a warning to follow community guidelines in future posts.';
        break;
      
      case 'RESTRICT_USER':
        content += ' Your posting privileges have been temporarily restricted.';
        break;
    }
    
    content += ' Please review our community guidelines to ensure your future contributions align with our standards.';
    
    if (data.notes) {
      content += `\n\nAdditional notes from your teacher: ${data.notes}`;
    }
    
    return content;
  }

  /**
   * Get feedback type based on moderation action
   */
  private getFeedbackType(actionType: string): string {
    switch (actionType) {
      case 'WARN_USER':
        return 'WARNING';
      case 'RESTRICT_USER':
        return 'DISCIPLINARY';
      case 'DELETE_POST':
      case 'DELETE_COMMENT':
        return 'DISCIPLINARY';
      case 'HIDE_POST':
      case 'HIDE_COMMENT':
        return 'CORRECTIVE';
      default:
        return 'GENERAL';
    }
  }

  /**
   * Get feedback priority based on severity
   */
  private getFeedbackPriority(severity: string): string {
    switch (severity) {
      case 'high':
        return 'HIGH';
      case 'medium':
        return 'MEDIUM';
      case 'low':
        return 'LOW';
      default:
        return 'MEDIUM';
    }
  }

  /**
   * Format action type for display
   */
  private formatActionType(actionType: string): string {
    return actionType
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Check if student needs intervention based on feedback history
   */
  async checkForInterventionNeeded(
    studentId: string,
    classId: string
  ): Promise<{
    needsIntervention: boolean;
    reason: string;
    recentViolations: number;
    severity: 'low' | 'medium' | 'high';
  }> {
    try {
      // Get recent moderation feedback (last 30 days)
      const recentFeedback = await this.prisma.studentFeedback.findMany({
        where: {
          studentId,
          classId,
          category: 'BEHAVIOR',
          isPositive: false,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const recentViolations = recentFeedback.length;
      let needsIntervention = false;
      let reason = '';
      let severity: 'low' | 'medium' | 'high' = 'low';

      if (recentViolations >= 5) {
        needsIntervention = true;
        severity = 'high';
        reason = `Student has ${recentViolations} moderation actions in the last 30 days, indicating a pattern of inappropriate behavior.`;
      } else if (recentViolations >= 3) {
        needsIntervention = true;
        severity = 'medium';
        reason = `Student has ${recentViolations} moderation actions in the last 30 days, suggesting need for guidance.`;
      } else if (recentViolations >= 2) {
        severity = 'low';
        reason = `Student has ${recentViolations} recent moderation actions, monitor for patterns.`;
      }

      return {
        needsIntervention,
        reason,
        recentViolations,
        severity,
      };
    } catch (error) {
      logger.error('Failed to check intervention needs', {
        error,
        studentId,
        classId,
      });
      return {
        needsIntervention: false,
        reason: 'Unable to assess intervention needs',
        recentViolations: 0,
        severity: 'low',
      };
    }
  }
}

export default StudentFeedbackService;
