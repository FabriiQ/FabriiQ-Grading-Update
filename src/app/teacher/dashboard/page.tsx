import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { prisma } from "@/server/db";
import { SystemStatus, UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { TeacherDashboardContent } from "@/components/dashboard/TeacherDashboardContent";
import { PageHeader } from "@/components/ui/page-header";
import TeacherMetrics from "@/components/teacher/dashboard/TeacherMetrics";


export default async function TeacherDashboardPage() {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      return redirect("/login");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        userType: true,
        primaryCampusId: true,
        teacherProfile: {
          select: {
            id: true,
            assignments: {
              where: { status: "ACTIVE" as SystemStatus },
              select: {
                class: {
                  select: {
                    id: true,
                    name: true,
                    students: {
                      select: { id: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      logger.error("User not found", { userId: session.user.id });
      return redirect("/login");
    }

    if (user.userType !== UserType.CAMPUS_TEACHER && user.userType !== 'TEACHER') {
      logger.error("Unauthorized user type", { userType: user.userType });
      return redirect("/unauthorized");
    }

    if (!user.primaryCampusId) {
      logger.warn("Teacher has no primary campus assigned", { userId: user.id });
      return (
        <div className="container mx-auto p-6">
          <PageHeader
            title="Welcome"
            description="Please contact your administrator to assign you to a campus."
          />
        </div>
      );
    }

    const activeClasses = user.teacherProfile?.assignments.map(assignment => ({
      id: assignment.class.id,
      name: assignment.class.name,
      students: assignment.class.students
    })) || [];

    const totalStudents = activeClasses.reduce((sum, cls) =>
      sum + cls.students.length, 0
    );

    // Get campus name
    const campus = await prisma.campus.findUnique({
      where: { id: user.primaryCampusId },
      select: { name: true }
    });

    const campusName = campus?.name || "Campus";

    // Get real attendance rate for teacher's classes
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        classId: {
          in: activeClasses.map(cls => cls.id),
        },
        date: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const totalRecords = attendanceRecords.length;
    const presentRecords = attendanceRecords.filter(record => record.status === 'PRESENT').length;
    const attendanceRate = totalRecords > 0 ? Math.round((presentRecords / totalRecords) * 100) : 0;

    // Get real pending assessments count
    const pendingAssessments = await prisma.assessment.findMany({
      where: {
        createdById: user.id,
        status: SystemStatus.ACTIVE,
        dueDate: {
          gte: new Date(), // Future due dates
        },
        submissions: {
          none: {}, // No submissions yet, or incomplete submissions
        },
      },
    });

    // Custom metrics for teacher with real data
    const metrics = {
      classes: { value: activeClasses.length, description: "Active classes" },
      students: { value: totalStudents, description: "Total students" },
      attendance: { value: `${attendanceRate}%`, description: "Avg. attendance" },
      assessments: { value: pendingAssessments.length, description: "Pending assessments" },
    };

    // Check if teacherProfile exists
    if (!user.teacherProfile) {
      logger.error("Teacher profile not found", { userId: user.id });
      throw new Error("Teacher profile not found");
    }

    return (
      <div className="space-y-6">
        <TeacherMetrics teacherId={user.teacherProfile.id} />
        <TeacherDashboardContent
          campusId={user.primaryCampusId}
          campusName={campusName}
          teacherId={user.teacherProfile.id}
        />
      </div>
    );
  } catch (error) {
    logger.error("Error in teacher dashboard", { error });
    throw error; // Let the error boundary handle it
  }
}
