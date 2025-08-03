import { PrismaClient } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { UnifiedAnalyticsDashboardService } from './unified-analytics-dashboard.service';
import { ActivityAnalyticsService } from './activity-analytics.service';
import { RealTimeBloomsAnalyticsService } from './realtime-blooms-analytics.service';

export interface ClassReportData {
  classId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  performance: {
    averageScore: number;
    scoreDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    topPerformers: Array<{
      studentId: string;
      name: string;
      score: number;
      improvement: number;
    }>;
    strugglingStudents: Array<{
      studentId: string;
      name: string;
      score: number;
      decline: number;
    }>;
    subjectPerformance: Array<{
      subject: string;
      average: number;
      students: number;
    }>;
    timeSeriesData: Array<{
      date: string;
      score: number;
    }>;
  };
  engagement: {
    overallEngagement: number;
    activeStudents: number;
    totalStudents: number;
    averageSessionTime: number;
    engagementTrend: Array<{
      date: string;
      engagement: number;
    }>;
    activityEngagement: Array<{
      activity: string;
      engagement: number;
      participation: number;
    }>;
    timeDistribution: Array<{
      timeSlot: string;
      students: number;
      engagement: number;
    }>;
  };
  analytics: {
    totalStudents: number;
    completionRate: number;
    averageTimeSpent: number;
    bloomsDistribution: Array<{
      level: string;
      count: number;
      percentage: number;
    }>;
    learningPatterns: Array<{
      pattern: string;
      count: number;
      percentage: number;
    }>;
    riskFactors: Array<{
      factor: string;
      students: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    strengths: Array<{
      area: string;
      score: number;
      trend: 'up' | 'down' | 'stable';
    }>;
  };
}

export class ClassReportsAnalyticsService {
  private prisma: PrismaClient;
  private unifiedAnalyticsService: UnifiedAnalyticsDashboardService;
  private activityAnalyticsService: ActivityAnalyticsService;
  private bloomsAnalyticsService: RealTimeBloomsAnalyticsService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.unifiedAnalyticsService = new UnifiedAnalyticsDashboardService(prisma);
    this.activityAnalyticsService = new ActivityAnalyticsService(prisma);
    this.bloomsAnalyticsService = new RealTimeBloomsAnalyticsService(prisma);
  }

  async generateClassReport(
    classId: string,
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<ClassReportData> {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = this.calculateStartDate(period, endDate);

      // Get class details
      const classData = await this.prisma.class.findUnique({
        where: { id: classId },
        include: {
          students: {
            where: { status: 'ACTIVE' },
            include: {
              student: {
                include: {
                  user: true
                }
              }
            }
          }
        }
      });

      if (!classData) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Class not found'
        });
      }

      // Generate performance data
      const performance = await this.generatePerformanceData(classId, startDate, endDate, classData);

      // Generate engagement data
      const engagement = await this.generateEngagementData(classId, startDate, endDate, classData);

      // Generate analytics data
      const analytics = await this.generateAnalyticsData(classId, startDate, endDate, classData);

      return {
        classId,
        period,
        startDate,
        endDate,
        performance,
        engagement,
        analytics
      };
    } catch (error) {
      console.error('Error generating class report:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate class report'
      });
    }
  }

  private calculateStartDate(period: 'daily' | 'weekly' | 'monthly', endDate: Date): Date {
    const startDate = new Date(endDate);
    
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }
    
    return startDate;
  }

  private async generatePerformanceData(
    classId: string,
    startDate: Date,
    endDate: Date,
    classData: any
  ) {
    // Get activity grades for the period
    const activityGrades = await this.prisma.activityGrade.findMany({
      where: {
        activity: {
          classId: classId
        },
        gradedAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'GRADED'
      },
      include: {
        activity: {
          include: {
            subject: true
          }
        },
        student: {
          include: {
            user: true
          }
        }
      }
    });

    // Calculate average score
    const totalScore = activityGrades.reduce((sum, grade) => sum + (grade.score || 0), 0);
    const averageScore = activityGrades.length > 0 ? totalScore / activityGrades.length : 0;

    // Calculate score distribution
    const scoreDistribution = this.calculateScoreDistribution(activityGrades);

    // Get top performers and struggling students
    const studentPerformance = this.calculateStudentPerformance(activityGrades, classData.students);

    // Calculate subject performance
    const subjectPerformance = this.calculateSubjectPerformance(activityGrades);

    // Generate time series data
    const timeSeriesData = this.generateTimeSeriesData(activityGrades, startDate, endDate);

    return {
      averageScore,
      scoreDistribution,
      topPerformers: studentPerformance.topPerformers,
      strugglingStudents: studentPerformance.strugglingStudents,
      subjectPerformance,
      timeSeriesData
    };
  }

  private async generateEngagementData(
    classId: string,
    startDate: Date,
    endDate: Date,
    classData: any
  ) {
    // Get activity submissions for engagement analysis
    const activitySubmissions = await this.prisma.activityGrade.findMany({
      where: {
        activity: {
          classId: classId
        },
        submittedAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        activity: true,
        student: {
          include: {
            user: true
          }
        }
      }
    });

    const totalStudents = classData.students.length;
    const uniqueActiveStudents = new Set(activitySubmissions.map(sub => sub.studentId)).size;
    const overallEngagement = totalStudents > 0 ? (uniqueActiveStudents / totalStudents) * 100 : 0;

    // Calculate engagement metrics
    const engagementTrend = this.calculateEngagementTrend(activitySubmissions, startDate, endDate);
    const activityEngagement = this.calculateActivityEngagement(activitySubmissions);
    const timeDistribution = this.calculateTimeDistribution(activitySubmissions);

    return {
      overallEngagement,
      activeStudents: uniqueActiveStudents,
      totalStudents,
      averageSessionTime: 45, // Placeholder - implement based on actual time tracking
      engagementTrend,
      activityEngagement,
      timeDistribution
    };
  }

  private async generateAnalyticsData(
    classId: string,
    startDate: Date,
    endDate: Date,
    classData: any
  ) {
    const totalStudents = classData.students.length;

    // Get completion rate
    const totalActivities = await this.prisma.activity.count({
      where: { classId: classId }
    });

    const completedActivities = await this.prisma.activityGrade.count({
      where: {
        activity: {
          classId: classId
        },
        status: 'GRADED',
        gradedAt: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    const completionRate = totalActivities > 0 ? (completedActivities / (totalActivities * totalStudents)) * 100 : 0;

    // Calculate Bloom's taxonomy distribution
    const bloomsDistribution = await this.calculateBloomsDistribution(classId, startDate, endDate);

    // Calculate learning patterns
    const learningPatterns = this.calculateLearningPatterns(classData.students);

    // Identify risk factors
    const riskFactors = await this.identifyRiskFactors(classId, startDate, endDate);

    // Identify strengths
    const strengths = await this.identifyStrengths(classId, startDate, endDate);

    return {
      totalStudents,
      completionRate,
      averageTimeSpent: 45, // Placeholder
      bloomsDistribution,
      learningPatterns,
      riskFactors,
      strengths
    };
  }

  // Helper methods for calculations
  private calculateScoreDistribution(activityGrades: any[]) {
    const ranges = [
      { range: '90-100%', min: 90, max: 100 },
      { range: '80-89%', min: 80, max: 89 },
      { range: '70-79%', min: 70, max: 79 },
      { range: '60-69%', min: 60, max: 69 },
      { range: 'Below 60%', min: 0, max: 59 }
    ];

    const total = activityGrades.length;
    
    return ranges.map(range => {
      const count = activityGrades.filter(grade => {
        const score = grade.score || 0;
        return score >= range.min && score <= range.max;
      }).length;
      
      return {
        range: range.range,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      };
    });
  }

  private calculateStudentPerformance(activityGrades: any[], students: any[]) {
    // Group grades by student
    const studentGrades = activityGrades.reduce((acc, grade) => {
      if (!acc[grade.studentId]) {
        acc[grade.studentId] = [];
      }
      acc[grade.studentId].push(grade);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate average scores for each student
    const studentAverages = Object.entries(studentGrades).map(([studentId, grades]) => {
      const typedGrades = grades as any[];
      const totalScore = typedGrades.reduce((sum, grade) => sum + (grade.score || 0), 0);
      const averageScore = typedGrades.length > 0 ? totalScore / typedGrades.length : 0;
      const student = students.find((enrollment: any) => enrollment.studentId === studentId);
      
      return {
        studentId,
        name: student?.student?.user?.name || 'Unknown Student',
        score: averageScore,
        improvement: Math.random() * 20 - 10 // Placeholder - calculate actual improvement
      };
    });

    // Sort by score
    studentAverages.sort((a, b) => b.score - a.score);

    return {
      topPerformers: studentAverages.slice(0, 3).map(student => ({
        studentId: student.studentId,
        name: student.name,
        score: student.score,
        improvement: Math.abs(student.improvement)
      })),
      strugglingStudents: studentAverages.slice(-2).map(student => ({
        studentId: student.studentId,
        name: student.name,
        score: student.score,
        decline: Math.abs(student.improvement)
      }))
    };
  }

  // Additional helper methods would be implemented here...
  private calculateSubjectPerformance(activityGrades: any[]) {
    // Placeholder implementation
    return [
      { subject: 'Mathematics', average: 82, students: 32 },
      { subject: 'Science', average: 78, students: 32 },
      { subject: 'English', average: 75, students: 32 },
      { subject: 'History', average: 80, students: 32 }
    ];
  }

  private generateTimeSeriesData(activityGrades: any[], startDate: Date, endDate: Date) {
    // Placeholder implementation
    return [
      { date: '2024-01-01', score: 75 },
      { date: '2024-01-08', score: 77 },
      { date: '2024-01-15', score: 76 },
      { date: '2024-01-22', score: 79 },
      { date: '2024-01-29', score: 78.5 }
    ];
  }

  private calculateEngagementTrend(activitySubmissions: any[], startDate: Date, endDate: Date) {
    // Placeholder implementation
    return [
      { date: '2024-01-01', engagement: 72 },
      { date: '2024-01-08', engagement: 75 },
      { date: '2024-01-15', engagement: 73 },
      { date: '2024-01-22', engagement: 79 },
      { date: '2024-01-29', engagement: 78.5 }
    ];
  }

  private calculateActivityEngagement(activitySubmissions: any[]) {
    // Placeholder implementation
    return [
      { activity: 'Quizzes', engagement: 85, participation: 90 },
      { activity: 'Discussions', engagement: 72, participation: 65 },
      { activity: 'Assignments', engagement: 78, participation: 88 },
      { activity: 'Videos', engagement: 82, participation: 95 },
      { activity: 'Reading', engagement: 68, participation: 70 }
    ];
  }

  private calculateTimeDistribution(activitySubmissions: any[]) {
    // Placeholder implementation
    return [
      { timeSlot: '8-10 AM', students: 12, engagement: 85 },
      { timeSlot: '10-12 PM', students: 18, engagement: 78 },
      { timeSlot: '12-2 PM', students: 8, engagement: 65 },
      { timeSlot: '2-4 PM', students: 15, engagement: 82 },
      { timeSlot: '4-6 PM', students: 10, engagement: 75 }
    ];
  }

  private async calculateBloomsDistribution(classId: string, startDate: Date, endDate: Date) {
    // Placeholder implementation
    return [
      { level: 'Remember', count: 120, percentage: 25 },
      { level: 'Understand', count: 96, percentage: 20 },
      { level: 'Apply', count: 84, percentage: 17.5 },
      { level: 'Analyze', count: 72, percentage: 15 },
      { level: 'Evaluate', count: 60, percentage: 12.5 },
      { level: 'Create', count: 48, percentage: 10 }
    ];
  }

  private calculateLearningPatterns(students: any[]) {
    // Placeholder implementation
    return [
      { pattern: 'Visual Learners', count: 12, percentage: 37.5 },
      { pattern: 'Auditory Learners', count: 8, percentage: 25 },
      { pattern: 'Kinesthetic Learners', count: 7, percentage: 21.9 },
      { pattern: 'Reading/Writing', count: 5, percentage: 15.6 }
    ];
  }

  private async identifyRiskFactors(classId: string, startDate: Date, endDate: Date) {
    // Placeholder implementation
    return [
      { factor: 'Low Engagement', students: 5, severity: 'high' as const },
      { factor: 'Poor Attendance', students: 3, severity: 'medium' as const },
      { factor: 'Late Submissions', students: 8, severity: 'low' as const },
      { factor: 'Declining Performance', students: 4, severity: 'high' as const }
    ];
  }

  private async identifyStrengths(classId: string, startDate: Date, endDate: Date) {
    // Placeholder implementation
    return [
      { area: 'Problem Solving', score: 85, trend: 'up' as const },
      { area: 'Collaboration', score: 78, trend: 'stable' as const },
      { area: 'Critical Thinking', score: 82, trend: 'up' as const },
      { area: 'Communication', score: 75, trend: 'down' as const }
    ];
  }
}
