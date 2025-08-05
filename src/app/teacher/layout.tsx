import { redirect } from "next/navigation";
import { getSessionCache } from "@/utils/session-cache";
import { UserType } from "@prisma/client";
import { logger } from "@/server/api/utils/logger";
import { TeacherLayoutClient } from "@/components/teacher/layout/TeacherLayoutClient";
import { cachedQueries } from "@/server/db";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const session = await getSessionCache();

    if (!session?.user?.id) {
      logger.debug("No session found in TeacherLayout, redirecting to login");
      return redirect("/login");
    }

    if (session.user.userType !== UserType.CAMPUS_TEACHER && session.user.userType !== 'TEACHER') {
      logger.warn("Non-teacher attempting to access teacher layout", {
        userType: session.user.userType,
        userId: session.user.id
      });
      return redirect("/unauthorized");
    }

    // Get teacher profile from database using cached query
    const user = session.user;

    // Use cached query to fetch the teacher profile from the database
    const dbUser = await cachedQueries.getCachedQuery(
      `teacher-profile:${user.id}`,
      async () => {
        // Use a more efficient query with timeout protection
        const result = await Promise.race([
          cachedQueries.getUserWithCache(user.id),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Query timeout')), 5000)
          )
        ]);

        if (!result) return null;

        // Get teacher profile separately if user exists
        if (result.userType === UserType.CAMPUS_TEACHER || result.userType === 'TEACHER') {
          try {
            const teacherProfile = await cachedQueries.getCachedQuery(
              `teacher-profile-data:${user.id}`,
              async () => {
                const { prisma } = await import("@/server/db");
                return await prisma.teacherProfile.findFirst({
                  where: { userId: user.id },
                  select: { id: true }
                });
              },
              2 * 60 * 1000 // 2 minute cache
            );

            return {
              ...result,
              teacherProfile
            };
          } catch (error) {
            logger.warn("Failed to fetch teacher profile", { userId: user.id, error });
            return { ...result, teacherProfile: null };
          }
        }

        return { ...result, teacherProfile: null };
      },
      5 * 60 * 1000 // 5 minute cache
    );

    if (!dbUser) {
      logger.error("User not found in database", { userId: user.id });
      return redirect("/login");
    }

    if (!dbUser.teacherProfile?.id) {
      logger.error("Teacher profile not found in database", { userId: user.id });
      return redirect("/unauthorized");
    }

    const teacherId = dbUser.teacherProfile.id;

    return (
      <TeacherLayoutClient
        teacherId={teacherId}
        userName={dbUser.name || "Teacher"}
        userEmail={dbUser.email || ""}
        userImage={undefined}
      >
        {children}
      </TeacherLayoutClient>
    );
  } catch (error) {
    logger.error("Error in TeacherLayout", { error });
    return redirect("/login");
  }
}