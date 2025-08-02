import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import StudentClassList from "@/components/shared/entities/students/StudentClassList";
import { logger } from "@/server/api/utils/logger";
import { prisma } from "@/server/db";
import { SystemStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "My Classes",
  description: "View and manage your enrolled classes",
};

export default async function StudentClassesPage() {
  try {
    logger.debug("Student classes page accessed");
    const session = await getSessionCache();

    if (!session?.user?.id) {
      logger.warn("No session or user ID found in student classes");
      return redirect("/login");
    }

    // Check if user is a student (either CAMPUS_STUDENT or STUDENT)
    const isStudent = session.user.userType === 'CAMPUS_STUDENT' || session.user.userType === 'STUDENT';

    if (!isStudent) {
      logger.warn("User is not a student", {
        userId: session.user.id,
        actualUserType: session.user.userType
      });
      return redirect("/login");
    }

    // Fetch real class data using Prisma
    logger.debug("Fetching student classes from database");

    // Find the student profile
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!studentProfile) {
      logger.warn("Student profile not found", { userId: session.user.id });
      return redirect("/login");
    }

    // Find all active enrollments for this student
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        studentId: studentProfile.id,
        status: SystemStatus.ACTIVE,
      },
      include: {
        class: {
          include: {
            courseCampus: {
              include: {
                course: {
                  include: {
                    subjects: true
                  }
                }
              }
            },
            term: true,
            classTeacher: {
              include: {
                user: true
              }
            },
            facility: true,
            activities: {
              where: {
                status: SystemStatus.ACTIVE
              },
              include: {
                activityGrades: {
                  where: {
                    studentId: studentProfile.id
                  }
                }
              }
            },
            attendance: {
              where: {
                studentId: studentProfile.id,
                date: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
                }
              }
            }
          }
        }
      },
    });

    // Transform the data to match the expected format
    const classes = enrollments.map(enrollment => {
      const cls = enrollment.class;
      const course = cls.courseCampus?.course;
      const teacher = cls.classTeacher?.user;

      // Create class data object with the expected format
      return {
        id: cls.id,
        name: cls.name,
        subject: {
          id: course?.id || '',
          name: course?.name || 'Unknown Subject',
          code: course?.code || ''
        },
        teacher: teacher ? {
          id: teacher.id,
          name: teacher.name || 'Unknown Teacher',
          avatar: undefined
        } : undefined,
        schedule: cls.facility ? {
          days: ['Mon', 'Wed', 'Fri'], // Default schedule
          startTime: '09:00',
          endTime: '10:30'
        } : undefined,
        // Calculate real progress based on completed activities
        progress: cls.activities && cls.activities.length > 0
          ? Math.round((cls.activities.filter(activity =>
              activity.activityGrades?.some(grade => grade.studentId === studentProfile.id && grade.score !== null)
            ).length / cls.activities.length) * 100)
          : 0,

        // Real activity counts from database
        activitiesCount: cls.activities?.length || 0,
        pendingActivitiesCount: cls.activities?.filter(activity =>
          !activity.activityGrades?.some(grade => grade.studentId === studentProfile.id && grade.score !== null)
        ).length || 0,

        // Real last activity date from most recent activity grade
        lastActivity: cls.activities?.reduce((latest, activity) => {
          const studentGrade = activity.activityGrades?.find(grade => grade.studentId === studentProfile.id);
          if (studentGrade && studentGrade.updatedAt) {
            return !latest || studentGrade.updatedAt > latest ? studentGrade.updatedAt : latest;
          }
          return latest;
        }, null as Date | null) || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),

        // Calculate importance based on pending activities and deadlines
        importance: (() => {
          const pendingCount = cls.activities?.filter(activity =>
            !activity.activityGrades?.some(grade => grade.studentId === studentProfile.id && grade.score !== null)
          ).length || 0;
          return pendingCount > 5 ? 'high' : pendingCount > 2 ? 'medium' : 'low';
        })() as 'high' | 'medium' | 'low',

        // Check if this is a new term (within 30 days of start date)
        isNewTerm: cls.term?.startDate ?
          (new Date().getTime() - new Date(cls.term.startDate).getTime()) < (30 * 24 * 60 * 60 * 1000) : false,

        // Additional fields for enhanced UX - calculated from real data
        hasLimitedTimeActivities: cls.activities?.some(activity =>
          activity.endDate && new Date(activity.endDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ) || false,
        limitedTimeActivitiesCount: cls.activities?.filter(activity =>
          activity.endDate && new Date(activity.endDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ).length || 0,
        nextDeadline: cls.activities?.reduce((earliest, activity) => {
          if (activity.endDate && new Date(activity.endDate) > new Date()) {
            return !earliest || new Date(activity.endDate) < earliest ? new Date(activity.endDate) : earliest;
          }
          return earliest;
        }, null as Date | null),
        // Calculate real attendance rate from attendance records
        attendanceRate: cls.attendance?.length > 0
          ? Math.round((cls.attendance.filter(record => record.status === 'PRESENT').length / cls.attendance.length) * 100)
          : 85, // Default if no attendance data
        // Calculate average grade from activity grades
        averageGrade: (() => {
          const studentGrades = cls.activities?.flatMap(activity =>
            activity.activityGrades?.filter(grade => grade.studentId === studentProfile.id && grade.score !== null) || []
          ) || [];
          if (studentGrades.length === 0) return 'N/A';
          const avgScore = studentGrades.reduce((sum, grade) => sum + (grade.score || 0), 0) / studentGrades.length;
          if (avgScore >= 90) return 'A';
          if (avgScore >= 80) return 'B+';
          if (avgScore >= 70) return 'B';
          if (avgScore >= 60) return 'C+';
          return 'C';
        })()
      };
    });

    logger.debug("Rendering student classes list", { classCount: classes.length });

    // Use the StudentClassList component directly with the new URL structure
    // This component will link to /student/class/[id]/dashboard instead of /student/classes/[id]
    return (
      <div className="page-content container mx-auto py-6">
        <StudentClassList
          classes={classes}
          defaultSortBy="lastActivity"
          defaultSortOrder="desc"
          showFilters={true}
          showSearch={true}
          onRefresh={undefined}
          isRefreshing={false}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error in student classes page", { error });

    // Return a simple error message
    return (
      <div className="page-content container mx-auto py-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-red-200 dark:border-red-900">
          <h2 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Error Loading Classes</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">There was an error loading your classes. Please try again later.</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Error details: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}
