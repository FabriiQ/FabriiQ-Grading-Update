import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { LeaderboardEntityType, TimeGranularity, StandardLeaderboardEntry } from "@/features/leaderboard/types/standard-leaderboard";
import { UnifiedLeaderboardService } from "@/features/leaderboard/services/unified-leaderboard.service";
import { UnifiedPerformanceQueryService } from "../services/unified-performance-queries";
import {
  PerformanceQueryParams
} from "../models/unified-performance-models";
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';

// Define analytics event schema
const trackEventSchema = z.object({
  eventType: z.string(),
  category: z.string(),
  userId: z.string(),
  metadata: z.record(z.any()).optional(),
});

// Define UserType and SystemStatus enums since they're not exported from @prisma/client
enum UserType {
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  SYSTEM_MANAGER = "SYSTEM_MANAGER",
  ADMINISTRATOR = "ADMINISTRATOR",
  CAMPUS_ADMIN = "CAMPUS_ADMIN",
  CAMPUS_COORDINATOR = "CAMPUS_COORDINATOR",
  COORDINATOR = "COORDINATOR",
  TEACHER = "TEACHER",
  CAMPUS_TEACHER = "CAMPUS_TEACHER",
  STUDENT = "STUDENT",
  CAMPUS_STUDENT = "CAMPUS_STUDENT",
  CAMPUS_PARENT = "CAMPUS_PARENT"
}

enum SystemStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DELETED = "DELETED",
  PENDING = "PENDING"
}

// Helper function to get previous time period
function getPreviousPeriod(currentPeriod: TimeGranularity): TimeGranularity {
  switch (currentPeriod) {
    case TimeGranularity.DAILY:
      return TimeGranularity.DAILY; // Still daily, but would be previous day in implementation
    case TimeGranularity.WEEKLY:
      return TimeGranularity.WEEKLY; // Previous week
    case TimeGranularity.MONTHLY:
      return TimeGranularity.MONTHLY; // Previous month
    case TimeGranularity.TERM:
      return TimeGranularity.MONTHLY; // Fall back to monthly if we're in term view
    case TimeGranularity.ALL_TIME:
      return TimeGranularity.TERM; // Fall back to term if we're in all-time view
    default:
      return TimeGranularity.MONTHLY;
  }
}

// Input validation schemas
const dateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

const userAnalyticsSchema = z.object({
  userId: z.string().optional(),
  ...dateRangeSchema.shape,
});

const courseAnalyticsSchema = z.object({
  courseId: z.string(),
  ...dateRangeSchema.shape,
});

const classAnalyticsSchema = z.object({
  classId: z.string(),
  ...dateRangeSchema.shape,
});

const institutionAnalyticsSchema = z.object({
  institutionId: z.string().optional(),
  ...dateRangeSchema.shape,
});

/**
 * Analytics Router
 * Provides endpoints for retrieving analytics data across the platform
 */
export const analyticsRouter = createTRPCRouter({
  // Track an analytics event
  trackEvent: protectedProcedure
    .input(trackEventSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        // Get user's institution ID from database
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          select: { institutionId: true, primaryCampusId: true }
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // Create analytics event
        const event = await ctx.prisma.analyticsEvent.create({
          data: {
            event: input.eventType,
            userId: input.userId,
            institutionId: user.institutionId,
            campusId: user.primaryCampusId,
            data: {
              category: input.category,
              metadata: input.metadata || {},
            },
            timestamp: new Date(),
          }
        });

        // Update analytics metrics if needed
        if (input.category === 'teacher_assistant') {
          // Create a simple metric entry
          await ctx.prisma.analyticsMetric.create({
            data: {
              name: `${input.category}_${input.eventType}`,
              value: 1,
              institutionId: user.institutionId,
              campusId: user.primaryCampusId,
              userId: input.userId,
              dimensions: {
                category: input.category,
                eventType: input.eventType
              },
              tags: input.metadata || {},
              timestamp: new Date(),
            }
          });
        }

        return { success: true };
      } catch (error) {
        console.error('Error in trackEvent:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to track event: ${(error as Error).message}`,
        });
      }
    }),

  // Get teacher assistant analytics
  getTeacherAssistantAnalytics: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated
        if (!ctx.session?.user?.id) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authenticated",
          });
        }

        // Parse date range
        const startDate = input.startDate ? new Date(input.startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default to last 30 days
        const endDate = input.endDate ? new Date(input.endDate) : new Date();

        // Get analytics events for this teacher
        const events = await ctx.prisma.analyticsEvent.findMany({
          where: {
            userId: input.teacherId,
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          },
          orderBy: {
            timestamp: 'asc'
          }
        });

        // Get metrics for this teacher
        const metrics = await ctx.prisma.analyticsMetric.findMany({
          where: {
            userId: input.teacherId,
            name: {
              contains: 'teacher_assistant'
            }
          }
        });

        // Calculate daily usage
        const dailyUsage = new Map<string, number>();
        events.forEach(event => {
          const day = event.timestamp.toISOString().split('T')[0];
          dailyUsage.set(day, (dailyUsage.get(day) || 0) + 1);
        });

        // Calculate feature usage
        const featureUsage = {
          messages: events.filter(e => e.event === 'message_sent').length,
          searches: events.filter(e => e.event === 'search_performed').length,
          feedback: events.filter(e => e.event === 'feedback_given').length,
          voiceInput: events.filter(e => e.event === 'voice_input_used').length,
          voiceOutput: events.filter(e => e.event === 'voice_output_used').length
        };

        // Calculate most common intents
        const intentCounts = new Map<string, number>();
        events.forEach(event => {
          if (event.event === 'message_sent' && event.data && typeof event.data === 'object') {
            const data = event.data as any;
            if (data.metadata?.intent) {
              const intent = data.metadata.intent as string;
              intentCounts.set(intent, (intentCounts.get(intent) || 0) + 1);
            }
          }
        });

        const topIntents = Array.from(intentCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([intent, count]) => ({ intent, count }));

        return {
          totalEvents: events.length,
          metrics,
          dailyUsage: Array.from(dailyUsage.entries()).map(([date, count]) => ({ date, count })),
          featureUsage,
          topIntents
        };
      } catch (error) {
        console.error('Error in getTeacherAssistantAnalytics:', error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get teacher assistant analytics: ${(error as Error).message}`,
        });
      }
    }),

  // Get time tracking analytics
  getTimeTrackingAnalytics: protectedProcedure
    .input(z.object({
      classId: z.string(),
      activityIds: z.array(z.string()).optional(),
      timeframe: z.enum(['week', 'month', 'term', 'all']).default('month'),
      groupBy: z.enum(['hour', 'day', 'week', 'activity']).default('day')
    }))
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          "SYSTEM_ADMIN",
          "SYSTEM_MANAGER",
          "ADMINISTRATOR",
          "CAMPUS_ADMIN",
          "CAMPUS_COORDINATOR",
          "COORDINATOR",
          "TEACHER",
          "CAMPUS_TEACHER",
        ].includes(ctx.session.user.userType as string)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get time range based on timeframe
        const now = new Date();
        let startDate = new Date();
        const endDate = new Date(); // Add endDate declaration

        switch (input.timeframe) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'term':
            startDate.setMonth(now.getMonth() - 4); // Assuming a term is ~4 months
            break;
          case 'all':
            startDate = new Date(0); // Beginning of time
            break;
        }

        // Query real learning time data from the database
        const learningTimeRecords = await ctx.prisma.learningTimeRecord.findMany({
          where: {
            classId: input.classId,
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            activity: {
              include: {
                activityGrades: {
                  select: {
                    score: true,
                    studentId: true
                  }
                }
              }
            },
            student: {
              include: {
                user: true,
              },
            },
          },
        });

        // Calculate time distribution by day and time slot
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const timeSlots = ['6am', '10am', '2pm', '6pm', '10pm', '2am'];

        const timeDistribution = days.flatMap(day =>
          timeSlots.map(time => {
            const dayIndex = days.indexOf(day);
            const timeSlotHour = time === '6am' ? 6 : time === '10am' ? 10 : time === '2pm' ? 14 : time === '6pm' ? 18 : time === '10pm' ? 22 : 2;

            // Filter records for this day and time slot (±2 hours)
            const relevantRecords = learningTimeRecords.filter(record => {
              const recordDate = new Date(record.createdAt);
              const recordDay = recordDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
              const recordHour = recordDate.getHours();

              // Convert Sunday (0) to index 6, Monday (1) to index 0, etc.
              const adjustedDay = recordDay === 0 ? 6 : recordDay - 1;

              return adjustedDay === dayIndex &&
                     recordHour >= timeSlotHour - 2 &&
                     recordHour <= timeSlotHour + 2;
            });

            const totalMinutes = relevantRecords.reduce((sum, record) => sum + (record.timeSpentMinutes || 0), 0);

            return {
              day,
              time,
              value: totalMinutes
            };
          })
        );

        // Calculate time efficiency based on actual performance vs time spent
        const timeEfficiency = learningTimeRecords
          .filter(record => record.timeSpentMinutes && record.activity)
          .map(record => {
            // Calculate average score for this activity
            const grades = record.activity?.activityGrades || [];
            const validGrades = grades.filter(g => g.score !== null);
            const avgScore = validGrades.length > 0
              ? validGrades.reduce((sum, g) => sum + (g.score || 0), 0) / validGrades.length
              : 0;

            return {
              timeSpent: (record.timeSpentMinutes || 0) * 60, // Convert to seconds
              score: avgScore
            };
          })
          .slice(0, 30); // Limit to 30 most recent records

        // Calculate focus duration based on session lengths and performance
        const sessionGroups = new Map();
        learningTimeRecords.forEach(record => {
          const sessionLength = Math.floor((record.timeSpentMinutes || 0) / 10) * 10; // Group by 10-minute intervals
          if (!sessionGroups.has(sessionLength)) {
            sessionGroups.set(sessionLength, { totalScore: 0, count: 0 });
          }
          const group = sessionGroups.get(sessionLength);

          // Calculate average score for this activity
          const grades = record.activity?.activityGrades || [];
          const validGrades = grades.filter(g => g.score !== null);
          const avgScore = validGrades.length > 0
            ? validGrades.reduce((sum, g) => sum + (g.score || 0), 0) / validGrades.length
            : 0;

          group.totalScore += avgScore;
          group.count += 1;
        });

        const focusDuration = Array.from(sessionGroups.entries())
          .map(([duration, data]) => ({
            duration,
            focusScore: data.count > 0 ? data.totalScore / data.count : 0
          }))
          .sort((a, b) => a.duration - b.duration)
          .slice(0, 10);

        // Calculate real metrics from the data
        const totalActivities = learningTimeRecords.length;
        const totalTimeSpent = learningTimeRecords.reduce((sum, record) => sum + (record.timeSpentMinutes || 0), 0) * 60; // Convert to seconds
        const averageTimePerActivity = totalActivities > 0 ? Math.round(totalTimeSpent / totalActivities) : 0;

        // Find peak activity time (time slot with most activity)
        const timeSlotActivity = timeDistribution.reduce((max, current) =>
          current.value > max.value ? current : max, timeDistribution[0] || { time: '2pm', value: 0 });
        const peakActivityTime = timeSlotActivity.time;

        // Find peak productivity time (time slot with highest average score)
        const timeSlotProductivity = timeSlots.map(time => {
          const timeSlotHour = time === '6am' ? 6 : time === '10am' ? 10 : time === '2pm' ? 14 : time === '6pm' ? 18 : time === '10pm' ? 22 : 2;
          const relevantRecords = learningTimeRecords.filter(record => {
            const recordHour = new Date(record.createdAt).getHours();
            return recordHour >= timeSlotHour - 2 && recordHour <= timeSlotHour + 2;
          });

          let totalScore = 0;
          let recordCount = 0;

          relevantRecords.forEach(record => {
            const grades = record.activity?.activityGrades || [];
            const validGrades = grades.filter(g => g.score !== null);
            if (validGrades.length > 0) {
              const avgScore = validGrades.reduce((sum, g) => sum + (g.score || 0), 0) / validGrades.length;
              totalScore += avgScore;
              recordCount++;
            }
          });

          const avgScore = recordCount > 0 ? totalScore / recordCount : 0;
          return { time, avgScore };
        }).reduce((max, current) => current.avgScore > max.avgScore ? current : max, { time: '10am', avgScore: 0 });

        const peakProductivityTime = timeSlotProductivity.time;

        return {
          timeDistribution,
          timeEfficiency,
          focusDuration,
          totalActivities,
          totalTimeSpent,
          averageTimePerActivity,
          peakActivityTime,
          peakProductivityTime
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve time tracking analytics",
          cause: error,
        });
      }
    }),
  // User engagement analytics
  getUserEngagement: protectedProcedure
    .input(userAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.ADMINISTRATOR,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
          UserType.STUDENT,
          UserType.CAMPUS_STUDENT,
          UserType.CAMPUS_PARENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Get user engagement data
      try {
        // This is a placeholder for actual implementation
        // In a real implementation, you would query the database for user engagement metrics
        return {
          totalLogins: 0,
          averageSessionDuration: 0,
          completedActivities: 0,
          submittedAssignments: 0,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve user engagement analytics",
          cause: error,
        });
      }
    }),

  // Course performance analytics
  getCoursePerformance: protectedProcedure
    .input(courseAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.ADMINISTRATOR,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
          UserType.STUDENT,
          UserType.CAMPUS_STUDENT,
          UserType.CAMPUS_PARENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Get course performance data
      try {
        // This is a placeholder for actual implementation
        return {
          averageGrade: 0,
          completionRate: 0,
          studentParticipation: 0,
          topPerformingStudents: [],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve course performance analytics",
          cause: error,
        });
      }
    }),

  getTeacherStats: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.ADMINISTRATOR,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
          UserType.STUDENT,
          UserType.CAMPUS_STUDENT,
          UserType.CAMPUS_PARENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      try {
        // Get teacher profile
        const teacher = await ctx.prisma.teacherProfile.findUnique({
          where: { id: input.teacherId },
          include: {
            user: true,
            assignments: {
              where: {
                status: SystemStatus.ACTIVE,
              },
              include: {
                class: true,
              },
            },
          },
        });

        if (!teacher) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher not found",
          });
        }

        // Get class IDs for this teacher
        const classIds = teacher.assignments.map((assignment: any) => assignment.classId);

        // Calculate metrics
        const classCount = teacher.assignments.length;

        // Get student count
        const students = await ctx.prisma.studentEnrollment.findMany({
          where: {
            classId: {
              in: classIds,
            },
            status: SystemStatus.ACTIVE,
          },
        });

        const studentCount = students.length;

        // Get attendance rate
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceRecords = await ctx.prisma.attendance.findMany({
          where: {
            classId: {
              in: classIds,
            },
            date: {
              gte: thirtyDaysAgo,
            },
          },
        });

        const totalRecords = attendanceRecords.length;
        const presentRecords = attendanceRecords.filter((record: any) => record.status === 'PRESENT').length;
        const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

        // Get assessments created by this teacher
        const assessments = await ctx.prisma.assessment.findMany({
          where: {
            createdById: input.teacherId,
            status: SystemStatus.ACTIVE,
          },
        });

        // Get grades for these assessments
        const assessmentIds = assessments.map((a: any) => a.id);
        const grades = await ctx.prisma.assessmentSubmission.findMany({
          where: {
            assessmentId: {
              in: assessmentIds
            }
          },
          include: {
            assessment: true
          }
        });

        // Calculate grading timeliness (average days between due date and grading date)
        let totalGradingDays = 0;
        let gradedAssessments = 0;

        grades.forEach((grade: any) => {
          if (grade.gradedAt && grade.assessment?.dueDate) {
            const dueDate = new Date(grade.assessment.dueDate);
            const gradedAt = new Date(grade.gradedAt);
            const daysDifference = Math.round((gradedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

            // Only count positive differences (graded after due date)
            if (daysDifference >= 0) {
              totalGradingDays += daysDifference;
              gradedAssessments++;
            }
          }
        });

        const gradingTimeliness = gradedAssessments > 0 ? parseFloat((totalGradingDays / gradedAssessments).toFixed(1)) : 0;

        // Calculate student performance in teacher's classes
        const studentGrades = await ctx.prisma.assessmentSubmission.findMany({
          where: {
            assessment: {
              classId: {
                in: classIds,
              },
            },
          },
          include: {
            assessment: true,
          },
        });

        let totalScore = 0;
        let totalPossible = 0;

        studentGrades.forEach((grade: any) => {
          if (grade.score !== null && grade.assessment?.totalScore) {
            totalScore += grade.score;
            totalPossible += grade.assessment.totalScore;
          }
        });

        const studentPerformance = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0;

        // Get feedback for this teacher
        const feedback = await ctx.prisma.teacherFeedback.count({
          where: {
            teacherId: input.teacherId,
            feedbackBase: {
              status: SystemStatus.ACTIVE,
            },
          },
        });

        // Calculate positive feedback percentage
        const positiveFeedback = await ctx.prisma.teacherFeedback.count({
          where: {
            teacherId: input.teacherId,
            feedbackBase: {
              status: SystemStatus.ACTIVE,
              severity: 'POSITIVE',
            },
          },
        });

        const positiveFeedbackPercentage = feedback > 0 ? Math.round((positiveFeedback / feedback) * 100) : 0;

        return {
          teacherId: input.teacherId,
          teacherName: teacher.user.name,
          classCount,
          studentCount,
          attendanceRate,
          gradingTimeliness,
          studentPerformance,
          feedbackCount: feedback,
          positiveFeedbackPercentage,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve teacher statistics",
          cause: error,
        });
      }
    }),

  // Class attendance analytics
  getClassAttendance: protectedProcedure
    .input(classAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.ADMINISTRATOR,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
          UserType.STUDENT,
          UserType.CAMPUS_STUDENT,
          UserType.CAMPUS_PARENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Get class attendance data
      try {
        // This is a placeholder for actual implementation
        return {
          overallAttendanceRate: 0,
          attendanceByDate: [],
          studentsWithLowAttendance: [],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve class attendance analytics",
          cause: error,
        });
      }
    }),

  // Get class leaderboard
  getClassLeaderboard: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get class details
        const classData = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
        });

        // Get student enrollments for this class
        const studentEnrollments = await ctx.prisma.studentEnrollment.findMany({
          where: {
            classId: input.classId,
            status: SystemStatus.ACTIVE,
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        });

        if (!classData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Get all grades for this class
        const grades = await ctx.prisma.assessmentSubmission.findMany({
          where: {
            assessment: {
              classId: input.classId,
            },
          },
          include: {
            student: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            assessment: true,
          },
        });

        // Calculate student scores
        const studentScores = new Map();

        grades.forEach((grade: any) => {
          const studentId = grade.studentId;
          const score = grade.score || 0;
          const totalScore = grade.assessment?.totalScore || 100;
          const weightedScore = (score / totalScore) * 100;

          if (!studentScores.has(studentId)) {
            studentScores.set(studentId, {
              studentId,
              userId: grade.student?.user?.id,
              name: grade.student?.user?.name || 'Unknown',
              image: grade.student?.user?.image,
              totalScore: 0,
              assessmentCount: 0,
              averageScore: 0,
            });
          }

          const currentStudent = studentScores.get(studentId);
          currentStudent.totalScore += weightedScore;
          currentStudent.assessmentCount += 1;
          currentStudent.averageScore = currentStudent.totalScore / currentStudent.assessmentCount;
          studentScores.set(studentId, currentStudent);
        });

        // Convert to array and sort by average score
        const leaderboard = Array.from(studentScores.values())
          .sort((a, b) => b.averageScore - a.averageScore)
          .map((student, index) => ({
            ...student,
            rank: index + 1,
            averageScore: Math.round(student.averageScore),
          }));

        // Add students with no grades
        studentEnrollments.forEach((enrollment: any) => {
          const studentId = enrollment.studentId;
          if (!studentScores.has(studentId)) {
            leaderboard.push({
              studentId,
              userId: enrollment.student.user.id,
              name: enrollment.student.user.name,
              image: null,
              totalScore: 0,
              assessmentCount: 0,
              averageScore: 0,
              rank: leaderboard.length + 1,
            });
          }
        });

        return {
          classId: input.classId,
          className: classData.name,
          leaderboard,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve class leaderboard",
          cause: error,
        });
      }
    }),

  // Institution-wide analytics
  getInstitutionOverview: protectedProcedure
    .input(institutionAnalyticsSchema)
    .query(async ({ ctx, input }) => {
      // Check permissions
      if (
        ![
          UserType.SYSTEM_ADMIN,
          UserType.SYSTEM_MANAGER,
          UserType.ADMINISTRATOR,
          UserType.CAMPUS_ADMIN,
          UserType.CAMPUS_COORDINATOR,
          UserType.COORDINATOR,
          UserType.TEACHER,
          UserType.CAMPUS_TEACHER,
          UserType.STUDENT,
          UserType.CAMPUS_STUDENT,
          UserType.CAMPUS_PARENT,
        ].includes(ctx.session.user.userType as UserType)
      ) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      // Get institution overview data
      try {
        // This is a placeholder for actual implementation
        return {
          activeUsers: 0,
          totalCourses: 0,
          averageGrades: 0,
          completionRates: 0,
          topPerformingCourses: [],
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve institution overview analytics",
          cause: error,
        });
      }
    }),

  // Get leaderboard correlation analysis
  getLeaderboardCorrelation: protectedProcedure
    .input(
      z.object({
        entityType: z.enum([
          LeaderboardEntityType.CLASS,
          LeaderboardEntityType.SUBJECT,
          LeaderboardEntityType.COURSE,
          LeaderboardEntityType.CAMPUS,
          LeaderboardEntityType.CUSTOM_GROUP
        ]),
        entityId: z.string(),
        timeframe: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      try {
        // Get the entity type and ID
        const { entityType, entityId } = { entityType: input.entityType, entityId: input.entityId };

        // Create an instance of the UnifiedLeaderboardService
        const leaderboardService = new UnifiedLeaderboardService({ prisma: ctx.prisma });

        // Get leaderboard data
        const leaderboardData = await leaderboardService.getLeaderboard({
          type: entityType,
          referenceId: entityId,
          timeGranularity: input.timeframe as TimeGranularity || TimeGranularity.TERM,
          filterOptions: {
            limit: 50,
            includeCurrentStudent: false
          }
        });

        // Get student data for correlation analysis
        const students = await ctx.prisma.studentProfile.findMany({
          where: {
            enrollments: {
              some: {
                status: SystemStatus.ACTIVE,
                class: entityType === LeaderboardEntityType.CLASS
                  ? { id: entityId }
                  : entityType === LeaderboardEntityType.COURSE
                    ? { courseCampus: { courseId: entityId } }
                    : undefined
              }
            }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            },
            enrollments: {
              where: {
                status: SystemStatus.ACTIVE
              },
              include: {
                class: true
              }
            },
            assessments: {
              where: {
                status: {
                  in: ['SUBMITTED', 'GRADED']
                }
              },
              include: {
                assessment: true
              }
            },
            attendance: true
          }
        });

        // Calculate correlation data
        const correlations = students.map((student: any) => {
          // Find student in leaderboard
          const leaderboardEntry = leaderboardData.leaderboard.find(
            (entry: StandardLeaderboardEntry) => entry.studentId === student.id
          );

          // Calculate academic performance (average grade)
          let totalScore = 0;
          let totalMaxScore = 0;

          student.assessments.forEach((submission: any) => {
            if (submission.score !== null && submission.assessment?.maxScore) {
              totalScore += submission.score;
              totalMaxScore += submission.assessment.maxScore;
            }
          });

          const academicPerformance = totalMaxScore > 0
            ? Math.round((totalScore / totalMaxScore) * 100)
            : 0;

          // Calculate attendance rate
          const totalAttendance = student.attendance.length;
          const presentAttendance = student.attendance.filter(
            (record: any) => record.status === 'PRESENT'
          ).length;

          const attendance = totalAttendance > 0
            ? Math.round((presentAttendance / totalAttendance) * 100)
            : 0;

          return {
            studentName: student.user.name,
            leaderboardPosition: leaderboardEntry?.rank || 0,
            academicPerformance,
            attendance
          };
        });

        return { correlations };
      } catch (error) {
        console.error("Error fetching correlation data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch correlation data",
          cause: error,
        });
      }
    }),

  // Get cohort comparison data
  getCohortComparison: protectedProcedure
    .input(
      z.object({
        entityType: z.enum([
          LeaderboardEntityType.CLASS,
          LeaderboardEntityType.SUBJECT,
          LeaderboardEntityType.COURSE,
          LeaderboardEntityType.CAMPUS,
          LeaderboardEntityType.CUSTOM_GROUP
        ]),
        entityId: z.string(),
        timeframe: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      try {
        // Get the entity type and ID
        const { entityType, entityId } = { entityType: input.entityType, entityId: input.entityId };

        // Create an instance of the UnifiedLeaderboardService
        const leaderboardService = new UnifiedLeaderboardService({ prisma: ctx.prisma });

        // Get classes for comparison based on entity type
        let classes: { id: string; name: string }[] = [];

        if (entityType === LeaderboardEntityType.CLASS) {
          // For class entity, get other classes in the same course
          const currentClass = await ctx.prisma.class.findUnique({
            where: { id: entityId },
            include: {
              courseCampus: true
            }
          });

          if (currentClass && currentClass.courseCampus) {
            const courseClasses = await ctx.prisma.class.findMany({
              where: {
                courseCampusId: currentClass.courseCampusId,
                id: { not: entityId }, // Exclude current class
                status: SystemStatus.ACTIVE
              },
              select: {
                id: true,
                name: true
              }
            });

            classes = [
              { id: entityId, name: currentClass.name }, // Include current class
              ...courseClasses
            ];
          }
        } else if (entityType === LeaderboardEntityType.COURSE) {
          // For course entity, get classes in this course
          const courseClasses = await ctx.prisma.class.findMany({
            where: {
              courseCampus: {
                courseId: entityId
              },
              status: SystemStatus.ACTIVE
            },
            select: {
              id: true,
              name: true
            }
          });

          classes = courseClasses;
        } else if (entityType === LeaderboardEntityType.CAMPUS) {
          // For campus entity, get top classes by performance
          const topClasses = await ctx.prisma.class.findMany({
            where: {
              campusId: entityId,
              status: SystemStatus.ACTIVE
            },
            select: {
              id: true,
              name: true
            },
            take: 5 // Limit to top 5 classes
          });

          classes = topClasses;
        }

        // Get leaderboard data for each class
        const cohortData = await Promise.all(
          classes.map(async (cls) => {
            try {
              const leaderboardData = await leaderboardService.getLeaderboard({
                type: LeaderboardEntityType.CLASS,
                referenceId: cls.id,
                timeGranularity: input.timeframe as TimeGranularity || TimeGranularity.TERM
              });

              // Calculate average metrics
              let totalPosition = 0;
              let totalScore = 0;
              let totalGrade = 0;
              const entries = leaderboardData.leaderboard;

              entries.forEach((entry: StandardLeaderboardEntry) => {
                totalPosition += entry.rank || 0;
                // Use a different property since score doesn't exist
                totalScore += (entry as any).score || 0;
                totalGrade += entry.academicScore || 0;
              });

              const count = entries.length || 1; // Avoid division by zero

              return {
                name: cls.name,
                averagePosition: Math.round(totalPosition / count),
                averageScore: Math.round(totalScore / count),
                averageGrade: Math.round(totalGrade / count)
              };
            } catch (error) {
              console.error(`Error getting leaderboard for class ${cls.id}:`, error);
              return {
                name: cls.name,
                averagePosition: 0,
                averageScore: 0,
                averageGrade: 0
              };
            }
          })
        );

        return { cohorts: cohortData };
      } catch (error) {
        console.error("Error fetching cohort comparison data:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch cohort comparison data",
          cause: error,
        });
      }
    }),

  // Get intervention suggestions
  getInterventionSuggestions: protectedProcedure
    .input(
      z.object({
        entityType: z.enum([
          LeaderboardEntityType.CLASS,
          LeaderboardEntityType.SUBJECT,
          LeaderboardEntityType.COURSE,
          LeaderboardEntityType.CAMPUS,
          LeaderboardEntityType.CUSTOM_GROUP
        ]),
        entityId: z.string(),
        timeframe: z.string().optional()
      })
    )
    .query(async ({ ctx, input }) => {
      // Ensure user is authenticated
      if (!ctx.session?.user?.id) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Not authenticated",
        });
      }

      try {
        // Get the entity type and ID
        const { entityType, entityId } = { entityType: input.entityType, entityId: input.entityId };

        // Create an instance of the UnifiedLeaderboardService
        const leaderboardService = new UnifiedLeaderboardService({ prisma: ctx.prisma });

        // Get current leaderboard data
        const currentLeaderboard = await leaderboardService.getLeaderboard({
          type: entityType,
          referenceId: entityId,
          timeGranularity: input.timeframe as TimeGranularity || TimeGranularity.TERM,
          filterOptions: {
            limit: 100 // Get a larger sample for analysis
          }
        });

        // Get previous leaderboard data (from previous period)
        const previousTimeGranularity = getPreviousPeriod(input.timeframe as TimeGranularity || TimeGranularity.TERM);
        const previousLeaderboard = await leaderboardService.getLeaderboard({
          type: entityType,
          referenceId: entityId,
          timeGranularity: previousTimeGranularity,
          filterOptions: {
            limit: 100
          }
        });

        // Get student data for additional context
        const studentIds = currentLeaderboard.leaderboard.map(entry => entry.studentId);

        const students = await ctx.prisma.studentProfile.findMany({
          where: {
            id: { in: studentIds }
          },
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            },
            assessments: {
              where: {
                status: {
                  in: ['SUBMITTED', 'GRADED']
                }
              },
              include: {
                assessment: true
              }
            },
            attendance: {
              orderBy: {
                date: 'desc'
              },
              take: 30 // Last 30 attendance records
            }
          }
        });

        // Generate intervention suggestions
        const interventions = studentIds.map((studentId) => {
          // Find student in current and previous leaderboards
          const currentEntry = currentLeaderboard.leaderboard.find((entry: StandardLeaderboardEntry) => entry.studentId === studentId);
          const previousEntry = previousLeaderboard.leaderboard.find((entry: StandardLeaderboardEntry) => entry.studentId === studentId);

          if (!currentEntry) return null;

          const student = students.find((s: any) => s.id === studentId);
          if (!student) return null;

          const currentPosition = currentEntry.rank || 0;
          const previousPosition = previousEntry?.rank || 0;
          const positionChange = previousPosition > 0 ? previousPosition - currentPosition : 0;

          // Calculate metrics for intervention analysis
          const attendanceRecords = student.attendance || [];
          const recentAbsences = attendanceRecords.filter((record: any) => record.status === 'ABSENT').length;
          const attendanceRate = attendanceRecords.length > 0
            ? (attendanceRecords.filter((record: any) => record.status === 'PRESENT').length / attendanceRecords.length) * 100
            : 0;

          const submissions = student.assessments || [];
          // Only use pendingSubmissions in the logic
          const pendingSubmissions = submissions.filter((sub: any) => sub.status === 'PENDING' || sub.status === 'SUBMITTED').length;

          let totalScore = 0;
          let totalMaxScore = 0;

          submissions.forEach((submission: any) => {
            if (submission.score !== null && submission.assessment?.maxScore) {
              totalScore += submission.score;
              totalMaxScore += submission.assessment.maxScore;
            }
          });

          const averageScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

          // Determine issues and suggestions
          let issue = '';
          let suggestion = '';
          let priority = 'medium';

          if (positionChange < -5) {
            // Significant drop in ranking
            issue = 'Significant drop in leaderboard position';
            suggestion = 'Schedule a one-on-one meeting to discuss recent performance challenges';
            priority = 'high';
          } else if (recentAbsences > 3) {
            // Attendance issues
            issue = 'Multiple recent absences affecting performance';
            suggestion = 'Follow up on attendance and provide catch-up resources';
            priority = 'high';
          } else if (pendingSubmissions > 3) {
            // Missing assignments
            issue = 'Multiple pending assignments';
            suggestion = 'Send reminder about pending assignments and offer extended office hours';
            priority = 'medium';
          } else if (averageScore < 60) {
            // Low academic performance
            issue = 'Below average academic performance';
            suggestion = 'Provide additional learning resources and consider tutoring options';
            priority = 'medium';
          } else if (attendanceRate < 70) {
            // Poor attendance overall
            issue = 'Poor overall attendance rate';
            suggestion = 'Discuss attendance importance and its impact on performance';
            priority = 'low';
          }

          // Only return interventions where there's an actual issue
          if (!issue) return null;

          return {
            id: `intervention-${studentId}-${Date.now()}`,
            studentName: student.user.name,
            currentPosition,
            previousPosition,
            positionChange,
            issue,
            suggestion,
            priority
          };
        }).filter(Boolean); // Remove null entries

        return { interventions };
      } catch (error) {
        console.error("Error generating intervention suggestions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate intervention suggestions",
          cause: error,
        });
      }
    }),

  // ============================================================================
  // UNIFIED PERFORMANCE ANALYTICS ENDPOINTS
  // ============================================================================

  /**
   * Get unified performance records with advanced filtering and pagination
   * Uses efficient database queries with proper caching
   */
  getPerformanceRecords: protectedProcedure
    .input(z.object({
      studentIds: z.array(z.string().cuid()).optional(),
      activityIds: z.array(z.string().cuid()).optional(),
      classIds: z.array(z.string().cuid()).optional(),
      subjectIds: z.array(z.string().cuid()).optional(),
      topicIds: z.array(z.string().cuid()).optional(),
      activityTypes: z.array(z.string()).optional(),
      gradingTypes: z.array(z.enum(['AUTO', 'MANUAL', 'AI', 'HYBRID'])).optional(),
      bloomsLevels: z.array(z.nativeEnum(BloomsTaxonomyLevel)).optional(),
      dateRange: z.object({
        from: z.date(),
        to: z.date(),
      }).optional(),
      scoreRange: z.object({
        min: z.number().min(0).max(100),
        max: z.number().min(0).max(100),
      }).optional(),
      flags: z.object({
        isExceptional: z.boolean().optional(),
        isStruggling: z.boolean().optional(),
        isImproving: z.boolean().optional(),
        needsAttention: z.boolean().optional(),
      }).optional(),
      pagination: z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(50),
      }).optional(),
      sort: z.object({
        field: z.enum(['id', 'studentId', 'activityId', 'classId', 'subjectId', 'score', 'percentage', 'gradedAt', 'createdAt']),
        direction: z.enum(['asc', 'desc']).default('desc'),
      }).optional(),
      include: z.object({
        student: z.boolean().optional(),
        activity: z.boolean().optional(),
        class: z.boolean().optional(),
        subject: z.boolean().optional(),
        topic: z.boolean().optional(),
      }).optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const queryService = new UnifiedPerformanceQueryService(ctx.prisma);

        // Convert input to PerformanceQueryParams with authorization
        const params: PerformanceQueryParams = {
          ...input,
          // Add user context for authorization
          ...(ctx.session.user.userType === 'STUDENT' && {
            studentIds: [ctx.session.user.id],
          }),
        };

        const result = await queryService.getPerformanceRecords(params);

        return result;
      } catch (error) {
        console.error('Error in getPerformanceRecords:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch performance records',
          cause: error,
        });
      }
    }),

  /**
   * Get student performance summary across subjects
   * Optimized for dashboard displays and student profiles
   */
  getStudentSummary: protectedProcedure
    .input(z.object({
      studentId: z.string().cuid(),
      subjectId: z.string().cuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Authorization check
        if (ctx.session.user.userType === 'STUDENT' && ctx.session.user.id !== input.studentId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Students can only access their own performance data',
          });
        }

        const queryService = new UnifiedPerformanceQueryService(ctx.prisma);
        const summaries = await queryService.getStudentPerformanceSummary(
          input.studentId,
          input.subjectId
        );

        return summaries;
      } catch (error) {
        console.error('Error in getStudentSummary:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch student performance summary',
          cause: error,
        });
      }
    }),

  /**
   * Get class activity performance with detailed analytics
   * Optimized for teacher dashboards and class analytics
   */
  getClassPerformance: protectedProcedure
    .input(z.object({
      classId: z.string().cuid(),
      activityId: z.string().cuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Authorization check - only teachers and admins can access class performance
        if (!['TEACHER', 'ADMIN', 'COORDINATOR', 'CAMPUS_TEACHER', 'CAMPUS_ADMIN'].includes(ctx.session.user.userType)) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Insufficient permissions to access class performance data',
          });
        }

        const queryService = new UnifiedPerformanceQueryService(ctx.prisma);
        const performances = await queryService.getClassActivityPerformance(
          input.classId,
          input.activityId
        );

        return performances;
      } catch (error) {
        console.error('Error in getClassPerformance:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch class performance data',
          cause: error,
        });
      }
    }),

  /**
   * Get real-time analytics for dashboards
   * Optimized for frequent updates and real-time displays
   */
  getRealTime: protectedProcedure
    .input(z.object({
      entityType: z.enum(['student', 'class', 'subject']),
      entityId: z.string().cuid(),
      timeWindow: z.number().min(1).max(365).default(7), // days
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Authorization check based on entity type
        if (input.entityType === 'student' &&
            ctx.session.user.userType === 'STUDENT' &&
            ctx.session.user.id !== input.entityId) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Students can only access their own analytics',
          });
        }

        const queryService = new UnifiedPerformanceQueryService(ctx.prisma);
        const analytics = await queryService.getRealTimeAnalytics(
          input.entityType,
          input.entityId,
          input.timeWindow
        );

        return analytics;
      } catch (error) {
        console.error('Error in getRealTime:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch real-time analytics',
          cause: error,
        });
      }
    }),

  /**
   * Mark performance alert as read
   * Updates alert status and triggers dashboard refresh
   * Note: This endpoint will be fully functional once the PerformanceAlert model is migrated
   */
  markAlertAsRead: protectedProcedure
    .input(z.object({
      alertId: z.string().cuid(),
    }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Implement once PerformanceAlert model is migrated to database
        // For now, return success to maintain API compatibility
        console.log('markAlertAsRead called with alertId:', input.alertId);

        return {
          success: true,
          message: 'Alert marking functionality will be available after database migration'
        };
      } catch (error) {
        console.error('Error in markAlertAsRead:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to mark alert as read',
          cause: error,
        });
      }
    }),
});