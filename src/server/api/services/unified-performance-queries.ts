/**
 * Unified Performance Query Service
 * 
 * This service provides efficient, optimized database queries for performance data
 * using the unified data models. All queries are optimized for performance with
 * proper indexing, caching, and batch operations.
 * 
 * Key Features:
 * - Efficient database queries with proper indexing
 * - Query result caching for improved performance
 * - Batch operations for bulk data processing
 * - Standardized query patterns across all endpoints
 * - Real-time analytics support
 * - Comprehensive error handling and logging
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { 
  PerformanceQueryParams, 
  PerformanceQueryResponse,
  UnifiedPerformanceRecord,
  StudentSubjectPerformance,
  ClassActivityPerformance,
  BasePerformanceMetrics
} from '../models/unified-performance-models';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

/**
 * Cache configuration for query results
 * Improves performance by caching frequently accessed data
 */
interface QueryCache {
  key: string;
  data: any;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
}

export class UnifiedPerformanceQueryService {
  private prisma: PrismaClient;
  private cache: Map<string, QueryCache> = new Map();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 1000;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    
    // Clean cache periodically
    setInterval(() => this.cleanCache(), 60 * 1000); // Every minute
  }

  /**
   * Get unified performance records with efficient querying
   * Uses optimized database queries with proper indexing
   */
  async getPerformanceRecords(
    params: PerformanceQueryParams
  ): Promise<PerformanceQueryResponse<UnifiedPerformanceRecord>> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey('performance_records', params);
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return {
        ...cached,
        metadata: {
          ...cached.metadata,
          cacheHit: true,
          queryTime: Date.now() - startTime,
        }
      };
    }

    try {
      // Build optimized where clause
      const where = this.buildWhereClause(params);
      
      // Build include clause for related data
      const include = this.buildIncludeClause(params.include);
      
      // Execute optimized queries in parallel
      const [records, totalCount] = await Promise.all([
        this.prisma.performanceAnalytics.findMany({
          where,
          include,
          orderBy: params.sort ? {
            [params.sort.field]: params.sort.direction
          } : { gradedAt: 'desc' },
          skip: params.pagination ? (params.pagination.page - 1) * params.pagination.limit : 0,
          take: params.pagination?.limit || 50,
        }),
        this.prisma.performanceAnalytics.count({ where })
      ]);

      // Transform database records to unified format
      const unifiedRecords = records.map(record => this.transformToUnifiedRecord(record));
      
      // Calculate insights
      const insights = this.calculateInsights(unifiedRecords);
      
      // Build response
      const response: PerformanceQueryResponse<UnifiedPerformanceRecord> = {
        data: unifiedRecords,
        pagination: {
          page: params.pagination?.page || 1,
          limit: params.pagination?.limit || 50,
          total: totalCount,
          totalPages: Math.ceil(totalCount / (params.pagination?.limit || 50)),
          hasNext: (params.pagination?.page || 1) * (params.pagination?.limit || 50) < totalCount,
          hasPrev: (params.pagination?.page || 1) > 1,
        },
        metadata: {
          queryTime: Date.now() - startTime,
          cacheHit: false,
          filters: params,
        },
        insights,
      };

      // Cache the result
      this.setCache(cacheKey, response);
      
      return response;

    } catch (error) {
      console.error('Error in getPerformanceRecords:', error);
      throw new Error(`Failed to fetch performance records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get student performance summary across all subjects
   * Optimized for dashboard displays and student profiles
   */
  async getStudentPerformanceSummary(
    studentId: string,
    subjectId?: string
  ): Promise<StudentSubjectPerformance[]> {
    const cacheKey = this.generateCacheKey('student_summary', { studentId, subjectId });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Use efficient aggregation query
      const whereClause: Prisma.StudentPerformanceMetricsWhereInput = {
        studentId,
        ...(subjectId && { subjectId }),
      };

      const [performanceMetrics, bloomsProgression, recentActivity] = await Promise.all([
        this.prisma.studentPerformanceMetrics.findMany({
          where: whereClause,
          include: {
            subject: { select: { id: true, name: true, code: true } },
            class: { select: { id: true, name: true, code: true } },
          },
        }),
        this.prisma.bloomsProgression.findMany({
          where: { studentId, ...(subjectId && { subjectId }) },
          include: {
            subject: { select: { id: true, name: true } },
          },
        }),
        this.prisma.performanceAnalytics.findMany({
          where: { studentId, ...(subjectId && { subjectId }) },
          orderBy: { gradedAt: 'desc' },
          take: 5,
          include: {
            activity: { select: { id: true, title: true, type: true } },
          },
        }),
      ]);

      // Transform to unified format
      const summaries = performanceMetrics.map(metrics => {
        const bloomsData = bloomsProgression.find(bp => bp.subjectId === metrics.subjectId);
        const recentActivities = recentActivity.filter(ra => ra.subjectId === metrics.subjectId);
        
        return this.transformToStudentSummary(metrics, bloomsData, recentActivities);
      });

      this.setCache(cacheKey, summaries);
      return summaries;

    } catch (error) {
      console.error('Error in getStudentPerformanceSummary:', error);
      throw new Error(`Failed to fetch student performance summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get class activity performance with efficient aggregation
   * Optimized for teacher dashboards and class analytics
   */
  async getClassActivityPerformance(
    classId: string,
    activityId?: string
  ): Promise<ClassActivityPerformance[]> {
    const cacheKey = this.generateCacheKey('class_activity', { classId, activityId });
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const whereClause: Prisma.ClassActivityMetricsWhereInput = {
        classId,
        ...(activityId && { activityId }),
      };

      // Use efficient aggregation with raw SQL for complex calculations
      const [classMetrics, detailedPerformance] = await Promise.all([
        this.prisma.classActivityMetrics.findMany({
          where: whereClause,
          include: {
            activity: {
              select: {
                id: true,
                title: true,
                type: true,
                maxScore: true,
                bloomsLevel: true,
              },
            },
          },
        }),
        this.prisma.$queryRaw<any[]>`
          SELECT 
            pa.activityId,
            COUNT(*) as totalSubmissions,
            AVG(pa.percentage) as averagePercentage,
            AVG(pa.timeSpent) as averageTimeSpent,
            COUNT(CASE WHEN pa.percentage >= 60 THEN 1 END) as passCount,
            COUNT(CASE WHEN pa.percentage >= 90 THEN 1 END) as excellentCount,
            COUNT(CASE WHEN pa.percentage >= 80 AND pa.percentage < 90 THEN 1 END) as goodCount,
            COUNT(CASE WHEN pa.percentage >= 70 AND pa.percentage < 80 THEN 1 END) as satisfactoryCount,
            COUNT(CASE WHEN pa.percentage >= 60 AND pa.percentage < 70 THEN 1 END) as needsWorkCount,
            COUNT(CASE WHEN pa.percentage < 60 THEN 1 END) as failingCount,
            pa.bloomsLevel,
            pa.demonstratedLevel
          FROM performance_analytics pa
          WHERE pa.classId = ${classId}
            ${activityId ? Prisma.sql`AND pa.activityId = ${activityId}` : Prisma.empty}
          GROUP BY pa.activityId, pa.bloomsLevel, pa.demonstratedLevel
        `,
      ]);

      // Transform to unified format
      const performances = classMetrics.map(metrics => {
        const detailed = detailedPerformance.find(dp => dp.activityId === metrics.activityId);
        return this.transformToClassPerformance(metrics, detailed);
      });

      this.setCache(cacheKey, performances);
      return performances;

    } catch (error) {
      console.error('Error in getClassActivityPerformance:', error);
      throw new Error(`Failed to fetch class activity performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get real-time performance analytics for dashboards
   * Optimized for frequent updates and real-time displays
   */
  async getRealTimeAnalytics(
    entityType: 'student' | 'class' | 'subject',
    entityId: string,
    timeWindow: number = 7 // days
  ): Promise<any> {
    const cacheKey = this.generateCacheKey('realtime', { entityType, entityId, timeWindow });
    const cached = this.getFromCache(cacheKey, 30 * 1000); // 30 second cache for real-time
    if (cached) return cached;

    try {
      const cutoffDate = new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000);
      
      let whereClause: Prisma.PerformanceAnalyticsWhereInput;
      switch (entityType) {
        case 'student':
          whereClause = { studentId: entityId, gradedAt: { gte: cutoffDate } };
          break;
        case 'class':
          whereClause = { classId: entityId, gradedAt: { gte: cutoffDate } };
          break;
        case 'subject':
          whereClause = { subjectId: entityId, gradedAt: { gte: cutoffDate } };
          break;
        default:
          throw new Error(`Invalid entity type: ${entityType}`);
      }

      // Execute optimized parallel queries
      const [recentPerformance, aggregateStats, bloomsDistribution, alerts] = await Promise.all([
        this.prisma.performanceAnalytics.findMany({
          where: whereClause,
          orderBy: { gradedAt: 'desc' },
          take: 20,
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            activity: { select: { id: true, title: true, type: true } },
          },
        }),
        this.prisma.performanceAnalytics.aggregate({
          where: whereClause,
          _avg: { percentage: true, engagementScore: true, timeSpent: true },
          _count: { id: true },
        }),
        this.prisma.$queryRaw<any[]>`
          SELECT 
            demonstratedLevel,
            COUNT(*) as count
          FROM performance_analytics
          WHERE ${this.buildRawWhereClause(whereClause)}
            AND demonstratedLevel IS NOT NULL
          GROUP BY demonstratedLevel
        `,
        this.prisma.performanceAlert.findMany({
          where: {
            ...(entityType === 'student' && { studentId: entityId }),
            ...(entityType === 'class' && { classId: entityId }),
            ...(entityType === 'subject' && { subjectId: entityId }),
            createdAt: { gte: cutoffDate },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            student: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
      ]);

      // Build real-time analytics response
      const analytics = {
        totalStudents: entityType === 'student' ? 1 : await this.getUniqueStudentCount(whereClause),
        averageScore: aggregateStats._avg.percentage || 0,
        completionRate: this.calculateCompletionRate(recentPerformance),
        engagementScore: aggregateStats._avg.engagementScore || 0,
        recentActivity: recentPerformance.map(this.transformRecentActivity),
        performanceAlerts: alerts.map(this.transformAlert),
        bloomsDistribution: this.transformBloomsDistribution(bloomsDistribution),
        lastUpdated: new Date(),
        metadata: {
          timeWindow,
          totalRecords: aggregateStats._count.id,
          queryTime: Date.now(),
        },
      };

      this.setCache(cacheKey, analytics, 30 * 1000); // 30 second cache
      return analytics;

    } catch (error) {
      console.error('Error in getRealTimeAnalytics:', error);
      throw new Error(`Failed to fetch real-time analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch update performance records for efficiency
   * Used for bulk operations and data migrations
   */
  async batchUpdatePerformanceRecords(
    updates: Array<{
      id: string;
      data: Partial<UnifiedPerformanceRecord>;
    }>
  ): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    try {
      // Process in batches of 100 for optimal performance
      const batchSize = 100;
      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (update) => {
          try {
            await this.prisma.performanceAnalytics.update({
              where: { id: update.id },
              data: {
                score: update.data.score,
                maxScore: update.data.maxScore,
                percentage: update.data.percentage,
                timeSpent: update.data.timeSpent,
                attemptCount: update.data.attemptCount,
                engagementScore: update.data.engagementScore,
                bloomsLevel: update.data.bloomsData?.bloomsLevel,
                demonstratedLevel: update.data.bloomsData?.demonstratedLevel,
                bloomsLevelScores: update.data.bloomsData?.bloomsLevelScores as any,
                updatedAt: new Date(),
              },
            });
            updated++;
          } catch (error) {
            errors.push(`Failed to update record ${update.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        await Promise.all(batchPromises);
      }

      // Clear related caches
      this.clearCacheByPattern('performance_');
      
      return { updated, errors };

    } catch (error) {
      console.error('Error in batchUpdatePerformanceRecords:', error);
      throw new Error(`Batch update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Build optimized WHERE clause for database queries
   */
  private buildWhereClause(params: PerformanceQueryParams): Prisma.PerformanceAnalyticsWhereInput {
    const where: Prisma.PerformanceAnalyticsWhereInput = {};

    if (params.studentIds?.length) {
      where.studentId = { in: params.studentIds };
    }

    if (params.activityIds?.length) {
      where.activityId = { in: params.activityIds };
    }

    if (params.classIds?.length) {
      where.classId = { in: params.classIds };
    }

    if (params.subjectIds?.length) {
      where.subjectId = { in: params.subjectIds };
    }

    if (params.topicIds?.length) {
      where.topicId = { in: params.topicIds };
    }

    if (params.activityTypes?.length) {
      where.activityType = { in: params.activityTypes };
    }

    if (params.gradingTypes?.length) {
      where.gradingType = { in: params.gradingTypes };
    }

    if (params.bloomsLevels?.length) {
      where.bloomsLevel = { in: params.bloomsLevels };
    }

    if (params.dateRange) {
      where.gradedAt = {
        gte: params.dateRange.from,
        lte: params.dateRange.to,
      };
    }

    if (params.scoreRange) {
      where.percentage = {
        gte: params.scoreRange.min,
        lte: params.scoreRange.max,
      };
    }

    return where;
  }

  /**
   * Build include clause for related data
   */
  private buildIncludeClause(include?: PerformanceQueryParams['include']): Prisma.PerformanceAnalyticsInclude | undefined {
    if (!include) return undefined;

    const includeClause: Prisma.PerformanceAnalyticsInclude = {};

    if (include.student) {
      includeClause.student = {
        select: { id: true, firstName: true, lastName: true, email: true },
      };
    }

    if (include.activity) {
      includeClause.activity = {
        select: { id: true, title: true, type: true, maxScore: true, bloomsLevel: true },
      };
    }

    if (include.class) {
      includeClause.class = {
        select: { id: true, name: true, code: true },
      };
    }

    if (include.subject) {
      includeClause.subject = {
        select: { id: true, name: true, code: true },
      };
    }

    if (include.topic) {
      includeClause.topic = {
        select: { id: true, title: true, code: true },
      };
    }

    return Object.keys(includeClause).length > 0 ? includeClause : undefined;
  }

  /**
   * Transform database record to unified performance record
   */
  private transformToUnifiedRecord(record: any): UnifiedPerformanceRecord {
    return {
      id: record.id,
      studentId: record.studentId,
      activityId: record.activityId,
      classId: record.classId,
      subjectId: record.subjectId,
      topicId: record.topicId,
      score: record.score,
      maxScore: record.maxScore,
      percentage: record.percentage,
      timeSpent: record.timeSpent,
      attemptCount: record.attemptCount,
      engagementScore: record.engagementScore,
      gradingType: record.gradingType as 'AUTO' | 'MANUAL' | 'AI' | 'HYBRID',
      activityType: record.activityType,
      submittedAt: record.submittedAt,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      gradedAt: record.gradedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      bloomsData: {
        bloomsLevel: record.bloomsLevel as BloomsTaxonomyLevel,
        demonstratedLevel: record.demonstratedLevel as BloomsTaxonomyLevel,
        bloomsLevelScores: record.bloomsLevelScores as Record<BloomsTaxonomyLevel, number>,
        levelMastered: record.percentage >= 80 && record.demonstratedLevel === record.bloomsLevel,
        levelProgression: this.calculateLevelProgression(record.bloomsLevel, record.demonstratedLevel),
      },
      metadata: record.metadata || {},
      flags: {
        isExceptional: record.percentage > 95,
        isStruggling: record.percentage < 60,
        isImproving: false, // Would need historical data to calculate
        needsAttention: record.percentage < 60 || record.engagementScore < 40,
        isFirstAttempt: record.attemptCount === 1,
        isRetake: record.attemptCount > 1,
      },
    };
  }

  /**
   * Calculate insights from performance records
   */
  private calculateInsights(records: UnifiedPerformanceRecord[]) {
    if (records.length === 0) return undefined;

    const averageScore = records.reduce((sum, r) => sum + r.percentage, 0) / records.length;
    const completionRate = (records.filter(r => r.percentage >= 60).length / records.length) * 100;
    
    const bloomsDistribution: Record<BloomsTaxonomyLevel, number> = {} as any;
    Object.values(BloomsTaxonomyLevel).forEach(level => {
      bloomsDistribution[level] = records.filter(r => r.bloomsData.demonstratedLevel === level).length;
    });

    return {
      averageScore,
      completionRate,
      bloomsDistribution,
      trends: {
        scoresTrend: 'stable' as const, // Would need time-series analysis
        engagementTrend: 'stable' as const,
      },
    };
  }

  /**
   * Generate cache key for query results
   */
  private generateCacheKey(prefix: string, params: any): string {
    return `${prefix}_${JSON.stringify(params)}`;
  }

  /**
   * Get data from cache if not expired
   */
  private getFromCache(key: string, customTtl?: number): any {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const ttl = customTtl || this.DEFAULT_CACHE_TTL;
    if (Date.now() - cached.timestamp.getTime() > ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any, customTtl?: number): void {
    // Prevent cache from growing too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      key,
      data,
      timestamp: new Date(),
      ttl: customTtl || this.DEFAULT_CACHE_TTL,
    });
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp.getTime() > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear cache entries matching pattern
   */
  private clearCacheByPattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Helper methods for data transformation
   */
  private transformToStudentSummary(metrics: any, bloomsData: any, recentActivities: any[]): StudentSubjectPerformance {
    // Implementation would transform database records to StudentSubjectPerformance
    // This is a placeholder for the actual transformation logic
    return {} as StudentSubjectPerformance;
  }

  private transformToClassPerformance(metrics: any, detailed: any): ClassActivityPerformance {
    // Implementation would transform database records to ClassActivityPerformance
    // This is a placeholder for the actual transformation logic
    return {} as ClassActivityPerformance;
  }

  private transformRecentActivity(record: any) {
    return {
      id: record.id,
      studentName: `${record.student.firstName} ${record.student.lastName}`,
      activityTitle: record.activity.title,
      score: record.score,
      percentage: record.percentage,
      gradedAt: record.gradedAt,
      gradingType: record.gradingType,
    };
  }

  private transformAlert(alert: any) {
    return {
      id: alert.id,
      type: alert.type,
      studentName: `${alert.student.firstName} ${alert.student.lastName}`,
      message: alert.message,
      confidence: alert.confidence,
      createdAt: alert.createdAt,
      isRead: alert.isRead,
    };
  }

  private transformBloomsDistribution(distribution: any[]): Record<string, number> {
    const result: Record<string, number> = {};
    distribution.forEach(item => {
      result[item.demonstratedLevel] = parseInt(item.count);
    });
    return result;
  }

  private calculateCompletionRate(records: any[]): number {
    if (records.length === 0) return 0;
    const completed = records.filter(r => r.percentage >= 60).length;
    return (completed / records.length) * 100;
  }

  private async getUniqueStudentCount(whereClause: Prisma.PerformanceAnalyticsWhereInput): Promise<number> {
    const result = await this.prisma.performanceAnalytics.findMany({
      where: whereClause,
      select: { studentId: true },
      distinct: ['studentId'],
    });
    return result.length;
  }

  private calculateLevelProgression(target?: BloomsTaxonomyLevel, demonstrated?: BloomsTaxonomyLevel): number {
    if (!target || !demonstrated) return 0;
    
    const levels = Object.values(BloomsTaxonomyLevel);
    const targetIndex = levels.indexOf(target);
    const demonstratedIndex = levels.indexOf(demonstrated);
    
    return demonstratedIndex - targetIndex;
  }

  private buildRawWhereClause(whereClause: Prisma.PerformanceAnalyticsWhereInput): Prisma.Sql {
    // This would build raw SQL WHERE clause for complex queries
    // Implementation depends on the specific where clause structure
    return Prisma.sql`1=1`; // Placeholder
  }
}
