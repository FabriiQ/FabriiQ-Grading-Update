import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { SystemStatus } from "@prisma/client";
import { UserType } from "../constants";
import bcryptjs from "bcryptjs";
import { ProcedureCacheHelpers } from "@/server/api/cache/advanced-procedure-cache";

const createTeacherSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  qualifications: z.string().optional(),
  joinDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  sendInvitation: z.boolean().optional(),
  requirePasswordChange: z.boolean().optional(),
  campusId: z.string(),
  userId: z.string(),
  // Manual credential creation fields
  createManualAccount: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

// Define system-level teacher creation schema
const createSystemTeacherSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  qualifications: z.string().optional(),
  joinDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  sendInvitation: z.boolean().optional(),
  requirePasswordChange: z.boolean().optional(),
  campusId: z.string(),
  userId: z.string(),
  // New fields for manual account creation
  createManualAccount: z.boolean().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
});

// Define update schema
const updateTeacherSchema = z.object({
  id: z.string(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  specialization: z.string().optional(),
  qualifications: z.string().optional(),
  joinDate: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  bio: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  campusId: z.string(),
  userId: z.string(),
});

export const teacherRouter = createTRPCRouter({
  // Get class by ID
  getClassById: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get the class details
        const classDetails = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {
            term: true,
            courseCampus: {
              include: {
                course: {
                  include: {
                    subjects: true
                  }
                }
              }
            },
            programCampus: {
              include: {
                program: true
              }
            },
            campus: true,
            facility: true,
            teachers: {
              include: {
                teacher: {
                  include: {
                    user: true
                  }
                }
              }
            },
            _count: {
              select: {
                students: true,
                activities: true,
                assessments: true,
                attendance: true
              }
            }
          }
        });

        if (!classDetails) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Check if the teacher is assigned to this class
        const isTeacherAssigned = classDetails.teachers.some(
          assignment => assignment.teacherId === user.teacherProfile?.id
        );

        if (!isTeacherAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not assigned to this class",
          });
        }

        return classDetails;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class details: ${(error as Error).message}`,
        });
      }
    }),

  // Get class metrics
  getClassMetrics: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get comprehensive class data for real-time metrics calculation
        const classInfo = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {

            activities: {
              where: { status: 'ACTIVE' as SystemStatus },
              include: {
                activityGrades: {
                  include: {
                    student: true
                  }
                }
              }
            },
            assessments: {
              where: { status: 'ACTIVE' as SystemStatus },
              include: {
                submissions: true
              }
            },
            attendance: {
              where: {
                createdAt: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
              }
            },
            _count: {
              select: {
                students: true
              }
            }
          }
        });

        if (!classInfo) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        // Get student count separately
        const studentCount = await ctx.prisma.studentEnrollment.count({
          where: {
            classId: input.classId,
            status: 'ACTIVE' as SystemStatus
          }
        });

        // Calculate real-time metrics
        const totalStudents = studentCount;
        const totalActivities = (classInfo as any).activities?.length || 0;
        const totalAssessments = (classInfo as any).assessments?.length || 0;

        // Calculate activity completion metrics
        let totalActivityGrades = 0;
        let completedActivityGrades = 0;
        let totalActivityScore = 0;
        let gradedActivityCount = 0;

        ((classInfo as any).activities || []).forEach((activity: any) => {
          totalActivityGrades += activity.activityGrades?.length || 0;
          (activity.activityGrades || []).forEach((grade: any) => {
            if (grade.status === 'GRADED' || grade.status === 'SUBMITTED') {
              completedActivityGrades++;
              if (grade.score !== null) {
                totalActivityScore += grade.score;
                gradedActivityCount++;
              }
            }
          });
        });

        // Calculate assessment completion metrics
        let totalAssessmentSubmissions = 0;
        let completedAssessmentSubmissions = 0;

        ((classInfo as any).assessments || []).forEach((assessment: any) => {
          totalAssessmentSubmissions += assessment.submissions?.length || 0;
          completedAssessmentSubmissions += (assessment.submissions || []).filter(
            (sub: any) => sub.status === 'SUBMITTED' || sub.status === 'GRADED'
          ).length;
        });

        // Calculate attendance metrics
        const attendanceRecords = (classInfo as any).attendance || [];
        const totalAttendanceRecords = attendanceRecords.length;
        const presentCount = attendanceRecords.filter((record: any) => record.status === 'PRESENT').length;
        const absentCount = attendanceRecords.filter((record: any) => record.status === 'ABSENT').length;
        const lateCount = attendanceRecords.filter((record: any) => record.status === 'LATE').length;
        const excusedCount = attendanceRecords.filter((record: any) => record.status === 'EXCUSED').length;

        // Calculate rates and averages
        const attendanceRate = totalAttendanceRecords > 0
          ? Math.round((presentCount / totalAttendanceRecords) * 100)
          : 0;

        const completionRate = totalActivityGrades > 0
          ? Math.round((completedActivityGrades / totalActivityGrades) * 100)
          : 0;

        const assessmentCompletionRate = totalAssessmentSubmissions > 0
          ? Math.round((completedAssessmentSubmissions / totalAssessmentSubmissions) * 100)
          : 0;

        const averageGrade = gradedActivityCount > 0
          ? Math.round(totalActivityScore / gradedActivityCount)
          : 0;

        const passingRate = gradedActivityCount > 0
          ? Math.round((totalActivityScore / gradedActivityCount >= 60 ? 1 : 0) * 100)
          : 0;

        // Calculate participation rate (students who have submitted at least one activity)
        const activeStudentIds = new Set();
        ((classInfo as any).activities || []).forEach((activity: any) => {
          (activity.activityGrades || []).forEach((grade: any) => {
            if (grade.status === 'SUBMITTED' || grade.status === 'GRADED') {
              activeStudentIds.add(grade.studentId);
            }
          });
        });

        const participationRate = totalStudents > 0
          ? Math.round((activeStudentIds.size / totalStudents) * 100)
          : 0;

        // Return calculated real-time metrics
        return {
          id: input.classId,
          classId: input.classId,
          // Academic metrics
          averageGrade,
          passingRate,
          highestGrade: 0, // Would need more complex calculation
          lowestGrade: 0,  // Would need more complex calculation
          // Attendance metrics
          attendanceRate,
          presentCount,
          absentCount,
          lateCount,
          excusedCount,
          // Participation metrics
          participationRate,
          activeStudents: activeStudentIds.size,
          inactiveStudents: totalStudents - activeStudentIds.size,
          // Activity metrics
          completionRate,
          completedActivities: completedActivityGrades,
          totalActivities,
          // Assessment metrics
          assessmentCompletionRate,
          completedAssessments: completedAssessmentSubmissions,
          totalAssessments,
          // Time metrics
          averageLearningTimeMinutes: 0, // Would need learning time records
          totalLearningTimeMinutes: 0,   // Would need learning time records
          // Last updated
          lastUpdated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class metrics: ${(error as Error).message}`,
        });
      }
    }),

  // Get recent class activities
  getRecentClassActivities: protectedProcedure
    .input(z.object({
      classId: z.string(),
      limit: z.number().min(1).max(100).optional().default(5),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get class info to calculate total students
        const classInfo = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {
            _count: {
              select: {
                students: true
              }
            }
          }
        });

        if (!classInfo) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        const totalStudents = classInfo._count.students;

        // Get recent activities for this class with detailed statistics
        const recentActivities = await ctx.prisma.activity.findMany({
          where: {
            classId: input.classId,
            status: 'ACTIVE' as SystemStatus,
          },
          take: input.limit,
          include: {
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
            activityGrades: {
              include: {
                student: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            },
            _count: {
              select: {
                activityGrades: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        // Process activities to include real-time statistics
        const processedActivities = recentActivities.map(activity => {
          const grades = activity.activityGrades;
          const totalSubmissions = grades.length;
          const gradedSubmissions = grades.filter(grade => grade.status === 'GRADED').length;
          const pendingSubmissions = grades.filter(grade => grade.status === 'SUBMITTED').length;
          const averageScore = gradedSubmissions > 0
            ? Math.round(grades.filter(g => g.status === 'GRADED' && g.score !== null)
                .reduce((sum, g) => sum + (g.score || 0), 0) / gradedSubmissions)
            : 0;

          const completionRate = totalStudents > 0
            ? Math.round((totalSubmissions / totalStudents) * 100)
            : 0;

          const needsGrading = pendingSubmissions > 0;

          // Determine activity status
          let activityStatus: 'active' | 'needs_grading' | 'completed' = 'active';
          if (needsGrading) {
            activityStatus = 'needs_grading';
          } else if (completionRate >= 80 && gradedSubmissions > 0) {
            activityStatus = 'completed';
          }

          return {
            ...activity,
            statistics: {
              totalSubmissions,
              gradedSubmissions,
              pendingSubmissions,
              averageScore,
              completionRate,
              needsGrading,
              activityStatus,
              totalStudents
            }
          };
        });

        return processedActivities;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get recent class activities: ${(error as Error).message}`,
        });
      }
    }),

  // Get upcoming class assessments
  getUpcomingClassAssessments: protectedProcedure
    .input(z.object({
      classId: z.string(),
      limit: z.number().min(1).max(100).optional().default(5),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get class info to calculate total students
        const classInfo = await ctx.prisma.class.findUnique({
          where: { id: input.classId },
          include: {
            _count: {
              select: {
                students: true
              }
            }
          }
        });

        if (!classInfo) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Class not found",
          });
        }

        const totalStudents = classInfo._count.students;

        // Get upcoming assessments for this class with detailed statistics
        const now = new Date();
        const upcomingAssessments = await ctx.prisma.assessment.findMany({
          where: {
            classId: input.classId,
            status: 'ACTIVE' as SystemStatus,
            dueDate: {
              gte: now
            }
          },
          take: input.limit,
          include: {
            subject: {
              select: {
                id: true,
                name: true,
                code: true
              }
            },
            submissions: {
              include: {
                student: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            },
            _count: {
              select: {
                submissions: true
              }
            }
          },
          orderBy: {
            dueDate: 'asc'
          }
        });

        // Process assessments to include real-time statistics
        const processedAssessments = upcomingAssessments.map(assessment => {
          const submissions = assessment.submissions;
          const totalSubmissions = submissions.length;
          const gradedSubmissions = submissions.filter(sub => sub.status === 'GRADED').length;
          const pendingSubmissions = submissions.filter(sub => sub.status === 'SUBMITTED').length;
          const averageScore = gradedSubmissions > 0
            ? Math.round(submissions.filter(s => s.status === 'GRADED' && s.score !== null)
                .reduce((sum, s) => sum + (s.score || 0), 0) / gradedSubmissions)
            : 0;

          const submissionRate = totalStudents > 0
            ? Math.round((totalSubmissions / totalStudents) * 100)
            : 0;

          // Calculate days until due
          const daysUntilDue = assessment.dueDate
            ? Math.ceil((assessment.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null;

          // Determine urgency level
          let urgency: 'low' | 'medium' | 'high' = 'low';
          if (daysUntilDue !== null) {
            if (daysUntilDue <= 1) urgency = 'high';
            else if (daysUntilDue <= 3) urgency = 'medium';
          }

          // Determine assessment status
          let assessmentStatus: 'upcoming' | 'active' | 'needs_grading' = 'upcoming';
          if (totalSubmissions > 0) {
            assessmentStatus = pendingSubmissions > 0 ? 'needs_grading' : 'active';
          }

          return {
            ...assessment,
            statistics: {
              totalSubmissions,
              gradedSubmissions,
              pendingSubmissions,
              averageScore,
              submissionRate,
              daysUntilDue,
              urgency,
              assessmentStatus,
              totalStudents
            }
          };
        });

        return processedAssessments;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get upcoming class assessments: ${(error as Error).message}`,
        });
      }
    }),

  // Get activities for a specific class
  getClassActivities: protectedProcedure
    .input(z.object({
      classId: z.string(),
      subjectId: z.string().optional(),
      limit: z.number().min(1).max(50).optional().default(20),
      cursor: z.string().optional(), // For cursor-based pagination
    }))
    .query(async ({ ctx, input }) => {
      try {
        // First, get the teacher profile to determine which students they can see
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Build the where clause for activities
        const activityWhere: any = {
          classId: input.classId,
          status: 'ACTIVE' as SystemStatus,
        };

        // Add subject filter if provided
        if (input.subjectId) {
          activityWhere.subjectId = input.subjectId;
        }

        // Get activities with minimal data for performance
        const activities = await ctx.prisma.activity.findMany({
          where: activityWhere,
          take: input.limit + 1, // Take one more to check if there are more results
          ...(input.cursor && {
            cursor: {
              id: input.cursor,
            },
            skip: 1, // Skip the cursor
          }),
          select: {
            id: true,
            title: true,

            content: true,
            learningType: true,
            purpose: true,
            bloomsLevel: true,
            isGradable: true,
            maxScore: true,
            startDate: true,
            endDate: true,
            createdAt: true,
            updatedAt: true,
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
            // Only get counts for performance - no deep nested data
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

        // Process activities with lightweight analytics using counts only
        const processedActivities = activities.map(activity => {
          // Use counts instead of loading all related data
          const totalSubmissions = activity._count?.activityGrades || 0;
          const totalLearningTimeRecords = activity._count?.learningTimeRecords || 0;

          // Determine if activity requires manual grading from content
          const content = activity.content as Record<string, any> || {};
          const requiresManualGrading = content.requiresTeacherReview === true ||
            (content.hasSubmission === true && content.hasRealTimeComponents !== true);

          // Return processed activity with lightweight analytics
          return {
            ...activity,
            analytics: {
              totalSubmissions,
              totalLearningTimeRecords,
              requiresManualGrading,
              // These will be loaded separately when needed for detailed views
              gradedSubmissions: 0, // Placeholder - load when needed
              averageScore: 0, // Placeholder - load when needed
              totalLearningTime: 0 // Placeholder - load when needed
            }
          };
        });

        // Check if there are more results
        let nextCursor: string | undefined = undefined;
        if (processedActivities.length > input.limit) {
          const nextItem = processedActivities.pop();
          nextCursor = nextItem?.id;
        }

        return {
          items: processedActivities,
          nextCursor
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class activities: ${(error as Error).message}`,
        });
      }
    }),

  // Get lesson plans for a specific class
  getClassLessonPlans: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get all lesson plans for this class and teacher
        const lessonPlans = await ctx.prisma.lessonPlan.findMany({
          where: {
            classId: input.classId,
            teacherId: user.teacherProfile.id,
          },
          include: {
            teacher: {
              include: {
                user: true
              }
            },
            class: true,
            subject: true
          },
          orderBy: {
            updatedAt: 'desc'
          }
        });

        return lessonPlans;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class lesson plans: ${(error as Error).message}`,
        });
      }
    }),

  // Delete an activity
  deleteActivity: protectedProcedure
    .input(z.object({
      activityId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Update the activity status to DELETED
        const deletedActivity = await ctx.prisma.activity.update({
          where: { id: input.activityId },
          data: { status: 'DELETED' as SystemStatus }
        });

        return deletedActivity;
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete activity: ${(error as Error).message}`,
        });
      }
    }),

  // Create a teacher at the system level
  createSystemTeacher: protectedProcedure
    .input(createSystemTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to create teachers at system level
      const userType = ctx.session?.user?.userType;
      if (userType !== UserType.SYSTEM_ADMIN && userType !== UserType.SYSTEM_MANAGER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create teachers at the system level',
        });
      }

      // Get the campus to fetch the institution ID
      const campus = await ctx.prisma.campus.findUnique({
        where: { id: input.campusId },
        select: { institutionId: true }
      });

      if (!campus) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campus not found',
        });
      }

      // Prepare user data
      const userData: any = {
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        username: input.createManualAccount && input.username ? input.username : input.email,
        userType: 'CAMPUS_TEACHER' as UserType,
        status: input.createManualAccount ? 'ACTIVE' as SystemStatus : 'INACTIVE' as SystemStatus,
        primaryCampusId: input.campusId,
        institutionId: campus.institutionId,
        // Store user's basic info in profileData
        profileData: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          address: input.address,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country,
          bio: input.bio,
        },
        teacherProfile: {
          create: {
            specialization: input.specialization,
            qualifications: input.qualifications ? [{ value: input.qualifications }] : [],
          },
        },
        activeCampuses: {
          create: {
            campusId: input.campusId,
            roleType: 'CAMPUS_TEACHER' as UserType,
            status: 'ACTIVE' as SystemStatus,
          },
        },
      };

      // If creating a manual account with password
      if (input.createManualAccount && input.password) {
        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(input.password, salt);
        userData.password = hashedPassword;

        console.log('Creating manual account with username:', userData.username);
        console.log('Password has been hashed and set');
      } else {
        console.log('Not creating manual account or no password provided');
        console.log('createManualAccount:', input.createManualAccount);
        console.log('password provided:', !!input.password);
      }

      // Create the user account for the teacher
      const teacher = await ctx.prisma.user.create({
        data: userData
      });

      // Fetch the teacher profile
      const teacherProfile = await ctx.prisma.teacherProfile.findUnique({
        where: { userId: teacher.id }
      });

      if (!teacherProfile) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create teacher profile',
        });
      }

      // Handle subject assignments if provided
      if (input.subjects?.length) {
        // Instead of directly creating TeacherSubjectAssignment records, we need to
        // first create qualifications and then assignments
        for (const subjectId of input.subjects) {
          // First create a qualification for the subject
          const qualification = await ctx.prisma.teacherSubjectQualification.create({
            data: {
              teacherId: teacherProfile.id,
              subjectId: subjectId,
              level: "BASIC",
              isVerified: true
            }
          });

          // Get the course campus info to complete the assignment
          const courseCampus = await ctx.prisma.courseCampus.findFirst({
            where: {
              campusId: input.campusId,
              course: {
                subjects: {
                  some: {
                    id: subjectId
                  }
                }
              }
            }
          });

          if (courseCampus) {
            // Now create the assignment
            await ctx.prisma.teacherSubjectAssignment.create({
              data: {
                qualificationId: qualification.id,
                campusId: input.campusId,
                courseCampusId: courseCampus.id,
                status: 'ACTIVE' as SystemStatus
              }
            });
          }
        }
      }

      // Handle invitation email if requested
      if (!input.createManualAccount && input.sendInvitation) {
        // Add your email sending logic here
      }

      return { ...teacher, teacherProfile };
    }),

  create: protectedProcedure
    .input(createTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to create teachers
      const userCampusAccess = await ctx.prisma.userCampusAccess.findFirst({
        where: {
          userId: ctx.session?.user?.id,
          campusId: input.campusId,
          status: 'ACTIVE' as SystemStatus,
        },
      });

      if (!userCampusAccess) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create teachers for this campus',
        });
      }

      // Get the campus to fetch the institution ID
      const campus = await ctx.prisma.campus.findUnique({
        where: { id: input.campusId },
        select: { institutionId: true }
      });

      if (!campus) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Campus not found',
        });
      }

      // Prepare user data
      const userData: any = {
        name: `${input.firstName} ${input.lastName}`,
        email: input.email,
        username: input.createManualAccount && input.username ? input.username : input.email,
        userType: 'CAMPUS_TEACHER' as UserType,
        status: input.createManualAccount ? 'ACTIVE' as SystemStatus : 'INACTIVE' as SystemStatus,
        primaryCampusId: input.campusId,
        institutionId: campus.institutionId,
        // Store user's basic info in profileData
        profileData: {
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone,
          address: input.address,
          city: input.city,
          state: input.state,
          postalCode: input.postalCode,
          country: input.country,
          bio: input.bio,
        },
        teacherProfile: {
          create: {
            specialization: input.specialization,
            qualifications: input.qualifications ? [{ value: input.qualifications }] : [],
          },
        },
        activeCampuses: {
          create: {
            campusId: input.campusId,
            roleType: 'CAMPUS_TEACHER' as UserType,
            status: 'ACTIVE' as SystemStatus,
          },
        },
      };

      // If creating a manual account with password
      if (input.createManualAccount && input.password) {
        // Hash the password
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(input.password, salt);
        userData.password = hashedPassword;

        console.log('Creating manual account with username:', userData.username);
        console.log('Password has been hashed and set');
      } else {
        console.log('Not creating manual account or no password provided');
        console.log('createManualAccount:', input.createManualAccount);
        console.log('password provided:', !!input.password);
      }

      // Create the user account for the teacher
      const teacher = await ctx.prisma.user.create({
        data: userData
      });

      // Fetch the teacher profile
      const teacherProfile = await ctx.prisma.teacherProfile.findUnique({
        where: { userId: teacher.id }
      });

      if (!teacherProfile) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create teacher profile',
        });
      }

      // Handle subject assignments if provided
      if (input.subjects?.length) {
        // Instead of directly creating TeacherSubjectAssignment records, we need to
        // first create qualifications and then assignments
        for (const subjectId of input.subjects) {
          // First create a qualification for the subject
          const qualification = await ctx.prisma.teacherSubjectQualification.create({
            data: {
              teacherId: teacherProfile.id,
              subjectId: subjectId,
              level: "BASIC",
              isVerified: true
            }
          });

          // Get the course campus info to complete the assignment
          const courseCampus = await ctx.prisma.courseCampus.findFirst({
            where: {
              campusId: input.campusId,
              course: {
                subjects: {
                  some: {
                    id: subjectId
                  }
                }
              }
            }
          });

          if (courseCampus) {
            // Now create the assignment
            await ctx.prisma.teacherSubjectAssignment.create({
              data: {
                qualificationId: qualification.id,
                campusId: input.campusId,
                courseCampusId: courseCampus.id,
                status: 'ACTIVE' as SystemStatus
              }
            });
          }
        }
      }

      // Handle invitation email if requested
      if (input.sendInvitation) {
        // Add your email sending logic here
      }

      return { ...teacher, teacherProfile };
    }),

  update: protectedProcedure
    .input(updateTeacherSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to update teachers
      const userType = ctx.session?.user?.userType;

      // Allow system admins to update teachers without campus access check
      if (userType !== UserType.SYSTEM_ADMIN && userType !== UserType.SYSTEM_MANAGER) {
        const userCampusAccess = await ctx.prisma.userCampusAccess.findFirst({
          where: {
            userId: ctx.session?.user?.id,
            campusId: input.campusId,
            status: 'ACTIVE' as SystemStatus,
          },
        });

        if (!userCampusAccess) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to update teachers for this campus',
          });
        }
      }

      // Get the teacher profile to update
      const teacherProfile = await ctx.prisma.teacherProfile.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          subjectQualifications: true
        }
      });

      if (!teacherProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teacher not found',
        });
      }

      // Update the user information
      const user = await ctx.prisma.user.update({
        where: { id: teacherProfile.userId },
        data: {
          name: `${input.firstName} ${input.lastName}`,
          email: input.email,
          // Store user's basic info in profileData
          profileData: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone,
            address: input.address,
            city: input.city,
            state: input.state,
            postalCode: input.postalCode,
            country: input.country,
            bio: input.bio,
          },
        },
      });

      // Update the teacher profile
      const updatedTeacherProfile = await ctx.prisma.teacherProfile.update({
        where: { id: input.id },
        data: {
          specialization: input.specialization,
          qualifications: input.qualifications ? [{ value: input.qualifications }] : [],
          // Remove joinDate as it's not in the TeacherProfile schema
        },
      });

      // Handle subject qualifications if provided
      if (input.subjects?.length) {
        // Get current subject qualifications
        const currentQualifications = await ctx.prisma.teacherSubjectQualification.findMany({
          where: { teacherId: input.id }
        });

        // Get IDs of current qualifications
        const currentSubjectIds = currentQualifications.map(qual => qual.subjectId);

        // Find subjects to add and remove
        const subjectsToAdd = input.subjects?.filter(subjectId => !currentSubjectIds.includes(subjectId)) || [];
        const subjectsToRemove = currentSubjectIds.filter(currentId => !input.subjects?.includes(currentId));

        // Remove old qualifications
        if (subjectsToRemove.length > 0) {
          await ctx.prisma.teacherSubjectQualification.deleteMany({
            where: {
              teacherId: input.id,
              subjectId: { in: subjectsToRemove }
            }
          });
        }

        // Add new qualifications using createMany for better performance
        if (subjectsToAdd.length > 0) {
          await ctx.prisma.teacherSubjectQualification.createMany({
            data: subjectsToAdd.map(subjectId => ({
              teacherId: input.id,
              subjectId,
              level: "BASIC" as const,
              isVerified: true
            })),
            skipDuplicates: true
          });
        }
      }

      // Return the updated teacher with user information
      return {
        ...updatedTeacherProfile,
        user
      };
    }),

  getAllTeachers: protectedProcedure
    .input(z.object({
      campusId: z.string(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { campusId, limit, offset, search } = input;

      const where = {
        user: {
          activeCampuses: {
            some: {
              campusId,
              status: 'ACTIVE' as SystemStatus,
            },
          },
          ...(search && {
            name: {
              contains: search,
              mode: 'insensitive' as const,
            },
          }),
        },
      };

      // Get total count for pagination
      const totalCount = await ctx.prisma.teacherProfile.count({ where });

      // Get teachers with pagination
      const teachers = await ctx.prisma.teacherProfile.findMany({
        where,
        take: limit,
        skip: offset,
        select: {
          id: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              profileData: true,
            },
          },
          // Only include essential data for performance
          _count: {
            select: {
              assignments: {
                where: { status: 'ACTIVE' as SystemStatus }
              }
            }
          }
        },
        orderBy: {
          user: {
            name: 'asc'
          }
        }
      });

      return {
        teachers,
        totalCount,
        hasMore: offset + limit < totalCount,
      };
    }),

  // Get a specific teacher by ID
  getTeacherById: protectedProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const teacher = await ctx.prisma.teacherProfile.findUnique({
        where: { id: input.id },
        include: {
          user: true,
          subjectQualifications: {
            include: {
              subject: true,
            },
          },
          assignments: {
            where: { status: 'ACTIVE' as SystemStatus },
            include: {
              class: true,
            },
          },
        },
      });

      if (!teacher) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teacher not found',
        });
      }

      return teacher;
    }),

  // Get current teacher profile
  getCurrentTeacher: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found",
          });
        }

        // If teacher profile doesn't exist, create one
        if (!user.teacherProfile) {
          const teacherProfile = await ctx.prisma.teacherProfile.create({
            data: {
              userId: user.id,
              specialization: null,
              qualifications: [],
              certifications: [],
              experience: [],
              expertise: [],
              publications: [],
              achievements: []
            }
          });

          return {
            ...teacherProfile,
            user: user
          };
        }

        return {
          ...user.teacherProfile,
          user: user
        };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get current teacher",
          cause: error,
        });
      }
    }),

  // Get classes assigned to a teacher
  getTeacherClasses: protectedProcedure
    .input(z.object({
      teacherId: z.string(), // This can be either user ID or teacher profile ID
    }))
    .query(async ({ ctx, input }) => {
      try {
        console.log("Getting teacher classes for ID:", input.teacherId);

        // Test database connection first
        await ctx.prisma.$queryRaw`SELECT 1`;

        // First, determine if the teacherId is a user ID or teacher profile ID
        // Try to find teacher profile by ID first
        let teacherProfileId = input.teacherId;

        const teacherProfile = await ctx.prisma.teacherProfile.findFirst({
          where: {
            OR: [
              { id: input.teacherId }, // Direct teacher profile ID
              { userId: input.teacherId } // User ID
            ]
          }
        });

        if (!teacherProfile) {
          console.log("No teacher profile found for ID:", input.teacherId);
          return [];
        }

        console.log("Found teacher profile:", teacherProfile.id);
        // Use the teacher profile ID for the assignment lookup
        teacherProfileId = teacherProfile.id;

        // Check if TeacherAssignment table exists and has data
        const assignmentCount = await ctx.prisma.teacherAssignment.count({
          where: {
            teacherId: teacherProfileId
          }
        });

        console.log(`Found ${assignmentCount} total assignments for teacher ${teacherProfileId}`);

        const teacherAssignments = await ctx.prisma.teacherAssignment.findMany({
          where: {
            teacherId: teacherProfileId,
            status: 'ACTIVE' as SystemStatus,
          },
          include: {
            class: {
              include: {
                campus: true,
                courseCampus: {
                  include: {
                    course: true
                  }
                },
                students: {
                  where: {
                    status: 'ACTIVE' as SystemStatus
                  }
                }
              }
            },
          },
        });

        console.log(`Found ${teacherAssignments.length} active assignments for teacher ${teacherProfileId}`);

        if (!teacherAssignments.length) {
          console.log("No active teacher assignments found for teacher profile ID:", teacherProfileId);
          return [];
        }

        const classes = teacherAssignments.map(assignment => assignment.class);
        console.log(`Returning ${classes.length} classes for teacher ${teacherProfileId}`);
        return classes;
      } catch (error) {
        console.error("Error fetching teacher classes:", error);

        // Check if it's a missing table/model error
        if (error instanceof Error && (
          error.message.includes('relation') ||
          error.message.includes('table') ||
          error.message.includes('does not exist')
        )) {
          // Return empty array if models don't exist
          return [];
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch teacher classes",
        });
      }
    }),

  // Get assessments for a class
  getClassAssessments: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Get assessments for this class
        const assessments = await ctx.prisma.assessment.findMany({
          where: {
            classId: input.classId,
            status: 'ACTIVE', // Only show active assessments by default
          },
          orderBy: {
            createdAt: "desc",
          },
          include: {
            subject: true,
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        });

        // Add additional computed properties for the frontend
        return assessments.map(assessment => ({
          ...assessment,
          completionRate: Math.round(Math.random() * 100), // Placeholder - replace with actual calculation
          averageScore: Math.round(Math.random() * 100), // Placeholder - replace with actual calculation
          assessmentType: (assessment as any).category || 'ASSIGNMENT',
          status: assessment.status.toLowerCase(),
          subjectName: assessment.subject?.name || '', // Add subject name as a separate property
        }));
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get class assessments: ${(error as Error).message}`,
        });
      }
    }),

  // Delete an assessment
  deleteAssessment: protectedProcedure
    .input(z.object({
      assessmentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get the assessment to check if the teacher has access
        const assessment = await ctx.prisma.assessment.findUnique({
          where: { id: input.assessmentId },
          include: {
            class: {
              include: {
                teachers: true
              }
            }
          }
        });

        if (!assessment) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Assessment not found",
          });
        }

        // Get the teacher profile
        const user = await ctx.prisma.user.findUnique({
          where: { id: ctx.session.user.id },
          include: { teacherProfile: true }
        });

        if (!user?.teacherProfile) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Teacher profile not found",
          });
        }

        // Check if the teacher is assigned to this class
        const isTeacherAssigned = assessment.class.teachers.some(
          assignment => assignment.teacherId === user.teacherProfile?.id
        );

        if (!isTeacherAssigned) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You are not authorized to delete this assessment",
          });
        }

        // Delete the assessment
        await ctx.prisma.assessment.update({
          where: { id: input.assessmentId },
          data: { status: 'DELETED' as SystemStatus }
        });

        return { success: true };
      } catch (error) {
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to delete assessment: ${(error as Error).message}`,
        });
      }
    }),

  // Assign a subject qualification to a teacher
  assignSubject: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      subjectId: z.string(),
      level: z.string().optional(),
      isVerified: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if the qualification already exists
      const existingQualification = await ctx.prisma.teacherSubjectQualification.findUnique({
        where: {
          teacherId_subjectId: {
            teacherId: input.teacherId,
            subjectId: input.subjectId,
          },
        },
      });

      if (existingQualification) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Teacher already has a qualification for this subject',
        });
      }

      // Create the qualification
      const qualification = await ctx.prisma.teacherSubjectQualification.create({
        data: {
          teacherId: input.teacherId,
          subjectId: input.subjectId,
          level: input.level || 'BASIC',
          isVerified: input.isVerified ?? true,
        },
        include: {
          subject: true,
        },
      });

      // Get the teacher's primary campus
      const teacher = await ctx.prisma.teacherProfile.findUnique({
        where: { id: input.teacherId },
        include: { user: true },
      });

      if (!teacher?.user?.primaryCampusId) {
        return qualification;
      }

      // Find a course campus for this subject and campus
      const courseCampus = await ctx.prisma.courseCampus.findFirst({
        where: {
          campusId: teacher.user.primaryCampusId,
          course: {
            subjects: {
              some: {
                id: input.subjectId,
              },
            },
          },
        },
      });

      // If we found a course campus, create an assignment
      if (courseCampus) {
        await ctx.prisma.teacherSubjectAssignment.create({
          data: {
            qualificationId: qualification.id,
            campusId: teacher.user.primaryCampusId,
            courseCampusId: courseCampus.id,
            status: 'ACTIVE' as SystemStatus,
          },
        });
      }

      return qualification;
    }),

  // Update teacher status (activate/deactivate)
  updateTeacherStatus: protectedProcedure
    .input(z.object({
      teacherId: z.string(),
      status: z.enum(['ACTIVE', 'INACTIVE']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user has permission to update teacher status
      const userType = ctx.session?.user?.userType;
      if (userType !== UserType.SYSTEM_ADMIN && userType !== UserType.SYSTEM_MANAGER) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to update teacher status',
        });
      }

      // Get the teacher profile
      const teacherProfile = await ctx.prisma.teacherProfile.findUnique({
        where: { id: input.teacherId },
        select: { userId: true }
      });

      if (!teacherProfile) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Teacher not found',
        });
      }

      // Update the user status
      const updatedUser = await ctx.prisma.user.update({
        where: { id: teacherProfile.userId },
        data: { status: input.status as SystemStatus },
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          userType: true
        }
      });

      return updatedUser;
    }),

  // Get students for a specific class
  getClassStudents: protectedProcedure
    .input(z.object({
      classId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        // Ensure user is authenticated and is a teacher
        if (!ctx.session?.user?.id || (ctx.session.user.userType !== UserType.CAMPUS_TEACHER && ctx.session.user.userType !== 'TEACHER')) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Not authorized",
          });
        }

        // Get student enrollments for the class
        const enrollments = await ctx.prisma.studentEnrollment.findMany({
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
                    email: true,
                    profileData: true,
                  },
                },
              },
            },
          },
          orderBy: {
            student: {
              user: {
                name: 'asc',
              },
            },
          },
        });

        // Transform the data to match the expected format in the EnhancedStudentGrid component
        const students = enrollments.map(enrollment => {
          // Calculate attendance rate (placeholder - you can implement actual calculation)
          const attendanceRate = Math.floor(Math.random() * 100); // Placeholder

          // Calculate completion rate (placeholder)
          const completionRate = Math.floor(Math.random() * 100); // Placeholder

          // Calculate average score (placeholder)
          const averageScore = Math.floor(Math.random() * 100); // Placeholder

          // Extract image from profileData if available
          const profileData = enrollment.student.user.profileData as any;
          const image = profileData?.image || profileData?.profileImage || null;

          return {
            id: enrollment.studentId,
            name: enrollment.student.user.name || '',
            email: enrollment.student.user.email || '',
            image,
            attendanceRate,
            completionRate,
            averageScore,
            status: 'active',
          };
        });

        return students;
      } catch (error) {
        console.error('Error getting students for class:', error);
        throw error instanceof TRPCError
          ? error
          : new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "An error occurred while retrieving students for class",
            });
      }
    }),
});
