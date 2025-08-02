/**
 * Unified Points Service
 * 
 * Single source of truth for all points calculations and awards.
 * Consolidates logic from multiple services to prevent inconsistencies.
 */

import { PrismaClient, SystemStatus, ActivityGrade } from '@prisma/client';
import { logger } from '@/server/api/utils/logger';

export interface UnifiedPointsCalculation {
  basePoints: number;
  bonusPoints: number;
  totalPoints: number;
  multiplier: number;
  source: 'activity' | 'assessment' | 'grade' | 'login' | 'bonus';
  calculation: string; // Human-readable explanation
}

export interface PointsAwardResult {
  points: number;
  levelUp: boolean;
  newLevel?: number;
  calculation: UnifiedPointsCalculation;
}

export class UnifiedPointsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Calculate points for activity completion (unified logic)
   */
  async calculateActivityPoints(
    activityId: string,
    studentId: string,
    options: {
      score?: number;
      maxScore?: number;
      isGraded?: boolean;
      activityType?: string;
      purpose?: string;
      complexity?: 'low' | 'medium' | 'high';
    } = {}
  ): Promise<UnifiedPointsCalculation> {
    try {
      // Get activity details
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: {
          id: true,
          title: true,
          learningType: true,
          purpose: true,
          isGradable: true,
          maxScore: true,
          weightage: true,
          content: true,
        },
      });

      if (!activity) {
        throw new Error(`Activity ${activityId} not found`);
      }

      // Extract activity configuration
      const isGraded = options.isGraded ?? activity.isGradable;
      const maxScore = options.maxScore ?? activity.maxScore ?? 100;
      const score = options.score ?? 0;
      const activityType = options.activityType ?? activity.learningType;
      const purpose = options.purpose ?? activity.purpose;
      const complexity = options.complexity ?? this.extractComplexity(activity.content);
      const weightage = activity.weightage ?? 1;

      let basePoints = 0;
      let multiplier = 1.0;
      let calculation = '';

      if (isGraded && options.score !== undefined) {
        // Graded activity: points = grade percentage
        const gradePercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        basePoints = gradePercentage;
        calculation = `Grade-based: ${score}/${maxScore} = ${gradePercentage}%`;
      } else {
        // Non-graded activity: points based on complexity
        switch (complexity) {
          case 'low':
            basePoints = 10;
            break;
          case 'medium':
            basePoints = 25;
            break;
          case 'high':
            basePoints = 50;
            break;
          default:
            basePoints = 25;
        }
        calculation = `Complexity-based: ${complexity} = ${basePoints} points`;
      }

      // Apply purpose-based multipliers
      switch (purpose) {
        case 'ASSESSMENT':
          multiplier = 1.5;
          calculation += ` × 1.5 (assessment bonus)`;
          break;
        case 'PRACTICE':
          multiplier = 1.2;
          calculation += ` × 1.2 (practice bonus)`;
          break;
        case 'ENRICHMENT':
          multiplier = 1.1;
          calculation += ` × 1.1 (enrichment bonus)`;
          break;
        default:
          multiplier = 1.0;
      }

      // Apply weightage multiplier
      if (weightage !== 1) {
        multiplier *= weightage;
        calculation += ` × ${weightage} (weightage)`;
      }

      const bonusPoints = Math.round(basePoints * (multiplier - 1));
      const totalPoints = Math.round(basePoints * multiplier);

      return {
        basePoints,
        bonusPoints,
        totalPoints,
        multiplier,
        source: purpose === 'ASSESSMENT' ? 'assessment' : 'activity',
        calculation,
      };
    } catch (error) {
      logger.error('Error calculating activity points', { error, activityId, studentId });
      throw error;
    }
  }

  /**
   * Award points for activity completion (atomic operation)
   */
  async awardActivityPoints(
    activityId: string,
    studentId: string,
    options: {
      score?: number;
      maxScore?: number;
      isGraded?: boolean;
      activityType?: string;
      purpose?: string;
      complexity?: 'low' | 'medium' | 'high';
      preventDuplicates?: boolean;
    } = {}
  ): Promise<PointsAwardResult> {
    const { preventDuplicates = true } = options;

    try {
      // Check for existing points award to prevent duplicates
      if (preventDuplicates) {
        const existingPoints = await this.prisma.studentPoints.findFirst({
          where: {
            studentId,
            source: 'ACTIVITY',
            sourceId: activityId,
            status: SystemStatus.ACTIVE,
          },
        });

        if (existingPoints) {
          logger.warn('Points already awarded for this activity', { activityId, studentId });
          return {
            points: existingPoints.amount,
            levelUp: false,
            calculation: {
              basePoints: existingPoints.amount,
              bonusPoints: 0,
              totalPoints: existingPoints.amount,
              multiplier: 1,
              source: 'activity',
              calculation: 'Already awarded',
            },
          };
        }
      }

      // Calculate points
      const pointsCalculation = await this.calculateActivityPoints(activityId, studentId, options);

      // Get activity details for context
      const activity = await this.prisma.activity.findUnique({
        where: { id: activityId },
        select: {
          title: true,
          classId: true,
          subjectId: true,
        },
      });

      if (!activity) {
        throw new Error(`Activity ${activityId} not found`);
      }

      // Award points in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create points record
        const pointsRecord = await tx.studentPoints.create({
          data: {
            studentId,
            amount: pointsCalculation.totalPoints,
            source: 'ACTIVITY',
            sourceId: activityId,
            description: `Completed activity: ${activity.title}`,
            classId: activity.classId,
            subjectId: activity.subjectId,
            status: SystemStatus.ACTIVE,
          },
        });

        // Update student's total points
        const studentProfile = await tx.studentProfile.findUnique({
          where: { id: studentId },
          select: { totalPoints: true, level: true },
        });

        if (studentProfile) {
          const newTotalPoints = (studentProfile.totalPoints || 0) + pointsCalculation.totalPoints;
          const newLevel = this.calculateLevel(newTotalPoints);
          const levelUp = newLevel > (studentProfile.level || 1);

          await tx.studentProfile.update({
            where: { id: studentId },
            data: {
              totalPoints: newTotalPoints,
              level: newLevel,
            },
          });

          return {
            pointsRecord,
            levelUp,
            newLevel: levelUp ? newLevel : undefined,
            previousLevel: studentProfile.level || 1,
          };
        }

        return { pointsRecord, levelUp: false };
      });

      logger.info('Points awarded successfully', {
        studentId,
        activityId,
        points: pointsCalculation.totalPoints,
        calculation: pointsCalculation.calculation,
      });

      return {
        points: pointsCalculation.totalPoints,
        levelUp: result.levelUp,
        newLevel: result.newLevel,
        calculation: pointsCalculation,
      };
    } catch (error) {
      logger.error('Error awarding activity points', { error, activityId, studentId });
      throw error;
    }
  }

  /**
   * Calculate student level based on total points
   */
  private calculateLevel(totalPoints: number): number {
    // Level calculation: 100 points per level, with exponential scaling
    if (totalPoints < 100) return 1;
    return Math.floor(Math.log2(totalPoints / 100)) + 2;
  }

  /**
   * Extract complexity from activity content
   */
  private extractComplexity(content: any): 'low' | 'medium' | 'high' {
    if (!content) return 'medium';
    
    // Check for complexity indicators
    const questionCount = content.questions?.length || 0;
    const hasMultipleSteps = content.steps?.length > 1;
    const hasComplexInteractions = content.interactions?.length > 3;

    if (questionCount > 10 || hasMultipleSteps || hasComplexInteractions) {
      return 'high';
    } else if (questionCount > 5) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get points history for a student
   */
  async getStudentPointsHistory(
    studentId: string,
    options: {
      limit?: number;
      classId?: string;
      subjectId?: string;
      source?: string;
    } = {}
  ) {
    const { limit = 50, classId, subjectId, source } = options;

    return this.prisma.studentPoints.findMany({
      where: {
        studentId,
        status: SystemStatus.ACTIVE,
        ...(classId && { classId }),
        ...(subjectId && { subjectId }),
        ...(source && { source }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
    });
  }

  /**
   * Get student's current points summary
   */
  async getStudentPointsSummary(studentId: string) {
    const [profile, recentPoints, totalBySource] = await Promise.all([
      this.prisma.studentProfile.findUnique({
        where: { id: studentId },
        select: { totalPoints: true, level: true },
      }),
      this.getStudentPointsHistory(studentId, { limit: 10 }),
      this.prisma.studentPoints.groupBy({
        by: ['source'],
        where: { studentId, status: SystemStatus.ACTIVE },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalPoints: profile?.totalPoints || 0,
      level: profile?.level || 1,
      recentPoints,
      pointsBySource: totalBySource.reduce((acc, item) => {
        acc[item.source] = {
          total: item._sum.amount || 0,
          count: item._count.id,
        };
        return acc;
      }, {} as Record<string, { total: number; count: number }>),
    };
  }
}

// Export singleton instance
export const unifiedPointsService = new UnifiedPointsService(
  // This will be injected by the calling service
  {} as PrismaClient
);
