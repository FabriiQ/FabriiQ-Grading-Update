"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import { Button } from '@/components/ui/button';
import {
  GraduationCap,
  BookOpen,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/utils/api';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { TeacherLeaderboardPreview } from '@/components/teacher/dashboard/TeacherLeaderboardPreview';
import { TeacherPerformanceMetrics } from '@/components/teacher/dashboard/TeacherPerformanceMetrics';
import { useTeacherRealTimeUpdates } from '@/features/teacher/hooks/useTeacherMemoryCleanup';
import {
  useOptimizedTeacherDashboard,
  useTeacherDashboardPerformance,
  withTeacherDashboardMemo
} from '@/features/teacher/services/teacher-dashboard-performance.service';

interface TeacherDashboardContentProps {
  campusId: string;
  campusName: string;
  teacherId: string;
}

function TeacherDashboardContentInner({ campusId, campusName, teacherId }: TeacherDashboardContentProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Use optimized dashboard data fetching
  const {
    data: dashboardData,
    isLoading,
    error,
    refresh,
    isCached,
    cacheHitRate
  } = useOptimizedTeacherDashboard(teacherId, campusId);

  // Performance monitoring
  const { renderCount } = useTeacherDashboardPerformance('TeacherDashboardContent');

  // Extract data from optimized response
  const teacherMetrics = dashboardData.teacherMetrics;
  const teacherClasses = dashboardData.teacherClasses;
  const isLoadingMetrics = isLoading;
  const isLoadingTeacherClasses = isLoading;

  // Handle errors
  React.useEffect(() => {
    if (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'error',
      });
    }
  }, [error, toast]);

  // Function to refresh all data using optimized refresh
  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      await refresh();
      toast({
        title: 'Data refreshed',
        description: `Dashboard data has been updated ${isCached ? '(from cache)' : ''}`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh dashboard data',
        variant: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Use the memory-safe real-time updates hook
  useTeacherRealTimeUpdates(() => {
    refreshAllData();
  });

  // Use teacher classes from optimized dashboard data
  const teacherClassesData = teacherClasses || [];



  // Calculate student count from teacher classes
  const studentsData = React.useMemo(() => {
    if (!teacherClassesData || teacherClassesData.length === 0) return [];

    // Collect all students from all classes
    const allStudents = teacherClassesData.flatMap(cls => (cls as any).students || []);

    // Return unique students by ID
    const uniqueStudents = Array.from(
      new Map(allStudents.map(student => [student.studentId, student])).values()
    );

    return uniqueStudents;
  }, [teacherClassesData]);

  const isLoadingStudents = isLoadingTeacherClasses;

  // Show loading state if any data is loading
  if (isLoadingMetrics || isLoadingTeacherClasses) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Teacher Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={refreshAllData}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">




          {/* Teacher Leaderboard Preview */}
          <TeacherLeaderboardPreview
            teacherId={teacherId}
            campusId={campusId}
          />

        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Teacher Performance Metrics */}
          <TeacherPerformanceMetrics
            teacherId={teacherId}
            timeframe="term"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Export memoized version for better performance
export const TeacherDashboardContent = withTeacherDashboardMemo(
  TeacherDashboardContentInner,
  (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.teacherId === nextProps.teacherId &&
      prevProps.campusId === nextProps.campusId &&
      prevProps.campusName === nextProps.campusName
    );
  }
);
