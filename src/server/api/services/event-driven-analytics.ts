/**
 * Event-Driven Analytics Architecture
 * 
 * Real-time event system that triggers immediate analytics recalculation
 * and dashboard updates when grading events occur.
 */

import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { UnifiedAnalyticsService, AnalyticsEventType, UnifiedPerformanceData } from './unified-analytics-service';

// Event payload interfaces
export interface GradeEventPayload {
  submissionId: string;
  studentId: string;
  activityId: string;
  classId: string;
  subjectId: string;
  score: number;
  maxScore: number;
  percentage: number;
  gradingType: 'AUTO' | 'MANUAL' | 'AI' | 'HYBRID';
  gradedBy: string;
  gradedAt: Date;
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>;
  demonstratedLevel?: BloomsTaxonomyLevel;
}

export interface AnalyticsRecalculationPayload {
  type: 'student' | 'class' | 'subject' | 'global';
  entityId: string;
  affectedMetrics: string[];
  priority: 'high' | 'medium' | 'low';
  triggeredBy: string;
}

export interface DashboardUpdatePayload {
  dashboardType: 'teacher' | 'student' | 'admin';
  userId: string;
  classId?: string;
  subjectId?: string;
  updateType: 'real-time' | 'batch';
  data: Record<string, any>;
}

// Event types
export enum AnalyticsEvent {
  GRADE_SUBMITTED = 'grade_submitted',
  ANALYTICS_RECALCULATED = 'analytics_recalculated',
  DASHBOARD_UPDATE_REQUIRED = 'dashboard_update_required',
  PERFORMANCE_ALERT_TRIGGERED = 'performance_alert_triggered',
  BLOOMS_PROGRESSION_UPDATED = 'blooms_progression_updated',
  THRESHOLD_CROSSED = 'threshold_crossed',
}

export class EventDrivenAnalyticsService extends EventEmitter {
  private prisma: PrismaClient;
  private unifiedAnalytics: UnifiedAnalyticsService;
  private eventQueue: Array<{ event: string; payload: any; timestamp: Date }> = [];
  private processingQueue = false;
  private subscribers: Map<string, Set<(payload: any) => void>> = new Map();

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.unifiedAnalytics = new UnifiedAnalyticsService(prisma);
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start processing queue
    this.startEventProcessor();
  }

  /**
   * Set up internal event listeners
   */
  private setupEventListeners(): void {
    // Listen to unified analytics events
    this.unifiedAnalytics.on('analytics_updated', (data: UnifiedPerformanceData) => {
      this.emit(AnalyticsEvent.ANALYTICS_RECALCULATED, {
        type: 'student',
        entityId: data.studentId,
        affectedMetrics: ['performance', 'blooms', 'engagement'],
        priority: 'high',
        triggeredBy: 'grade_event',
        data,
      });
    });

    // Handle analytics recalculation events
    this.on(AnalyticsEvent.ANALYTICS_RECALCULATED, this.handleAnalyticsRecalculated.bind(this));
    
    // Handle dashboard update events
    this.on(AnalyticsEvent.DASHBOARD_UPDATE_REQUIRED, this.handleDashboardUpdate.bind(this));
    
    // Handle performance alerts
    this.on(AnalyticsEvent.PERFORMANCE_ALERT_TRIGGERED, this.handlePerformanceAlert.bind(this));
  }

  /**
   * Process a grade submission event
   */
  async processGradeEvent(payload: GradeEventPayload): Promise<void> {
    try {
      // Add to event queue for processing
      this.queueEvent(AnalyticsEvent.GRADE_SUBMITTED, payload);

      // Trigger immediate analytics update
      await this.unifiedAnalytics.processGradingEvent(payload.submissionId, {
        score: payload.score,
        maxScore: payload.maxScore,
        bloomsLevelScores: payload.bloomsLevelScores,
        gradingType: payload.gradingType,
        gradedBy: payload.gradedBy,
      });

      // Check for performance thresholds
      await this.checkPerformanceThresholds(payload);

      // Trigger dashboard updates
      await this.triggerDashboardUpdates(payload);

      console.log('Grade event processed successfully', {
        submissionId: payload.submissionId,
        studentId: payload.studentId,
        score: payload.score,
      });

    } catch (error) {
      console.error('Error processing grade event:', error);
      throw error;
    }
  }

  /**
   * Queue an event for processing
   */
  private queueEvent(event: string, payload: any): void {
    this.eventQueue.push({
      event,
      payload,
      timestamp: new Date(),
    });

    if (!this.processingQueue) {
      this.processEventQueue();
    }
  }

  /**
   * Process the event queue
   */
  private async processEventQueue(): Promise<void> {
    if (this.processingQueue || this.eventQueue.length === 0) {
      return;
    }

    this.processingQueue = true;

    try {
      while (this.eventQueue.length > 0) {
        const eventItem = this.eventQueue.shift();
        if (eventItem) {
          this.emit(eventItem.event, eventItem.payload);
          
          // Small delay to prevent overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    } catch (error) {
      console.error('Error processing event queue:', error);
    } finally {
      this.processingQueue = false;
    }
  }

  /**
   * Start the event processor
   */
  private startEventProcessor(): void {
    // Process queue every 100ms for real-time updates
    setInterval(() => {
      this.processEventQueue();
    }, 100);
  }

  /**
   * Check performance thresholds and trigger alerts
   */
  private async checkPerformanceThresholds(payload: GradeEventPayload): Promise<void> {
    try {
      // Get student's recent performance
      const recentPerformance = await (this.prisma as any).performanceAnalytics?.findMany({
        where: {
          studentId: payload.studentId,
          subjectId: payload.subjectId,
          gradedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
        orderBy: { gradedAt: 'desc' },
        take: 5,
      });

      if (recentPerformance.length >= 3) {
        const averagePercentage = recentPerformance.reduce((sum, p) => sum + p.percentage, 0) / recentPerformance.length;
        
        // Struggling student threshold (below 60% average)
        if (averagePercentage < 60) {
          this.emit(AnalyticsEvent.PERFORMANCE_ALERT_TRIGGERED, {
            type: 'struggling_student',
            studentId: payload.studentId,
            classId: payload.classId,
            subjectId: payload.subjectId,
            averagePercentage,
            recentScores: recentPerformance.map(p => p.percentage),
            confidence: 0.8,
            message: `Student is struggling with an average of ${averagePercentage.toFixed(1)}% over the last ${recentPerformance.length} activities`,
          });
        }

        // Exceptional performance threshold (above 95% average)
        if (averagePercentage > 95) {
          this.emit(AnalyticsEvent.PERFORMANCE_ALERT_TRIGGERED, {
            type: 'exceptional_performance',
            studentId: payload.studentId,
            classId: payload.classId,
            subjectId: payload.subjectId,
            averagePercentage,
            recentScores: recentPerformance.map(p => p.percentage),
            confidence: 0.9,
            message: `Student is performing exceptionally well with an average of ${averagePercentage.toFixed(1)}% over the last ${recentPerformance.length} activities`,
          });
        }

        // Improvement detection
        const firstHalf = recentPerformance.slice(Math.ceil(recentPerformance.length / 2));
        const secondHalf = recentPerformance.slice(0, Math.floor(recentPerformance.length / 2));
        
        if (firstHalf.length > 0 && secondHalf.length > 0) {
          const firstHalfAvg = firstHalf.reduce((sum, p) => sum + p.percentage, 0) / firstHalf.length;
          const secondHalfAvg = secondHalf.reduce((sum, p) => sum + p.percentage, 0) / secondHalf.length;
          
          if (secondHalfAvg - firstHalfAvg > 15) {
            this.emit(AnalyticsEvent.PERFORMANCE_ALERT_TRIGGERED, {
              type: 'significant_improvement',
              studentId: payload.studentId,
              classId: payload.classId,
              subjectId: payload.subjectId,
              improvement: secondHalfAvg - firstHalfAvg,
              confidence: 0.7,
              message: `Student has shown significant improvement of ${(secondHalfAvg - firstHalfAvg).toFixed(1)} percentage points`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error checking performance thresholds:', error);
    }
  }

  /**
   * Trigger dashboard updates for relevant users
   */
  private async triggerDashboardUpdates(payload: GradeEventPayload): Promise<void> {
    try {
      // Get class teachers
      const classTeachers = await this.prisma.teacherAssignment.findMany({
        where: { classId: payload.classId },
        include: { teacher: true },
      });

      // Trigger teacher dashboard updates
      for (const classTeacher of classTeachers) {
        this.emit(AnalyticsEvent.DASHBOARD_UPDATE_REQUIRED, {
          dashboardType: 'teacher',
          userId: classTeacher.teacherId,
          classId: payload.classId,
          subjectId: payload.subjectId,
          updateType: 'real-time',
          data: {
            newGrade: {
              studentId: payload.studentId,
              activityId: payload.activityId,
              score: payload.score,
              percentage: payload.percentage,
              gradedAt: payload.gradedAt,
            },
          },
        });
      }

      // Trigger student dashboard update
      this.emit(AnalyticsEvent.DASHBOARD_UPDATE_REQUIRED, {
        dashboardType: 'student',
        userId: payload.studentId,
        classId: payload.classId,
        subjectId: payload.subjectId,
        updateType: 'real-time',
        data: {
          newGrade: {
            activityId: payload.activityId,
            score: payload.score,
            percentage: payload.percentage,
            gradedAt: payload.gradedAt,
          },
        },
      });

    } catch (error) {
      console.error('Error triggering dashboard updates:', error);
    }
  }

  /**
   * Handle analytics recalculation events
   */
  private async handleAnalyticsRecalculated(payload: AnalyticsRecalculationPayload): Promise<void> {
    console.log('Analytics recalculated:', payload);
    
    // Notify subscribers
    const subscribers = this.subscribers.get(AnalyticsEvent.ANALYTICS_RECALCULATED);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in analytics recalculation subscriber:', error);
        }
      });
    }
  }

  /**
   * Handle dashboard update events
   */
  private async handleDashboardUpdate(payload: DashboardUpdatePayload): Promise<void> {
    console.log('Dashboard update required:', payload);
    
    // Here you would integrate with your real-time system (WebSocket, Server-Sent Events, etc.)
    // For now, we'll just log and notify subscribers
    
    const subscribers = this.subscribers.get(AnalyticsEvent.DASHBOARD_UPDATE_REQUIRED);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in dashboard update subscriber:', error);
        }
      });
    }
  }

  /**
   * Handle performance alert events
   */
  private async handlePerformanceAlert(payload: any): Promise<void> {
    console.log('Performance alert triggered:', payload);
    
    // Store the alert in the database
    try {
      await (this.prisma as any).performanceAlert?.create({
        data: {
          type: payload.type,
          studentId: payload.studentId,
          classId: payload.classId,
          subjectId: payload.subjectId,
          message: payload.message,
          confidence: payload.confidence,
          metadata: payload,
          isRead: false,
        },
      });
    } catch (error) {
      console.error('Error storing performance alert:', error);
    }

    // Notify subscribers
    const subscribers = this.subscribers.get(AnalyticsEvent.PERFORMANCE_ALERT_TRIGGERED);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in performance alert subscriber:', error);
        }
      });
    }
  }

  /**
   * Subscribe to specific events
   */
  subscribe(event: AnalyticsEvent, callback: (payload: any) => void): void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(event: AnalyticsEvent, callback: (payload: any) => void): void {
    const subscribers = this.subscribers.get(event);
    if (subscribers) {
      subscribers.delete(callback);
    }
  }

  /**
   * Get real-time analytics for a specific entity
   */
  async getRealTimeAnalytics(entityType: 'student' | 'class' | 'subject', entityId: string): Promise<any> {
    try {
      switch (entityType) {
        case 'student':
          return await this.getStudentRealTimeAnalytics(entityId);
        case 'class':
          return await this.getClassRealTimeAnalytics(entityId);
        case 'subject':
          return await this.getSubjectRealTimeAnalytics(entityId);
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }
    } catch (error) {
      console.error('Error getting real-time analytics:', error);
      throw error;
    }
  }

  /**
   * Get student real-time analytics
   */
  private async getStudentRealTimeAnalytics(studentId: string): Promise<any> {
    const [performanceMetrics, bloomsProgression, recentActivity] = await Promise.all([
      (this.prisma as any).studentPerformanceMetrics?.findMany({
        where: { studentId },
        include: { subject: true, class: true },
      }),
      (this.prisma as any).bloomsProgression?.findMany({
        where: { studentId },
        include: { subject: true },
      }),
      (this.prisma as any).performanceAnalytics?.findMany({
        where: { studentId },
        orderBy: { gradedAt: 'desc' },
        take: 10,
        include: { activity: true },
      }),
    ]);

    return {
      performanceMetrics,
      bloomsProgression,
      recentActivity,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get class real-time analytics
   */
  private async getClassRealTimeAnalytics(classId: string): Promise<any> {
    const [classMetrics, studentMetrics, recentActivity] = await Promise.all([
      // Use ClassPerformance instead of non-existent classActivityMetrics
      this.prisma.classPerformance.findUnique({
        where: { classId },
        include: { class: true },
      }).then(result => result ? [result] : []),
      (this.prisma as any).studentPerformanceMetrics?.findMany({
        where: { classId },
        include: { student: true, subject: true },
      }),
      (this.prisma as any).performanceAnalytics?.findMany({
        where: { classId },
        orderBy: { gradedAt: 'desc' },
        take: 20,
        include: { student: true, activity: true },
      }),
    ]);

    return {
      classMetrics,
      studentMetrics,
      recentActivity,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get subject real-time analytics
   */
  private async getSubjectRealTimeAnalytics(subjectId: string): Promise<any> {
    const [studentMetrics, bloomsProgression, recentActivity] = await Promise.all([
      (this.prisma as any).studentPerformanceMetrics?.findMany({
        where: { subjectId },
        include: { student: true, class: true },
      }),
      (this.prisma as any).bloomsProgression?.findMany({
        where: { subjectId },
        include: { student: true, class: true },
      }),
      (this.prisma as any).performanceAnalytics?.findMany({
        where: { subjectId },
        orderBy: { gradedAt: 'desc' },
        take: 50,
        include: { student: true, activity: true },
      }),
    ]);

    return {
      studentMetrics,
      bloomsProgression,
      recentActivity,
      lastUpdated: new Date(),
    };
  }
}
