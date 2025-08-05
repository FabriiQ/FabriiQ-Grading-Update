import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { TeacherMetricType } from "@/types/analytics";
import { ProcedureCacheHelpers } from "@/server/api/cache/advanced-procedure-cache";
import { cachedQueries } from "@/server/db";

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

        // Use cached query with timeout protection
        const cacheKey = `teacher-metrics:${teacherId || 'all'}:${courseId || 'all'}:${programId || 'all'}:${timeframe}:${metricType}`;

        return await cachedQueries.getCachedQuery(
          cacheKey,
          async () => {
            // Test database connection first with timeout
            const connectionTest = Promise.race([
              ctx.prisma.$queryRaw`SELECT 1`,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Database connection timeout')), 3000)
              )
            ]);

            await connectionTest;

            // If a specific teacher is requested
            if (teacherId) {
              console.log("Fetching specific teacher:", teacherId);

              // Use timeout protection for individual queries
              const teacherQuery = Promise.race([
                prisma.teacherProfile.findUnique({
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
                }),
                new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error('Teacher query timeout')), 5000)
                )
              ]);

              const teacher = await teacherQuery as Awaited<ReturnType<typeof prisma.teacherProfile.findUnique>> & {
                user: { name: string } | null;
                classesAsTeacher: Array<{
                  id: string;
                  name: string;
                  students: Array<{ id: string }>;
                  courseCampus: {
                    course: { id: string; name: string };
                  } | null;
                }>;
                performanceMetrics: Array<any>;
              };

              if (!teacher) {
                console.log("Teacher not found for ID:", teacherId);
                throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Teacher not found",
                });
              }

              console.log("Found teacher:", teacher.id, "with", teacher.classesAsTeacher?.length || 0, "classes");

              return {
                id: teacher.id,
                name: teacher.user?.name || "Unknown",
                avatar: null,
                metrics: teacher.performanceMetrics?.[0] || {
                  studentPerformance: 0,
                  attendanceRate: 0,
                  feedbackTime: 0,
                  activityCreation: 0,
                  activityEngagement: 0,
                  classPerformance: 0,
                  overallRating: 0,
                },
                classes: teacher.classesAsTeacher?.map(cls => ({
                  id: cls.id,
                  name: cls.name,
                  studentCount: cls.students?.length || 0,
                  courseName: cls.courseCampus?.course?.name || "Unknown Course",
                })) || [],
              };
            }

            // Optimized query: Get teachers with minimal data first with timeout protection
            const teachersQuery = Promise.race([
              prisma.teacherProfile.findMany({
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
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Teachers query timeout')), 5000)
              )
            ]);

            // Get performance metrics separately to avoid N+1 queries with timeout protection
            const teachers = await teachersQuery as Array<{
              id: string;
              user: { name: string | null } | null;
            }>;
            const metricsQuery = Promise.race([
              prisma.teacherPerformanceMetrics.findMany({
                where: {
                  timeframe: timeframe,
                  ...(courseId && { courseId }),
                  ...(programId && { programId }),
                  teacherId: {
                    in: teachers.map(t => t.id)
                  }
                },
                orderBy: { createdAt: 'desc' },
                distinct: ['teacherId'],
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Metrics query timeout')), 5000)
              )
            ]);

            // Get class data separately with timeout protection
            const classesQuery = Promise.race([
              prisma.class.findMany({
                where: {
                  classTeacherId: {
                    in: teachers.map(t => t.id)
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
              }),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Classes query timeout')), 5000)
              )
            ]);

            // Execute all queries in parallel
            const [metrics, classes] = await Promise.all([
              metricsQuery,
              classesQuery
            ]);

            // Create lookup maps for efficient data joining
            const metricsMap = new Map((metrics as any[]).map((m: any) => [m.teacherId, m]));
            const classesMap = new Map<string, any[]>();
            (classes as any[]).forEach((cls: any) => {
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
                name: teacher.user?.name || "Unknown",
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
                classes: teacherClasses.map((cls: any) => ({
                  id: cls.id,
                  name: cls.name,
                  studentCount: cls._count?.students || 0,
                  courseName: cls.courseCampus.course.name,
                })),
              };
            });
          },
          5 * 60 * 1000 // 5 minute cache
        );
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
