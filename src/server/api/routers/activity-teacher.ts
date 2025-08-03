/**
 * Activity Teacher Router
 * Handles API routes for teacher-specific activity operations
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";

export const activityTeacherRouter = createTRPCRouter({
  listByTeacher: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      status: z.nativeEnum(SystemStatus).optional().default(SystemStatus.ACTIVE),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      purpose: z.enum(['LEARNING', 'ASSESSMENT', 'PRACTICE']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { teacherId, status, limit, offset, purpose } = input;

        const where = {
          class: {
            teachers: {
              some: {
                teacherId
              }
            }
          },
          status,
          ...(purpose && { purpose }),
        };

        // Get total count for pagination
        const totalCount = await ctx.prisma.activity.count({ where });

        // Get activities with pagination and optimized selection
        const activities = await ctx.prisma.activity.findMany({
          where,
          take: limit,
          skip: offset,
          select: {
            id: true,
            title: true,
            purpose: true,
            learningType: true,
            bloomsLevel: true,
            isGradable: true,
            maxScore: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            status: true,
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            topic: {
              select: {
                id: true,
                title: true
              }
            },
            class: {
              select: {
                id: true,
                name: true
              }
            },
            _count: {
              select: {
                activityGrades: true,
                learningTimeRecords: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        return {
          activities,
          totalCount,
          hasMore: offset + limit < totalCount,
        };

        // Transform the results to maintain the same response structure
        const transformedActivities = activities.map(activity => {
          // Create a new object with the desired structure
          // Use type assertion to handle the included relations
          const activityWithRelations = activity as unknown as {
            subject?: { name: string | null } | null;
            topic?: { title: string | null } | null;
            [key: string]: any;
          };

          return {
            id: activity.id,
            title: activity.title,
            purpose: activity.purpose,
            status: activity.status,
            // Add other fields from activity as needed
            createdAt: activity.createdAt,
            updatedAt: activity.updatedAt,
            // Add subject and topic properties in the expected format
            subject: { name: activityWithRelations.subject?.name || null },
            topic: activityWithRelations.topic ? { title: activityWithRelations.topic.title } : null
          };
        });

        return transformedActivities;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get teacher activities: ${(error as Error).message}`,
        });
      }
    }),
});
