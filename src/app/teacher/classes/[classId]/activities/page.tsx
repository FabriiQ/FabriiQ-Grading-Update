'use client';

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ActivityList } from "@/features/activties";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function ClassActivitiesPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Show loading state
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Check authentication
  if (status === 'unauthenticated' || !session?.user?.id) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to view class activities.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if user is a teacher
  if (session.user.userType !== 'CAMPUS_TEACHER' && session.user.userType !== 'TEACHER') {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You must be a teacher to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // For now, use empty activities array - this will be populated by the actual data fetching logic
  const transformedActivities: any[] = [];

  return (
    <div className="container mx-auto py-6">
      <ActivityList
        activities={transformedActivities}
        onEdit={(activity) => {
          // Handle edit navigation
          router.push(`/teacher/classes/${classId}/activities/${activity.id}/edit`);
        }}
        onView={(activity) => {
          // Handle view navigation
          router.push(`/teacher/classes/${classId}/activities/${activity.id}`);
        }}
        onDuplicate={(activity) => {
          // Handle duplicate
          console.log('Duplicate activity:', activity.id);
        }}
        onDelete={(activity) => {
          // Handle delete
          console.log('Delete activity:', activity.id);
        }}
        className="w-full"
      />
    </div>
  );
}


