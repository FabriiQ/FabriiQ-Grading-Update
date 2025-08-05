import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { CreateActivityClient } from "./create-activity-client";

export const metadata: Metadata = {
  title: "Create Activity",
  description: "Create a new activity for your class",
};

export default async function CreateActivityPage({
  params,
}: {
  params: Promise<{ classId: string  }>;
}) {
  const { classId } = await params;
  const session = await getSessionCache();

  if (!session?.user?.id) {
    return redirect("/login");
  }

  // Get user details from database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      userType: true,
      teacherProfile: {
        select: {
          id: true
        }
      }
    }
  });

  if (!user || (user.userType !== 'CAMPUS_TEACHER' && user.userType !== 'TEACHER') || !user.teacherProfile) {
    return redirect("/login");
  }

  // Check if the teacher is assigned to this class
  const teacherAssignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: user.teacherProfile.id,
      classId: classId
    }
  });

  if (!teacherAssignment) {
    return redirect("/teacher/classes");
  }

  // Get class details
  const classDetails = await prisma.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      name: true,
      code: true,
      status: true,
    }
  });

  if (!classDetails) {
    return redirect("/teacher/classes");
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create Activity</h1>
        <p className="text-muted-foreground">Class: {classDetails.name}</p>
      </div>
      <CreateActivityClient classId={classId} />
    </div>
  );
}
