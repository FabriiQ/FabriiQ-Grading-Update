'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { ClassLearningPatternsView } from '@/features/learning-patterns/components/ClassLearningPatternsView';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function ClassLearningPatternsPage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const classId = params.classId as string;

  // Redirect if not authenticated or not a teacher
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!session) {
    redirect('/auth/signin');
  }

  if (session.user.userType !== 'CAMPUS_TEACHER') {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. This page is only available to teachers.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get class information
  const { data: classInfo, isLoading: classLoading, error: classError } = 
    api.class.getClassById.useQuery({ classId });

  if (classLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (classError || !classInfo) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Class not found or you don't have permission to view this class.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Verify teacher has access to this class
  if (classInfo.teacherId !== session.user.id) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view learning patterns for this class.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <ClassLearningPatternsView
        classId={classId}
        className={classInfo.name}
        teacherId={session.user.id}
      />
    </div>
  );
}
