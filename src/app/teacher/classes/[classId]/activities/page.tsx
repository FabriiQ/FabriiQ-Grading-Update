'use client';

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ActivityList } from "@/features/activties";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus, RefreshCw } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SystemStatus } from "@prisma/client";
import { useToast } from "@/components/ui/feedback/toast";

export default function ClassActivitiesPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Fetch activities for this class with optimized caching - MOVED BEFORE CONDITIONAL RETURNS
  const { data: activitiesData, isLoading: isLoadingActivities, error: activitiesError, refetch } = api.class.listActivities.useQuery(
    {
      classId,
      status: SystemStatus.ACTIVE,
    },
    {
      enabled: !!classId && !!session?.user?.id && status === 'authenticated',
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
      onError: (error) => {
        console.error('Failed to fetch activities:', error);
        toast({
          title: "Error",
          description: "Failed to load activities. Please try again.",
          variant: "error",
        });
      }
    }
  );

  // Transform activities data to match the expected format
  const transformedActivities = activitiesData?.items?.map((activity: any) => ({
    id: activity.id,
    title: activity.title,
    description: activity.description || '',
    type: activity.learningType || activity.purpose || 'OTHER',
    status: (activity.status?.toLowerCase() === 'active' ? 'published' : 'draft') as 'published' | 'draft' | 'archived',
    createdAt: new Date(activity.createdAt),
    updatedAt: new Date(activity.updatedAt),
    author: {
      id: session?.user?.id || '',
      name: session?.user?.name || 'Unknown',
      avatar: undefined, // session?.user doesn't have image property
    },
    stats: {
      totalSubmissions: activity._count?.activityGrades || 0,
      averageScore: 0, // TODO: Calculate from grades
      completionRate: 0, // TODO: Calculate completion rate
      timeSpent: activity.duration || 0,
    },
    settings: {
      maxScore: activity.maxScore || 100,
      timeLimit: activity.duration,
      attempts: 1, // TODO: Get from activity settings
      gradingMethod: (activity.isGradable ? 'auto' : 'manual') as 'auto' | 'manual' | 'hybrid',
    },
    tags: [],
    subject: activity.subject?.name,
    gradeLevel: undefined,
    // Additional properties for compatibility
    dueDate: activity.endDate,
    subjectName: activity.subject?.name,
    topicName: activity.topic?.title,
    participantCount: activity._count?.activityGrades || 0,
    isGradable: activity.isGradable,
    maxScore: activity.maxScore,
    bloomsLevel: activity.bloomsLevel,
    duration: activity.duration,
    purpose: activity.purpose,
    learningType: activity.learningType,
    assessmentType: activity.assessmentType,
  })) || [];

  console.log('Activities data:', activitiesData);
  console.log('Transformed activities:', transformedActivities);

  // Show loading state first
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

  // Show error state for activities
  if (activitiesError) {
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Activities</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load activities: {activitiesError.message}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
              {activitiesData?.total === 0
                ? "There are no activities for this class yet. Create your first activity to get started."
                : "No activities match the current filters."
              }
            </p>
            <div className="flex gap-2">
              <Link href={`/teacher/classes/${classId}/activities/create`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Activity
                </Button>
              </Link>
              {activitiesData?.total !== 0 && (
                <Button variant="outline" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <ActivityList
          activities={transformedActivities}
          onEdit={(activity) => {
            // Check if activity has attempts before allowing edit
            if (activity.stats.totalSubmissions > 0) {
              toast({
                title: "Cannot Edit Activity",
                description: "This activity cannot be edited because students have already submitted attempts.",
                variant: "error",
              });
              return;
            }
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


