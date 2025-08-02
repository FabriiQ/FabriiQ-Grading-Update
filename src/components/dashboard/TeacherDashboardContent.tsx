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

interface TeacherDashboardContentProps {
  campusId: string;
  campusName: string;
  teacherId: string;
}

export function TeacherDashboardContent({ campusId, campusName, teacherId }: TeacherDashboardContentProps) {
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Fetch teacher performance metrics
  const {
    data: teacherMetrics,
    isLoading: isLoadingMetrics,
    refetch: refetchMetrics
  } = api.teacherAnalytics.getTeacherMetrics.useQuery(
    { teacherId },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching teacher metrics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load performance metrics',
          variant: 'error',
        });
      }
    }
  );

  // Function to refresh all data
  const refreshAllData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchMetrics()
      ]);
      toast({
        title: 'Data refreshed',
        description: 'Dashboard data has been updated',
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

  // FIXED: Add real-time event listeners for consistent teacher dashboard updates
  React.useEffect(() => {
    const handleRealTimeUpdate = () => {
      // Refresh teacher dashboard data when real-time events occur
      refreshAllData();
    };

    // Add event listeners for real-time updates
    if (typeof window !== 'undefined') {
      window.addEventListener('activity-submitted', handleRealTimeUpdate);
      window.addEventListener('dashboard-update-needed', handleRealTimeUpdate);
      window.addEventListener('analytics-refresh-needed', handleRealTimeUpdate);
    }

    // Cleanup event listeners
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('activity-submitted', handleRealTimeUpdate);
        window.removeEventListener('dashboard-update-needed', handleRealTimeUpdate);
        window.removeEventListener('analytics-refresh-needed', handleRealTimeUpdate);
      }
    };
  }, [refetchMetrics]);

  // Fetch teacher's classes using the correct API endpoint
  const {
    data: teacherClassesData = [],
    isLoading: isLoadingTeacherClasses
  } = api.teacher.getTeacherClasses.useQuery(
    { teacherId },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching teacher classes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load class data',
          variant: 'error',
        });
      }
    }
  );



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
