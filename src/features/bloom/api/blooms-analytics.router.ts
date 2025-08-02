/**
 * Bloom's Taxonomy Analytics Router
 * 
 * This router provides API endpoints for Bloom's Taxonomy analytics.
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { BloomsAnalyticsService } from '../services/analytics/blooms-analytics.service';
import { AssessmentAnalyticsService } from '../services/analytics/assessment-analytics.service';
import { BloomsReportingService } from '../services/analytics/blooms-reporting.service';
import { BloomsTaxonomyLevel } from '../types/bloom-taxonomy';

// Create enum schema for Bloom's Taxonomy levels
const BloomsTaxonomyLevelEnum = z.enum([
  BloomsTaxonomyLevel.REMEMBER,
  BloomsTaxonomyLevel.UNDERSTAND,
  BloomsTaxonomyLevel.APPLY,
  BloomsTaxonomyLevel.ANALYZE,
  BloomsTaxonomyLevel.EVALUATE,
  BloomsTaxonomyLevel.CREATE
]);

/**
 * Bloom's Taxonomy Analytics Router
 */
export const bloomsAnalyticsRouter = createTRPCRouter({
  /**
   * Get class performance by Bloom's Taxonomy levels
   */
  getClassPerformance: protectedProcedure
    .input(z.object({
      classId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      const { classId, startDate, endDate } = input;
      
      // Parse dates if provided
      const parsedStartDate = startDate ? new Date(startDate) : undefined;
      const parsedEndDate = endDate ? new Date(endDate) : undefined;
      
      const service = new BloomsAnalyticsService(ctx.prisma);
      return service.getClassPerformance(classId, parsedStartDate, parsedEndDate);
    }),

  /**
   * Get assessment performance by Bloom's Taxonomy levels
   */
  getAssessmentPerformance: protectedProcedure
    .input(z.object({
      assessmentId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { assessmentId } = input;
      
      const service = new AssessmentAnalyticsService(ctx.prisma);
      return service.getAssessmentPerformance(assessmentId);
    }),

  /**
   * Compare multiple assessments
   */
  compareAssessments: protectedProcedure
    .input(z.object({
      assessmentIds: z.array(z.string())
    }))
    .query(async ({ ctx, input }) => {
      const { assessmentIds } = input;
      
      const service = new AssessmentAnalyticsService(ctx.prisma);
      return service.compareAssessments(assessmentIds);
    }),

  /**
   * Generate a comprehensive analytics report for a class
   */
  generateClassReport: protectedProcedure
    .input(z.object({
      classId: z.string(),
      teacherId: z.string(),
      startDate: z.string(),
      endDate: z.string()
    }))
    .mutation(async ({ ctx, input }) => {
      const { classId, teacherId, startDate, endDate } = input;
      
      const service = new BloomsReportingService(ctx.prisma);
      const report = await service.generateClassReport(
        classId,
        teacherId,
        new Date(startDate),
        new Date(endDate)
      );
      
      return service.saveReport(report);
    }),

  /**
   * Get a report by ID
   */
  getReport: protectedProcedure
    .input(z.object({
      reportId: z.string()
    }))
    .query(async ({ ctx, input }) => {
      const { reportId } = input;
      
      const service = new BloomsReportingService(ctx.prisma);
      return service.getReport(reportId);
    }),

  /**
   * Get student performance by Bloom's Taxonomy levels
   */
  getStudentPerformance: protectedProcedure
    .input(z.object({
      studentId: z.string(),
      classId: z.string().optional(),
      subjectId: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { studentId, classId, subjectId, startDate, endDate } = input;

        // Validate Prisma context
        if (!ctx.prisma) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Database connection not available'
          });
        }

        // Parse dates if provided
        const parsedStartDate = startDate ? new Date(startDate) : undefined;
        const parsedEndDate = endDate ? new Date(endDate) : undefined;

        // Get student details first to ensure student exists
        const student = await ctx.prisma.studentProfile.findUnique({
          where: { id: studentId },
          select: {
            id: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });

        if (!student) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Student not found'
          });
        }

        // Get topic masteries for this student
        const topicMasteries = await ctx.prisma.topicMastery.findMany({
          where: {
            studentId,
            ...(subjectId && { subjectId }),
            ...(parsedStartDate && parsedEndDate && {
              updatedAt: {
                gte: parsedStartDate,
                lte: parsedEndDate
              }
            })
          },
          include: {
            topic: {
              select: {
                id: true,
                title: true,
                subjectId: true,
                subject: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        });

        // Calculate average mastery for each Bloom's level
        const totalTopics = topicMasteries.length;
        const performance = {
          studentId,
          studentName: student.user?.name || 'Unknown',
          [BloomsTaxonomyLevel.REMEMBER]: 0,
          [BloomsTaxonomyLevel.UNDERSTAND]: 0,
          [BloomsTaxonomyLevel.APPLY]: 0,
          [BloomsTaxonomyLevel.ANALYZE]: 0,
          [BloomsTaxonomyLevel.EVALUATE]: 0,
          [BloomsTaxonomyLevel.CREATE]: 0,
          overallMastery: 0
        };

        if (totalTopics > 0) {
          // Sum up mastery levels
          topicMasteries.forEach(mastery => {
            performance[BloomsTaxonomyLevel.REMEMBER] += mastery.rememberLevel || 0;
            performance[BloomsTaxonomyLevel.UNDERSTAND] += mastery.understandLevel || 0;
            performance[BloomsTaxonomyLevel.APPLY] += mastery.applyLevel || 0;
            performance[BloomsTaxonomyLevel.ANALYZE] += mastery.analyzeLevel || 0;
            performance[BloomsTaxonomyLevel.EVALUATE] += mastery.evaluateLevel || 0;
            performance[BloomsTaxonomyLevel.CREATE] += mastery.createLevel || 0;
            performance.overallMastery += mastery.overallMastery || 0;
          });

          // Calculate averages
          performance[BloomsTaxonomyLevel.REMEMBER] = Math.round(performance[BloomsTaxonomyLevel.REMEMBER] / totalTopics);
          performance[BloomsTaxonomyLevel.UNDERSTAND] = Math.round(performance[BloomsTaxonomyLevel.UNDERSTAND] / totalTopics);
          performance[BloomsTaxonomyLevel.APPLY] = Math.round(performance[BloomsTaxonomyLevel.APPLY] / totalTopics);
          performance[BloomsTaxonomyLevel.ANALYZE] = Math.round(performance[BloomsTaxonomyLevel.ANALYZE] / totalTopics);
          performance[BloomsTaxonomyLevel.EVALUATE] = Math.round(performance[BloomsTaxonomyLevel.EVALUATE] / totalTopics);
          performance[BloomsTaxonomyLevel.CREATE] = Math.round(performance[BloomsTaxonomyLevel.CREATE] / totalTopics);
          performance.overallMastery = Math.round(performance.overallMastery / totalTopics);
        }

        return performance;
      } catch (error) {
        console.error('Error in getStudentPerformance:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get student performance'
        });
      }
    })
});
