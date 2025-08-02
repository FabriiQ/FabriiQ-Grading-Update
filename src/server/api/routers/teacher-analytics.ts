import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { TeacherMetricType } from "@/types/analytics";
import { ProcedureCacheHelpers } from "@/server/api/cache/advanced-procedure-cache";

/**
 * Teacher Analytics Router
 * 
 * Provides endpoints for teacher performance analytics and comparisons
 */
export const teacherAnalyticsRouter = createTRPCRouter({
  /**
   * Get teacher performance metrics
   */
  getTeacherMetrics: protectedProcedure
    .input(
      z.object({
        teacherId: z.string().optional(),
        courseId: z.string().optional(),
        programId: z.string().optional(),
        timeframe: z.enum(["week", "month", "term", "year"]).default("term"),
        metricType: z.enum([
          "studentPerformance", 
          "attendanceRate", 
          "feedbackTime", 
          "classEngagement", 
          "contentQuality", 
          "overallRating"
        ]).default("overallRating"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { teacherId, courseId, programId, timeframe, metricType } = input;

      try {
        console.log("Getting teacher metrics for:", { teacherId, courseId, programId, timeframe, metricType });

        // Test database connection first
        await ctx.prisma.$queryRaw`SELECT 1`;

        // If a specific teacher is requested
        if (teacherId) {
          console.log("Fetching specific teacher:", teacherId);
          const teacher = await prisma.teacherProfile.findUnique({
            where: { id: teacherId },
            include: {
              user: {
                select: {
                  name: true,
                }
              },
              classesAsTeacher: {
                select: {
                  id: true,
                  name: true,
                  students: {
                    select: { id: true }
                  },
                  courseCampus: {
                    select: {
                      course: {
                        select: { id: true, name: true }
                      }
                    }
                  }
                }
              },
              performanceMetrics: {
                where: {
                  timeframe: timeframe,
                  ...(courseId && { courseId }),
                  ...(programId && { programId }),
                },
                orderBy: { createdAt: 'desc' },
                take: 1,
              }
            }
          });

          if (!teacher) {
            console.log("Teacher not found for ID:", teacherId);
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Teacher not found",
            });
          }

          console.log("Found teacher:", teacher.id, "with", teacher.classesAsTeacher.length, "classes");

          return {
            id: teacher.id,
            name: teacher.user.name || "Unknown",
            avatar: null,
            metrics: teacher.performanceMetrics[0] || {
              studentPerformance: 0,
              attendanceRate: 0,
              feedbackTime: 0,
              activityCreation: 0,
              activityEngagement: 0,
              classPerformance: 0,
              overallRating: 0,
            },
            classes: teacher.classesAsTeacher.map(cls => ({
              id: cls.id,
              name: cls.name,
              studentCount: cls.students.length,
              courseName: cls.courseCampus.course.name,
            })),
          };
        }

        // Optimized query: Get teachers with minimal data first
        const teachersQuery = prisma.teacherProfile.findMany({
          where: {
            ...(courseId && {
              classesAsTeacher: {
                some: {
                  courseCampus: {
                    courseId,
                  }
                }
              }
            }),
            ...(programId && {
              classesAsTeacher: {
                some: {
                  courseCampus: {
                    course: {
                      programId,
                    }
                  }
                }
              }
            }),
          },
          select: {
            id: true,
            user: {
              select: {
                name: true,
              }
            }
          }
        });

        // Get performance metrics separately to avoid N+1 queries
        const metricsQuery = prisma.teacherPerformanceMetrics.findMany({
          where: {
            timeframe: timeframe,
            ...(courseId && { courseId }),
            ...(programId && { programId }),
            teacherId: {
              in: (await teachersQuery).map(t => t.id)
            }
          },
          orderBy: { createdAt: 'desc' },
          distinct: ['teacherId'],
        });

        // Get class data separately
        const classesQuery = prisma.class.findMany({
          where: {
            classTeacherId: {
              in: (await teachersQuery).map(t => t.id)
            },
            ...(courseId && {
              courseCampus: {
                courseId,
              }
            }),
            ...(programId && {
              courseCampus: {
                course: {
                  programId,
                }
              }
            }),
          },
          select: {
            id: true,
            name: true,
            classTeacherId: true,
            _count: {
              select: {
                students: true
              }
            },
            courseCampus: {
              select: {
                course: {
                  select: { id: true, name: true }
                }
              }
            }
          }
        });

        // Execute all queries in parallel
        const [teachers, metrics, classes] = await Promise.all([
          teachersQuery,
          metricsQuery,
          classesQuery
        ]);

        // Create lookup maps for efficient data joining
        const metricsMap = new Map(metrics.map(m => [m.teacherId, m]));
        const classesMap = new Map<string, typeof classes>();
        classes.forEach(cls => {
          if (cls.classTeacherId) {
            if (!classesMap.has(cls.classTeacherId)) {
              classesMap.set(cls.classTeacherId, []);
            }
            classesMap.get(cls.classTeacherId)!.push(cls);
          }
        });

        // Process and return teacher metrics using optimized data
        return teachers.map(teacher => {
          const latestMetric = metricsMap.get(teacher.id);
          const teacherClasses = classesMap.get(teacher.id) || [];

          return {
            id: teacher.id,
            name: teacher.user.name || "Unknown",
            avatar: null,
            metrics: latestMetric || {
              studentPerformance: 0,
              attendanceRate: 0,
              feedbackTime: 0,
              activityCreation: 0,
              activityEngagement: 0,
              classPerformance: 0,
              overallRating: 0,
            },
            classes: teacherClasses.map(cls => ({
              id: cls.id,
              name: cls.name,
              studentCount: cls._count?.students || 0,
              courseName: cls.courseCampus.course.name,
            })),
          };
        });
      } catch (error) {
        console.error("Error fetching teacher metrics:", error);

        // Check if it's a missing table/model error
        if (error instanceof Error && (
          error.message.includes('relation') ||
          error.message.includes('table') ||
          error.message.includes('does not exist')
        )) {
          // Return empty metrics if models don't exist
          return [];
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch teacher metrics",
        });
      }
    }),

  /**
   * Get teacher performance trends
   */
  getTeacherTrends: protectedProcedure
    .input(
      z.object({
        teacherIds: z.array(z.string()),
        courseId: z.string().optional(),
        programId: z.string().optional(),
        timeframe: z.enum(["week", "month", "term", "year"]).default("term"),
        metricType: z.enum([
          "studentPerformance", 
          "attendanceRate", 
          "feedbackTime", 
          "classEngagement", 
          "contentQuality", 
          "overallRating"
        ]).default("studentPerformance"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { teacherIds, courseId, programId, timeframe, metricType } = input;

      try {
        // Optimized: Get all data in parallel instead of N+1 queries
        const [teachers, allMetrics] = await Promise.all([
          // Get teacher names
          prisma.teacherProfile.findMany({
            where: {
              id: {
                in: teacherIds
              }
            },
            select: {
              id: true,
              user: {
                select: {
                  name: true,
                }
              }
            }
          }),
          // Get all metrics for all teachers at once
          prisma.teacherPerformanceMetrics.findMany({
            where: {
              teacherId: {
                in: teacherIds
              },
              timeframe: timeframe,
              ...(courseId && { courseId }),
              ...(programId && { programId }),
            },
            orderBy: { date: 'asc' },
            select: {
              teacherId: true,
              date: true,
              [metricType]: true,
            }
          })
        ]);

        // Create lookup maps
        const teacherMap = new Map(teachers.map(t => [t.id, t]));
        const metricsMap = new Map<string, typeof allMetrics>();

        allMetrics.forEach(metric => {
          if (!metricsMap.has(metric.teacherId)) {
            metricsMap.set(metric.teacherId, []);
          }
          metricsMap.get(metric.teacherId)!.push(metric);
        });

        // Build trends data
        const teacherTrends = teacherIds.map(teacherId => {
          const teacher = teacherMap.get(teacherId);
          const metrics = metricsMap.get(teacherId) || [];

          return {
            teacherId,
            teacherName: teacher?.user?.name || "Unknown",
            trends: metrics.map(metric => ({
              date: metric.date,
              value: metric[metricType as keyof typeof metric] as number,
            })),
          };
        });

        return teacherTrends;
      } catch (error) {
        console.error("Error fetching teacher trends:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch teacher trends",
        });
      }
    }),

  /**
   * Get available courses for teacher analytics
   */
  getAvailableCourses: protectedProcedure
    .input(
      z.object({
        programId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { prisma } = ctx;
      const { programId } = input;

      try {
        const courses = await prisma.course.findMany({
          where: {
            ...(programId && { programId }),
            status: "ACTIVE",
          },
          select: {
            id: true,
            name: true,
            code: true,
          },
          orderBy: {
            name: 'asc',
          },
        });

        return courses;
      } catch (error) {
        console.error("Error fetching available courses:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch available courses",
        });
      }
    }),
});
