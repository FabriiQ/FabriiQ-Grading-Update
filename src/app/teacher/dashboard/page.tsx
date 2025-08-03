'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/trpc/react';
import { TeacherDashboardContent } from "@/components/dashboard/TeacherDashboardContent";
import { QuickTeacherLoading } from '@/components/teacher/loading/TeacherLoadingState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useOptimizedTeacherDashboard } from '@/features/teacher/services/teacher-dashboard-performance.service';

export default function TeacherDashboardPage() {
  const { data: session, status } = useSession();

  // Get teacher ID from session
  const teacherId = session?.user?.id;

  // Show loading state
  if (status === 'loading') {
    return <QuickTeacherLoading configKey="dashboard" />;
  }

  // Show error state if no session or teacher ID
  if (!session?.user?.id) {
    return (
      <div className="container mx-auto py-6">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the teacher dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <TeacherDashboardContent
        teacherId={teacherId!}
        campusId={session?.user?.primaryCampusId || ''}
        campusName={'Campus'} // Will be fetched by the component if needed
      />
    </div>
  );
}
