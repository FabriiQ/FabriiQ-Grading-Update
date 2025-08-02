/**
 * Real-Time Bloom's Analytics Integration Service
 * 
 * Provides real-time Bloom's taxonomy progression tracking with automatic
 * level verification, performance correlation, and live dashboard updates.
 */

import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { CognitiveAnalysisService } from './cognitive-analysis.service';

export interface BloomsProgressionEvent {
  type: 'level_achieved' | 'level_verified' | 'progression_milestone' | 'regression_detected';
  studentId: string;
  classId: string;
  previousLevel?: BloomsTaxonomyLevel;
  currentLevel: BloomsTaxonomyLevel;
  confidence: number;
  timestamp: Date;
  activityId: string;
  metadata?: Record<string, any>;
}

export interface RealTimeBloomsMetrics {
  studentId: string;
  currentLevel: BloomsTaxonomyLevel;
  levelConfidence: number;
  progressionVelocity: number; // Levels per week
  consistencyScore: number; // 0-100
  nextLevelReadiness: number; // 0-100
  recentActivities: Array<{
    activityId: string;
    detectedLevel: BloomsTaxonomyLevel;
    confidence: number;
    timestamp: Date;
  }>;
  milestones: Array<{
    level: BloomsTaxonomyLevel;
    achievedAt: Date;
    verifiedAt?: Date;
    activitiesCount: number;
  }>;
}

export interface ClassBloomsAnalytics {
  classId: string;
  totalStudents: number;
  levelDistribution: Record<BloomsTaxonomyLevel, {
    count: number;
    percentage: number;
    averageConfidence: number;
  }>;
  progressionTrends: {
    improving: number;
    stable: number;
    declining: number;
  };
  milestoneAchievements: Array<{
    level: BloomsTaxonomyLevel;
    studentsAchieved: number;
    averageTimeToAchieve: number; // days
  }>;
  realTimeAlerts: Array<{
    type: 'achievement' | 'concern' | 'milestone';
    message: string;
    studentIds: string[];
    timestamp: Date;
  }>;
}

export class RealTimeBloomsAnalyticsService extends EventEmitter {
  private prisma: PrismaClient;
  private cognitiveAnalysis: CognitiveAnalysisService;
  private activeConnections: Map<string, WebSocket[]> = new Map();
  private metricsCache: Map<string, RealTimeBloomsMetrics> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.cognitiveAnalysis = new CognitiveAnalysisService(prisma);
    this.startRealTimeUpdates();
  }

  /**
   * Process new activity submission for real-time Bloom's analysis
   */
  async processActivitySubmission(
    submissionId: string,
    studentId: string,
    classId: string,
    activityId: string,
    studentWork: string,
    activityType: string
  ): Promise<BloomsProgressionEvent | null> {
    try {
      // Perform cognitive analysis
      const analysis = await this.cognitiveAnalysis.analyzeCognitiveLevel(
        studentWork,
        activityType
      );

      // Update student's Bloom's progression
      const progressionEvent = await this.updateStudentProgression(
        studentId,
        classId,
        activityId,
        analysis.detectedLevel,
        analysis.confidence
      );

      // Update real-time metrics
      await this.updateRealTimeMetrics(studentId);

      // Emit real-time event
      if (progressionEvent) {
        this.emit('blooms_progression', progressionEvent);
        this.broadcastToConnections(classId, {
          type: 'blooms_update',
          data: progressionEvent
        });
      }

      // Check for milestones and alerts
      await this.checkMilestonesAndAlerts(studentId, classId);

      return progressionEvent;
    } catch (error) {
      console.error('Error processing activity submission for Bloom\'s analysis:', error);
      return null;
    }
  }

  /**
   * Get real-time Bloom's metrics for a student
   */
  async getStudentRealTimeMetrics(studentId: string): Promise<RealTimeBloomsMetrics> {
    try {
      // Check cache first
      const cached = this.metricsCache.get(studentId);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }

      // Calculate fresh metrics
      const metrics = await this.calculateStudentMetrics(studentId);
      
      // Cache the results
      this.metricsCache.set(studentId, metrics);
      
      return metrics;
    } catch (error) {
      console.error('Error getting student real-time metrics:', error);
      throw new Error('Failed to get student metrics');
    }
  }

  /**
   * Get real-time class Bloom's analytics
   */
  async getClassRealTimeAnalytics(classId: string): Promise<ClassBloomsAnalytics> {
    try {
      // Get activity grades for the class instead of students directly
      const activityGrades = await this.prisma.activityGrade.findMany({
        where: {
          activity: {
            classId: classId
          },
          gradedAt: { not: null }
        },
        include: {
          activity: {
            select: {
              title: true,
              classId: true
            }
          }
        },
        orderBy: { gradedAt: 'desc' },
        take: 100
      });

      const analytics = await this.calculateClassAnalytics(classId, activityGrades);
      return analytics;
    } catch (error) {
      console.error('Error getting class real-time analytics:', error);
      throw new Error('Failed to get class analytics');
    }
  }

  /**
   * Subscribe to real-time Bloom's updates
   */
  subscribeToUpdates(classId: string, websocket: WebSocket): void {
    if (!this.activeConnections.has(classId)) {
      this.activeConnections.set(classId, []);
    }
    
    this.activeConnections.get(classId)!.push(websocket);
    
    // Send initial data
    this.getClassRealTimeAnalytics(classId).then(analytics => {
      this.sendToWebSocket(websocket, {
        type: 'initial_data',
        data: analytics
      });
    });

    // Handle connection close
    websocket.addEventListener('close', () => {
      this.unsubscribeFromUpdates(classId, websocket);
    });
  }

  /**
   * Unsubscribe from real-time updates
   */
  unsubscribeFromUpdates(classId: string, websocket: WebSocket): void {
    const connections = this.activeConnections.get(classId);
    if (connections) {
      const index = connections.indexOf(websocket);
      if (index > -1) {
        connections.splice(index, 1);
      }
      
      if (connections.length === 0) {
        this.activeConnections.delete(classId);
      }
    }
  }

  /**
   * Verify Bloom's level achievement
   */
  async verifyLevelAchievement(
    studentId: string,
    level: BloomsTaxonomyLevel,
    requiredConsistency: number = 3
  ): Promise<boolean> {
    try {
      const recentSubmissions = await this.prisma.activityGrade.findMany({
        where: {
          studentId,
          gradedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        include: {
          activity: {
            select: {
              classId: true
            }
          }
        },
        orderBy: { gradedAt: 'desc' },
        take: requiredConsistency * 2 // Get more to filter by level
      });

      // Filter submissions by level from content
      const levelSubmissions = recentSubmissions.filter(sub => {
        const content = sub.content as any;
        return content?.bloomsLevel === level;
      });

      const isVerified = levelSubmissions.length >= requiredConsistency;

      if (isVerified) {
        // Mark level as verified
        await this.markLevelAsVerified(studentId, level);

        // Emit verification event
        const event: BloomsProgressionEvent = {
          type: 'level_verified',
          studentId,
          classId: recentSubmissions[0]?.activity?.classId || '',
          currentLevel: level,
          confidence: 0.9,
          timestamp: new Date(),
          activityId: recentSubmissions[0]?.activityId || '',
          metadata: { verificationType: 'consistency', activitiesCount: levelSubmissions.length }
        };

        this.emit('blooms_progression', event);
      }

      return isVerified;
    } catch (error) {
      console.error('Error verifying level achievement:', error);
      return false;
    }
  }

  /**
   * Get Bloom's progression insights
   */
  async getProgressionInsights(
    studentId: string,
    timeframe: { start: Date; end: Date }
  ): Promise<{
    progressionPath: Array<{
      level: BloomsTaxonomyLevel;
      achievedAt: Date;
      confidence: number;
    }>;
    velocityTrend: 'accelerating' | 'steady' | 'slowing';
    predictedNextLevel: {
      level: BloomsTaxonomyLevel;
      estimatedDate: Date;
      confidence: number;
    };
    recommendations: string[];
  }> {
    try {
      const progression = await this.cognitiveAnalysis.trackCognitiveProgression(
        studentId,
        undefined,
        timeframe
      );

      const velocityTrend = this.analyzeVelocityTrend(progression.levelHistory);
      const predictedNextLevel = this.predictNextLevelAchievement(progression);
      const recommendations = this.generateProgressionRecommendations(progression);

      return {
        progressionPath: progression.levelHistory.map(h => ({
          level: h.level,
          achievedAt: h.date,
          confidence: h.confidence
        })),
        velocityTrend,
        predictedNextLevel,
        recommendations
      };
    } catch (error) {
      console.error('Error getting progression insights:', error);
      throw new Error('Failed to get progression insights');
    }
  }

  // Private methods

  private startRealTimeUpdates(): void {
    // Update metrics cache every 30 seconds
    this.updateInterval = setInterval(async () => {
      await this.refreshActiveMetrics();
    }, 30000);
  }

  private async updateStudentProgression(
    studentId: string,
    classId: string,
    activityId: string,
    detectedLevel: BloomsTaxonomyLevel,
    confidence: number
  ): Promise<BloomsProgressionEvent | null> {
    try {
      // Get previous level
      const previousSubmission = await this.prisma.activityGrade.findFirst({
        where: {
          studentId,
          gradedAt: { not: null }
        },
        orderBy: { gradedAt: 'desc' }
      });

      const previousContent = previousSubmission?.content as any;
      const previousLevel = previousContent?.bloomsLevel as BloomsTaxonomyLevel;
      
      // Check if this is a new level achievement
      if (previousLevel && this.getBloomsLevelOrder(detectedLevel) > this.getBloomsLevelOrder(previousLevel)) {
        return {
          type: 'level_achieved',
          studentId,
          classId,
          previousLevel,
          currentLevel: detectedLevel,
          confidence,
          timestamp: new Date(),
          activityId
        };
      }

      // Check for regression
      if (previousLevel && this.getBloomsLevelOrder(detectedLevel) < this.getBloomsLevelOrder(previousLevel) - 1) {
        return {
          type: 'regression_detected',
          studentId,
          classId,
          previousLevel,
          currentLevel: detectedLevel,
          confidence,
          timestamp: new Date(),
          activityId
        };
      }

      return null;
    } catch (error) {
      console.error('Error updating student progression:', error);
      return null;
    }
  }

  private async updateRealTimeMetrics(studentId: string): Promise<void> {
    try {
      const metrics = await this.calculateStudentMetrics(studentId);
      this.metricsCache.set(studentId, metrics);
    } catch (error) {
      console.error('Error updating real-time metrics:', error);
    }
  }

  private async calculateStudentMetrics(studentId: string): Promise<RealTimeBloomsMetrics> {
    const submissions = await this.prisma.activityGrade.findMany({
      where: {
        studentId,
        gradedAt: { not: null }
      },
      orderBy: { gradedAt: 'desc' },
      take: 20
    });

    if (submissions.length === 0) {
      throw new Error('No submissions found for student');
    }

    const currentContent = submissions[0].content as any;
    const currentLevel = currentContent?.bloomsLevel as BloomsTaxonomyLevel || BloomsTaxonomyLevel.REMEMBER;
    const levelConfidence = currentContent?.aiConfidence || 0.8;
    
    // Calculate progression velocity (levels per week)
    const progressionVelocity = this.calculateProgressionVelocity(submissions);
    
    // Calculate consistency score
    const consistencyScore = this.calculateConsistencyScore(submissions);
    
    // Calculate next level readiness
    const nextLevelReadiness = this.calculateNextLevelReadiness(submissions, currentLevel);
    
    // Get recent activities
    const recentActivities = submissions.slice(0, 5).map(sub => {
      const content = sub.content as any;
      return {
        activityId: sub.activityId,
        detectedLevel: content?.bloomsLevel as BloomsTaxonomyLevel || BloomsTaxonomyLevel.REMEMBER,
        confidence: content?.aiConfidence || 0.8,
        timestamp: sub.gradedAt!
      };
    });

    // Get milestones
    const milestones = await this.getStudentMilestones(studentId);

    return {
      studentId,
      currentLevel,
      levelConfidence,
      progressionVelocity,
      consistencyScore,
      nextLevelReadiness,
      recentActivities,
      milestones
    };
  }

  private async calculateClassAnalytics(classId: string, students: any[]): Promise<ClassBloomsAnalytics> {
    const totalStudents = students.length;
    
    // Calculate level distribution
    const levelDistribution: Record<BloomsTaxonomyLevel, any> = {} as any;
    Object.values(BloomsTaxonomyLevel).forEach(level => {
      const studentsAtLevel = students.filter(s => 
        s.activityGrades.length > 0 && s.activityGrades[0].bloomsLevel === level
      );
      
      levelDistribution[level] = {
        count: studentsAtLevel.length,
        percentage: Math.round((studentsAtLevel.length / totalStudents) * 100),
        averageConfidence: studentsAtLevel.reduce((sum, s) => 
          sum + (s.activityGrades[0]?.aiConfidence || 0.8), 0
        ) / (studentsAtLevel.length || 1)
      };
    });

    // Calculate progression trends
    const progressionTrends = await this.calculateProgressionTrends(students);
    
    // Calculate milestone achievements
    const milestoneAchievements = await this.calculateMilestoneAchievements(classId);
    
    // Get real-time alerts
    const realTimeAlerts = await this.getRealTimeAlerts(classId);

    return {
      classId,
      totalStudents,
      levelDistribution,
      progressionTrends,
      milestoneAchievements,
      realTimeAlerts
    };
  }

  private broadcastToConnections(classId: string, message: any): void {
    const connections = this.activeConnections.get(classId);
    if (connections) {
      connections.forEach(ws => {
        this.sendToWebSocket(ws, message);
      });
    }
  }

  private sendToWebSocket(ws: WebSocket, message: any): void {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }

  private isCacheValid(metrics: RealTimeBloomsMetrics): boolean {
    // Cache is valid for 5 minutes
    const lastActivity = metrics.recentActivities[0];
    if (!lastActivity) return false;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastActivity.timestamp > fiveMinutesAgo;
  }

  private getBloomsLevelOrder(level: BloomsTaxonomyLevel): number {
    const order = {
      [BloomsTaxonomyLevel.REMEMBER]: 1,
      [BloomsTaxonomyLevel.UNDERSTAND]: 2,
      [BloomsTaxonomyLevel.APPLY]: 3,
      [BloomsTaxonomyLevel.ANALYZE]: 4,
      [BloomsTaxonomyLevel.EVALUATE]: 5,
      [BloomsTaxonomyLevel.CREATE]: 6
    };
    return order[level] || 1;
  }

  private calculateProgressionVelocity(submissions: any[]): number {
    if (submissions.length < 2) return 0;
    
    const levels = submissions.map(s => this.getBloomsLevelOrder(s.bloomsLevel as BloomsTaxonomyLevel));
    const timeSpan = submissions[0].gradedAt.getTime() - submissions[submissions.length - 1].gradedAt.getTime();
    const weeks = timeSpan / (7 * 24 * 60 * 60 * 1000);
    
    const levelChange = Math.max(...levels) - Math.min(...levels);
    return weeks > 0 ? levelChange / weeks : 0;
  }

  private calculateConsistencyScore(submissions: any[]): number {
    if (submissions.length < 3) return 50;
    
    const levels = submissions.slice(0, 10).map(s => this.getBloomsLevelOrder(s.bloomsLevel as BloomsTaxonomyLevel));
    const variance = this.calculateVariance(levels);
    
    // Lower variance = higher consistency
    return Math.max(0, Math.min(100, 100 - (variance * 20)));
  }

  private calculateNextLevelReadiness(submissions: any[], currentLevel: BloomsTaxonomyLevel): number {
    const currentOrder = this.getBloomsLevelOrder(currentLevel);
    const recentAtCurrentLevel = submissions
      .slice(0, 5)
      .filter(s => this.getBloomsLevelOrder(s.bloomsLevel as BloomsTaxonomyLevel) === currentOrder);
    
    const consistency = recentAtCurrentLevel.length / Math.min(5, submissions.length);
    const avgConfidence = recentAtCurrentLevel.reduce((sum, s) => sum + (s.aiConfidence || 0.8), 0) / (recentAtCurrentLevel.length || 1);
    
    return Math.round((consistency * 0.6 + avgConfidence * 0.4) * 100);
  }

  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  }

  private async getStudentMilestones(_studentId: string) {
    // Implementation for getting student milestones
    return [];
  }

  private async calculateProgressionTrends(_students: any[]) {
    // Implementation for calculating progression trends
    return { improving: 0, stable: 0, declining: 0 };
  }

  private async calculateMilestoneAchievements(_classId: string) {
    // Implementation for calculating milestone achievements
    return [];
  }

  private async getRealTimeAlerts(_classId: string) {
    // Implementation for getting real-time alerts
    return [];
  }

  private async checkMilestonesAndAlerts(_studentId: string, _classId: string) {
    // Implementation for checking milestones and generating alerts
  }

  private async markLevelAsVerified(_studentId: string, _level: BloomsTaxonomyLevel) {
    // Implementation for marking level as verified
  }

  private async refreshActiveMetrics() {
    // Implementation for refreshing active metrics cache
  }

  private analyzeVelocityTrend(levelHistory: any[]): 'accelerating' | 'steady' | 'slowing' {
    // Implementation for analyzing velocity trend
    return 'steady';
  }

  private predictNextLevelAchievement(progression: any) {
    // Implementation for predicting next level achievement
    return {
      level: BloomsTaxonomyLevel.UNDERSTAND,
      estimatedDate: new Date(),
      confidence: 0.7
    };
  }

  private generateProgressionRecommendations(progression: any): string[] {
    // Implementation for generating progression recommendations
    return [];
  }
}
