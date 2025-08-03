'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { TeacherDashboardContent } from "@/components/dashboard/TeacherDashboardContent";
import { QuickTeacherLoading } from '@/components/teacher/loading/TeacherLoadingState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export default function TeacherDashboardPage() {
  const { data: session, status } = useSession();

  // Fetch teacher data
  const { data: teacherData, isLoading: isLoadingTeacher, error } = api.teacher.getDashboardData.useQuery(
    undefined,
    {
      enabled: !!session?.user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Show loading state
  if (status === 'loading' || isLoadingTeacher) {
    return <QuickTeacherLoading configKey="dashboard" />;
  }

  // Show error state
  if (error || !teacherData) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error?.message || 'Failed to load dashboard data. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <TeacherDashboardContent teacherData={teacherData} />
    </div>
  );
}
