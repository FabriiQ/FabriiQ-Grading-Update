import React from "react";
import { getSessionCache } from "@/utils/session-cache";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";
import { StudentSocialWallClient } from "./client";

export const metadata: Metadata = {
  title: "Class Social Wall",
  description: "Connect and engage with your classmates",
};

export default async function StudentSocialWallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Await params to ensure it's fully resolved
  const { id: classId } = await params;
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
      studentProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user || user.userType !== 'STUDENT' || !user.studentProfile) {
    redirect("/login");
  }

  // Get class details and verify student enrollment
  const classDetails = await prisma.class.findUnique({
    where: {
      id: classId,
    },
    include: {
      students: {
        where: {
          studentId: user.studentProfile.id,
          status: 'ACTIVE',
        },
        select: {
          id: true,
        },
      },
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
    redirect("/student/classes");
  }

  // Check if the student is enrolled in this class
  if (classDetails.students.length === 0) {
    redirect("/student/classes");
  }

  return (
    <StudentSocialWallClient
      classId={classId}
      className={classDetails.name}
      courseName={classDetails.courseCampus?.course?.name}
    />
  );
}
