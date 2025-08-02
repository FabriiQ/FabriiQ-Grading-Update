/**
 * Essay Analytics Service
 * 
 * Provides comprehensive analytics for essay activities including
 * AI grading metrics, Bloom's taxonomy progression, and performance insights.
 */

import { PrismaClient } from '@prisma/client';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { EssayGradingMethod } from '@/types/essay-grading';

export interface EssayAnalyticsData {
  // Basic metrics
  totalEssays: number;
  averageScore: number;
  averageWordCount: number;
  averageTimeSpent: number; // in minutes
  
  // AI grading metrics
  aiGradingStats: {
    totalAIGraded: number;
    averageAIConfidence: number;
    manualOverrideRate: number;
    highConfidenceRate: number; // Above 80% confidence
    lowConfidenceRate: number; // Below 50% confidence
  };
  
  // Bloom's taxonomy distribution
  bloomsDistribution: Record<BloomsTaxonomyLevel, {
    count: number;
    averageScore: number;
    percentage: number;
  }>;
  
  // Performance trends
  performanceTrends: {
    scoreProgression: Array<{
      date: Date;
      averageScore: number;
      count: number;
    }>;
    bloomsProgression: Array<{
      date: Date;
      level: BloomsTaxonomyLevel;
      count: number;
    }>;
  };
  
  // Quality metrics
  qualityMetrics: {
    grammarScoreAverage: number;
    vocabularyScoreAverage: number;
    structureScoreAverage: number;
    contentScoreAverage: number;
    originalityScoreAverage: number;
  };
  
  // Engagement metrics
  engagementMetrics: {
    averageRevisions: number;
    saveProgressUsage: number; // Percentage of students who saved progress
    timeDistribution: {
      under30min: number;
      between30and60min: number;
      over60min: number;
    };
  };
}

export interface StudentEssayProgress {
  studentId: string;
  studentName: string;
  essayCount: number;
  averageScore: number;
  bloomsProgression: BloomsTaxonomyLevel[];
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
}

export class EssayAnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get comprehensive essay analytics for a class or teacher
   */
  async getEssayAnalytics(
    classId?: string,
    teacherId?: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<EssayAnalyticsData> {
    try {
      const where: any = {
        activity: {
          activityType: 'essay'
        },
        wordCount: { not: null }, // Only completed essays
      };

      if (classId) {
        where.activity.classId = classId;
      }

      if (teacherId) {
        where.activity.createdBy = teacherId;
      }

      if (dateRange) {
        where.submittedAt = {
          gte: dateRange.start,
          lte: dateRange.end,
        };
      }

      // Get basic metrics
      const [
        totalEssays,
        avgScore,
        avgWordCount,
        avgTimeSpent,
        aiGradingStats,
        bloomsData,
        qualityData,
        engagementData
      ] = await Promise.all([
        this.getTotalEssays(where),
        this.getAverageScore(where),
        this.getAverageWordCount(where),
        this.getAverageTimeSpent(where),
        this.getAIGradingStats(where),
        this.getBloomsDistribution(where),
        this.getQualityMetrics(where),
        this.getEngagementMetrics(where)
      ]);

      // Get performance trends
      const performanceTrends = await this.getPerformanceTrends(where);

      return {
        totalEssays,
        averageScore: avgScore,
        averageWordCount: avgWordCount,
        averageTimeSpent: avgTimeSpent,
        aiGradingStats,
        bloomsDistribution: bloomsData,
        performanceTrends,
        qualityMetrics: qualityData,
        engagementMetrics: engagementData,
      };
    } catch (error) {
      console.error('Error getting essay analytics:', error);
      throw new Error('Failed to get essay analytics');
    }
  }

  /**
   * Get individual student essay progress
   */
  async getStudentEssayProgress(
    studentId: string,
    classId?: string
  ): Promise<StudentEssayProgress> {
    try {
      const where: any = {
        studentId,
        activity: {
          activityType: 'essay'
        },
        wordCount: { not: null },
      };

      if (classId) {
        where.activity.classId = classId;
      }

      const essays = await this.prisma.activityGrade.findMany({
        where,
        include: {
          student: {
            include: {
              user: true
            }
          }
        },
        orderBy: {
          submittedAt: 'asc'
        }
      });

      if (essays.length === 0) {
        throw new Error('No essays found for student');
      }

      const studentName = essays[0].student.user.name || 'Unknown';
      const scores = essays.map(e => e.score || 0);
      const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      // Extract Bloom's progression - using content field since bloomsLevel may not exist directly
      const bloomsProgression = essays
        .map(e => {
          // Try to get bloomsLevel from content or use a default
          const content = e.content as any;
          return content?.bloomsLevel as BloomsTaxonomyLevel;
        })
        .filter(Boolean);

      // Analyze strengths and improvement areas
      const { strengths, improvementAreas, recommendations } = 
        await this.analyzeStudentPerformance(essays);

      return {
        studentId,
        studentName,
        essayCount: essays.length,
        averageScore,
        bloomsProgression,
        strengths,
        improvementAreas,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting student essay progress:', error);
      throw new Error('Failed to get student essay progress');
    }
  }

  /**
   * Get essay analytics for dashboard
   */
  async getDashboardAnalytics(
    classId?: string,
    teacherId?: string
  ): Promise<{
    totalEssays: number;
    averageScore: number;
    pendingReviews: number;
    aiGradingAccuracy: number;
    topPerformers: Array<{
      studentName: string;
      averageScore: number;
      essayCount: number;
    }>;
    bloomsDistribution: Record<string, number>;
  }> {
    try {
      const where: any = {
        activity: {
          activityType: 'essay'
        }
      };

      if (classId) {
        where.activity.classId = classId;
      }

      if (teacherId) {
        where.activity.createdBy = teacherId;
      }

      const [
        totalEssays,
        averageScore,
        pendingReviews,
        aiAccuracy,
        topPerformers,
        bloomsDistribution
      ] = await Promise.all([
        this.getTotalEssays(where),
        this.getAverageScore(where),
        this.getPendingReviews(where),
        this.getAIGradingAccuracy(where),
        this.getTopPerformers(where),
        this.getBloomsDistributionSimple(where)
      ]);

      return {
        totalEssays,
        averageScore,
        pendingReviews,
        aiGradingAccuracy: aiAccuracy,
        topPerformers,
        bloomsDistribution,
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw new Error('Failed to get dashboard analytics');
    }
  }

  // Private helper methods
  private async getTotalEssays(where: any): Promise<number> {
    return await this.prisma.activityGrade.count({ where });
  }

  private async getAverageScore(where: any): Promise<number> {
    const result = await this.prisma.activityGrade.aggregate({
      where: { ...where, score: { not: null } },
      _avg: { score: true }
    });
    return result._avg.score || 0;
  }

  private async getAverageWordCount(where: any): Promise<number> {
    // Since wordCount might be stored in content field, we need to calculate manually
    const submissions = await this.prisma.activityGrade.findMany({
      where,
      select: { content: true }
    });

    const wordCounts = submissions
      .map(s => {
        const content = s.content as any;
        return content?.wordCount || 0;
      })
      .filter(count => count > 0);

    return wordCounts.length > 0
      ? wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length
      : 0;
  }

  private async getAverageTimeSpent(where: any): Promise<number> {
    const result = await this.prisma.activityGrade.aggregate({
      where: { ...where, timeSpentMinutes: { not: null } },
      _avg: { timeSpentMinutes: true }
    });
    return result._avg.timeSpentMinutes || 0;
  }

  private async getAIGradingStats(where: any) {
    const [total, aiGraded, highConfidence, lowConfidence, overrides] = await Promise.all([
      this.prisma.activityGrade.count({ where }),
      this.prisma.activityGrade.count({
        where: { ...where, gradingMethod: EssayGradingMethod.AI }
      }),
      this.prisma.activityGrade.count({
        where: { ...where, aiConfidence: { gte: 0.8 } }
      }),
      this.prisma.activityGrade.count({
        where: { ...where, aiConfidence: { lte: 0.5 } }
      }),
      this.prisma.activityGrade.count({
        where: { ...where, manualOverride: true }
      })
    ]);

    // Calculate average AI confidence from content field
    const confidenceSubmissions = await this.prisma.activityGrade.findMany({
      where,
      select: { content: true }
    });

    const confidenceValues = confidenceSubmissions
      .map(s => {
        const content = s.content as any;
        return content?.aiConfidence || 0;
      })
      .filter(conf => conf > 0);

    const averageAIConfidence = confidenceValues.length > 0
      ? confidenceValues.reduce((a, b) => a + b, 0) / confidenceValues.length
      : 0;

    return {
      totalAIGraded: aiGraded,
      averageAIConfidence,
      manualOverrideRate: total > 0 ? overrides / total : 0,
      highConfidenceRate: total > 0 ? highConfidence / total : 0,
      lowConfidenceRate: total > 0 ? lowConfidence / total : 0,
    };
  }

  private async getBloomsDistribution(where: any) {
    // Since bloomsLevel is stored in content, we need to fetch and process manually
    const submissions = await this.prisma.activityGrade.findMany({
      where,
      select: { content: true, score: true }
    });

    const levelData: Record<string, { scores: number[], count: number }> = {};

    submissions.forEach(sub => {
      const content = sub.content as any;
      const bloomsLevel = content?.bloomsLevel;
      if (bloomsLevel) {
        if (!levelData[bloomsLevel]) {
          levelData[bloomsLevel] = { scores: [], count: 0 };
        }
        levelData[bloomsLevel].count++;
        if (sub.score) {
          levelData[bloomsLevel].scores.push(sub.score);
        }
      }
    });

    const total = submissions.length;
    const distribution: Record<BloomsTaxonomyLevel, any> = {} as any;

    Object.values(BloomsTaxonomyLevel).forEach(level => {
      const data = levelData[level];
      const averageScore = data?.scores.length > 0
        ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length
        : 0;

      distribution[level] = {
        count: data?.count || 0,
        averageScore,
        percentage: total > 0 ? ((data?.count || 0) / total) * 100 : 0,
      };
    });

    return distribution;
  }

  private async getBloomsDistributionSimple(where: any): Promise<Record<string, number>> {
    // Since bloomsLevel is stored in content, we need to fetch and process manually
    const submissions = await this.prisma.activityGrade.findMany({
      where,
      select: { content: true }
    });

    const distribution: Record<string, number> = {};

    submissions.forEach(sub => {
      const content = sub.content as any;
      const bloomsLevel = content?.bloomsLevel;
      if (bloomsLevel) {
        distribution[bloomsLevel] = (distribution[bloomsLevel] || 0) + 1;
      }
    });

    return distribution;
  }

  private async getPerformanceTrends(where: any) {
    // Implementation for performance trends
    // This would involve complex date-based aggregations
    return {
      scoreProgression: [],
      bloomsProgression: [],
    };
  }

  private async getQualityMetrics(where: any) {
    // Extract quality metrics from AI analysis data
    return {
      grammarScoreAverage: 0,
      vocabularyScoreAverage: 0,
      structureScoreAverage: 0,
      contentScoreAverage: 0,
      originalityScoreAverage: 0,
    };
  }

  private async getEngagementMetrics(where: any) {
    return {
      averageRevisions: 0,
      saveProgressUsage: 0,
      timeDistribution: {
        under30min: 0,
        between30and60min: 0,
        over60min: 0,
      },
    };
  }

  private async getPendingReviews(where: any): Promise<number> {
    return await this.prisma.activityGrade.count({
      where: { ...where, reviewRequired: true }
    });
  }

  private async getAIGradingAccuracy(where: any): Promise<number> {
    // Calculate AI grading accuracy based on manual overrides
    const total = await this.prisma.activityGrade.count({
      where: { ...where, gradingMethod: EssayGradingMethod.AI }
    });
    
    const overrides = await this.prisma.activityGrade.count({
      where: { ...where, manualOverride: true }
    });

    return total > 0 ? ((total - overrides) / total) * 100 : 0;
  }

  private async getTopPerformers(where: any) {
    const performers = await this.prisma.activityGrade.groupBy({
      by: ['studentId'],
      where: { ...where, score: { not: null } },
      _avg: { score: true },
      _count: true,
      orderBy: { _avg: { score: 'desc' } },
      take: 5
    });

    const performersWithNames = performers.map((p) => ({
      studentName: `Student ${p.studentId.slice(-4)}`, // Use last 4 chars of ID as placeholder
      averageScore: p._avg.score || 0,
      essayCount: p._count,
    }));

    return performersWithNames;
  }

  private async analyzeStudentPerformance(essays: any[]) {
    // Analyze student performance patterns
    const strengths: string[] = [];
    const improvementAreas: string[] = [];
    const recommendations: string[] = [];

    // Basic analysis based on scores and trends
    const scores = essays.map(e => e.score || 0);
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (avgScore >= 85) {
      strengths.push('Consistently high performance');
    } else if (avgScore >= 70) {
      strengths.push('Good overall performance');
    } else {
      improvementAreas.push('Overall performance needs improvement');
    }

    // Check for improvement trend
    if (scores.length >= 3) {
      const recent = scores.slice(-3);
      const earlier = scores.slice(0, -3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;

      if (recentAvg > earlierAvg + 5) {
        strengths.push('Showing improvement over time');
      } else if (recentAvg < earlierAvg - 5) {
        improvementAreas.push('Performance declining over time');
        recommendations.push('Review recent essays for common issues');
      }
    }

    return { strengths, improvementAreas, recommendations };
  }
}
