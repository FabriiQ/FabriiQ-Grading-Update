/**
 * Unified Analytics Service
 * 
 * This service creates a unified data pipeline that connects grading and analytics
 * in real-time, eliminating data silos and ensuring consistent metrics.
 */

import { PrismaClient } from '@prisma/client';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { EventEmitter } from 'events';

// Event types for real-time analytics
export enum AnalyticsEventType {
  ACTIVITY_SUBMITTED = 'activity_submitted',
  ACTIVITY_GRADED = 'activity_graded',
  BLOOMS_LEVEL_DEMONSTRATED = 'blooms_level_demonstrated',
  PERFORMANCE_THRESHOLD_CROSSED = 'performance_threshold_crossed',
  LEARNING_PATTERN_DETECTED = 'learning_pattern_detected',
}

// Unified data structure for all performance metrics
export interface UnifiedPerformanceData {
  studentId: string;
  activityId: string;
  submissionId: string;
  
  // Grading data
  score: number;
  maxScore: number;
  percentage: number;
  gradedAt: Date;
  gradingType: 'AUTO' | 'MANUAL' | 'AI' | 'HYBRID';
  
  // Bloom's taxonomy data
  bloomsLevel?: BloomsTaxonomyLevel;
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  demonstratedLevel?: BloomsTaxonomyLevel;
  
  // Analytics metadata
  timeSpent: number;
  attemptCount: number;
  interactionCount: number;
  engagementScore: number;
  
  // Context data
  classId: string;
  subjectId: string;
  topicId?: string;
  activityType: string;
  
  // Timestamps
  submittedAt: Date;
  startedAt: Date;
  completedAt: Date;
}

// Real-time analytics update interface
export interface AnalyticsUpdate {
  type: AnalyticsEventType;
  data: UnifiedPerformanceData;
  metadata: {
    triggeredBy: string;
    timestamp: Date;
    confidence?: number;
  };
}

export class UnifiedAnalyticsService extends EventEmitter {
  private prisma: PrismaClient;
  private updateQueue: AnalyticsUpdate[] = [];
  private processingQueue = false;

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    
    // Start processing queue
    this.startQueueProcessor();
  }

  /**
   * Process a grading event and trigger real-time analytics updates
   */
  async processGradingEvent(
    submissionId: string,
    gradingData: {
      score: number;
      maxScore: number;
      feedback?: string;
      bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
      gradingType: 'AUTO' | 'MANUAL' | 'AI' | 'HYBRID';
      gradedBy: string;
    }
  ): Promise<void> {
    try {
      // Get submission with related data
      const submission = await this.prisma.activityGrade.findUnique({
        where: { id: submissionId },
        include: {
          activity: {
            include: {
              subject: true,
              topic: true,
              class: true,
            }
          },
          student: true,
        }
      });

      if (!submission) {
        throw new Error(`Submission ${submissionId} not found`);
      }

      // Calculate analytics metrics
      const timeSpent = submission.learningCompletedAt && submission.learningStartedAt
        ? Math.floor((submission.learningCompletedAt.getTime() - submission.learningStartedAt.getTime()) / 1000)
        : (submission.timeSpentMinutes ? submission.timeSpentMinutes * 60 : 0);

      const percentage = gradingData.maxScore > 0 
        ? (gradingData.score / gradingData.maxScore) * 100 
        : 0;

      // Determine demonstrated Bloom's level
      const demonstratedLevel = this.determineDemonstratedBloomsLevel(
        gradingData.bloomsLevelScores,
        submission.activity.bloomsLevel as BloomsTaxonomyLevel
      );

      // Create unified performance data
      const performanceData: UnifiedPerformanceData = {
        studentId: submission.studentId,
        activityId: submission.activityId,
        submissionId: submission.id,
        
        // Grading data
        score: gradingData.score,
        maxScore: gradingData.maxScore,
        percentage,
        gradedAt: new Date(),
        gradingType: gradingData.gradingType,
        
        // Bloom's taxonomy data
        bloomsLevel: submission.activity.bloomsLevel as BloomsTaxonomyLevel,
        bloomsLevelScores: gradingData.bloomsLevelScores,
        demonstratedLevel,
        
        // Analytics metadata
        timeSpent,
        attemptCount: 1, // ActivityGrade doesn't track attempts, default to 1
        interactionCount: (submission.content as any)?.interactionCount || 0,
        engagementScore: this.calculateEngagementScore(submission, timeSpent),
        
        // Context data
        classId: submission.activity.classId,
        subjectId: submission.activity.subjectId,
        topicId: submission.activity.topicId || undefined,
        activityType: submission.activity.learningType || submission.activity.assessmentType || 'UNKNOWN',
        
        // Timestamps
        submittedAt: submission.submittedAt,
        startedAt: submission.learningStartedAt || submission.submittedAt,
        completedAt: submission.learningCompletedAt || submission.gradedAt || submission.submittedAt,
      };

      // Queue analytics update
      await this.queueAnalyticsUpdate({
        type: AnalyticsEventType.ACTIVITY_GRADED,
        data: performanceData,
        metadata: {
          triggeredBy: gradingData.gradedBy,
          timestamp: new Date(),
        }
      });

      // Update database with unified data
      await this.updateUnifiedPerformanceRecord(performanceData);

      // Emit real-time event
      this.emit('analytics_updated', performanceData);

    } catch (error) {
      console.error('Error processing grading event:', error);
      throw error;
    }
  }

  /**
   * Queue an analytics update for processing
   */
  private async queueAnalyticsUpdate(update: AnalyticsUpdate): Promise<void> {
    this.updateQueue.push(update);
    
    if (!this.processingQueue) {
      this.processQueue();
    }
  }

  /**
   * Process the analytics update queue
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue || this.updateQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.updateQueue.length > 0) {
        const update = this.updateQueue.shift();
        if (update) {
          await this.processAnalyticsUpdate(update);
        }
      }
    } catch (error) {
      console.error('Error processing analytics queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Start the queue processor
   */
  private startQueueProcessor(): void {
    // Process queue every 1 second
    setInterval(() => {
      this.processQueue();
    }, 1000);
  }

  /**
   * Process a single analytics update
   */
  private async processAnalyticsUpdate(update: AnalyticsUpdate): Promise<void> {
    try {
      switch (update.type) {
        case AnalyticsEventType.ACTIVITY_GRADED:
          await this.processActivityGradedUpdate(update);
          break;
        case AnalyticsEventType.BLOOMS_LEVEL_DEMONSTRATED:
          await this.processBloomsLevelUpdate(update);
          break;
        case AnalyticsEventType.PERFORMANCE_THRESHOLD_CROSSED:
          await this.processPerformanceThresholdUpdate(update);
          break;
        default:
          console.warn('Unknown analytics update type:', update.type);
      }
    } catch (error) {
      console.error('Error processing analytics update:', error);
    }
  }

  /**
   * Process activity graded update
   */
  private async processActivityGradedUpdate(update: AnalyticsUpdate): Promise<void> {
    const { data } = update;
    
    // Update student performance metrics
    await this.updateStudentPerformanceMetrics(data);
    
    // Update class performance metrics
    await this.updateClassPerformanceMetrics(data);
    
    // Update Bloom's taxonomy progression
    if (data.demonstratedLevel) {
      await this.updateBloomsProgression(data);
    }
    
    // Check for performance thresholds
    await this.checkPerformanceThresholds(data);
  }

  /**
   * Determine demonstrated Bloom's level from scores
   */
  private determineDemonstratedBloomsLevel(
    bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>,
    activityBloomsLevel?: BloomsTaxonomyLevel
  ): BloomsTaxonomyLevel | undefined {
    if (!bloomsLevelScores) {
      return activityBloomsLevel;
    }

    // Find the highest scoring Bloom's level above threshold (70%)
    const threshold = 70;
    let highestLevel: BloomsTaxonomyLevel | undefined;
    let highestScore = 0;

    for (const [level, score] of Object.entries(bloomsLevelScores)) {
      if (score >= threshold && score > highestScore) {
        highestLevel = level as BloomsTaxonomyLevel;
        highestScore = score;
      }
    }

    return highestLevel || activityBloomsLevel;
  }

  /**
   * Calculate engagement score based on submission data
   */
  private calculateEngagementScore(submission: any, timeSpent: number): number {
    // Base engagement score calculation
    let score = 50; // Base score

    // Time spent factor (optimal range: 5-30 minutes)
    const timeMinutes = timeSpent / 60;
    if (timeMinutes >= 5 && timeMinutes <= 30) {
      score += 20;
    } else if (timeMinutes > 30) {
      score += 10; // Diminishing returns for very long time
    }

    // Interaction count factor
    const interactions = (submission.metadata as any)?.interactionCount || 0;
    if (interactions > 10) {
      score += 15;
    } else if (interactions > 5) {
      score += 10;
    }

    // Attempt count factor (fewer attempts = higher engagement)
    const attempts = submission.attemptCount || 1;
    if (attempts === 1) {
      score += 15;
    } else if (attempts <= 3) {
      score += 5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Update unified performance record in database
   */
  private async updateUnifiedPerformanceRecord(data: UnifiedPerformanceData): Promise<void> {
    try {
      // Create or update performance analytics record (if model exists)
      try {
        await (this.prisma as any).performanceAnalytics?.upsert({
        where: {
          submissionId: data.submissionId,
        },
        create: {
          submissionId: data.submissionId,
          studentId: data.studentId,
          activityId: data.activityId,
          classId: data.classId,
          subjectId: data.subjectId,
          topicId: data.topicId,

          // Performance metrics
          score: data.score,
          maxScore: data.maxScore,
          percentage: data.percentage,
          timeSpent: data.timeSpent,
          attemptCount: data.attemptCount,
          engagementScore: data.engagementScore,

          // Bloom's taxonomy data
          bloomsLevel: data.bloomsLevel,
          demonstratedLevel: data.demonstratedLevel,
          bloomsLevelScores: data.bloomsLevelScores as any,

          // Metadata
          gradingType: data.gradingType,
          activityType: data.activityType,
          gradedAt: data.gradedAt,
          submittedAt: data.submittedAt,
          completedAt: data.completedAt,
        },
        update: {
          // Update performance metrics
          score: data.score,
          maxScore: data.maxScore,
          percentage: data.percentage,
          timeSpent: data.timeSpent,
          attemptCount: data.attemptCount,
          engagementScore: data.engagementScore,

          // Update Bloom's taxonomy data
          demonstratedLevel: data.demonstratedLevel,
          bloomsLevelScores: data.bloomsLevelScores as any,

          // Update metadata
          gradingType: data.gradingType,
          gradedAt: data.gradedAt,
          completedAt: data.completedAt,
        }
        });
      } catch (error) {
        console.error('Error updating performance analytics (model may not exist):', error);
        // Don't throw - this is optional functionality
      }
    } catch (error) {
      console.error('Error updating unified performance record:', error);
      throw error;
    }
  }

  /**
   * Update student performance metrics
   */
  private async updateStudentPerformanceMetrics(data: UnifiedPerformanceData): Promise<void> {
    try {
      // Get current student metrics (if model exists)
      const currentMetrics = await (this.prisma as any).studentPerformanceMetrics?.findUnique({
        where: {
          studentId_subjectId: {
            studentId: data.studentId,
            subjectId: data.subjectId,
          }
        }
      });

      if (currentMetrics) {
        // Update existing metrics
        const newTotalScore = currentMetrics.totalScore + data.score;
        const newTotalMaxScore = currentMetrics.totalMaxScore + data.maxScore;
        const newActivityCount = currentMetrics.activityCount + 1;
        const newAverageScore = newTotalScore / newActivityCount;
        const newAveragePercentage = newTotalMaxScore > 0 ? (newTotalScore / newTotalMaxScore) * 100 : 0;

        await (this.prisma as any).studentPerformanceMetrics?.update({
          where: {
            studentId_subjectId: {
              studentId: data.studentId,
              subjectId: data.subjectId,
            }
          },
          data: {
            totalScore: newTotalScore,
            totalMaxScore: newTotalMaxScore,
            activityCount: newActivityCount,
            averageScore: newAverageScore,
            averagePercentage: newAveragePercentage,
            lastActivityDate: data.completedAt,
            totalTimeSpent: currentMetrics.totalTimeSpent + data.timeSpent,
            averageEngagement: (currentMetrics.averageEngagement * (newActivityCount - 1) + data.engagementScore) / newActivityCount,
          }
        });
      } else {
        // Create new metrics record
        await (this.prisma as any).studentPerformanceMetrics?.create({
          data: {
            studentId: data.studentId,
            subjectId: data.subjectId,
            classId: data.classId,
            totalScore: data.score,
            totalMaxScore: data.maxScore,
            activityCount: 1,
            averageScore: data.score,
            averagePercentage: data.percentage,
            lastActivityDate: data.completedAt,
            totalTimeSpent: data.timeSpent,
            averageEngagement: data.engagementScore,
          }
        });
      }
    } catch (error) {
      console.error('Error updating student performance metrics:', error);
      throw error;
    }
  }

  /**
   * Update class performance metrics
   */
  private async updateClassPerformanceMetrics(data: UnifiedPerformanceData): Promise<void> {
    try {
      // Update class performance using existing ClassPerformance model
      // This is a simplified approach that updates overall class metrics
      await this.prisma.classPerformance.upsert({
        where: {
          classId: data.classId
        },
        update: {
          // Update aggregate metrics (simplified)
          lastUpdated: new Date(),
        },
        create: {
          classId: data.classId,
          // Initialize with default values
          averageGrade: data.percentage,
          completionRate: 0,
          submissionRate: 0,
          activitiesCreated: 0,
          activitiesGraded: 1,
          totalPoints: 0,
          averagePoints: 0,
          gradeImprovement: 0,
          teacherFeedbackRate: 0,
          gradingTimeliness: 0,
          lastUpdated: new Date(),
        }
      });
    } catch (error) {
      console.error('Error updating class performance metrics:', error);
      throw error;
    }
  }

  /**
   * Update Bloom's taxonomy progression
   */
  private async updateBloomsProgression(data: UnifiedPerformanceData): Promise<void> {
    if (!data.demonstratedLevel) return;

    try {
      // Get current Bloom's progression
      const currentProgression = await (this.prisma as any).bloomsProgression?.findUnique({
        where: {
          studentId_subjectId: {
            studentId: data.studentId,
            subjectId: data.subjectId,
          }
        }
      });

      const levelCounts = currentProgression?.levelCounts as any || {};
      levelCounts[data.demonstratedLevel] = (levelCounts[data.demonstratedLevel] || 0) + 1;

      if (currentProgression) {
        await (this.prisma as any).bloomsProgression?.update({
          where: {
            studentId_subjectId: {
              studentId: data.studentId,
              subjectId: data.subjectId,
            }
          },
          data: {
            levelCounts: levelCounts,
            lastDemonstratedLevel: data.demonstratedLevel,
            lastActivityDate: data.completedAt,
          }
        });
      } else {
        await (this.prisma as any).bloomsProgression?.create({
          data: {
            studentId: data.studentId,
            subjectId: data.subjectId,
            classId: data.classId,
            levelCounts: levelCounts,
            lastDemonstratedLevel: data.demonstratedLevel,
            lastActivityDate: data.completedAt,
          }
        });
      }
    } catch (error) {
      console.error('Error updating Blooms progression:', error);
      throw error;
    }
  }

  /**
   * Check performance thresholds and trigger alerts
   */
  private async checkPerformanceThresholds(data: UnifiedPerformanceData): Promise<void> {
    try {
      // Check if student is struggling (below 60% average)
      if (data.percentage < 60) {
        await this.queueAnalyticsUpdate({
          type: AnalyticsEventType.PERFORMANCE_THRESHOLD_CROSSED,
          data,
          metadata: {
            triggeredBy: 'system',
            timestamp: new Date(),
            confidence: 0.8,
          }
        });
      }

      // Check for exceptional performance (above 95%)
      if (data.percentage > 95) {
        await this.queueAnalyticsUpdate({
          type: AnalyticsEventType.PERFORMANCE_THRESHOLD_CROSSED,
          data,
          metadata: {
            triggeredBy: 'system',
            timestamp: new Date(),
            confidence: 0.9,
          }
        });
      }
    } catch (error) {
      console.error('Error checking performance thresholds:', error);
    }
  }

  /**
   * Process Bloom's level update
   */
  private async processBloomsLevelUpdate(update: AnalyticsUpdate): Promise<void> {
    // Implementation for Bloom's level specific updates
    console.log('Processing Blooms level update:', update);
  }

  /**
   * Process performance threshold update
   */
  private async processPerformanceThresholdUpdate(update: AnalyticsUpdate): Promise<void> {
    // Implementation for performance threshold alerts
    console.log('Processing performance threshold update:', update);
  }
}
