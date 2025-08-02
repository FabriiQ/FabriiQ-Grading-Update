'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { BloomsAnalyticsDashboard } from '@/features/bloom/components/analytics';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { use } from 'react';
import { useRouter } from 'next/navigation';

interface BloomsAnalyticsPageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default function BloomsAnalyticsPage({ params }: BloomsAnalyticsPageProps) {
  // Unwrap the params Promise using React's use() hook
  const resolvedParams = use(params);
  const { classId } = resolvedParams;
  
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);
  
  // Get class details
  const { data: classDetails, isLoading: isLoadingClass, error: classError } = api.class.getClassById.useQuery(
    { id: classId },
    { enabled: !!classId && status === 'authenticated' }
  );
  
  // Get teacher ID
  const { data: teacher, isLoading: isLoadingTeacher, error: teacherError } = api.teacher.getTeacherByUserId.useQuery(
    { userId: session?.user?.id || '' },
    { enabled: !!session?.user?.id }
  );
  
  // Loading state
  if (status === 'loading' || isLoadingClass || isLoadingTeacher) {
    return (
      <div className="container py-6">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <Skeleton className="h-8 w-1/2 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }
  
  // Return null while redirecting
  if (status === 'unauthenticated') {
    return null;
  }
  
  // Handle teacher query error
  if (teacherError) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Teacher Data</AlertTitle>
          <AlertDescription>
            Failed to load teacher information. Please try again or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Handle class query error
  if (classError) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Class Data</AlertTitle>
          <AlertDescription>
            Failed to load class information. Please try again or contact support.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // No teacher found
  if (!teacher) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Error</AlertTitle>
          <AlertDescription>
            You must be a teacher to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // No class found
  if (!classDetails) {
    return (
      <div className="container py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Class Not Found</AlertTitle>
          <AlertDescription>
            The requested class could not be found or you don't have permission to access it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      <BloomsAnalyticsDashboard
        classId={classId}
        teacherId={teacher.id}
      />
    </div>
  );
}