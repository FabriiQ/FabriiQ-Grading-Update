import React from "react";
import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { TeacherSocialWallClient } from "./client";

export const metadata: Metadata = {
  title: "Class Social Wall",
  description: "Engage with your class through the social wall",
};

export default async function TeacherSocialWallPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  // Await params to ensure it's fully resolved
  const { classId } = await params;
  const session = await getSessionCache();

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Get user details from database
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
        },
      },
    },
  });

  if (!user || (user.userType !== 'CAMPUS_TEACHER' && user.userType !== 'TEACHER') || !user.teacherProfile) {
    redirect("/login");
  }

  // Get class details and verify teacher access
  const classDetails = await prisma.class.findUnique({
    where: {
      id: classId,
    },
    include: {
      courseCampus: {
        include: {
          course: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!classDetails) {
    redirect("/teacher/classes");
  }

  // Check if the teacher has access to this class (same logic as service)
  const isPrimaryTeacher = classDetails.classTeacherId === user.teacherProfile.id;

  // Check if teacher is assigned to this class
  const teacherAssignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: user.teacherProfile.id,
      classId: classId,
      status: 'ACTIVE'
    }
  });

  const hasAssignment = !!teacherAssignment;
  const hasAccess = isPrimaryTeacher || hasAssignment;

  console.log('Social Wall Access Check:', {
    userId: user.id,
    teacherProfileId: user.teacherProfile.id,
    classId,
    isPrimaryTeacher,
    hasAssignment,
    hasAccess,
    classTeacherId: classDetails.classTeacherId
  });

  if (!hasAccess) {
    console.log('Teacher does not have access to social wall for class:', classId);
    redirect("/teacher/classes");
  }

  return (
    <TeacherSocialWallClient
      classId={classId}
      className={classDetails.name}
      courseName={classDetails.courseCampus?.course?.name}
    />
  );
}
