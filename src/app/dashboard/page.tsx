import { redirect } from "next/navigation";
import { UserType } from "@prisma/client";
import { getSessionCache } from "@/utils/session-cache";
import { logger } from "@/server/api/utils/logger";

/**
 * Optimized dashboard redirect page
 * This page efficiently redirects users to their role-based dashboard
 */
export default async function DashboardPage() {
  // Get session directly without caching delays
  const session = await getSessionCache();

  // If no session, redirect to login immediately
  if (!session?.user) {
    logger.debug("No session found, redirecting to login");
    redirect("/login");
  }

  // At this point, session is guaranteed to be non-null due to the check above
  const user = session.user;
  const userType = user.userType as UserType;
  logger.debug("Dashboard redirect for user", {
    userId: user.id,
    userType
  });

  // Direct redirect based on user role - no fallback UI needed
  switch (userType) {
    case 'SYSTEM_ADMIN':
      redirect("/admin/system");
    case 'CAMPUS_ADMIN':
      redirect("/admin/campus");
    case 'CAMPUS_COORDINATOR':
    case 'COORDINATOR':
      redirect("/admin/coordinator");
    case 'CAMPUS_TEACHER':
    case 'TEACHER':
      redirect("/teacher/dashboard");
    case 'CAMPUS_STUDENT':
    case 'STUDENT':
      redirect("/student/classes");
    case 'CAMPUS_PARENT':
      redirect("/parent/dashboard");
    default:
      logger.warn("Unknown user type, redirecting to login", { userType });
      redirect("/login");
  }

  // This is just a fallback dashboard that should only be shown if the redirect fails
  // or if the user type doesn't match any of the above cases
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Welcome, {user.name || user.username}!</h2>
          <p className="text-gray-600">You are logged in as: <span className="font-medium">{userType}</span></p>
          <p className="mt-4 text-amber-600">Redirecting you to the appropriate dashboard...</p>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Your Account</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">User ID</p>
              <p className="font-medium">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">{userType}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}