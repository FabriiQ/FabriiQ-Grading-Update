'use client';

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ActivityList } from "@/features/activties";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // Fetch activities for this class
  const { data: activitiesData, isLoading: isLoadingActivities, refetch } = api.class.listActivities.useQuery(
    {
      classId,
      status: 'ACTIVE',
    },
    {
      enabled: !!classId,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Transform activities data to match the expected format
  const transformedActivities = activitiesData?.activities?.map((activity: any) => ({
    id: activity.id,
    title: activity.title,
    description: activity.description || '',
    type: activity.learningType || 'OTHER',
    status: activity.status,
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt,
    dueDate: activity.endDate,
    subjectName: activity.subject?.name,
    topicName: activity.topic?.title,
    participantCount: activity._count?.activityGrades || 0,
    isGradable: activity.isGradable,
    maxScore: activity.maxScore,
    bloomsLevel: activity.bloomsLevel,
    duration: activity.duration,
  })) || [];

  // Show loading state for activities
  if (isLoadingActivities) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Class Activities</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Class Activities</h1>
        <Link href={`/teacher/classes/${classId}/activities/create`}>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Activity
          </Button>
        </Link>
      </div>

      {transformedActivities.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Activities Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              There are no activities for this class yet. Create your first activity to get started.
            </p>
            <Link href={`/teacher/classes/${classId}/activities/create`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create First Activity
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
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
      )}
    </div>
  );
}


