/**
 * Class Teacher Router
 * Handles API routes for teacher-specific class operations
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";

export const classTeacherRouter = createTRPCRouter({
  getByTeacher: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      status: z.nativeEnum(SystemStatus).optional().default(SystemStatus.ACTIVE),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const { teacherId, status, limit, offset } = input;

        // Get total count for pagination
        const totalCount = await ctx.prisma.teacherAssignment.count({
          where: {
            teacherId,
            status
          }
        });

        // Find classes where the teacher is assigned with optimized selection
        const teacherAssignments = await ctx.prisma.teacherAssignment.findMany({
          where: {
            teacherId,
            status
          },
          take: limit,
          skip: offset,
          select: {
            id: true,
            class: {
              select: {
                id: true,
                name: true,
                code: true,
                status: true,
                minCapacity: true,
                maxCapacity: true,
                currentCount: true,
                term: {
                  select: {
                    id: true,
                    name: true,
                    startDate: true,
                    endDate: true
                  }
                },
                courseCampus: {
                  select: {
                    id: true,
                    course: {
                      select: {
                        id: true,
                        name: true,
                        code: true
                      }
                    }
                  }
                },
                programCampus: {
                  select: {
                    id: true,
                    program: {
                      select: {
                        id: true,
                        name: true,
                        code: true
                      }
                    }
                  }
                },
                campus: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                },
                facility: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                },
                _count: {
                  select: {
                    students: true,
                    activities: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Extract the classes from the assignments
        const classes = teacherAssignments.map(assignment => assignment.class);

        return {
          classes,
          totalCount,
          hasMore: offset + limit < totalCount,
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get teacher classes: ${(error as Error).message}`,
        });
      }
    }),
});
