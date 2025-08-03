'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { ClassesGrid } from "@/components/teacher/classes/ClassesGrid";
import { QuickTeacherLoading } from '@/components/teacher/loading/TeacherLoadingState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function TeacherClassesPage() {
  const { data: session, status } = useSession();

  // Fetch teacher classes with proper cleanup
  const { data: classes, isLoading, error } = api.class.getTeacherClasses.useQuery(
    undefined,
    {
      enabled: !!session?.user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 30000, // Refresh every 30 seconds
      refetchIntervalInBackground: false, // Stop refetching when tab is not active
    }
  );

  // Show loading state
  if (status === 'loading' || isLoading) {
    return <QuickTeacherLoading configKey="classes" />;
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error.message || 'Failed to load classes. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <ClassesGrid classes={classes || []} />
    </div>
  );
}