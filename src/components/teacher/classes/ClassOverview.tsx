'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/trpc/react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { ClassMetricsGrid } from './ClassMetricsGrid';
// Removed mastery imports due to API errors
// import { useTrpcMastery } from '@/features/bloom/hooks/useTrpcMastery';
// import { MasteryRadarChart } from '@/features/bloom/components/mastery/MasteryRadarChart';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  Award,
  TrendingUp,
  Clock,
  ChevronRight,
  BarChart,
  FileText,
  Plus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ClassOverviewProps {
  classId: string;
}

// Extended interface for class metrics that includes both ClassPerformance and custom properties
interface ExtendedClassMetrics {
  // Standard ClassPerformance properties
  attendanceRate?: number;
  participationRate?: number;
  completionRate?: number;
  averageGrade?: number;
  passingRate?: number;
  activeStudents?: number;
  presentCount?: number;
  absentCount?: number;
  lateCount?: number;
  excusedCount?: number;
  activitiesCreated?: number;

  // Custom properties that may be added by the API
  totalActivities?: number;
  totalAssessments?: number;
  assessmentCompletionRate?: number;
  completedActivities?: number;
  completedAssessments?: number;
  inactiveStudents?: number;
  averageLearningTimeMinutes?: number;
}

/**
 * ClassOverview component for displaying class overview page
 *
 * Features:
 * - Key metrics at the top
 * - Recent activities and upcoming assessments
 * - Student attendance summary
 * - Mobile-first responsive design
 */
export function ClassOverview({ classId }: ClassOverviewProps) {
  const router = useRouter();
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState('overview');

  // Memoize date calculations to prevent unnecessary re-renders and queries
  const dateRanges = useMemo(() => {
    const now = new Date();
    return {
      last30Days: {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now
      },
      last7Days: {
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now
      }
    };
  }, []); // Empty dependency array - only calculate once

  // Fetch class data
  const { data: classData, isLoading: isLoadingClass } = api.teacher.getClassById.useQuery(
    { classId },
    {
      enabled: !!classId,
      staleTime: 30 * 60 * 1000, // 30 minutes - increased to reduce polling
      cacheTime: 60 * 60 * 1000, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false, // Disable automatic refetching
      retry: 1,
    }
  );

  // Fetch class metrics
  const { data: classMetrics, isLoading: isLoadingMetrics } = api.teacher.getClassMetrics.useQuery(
    { classId },
    {
      enabled: !!classId,
      staleTime: 30 * 60 * 1000, // 30 minutes - increased to reduce polling
      cacheTime: 60 * 60 * 1000, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false, // Disable automatic refetching
      retry: 1,
    }
  );

  // Fetch recent activities
  const { data: recentActivities, isLoading: isLoadingActivities } = api.teacher.getRecentClassActivities.useQuery(
    { classId, limit: 5 },
    {
      enabled: !!classId,
      staleTime: 15 * 60 * 1000, // 15 minutes - increased to reduce polling
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false, // Disable automatic refetching
      retry: 1,
    }
  );

  // Fetch upcoming assessments
  const { data: upcomingAssessments, isLoading: isLoadingAssessments } = api.teacher.getUpcomingClassAssessments.useQuery(
    { classId, limit: 5 },
    {
      enabled: !!classId,
      staleTime: 15 * 60 * 1000, // 15 minutes - increased to reduce polling
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false, // Disable automatic refetching
      retry: 1,
    }
  );

  // Fetch attendance statistics using existing API
  const { data: attendanceStats, isLoading: isLoadingAttendanceStats, error: attendanceStatsError } = api.attendance.getClassStats.useQuery(
    {
      classId,
      startDate: dateRanges.last30Days.startDate,
      endDate: dateRanges.last30Days.endDate
    },
    {
      enabled: !!classId,
      staleTime: 30 * 60 * 1000, // 30 minutes - increased to reduce polling
      cacheTime: 60 * 60 * 1000, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false, // Disable automatic refetching
      retry: 1,
    }
  );

  // Fetch recent attendance records using existing API
  const { data: recentAttendanceRecords, isLoading: isLoadingAttendance, error: attendanceRecordsError } = api.attendance.getRecords.useQuery(
    {
      classId,
      startDate: dateRanges.last7Days.startDate,
      endDate: dateRanges.last7Days.endDate
    },
    {
      enabled: !!classId,
      staleTime: 30 * 60 * 1000, // 30 minutes - increased to reduce polling
      cacheTime: 60 * 60 * 1000, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false, // Disable automatic refetching
      retry: 1,
    }
  );

  // Cast metrics to extended type for better type safety
  const extendedMetrics = classMetrics as ExtendedClassMetrics;

  // Remove mastery analytics - causing infinite queries and errors
  // const { data: masteryAnalytics } = useTrpcMastery().getClassAnalytics(classId);

  // Fetch class rewards data
  const { data: rewardsData } = api.rewards.getClassRewardsData.useQuery(
    {
      classId,
      includeStudents: false,
      includeLeaderboard: true,
      leaderboardLimit: 3,
    },
    {
      enabled: !!classId,
      staleTime: 15 * 60 * 1000, // 15 minutes - increased to reduce polling
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchInterval: false, // Disable automatic refetching
      retry: 1,
    }
  );

  // Prepare metrics data
  const metrics = [
    {
      id: 'students',
      label: 'Students',
      value: classData?._count?.students || 0,
      icon: <Users className="h-5 w-5" />,
      color: 'blue'
    },
    {
      id: 'attendance',
      label: 'Attendance Rate',
      value: `${extendedMetrics?.attendanceRate || 0}%`,
      icon: <Calendar className="h-5 w-5" />,
      progress: extendedMetrics?.attendanceRate || 0,
      color: 'green'
    },
    {
      id: 'activities',
      label: 'Activities',
      value: extendedMetrics?.totalActivities || extendedMetrics?.activitiesCreated || 0,
      icon: <BookOpen className="h-5 w-5" />,
      change: {
        value: extendedMetrics?.completionRate || 0,
        isPositive: (extendedMetrics?.completionRate || 0) >= 0
      },
      color: 'orange'
    },
    {
      id: 'assessments',
      label: 'Assessments',
      value: extendedMetrics?.totalAssessments || 0,
      icon: <ClipboardList className="h-5 w-5" />,
      change: {
        value: extendedMetrics?.assessmentCompletionRate || 0,
        isPositive: (extendedMetrics?.assessmentCompletionRate || 0) >= 0
      },
      color: 'purple'
    },
    // Removed mastery analytics due to API errors
    // {
    //   id: 'mastery',
    //   label: 'Class Mastery',
    //   value: `${Math.round(masteryAnalytics?.averageMastery || 0)}%`,
    //   icon: <Award className="h-5 w-5" />,
    //   progress: masteryAnalytics?.averageMastery || 0,
    //   color: 'emerald'
    // },
    {
      id: 'rewards',
      label: 'Total Points',
      value: rewardsData?.stats?.totalPoints || 0,
      icon: <Award className="h-5 w-5" />,
      color: 'amber'
    }
  ];

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Class title and info */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{classData?.name || 'Class Overview'}</h2>
        <p className="text-muted-foreground">
          {classData?.courseCampus?.course?.name && (
            <>
              <span className="font-medium">{classData.courseCampus.course.name}</span>
              {' • '}
            </>
          )}
          {classData?.term?.name && (
            <span>{classData.term.name}</span>
          )}
        </p>
      </div>

      {/* Class metrics */}
      <ClassMetricsGrid
        metrics={metrics}
        isLoading={isLoadingMetrics}
      />



      {/* Tabs for recent content */}
      <Tabs defaultValue="activities" className="space-y-4">
        <TabsList>
          <TabsTrigger value="activities">Recent Activities</TabsTrigger>
          <TabsTrigger value="assessments">Upcoming Assessments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
        </TabsList>

        {/* Recent activities tab */}
        <TabsContent value="activities" className="space-y-4">
          {isLoadingActivities ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : recentActivities && recentActivities.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <CardDescription>
                  Latest activities with real-time submission and grading statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentActivities.map((activity: any) => {
                    const stats = activity.statistics;
                    const statusColor = stats?.activityStatus === 'needs_grading'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : stats?.activityStatus === 'completed'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200';

                    return (
                      <div
                        key={activity.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/teacher/classes/${classId}/activities/${activity.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                              <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-base">{activity.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {activity.subject?.name || activity.purpose || 'Activity'}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant="outline" className={statusColor}>
                              {stats?.activityStatus === 'needs_grading' && 'Needs Grading'}
                              {stats?.activityStatus === 'completed' && 'Completed'}
                              {stats?.activityStatus === 'active' && 'Active'}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(activity.createdAt.toISOString())}
                            </div>
                          </div>
                        </div>

                        {stats && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-lg">{stats.totalSubmissions}</div>
                              <div className="text-muted-foreground">Submissions</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-lg">{stats.completionRate}%</div>
                              <div className="text-muted-foreground">Completion</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-lg">{stats.gradedSubmissions}</div>
                              <div className="text-muted-foreground">Graded</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-lg">{stats.averageScore}%</div>
                              <div className="text-muted-foreground">Avg Score</div>
                            </div>
                          </div>
                        )}

                        {stats?.needsGrading && (
                          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                            <span className="font-medium">{stats.pendingSubmissions} submissions</span> need grading
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/teacher/classes/${classId}/activities`)}
                >
                  View All Activities
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recent Activities
                </CardTitle>
                <CardDescription>
                  No activities have been assigned to this class yet
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Activities Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Get started by creating your first activity for this class. Activities help engage students and track their progress.
                </p>
                <Button
                  onClick={() => router.push(`/teacher/content-studio?classId=${classId}`)}
                  className="min-w-[140px]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Activity
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Upcoming assessments tab */}
        <TabsContent value="assessments" className="space-y-4">
          {isLoadingAssessments ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2 p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : upcomingAssessments && upcomingAssessments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Upcoming Assessments
                </CardTitle>
                <CardDescription>
                  Scheduled assessments with real-time submission and grading statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingAssessments.map((assessment: any) => {
                    const stats = assessment.statistics;
                    const urgencyColor = stats?.urgency === 'high'
                      ? 'bg-red-100 text-red-800 border-red-200'
                      : stats?.urgency === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-green-100 text-green-800 border-green-200';

                    const statusColor = stats?.assessmentStatus === 'needs_grading'
                      ? 'bg-orange-100 text-orange-800 border-orange-200'
                      : stats?.assessmentStatus === 'active'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200';

                    return (
                      <div
                        key={assessment.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => router.push(`/teacher/classes/${classId}/assessments/${assessment.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-full bg-primary/10">
                              <ClipboardList className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-base">{assessment.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {assessment.subject?.name || 'Assessment'}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex gap-2">
                              {stats?.urgency && (
                                <Badge variant="outline" className={urgencyColor}>
                                  {stats.urgency === 'high' && (
                                    <>
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      Due Soon
                                    </>
                                  )}
                                  {stats.urgency === 'medium' && `${stats.daysUntilDue} days left`}
                                  {stats.urgency === 'low' && `${stats.daysUntilDue} days left`}
                                </Badge>
                              )}
                              <Badge variant="outline" className={statusColor}>
                                {stats?.assessmentStatus === 'needs_grading' && 'Needs Grading'}
                                {stats?.assessmentStatus === 'active' && 'Active'}
                                {stats?.assessmentStatus === 'upcoming' && 'Upcoming'}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Due: {assessment.dueDate ? formatDate(assessment.dueDate.toISOString()) : 'No due date'}
                            </div>
                          </div>
                        </div>

                        {stats && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-semibold text-lg">{stats.totalSubmissions}</div>
                              <div className="text-muted-foreground">Submissions</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-lg">{stats.submissionRate}%</div>
                              <div className="text-muted-foreground">Submitted</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-lg">{stats.gradedSubmissions}</div>
                              <div className="text-muted-foreground">Graded</div>
                            </div>
                            <div className="text-center">
                              <div className="font-semibold text-lg">{stats.averageScore}%</div>
                              <div className="text-muted-foreground">Avg Score</div>
                            </div>
                          </div>
                        )}

                        {stats?.assessmentStatus === 'needs_grading' && (
                          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-800">
                            <span className="font-medium">{stats.pendingSubmissions} submissions</span> need grading
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/teacher/classes/${classId}/assessments`)}
                >
                  View All Assessments
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Upcoming Assessments
                </CardTitle>
                <CardDescription>
                  No assessments have been scheduled for this class yet
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <ClipboardList className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Assessments Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Create assessments to evaluate student learning and track their progress throughout the course.
                </p>
                <Button
                  onClick={() => router.push(`/teacher/classes/${classId}/assessments/new`)}
                  className="min-w-[140px]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Assessment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance tab */}
        <TabsContent value="attendance" className="space-y-4">
          {isLoadingAttendanceStats || isLoadingAttendance ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-10 w-32" />
                </div>
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Attendance Summary
                </CardTitle>
                <CardDescription>
                  Real-time attendance records and statistics for this class
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Statistics */}
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Overall Attendance Rate</div>
                      <div className="text-3xl font-bold">
                        {attendanceStats?.success && attendanceStats.stats ?
                          Math.round(((attendanceStats.stats.statusCounts?.PRESENT || 0) /
                            Math.max((attendanceStats.stats.totalDays || 1) * (attendanceStats.stats.totalStudents || 1), 1)) * 100) :
                          extendedMetrics?.attendanceRate || 0}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last 30 days • {attendanceStats?.stats?.statusCounts?.PRESENT || extendedMetrics?.presentCount || 0} present, {attendanceStats?.stats?.statusCounts?.ABSENT || extendedMetrics?.absentCount || 0} absent
                      </div>
                    </div>
                    <Button
                      variant="default"
                      onClick={() => router.push(`/teacher/classes/${classId}/attendance`)}
                      className="min-w-[140px]"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      Take Attendance
                    </Button>
                  </div>

                  {/* Recent Attendance Records */}
                  {(Array.isArray(recentAttendanceRecords) ? false : recentAttendanceRecords?.success) &&
                   (Array.isArray(recentAttendanceRecords) ? false : recentAttendanceRecords?.attendanceRecords) &&
                   (Array.isArray(recentAttendanceRecords) ? false : (recentAttendanceRecords?.attendanceRecords?.length ?? 0) > 0) ? (
                    <div>
                      <div className="mb-4 text-sm font-medium">Recent Attendance Records</div>
                      <div className="space-y-3">
                        {/* Group records by date */}
                        {Object.entries(
                          (Array.isArray(recentAttendanceRecords) ? [] : recentAttendanceRecords?.attendanceRecords || []).reduce((acc: any, record: any) => {
                            const dateKey = record.date.toISOString().split('T')[0];
                            if (!acc[dateKey]) {
                              acc[dateKey] = {
                                date: record.date,
                                records: [],
                                stats: { present: 0, absent: 0, late: 0, excused: 0 }
                              };
                            }
                            acc[dateKey].records.push(record);
                            // Fix status mapping - use uppercase for consistency
                            const statusKey = record.status.toLowerCase();
                            if (statusKey === 'present') acc[dateKey].stats.present++;
                            else if (statusKey === 'absent') acc[dateKey].stats.absent++;
                            else if (statusKey === 'late') acc[dateKey].stats.late++;
                            else if (statusKey === 'excused') acc[dateKey].stats.excused++;
                            return acc;
                          }, {})
                        ).slice(0, 5).map(([dateKey, dayData]: [string, any]) => {
                          const totalRecords = dayData.records.length;
                          const attendanceRate = totalRecords > 0
                            ? Math.round((dayData.stats.present / totalRecords) * 100)
                            : 0;
                          const rateColor = attendanceRate >= 90
                            ? 'text-green-600'
                            : attendanceRate >= 75
                            ? 'text-yellow-600'
                            : 'text-red-600';

                          return (
                            <div key={dateKey} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium">
                                  {formatDate(dayData.date.toISOString())}
                                </div>
                                <div className={`font-semibold ${rateColor}`}>
                                  {attendanceRate}% attendance
                                </div>
                              </div>

                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div className="text-center">
                                  <div className="font-semibold text-green-600">{dayData.stats.present}</div>
                                  <div className="text-muted-foreground">Present</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold text-red-600">{dayData.stats.absent}</div>
                                  <div className="text-muted-foreground">Absent</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold text-yellow-600">{dayData.stats.late}</div>
                                  <div className="text-muted-foreground">Late</div>
                                </div>
                                <div className="text-center">
                                  <div className="font-semibold text-blue-600">{dayData.stats.excused}</div>
                                  <div className="text-muted-foreground">Excused</div>
                                </div>
                              </div>

                              <div className="mt-2">
                                <Progress value={attendanceRate} className="h-2" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No Attendance Records</h3>
                      <p className="text-muted-foreground mb-4">
                        Start taking attendance to track student participation
                      </p>
                      <Button
                        onClick={() => router.push(`/teacher/classes/${classId}/attendance`)}
                        variant="outline"
                      >
                        Take First Attendance
                      </Button>
                    </div>
                  )}

                  {/* Monthly Overview */}
                  <div>
                    <div className="mb-3 text-sm font-medium">Monthly Overview</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="font-semibold text-lg text-green-600">
                          {attendanceStats?.stats?.statusCounts?.PRESENT || extendedMetrics?.presentCount || 0}
                        </div>
                        <div className="text-green-700">Present</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="font-semibold text-lg text-red-600">
                          {attendanceStats?.stats?.statusCounts?.ABSENT || extendedMetrics?.absentCount || 0}
                        </div>
                        <div className="text-red-700">Absent</div>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="font-semibold text-lg text-yellow-600">
                          {attendanceStats?.stats?.statusCounts?.LATE || extendedMetrics?.lateCount || 0}
                        </div>
                        <div className="text-yellow-700">Late</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-semibold text-lg text-blue-600">
                          {attendanceStats?.stats?.statusCounts?.EXCUSED || extendedMetrics?.excusedCount || 0}
                        </div>
                        <div className="text-blue-700">Excused</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/teacher/classes/${classId}/attendance/history`)}
                >
                  View Attendance History
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Performance summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Class Performance
          </CardTitle>
          <CardDescription>
            Real-time performance metrics and insights for this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{extendedMetrics?.averageGrade || 0}%</div>
                <div className="text-sm text-blue-700 font-medium">Average Grade</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {(extendedMetrics?.averageGrade || 0) >= 80 ? 'Excellent' :
                   (extendedMetrics?.averageGrade || 0) >= 70 ? 'Good' :
                   (extendedMetrics?.averageGrade || 0) >= 60 ? 'Satisfactory' : 'Needs Improvement'}
                </div>
              </div>
              <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{extendedMetrics?.passingRate || 0}%</div>
                <div className="text-sm text-green-700 font-medium">Passing Rate</div>
                <div className="text-xs text-muted-foreground mt-1">Students scoring ≥60%</div>
              </div>
              <div className="text-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{extendedMetrics?.participationRate || 0}%</div>
                <div className="text-sm text-purple-700 font-medium">Participation</div>
                <div className="text-xs text-muted-foreground mt-1">Active students</div>
              </div>
              <div className="text-center p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {attendanceStats?.success && attendanceStats.stats ?
                    Math.round(((attendanceStats.stats.statusCounts?.PRESENT || 0) /
                      Math.max((attendanceStats.stats.totalDays || 1) * (attendanceStats.stats.totalStudents || 1), 1)) * 100) :
                    extendedMetrics?.attendanceRate || 0}%
                </div>
                <div className="text-sm text-orange-700 font-medium">Attendance</div>
                <div className="text-xs text-muted-foreground mt-1">Last 30 days</div>
              </div>
            </div>

            {/* Progress Tracking */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-3 text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Activity Completion
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed Activities</span>
                    <span className="font-medium">{extendedMetrics?.completedActivities || 0} / {extendedMetrics?.totalActivities || 0}</span>
                  </div>
                  <Progress value={extendedMetrics?.completionRate || 0} className="h-3" />
                  <div className="text-xs text-muted-foreground">
                    {(extendedMetrics?.completionRate || 0) >= 80 ? 'On track' :
                     (extendedMetrics?.completionRate || 0) >= 60 ? 'Moderate progress' : 'Behind schedule'}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-3 text-sm font-medium flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Assessment Progress
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed Assessments</span>
                    <span className="font-medium">{extendedMetrics?.completedAssessments || 0} / {extendedMetrics?.totalAssessments || 0}</span>
                  </div>
                  <Progress value={extendedMetrics?.assessmentCompletionRate || 0} className="h-3" />
                  <div className="text-xs text-muted-foreground">
                    {(extendedMetrics?.assessmentCompletionRate || 0) >= 80 ? 'Excellent completion' :
                     (extendedMetrics?.assessmentCompletionRate || 0) >= 60 ? 'Good progress' : 'Needs attention'}
                  </div>
                </div>
              </div>
            </div>

            {/* Student Engagement Overview */}
            <div>
              <div className="mb-3 text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Student Engagement
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center p-3 border rounded-lg">
                  <div className="font-semibold text-lg text-green-600">{extendedMetrics?.activeStudents || 0}</div>
                  <div className="text-muted-foreground">Active Students</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="font-semibold text-lg text-gray-600">
                    {(classData?._count?.students || 0) - (extendedMetrics?.activeStudents || 0)}
                  </div>
                  <div className="text-muted-foreground">Inactive Students</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="font-semibold text-lg text-blue-600">{classData?._count?.students || 0}</div>
                  <div className="text-muted-foreground">Total Students</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="font-semibold text-lg text-purple-600">
                    {extendedMetrics?.averageLearningTimeMinutes ? Math.round((extendedMetrics.averageLearningTimeMinutes || 0) / 60) : 0}h
                  </div>
                  <div className="text-muted-foreground">Avg. Study Time</div>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            {((extendedMetrics?.completionRate || 0) < 60 ||
              (attendanceStats?.success && attendanceStats.stats &&
               ((attendanceStats.stats.statusCounts?.PRESENT || 0) /
                Math.max((attendanceStats.stats.totalDays || 1) * (attendanceStats.stats.totalStudents || 1), 1)) * 100 < 75) ||
              (extendedMetrics?.averageGrade || 0) < 70) && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800 mb-1">Performance Insights</div>
                    <div className="text-sm text-yellow-700 space-y-1">
                      {(extendedMetrics?.completionRate || 0) < 60 && (
                        <div>• Activity completion rate is below 60% - consider reviewing assignment difficulty</div>
                      )}
                      {attendanceStats?.success && attendanceStats.stats &&
                       ((attendanceStats.stats.statusCounts?.PRESENT || 0) /
                        Math.max((attendanceStats.stats.totalDays || 1) * (attendanceStats.stats.totalStudents || 1), 1)) * 100 < 75 && (
                        <div>• Attendance rate is below 75% - may need engagement strategies</div>
                      )}
                      {(extendedMetrics?.averageGrade || 0) < 70 && (
                        <div>• Average grade is below 70% - additional support may be needed</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push(`/teacher/classes/${classId}/analytics`)}
          >
            View Detailed Analytics
            <BarChart className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      {/* Removed Bloom's Taxonomy Mastery Analytics due to API errors */}

      {/* Class Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Class Leaders
          </CardTitle>
          <CardDescription>
            Top performing students in this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rewardsData?.leaderboard && rewardsData.leaderboard.length > 0 ? (
            <div className="space-y-3">
              {rewardsData.leaderboard.slice(0, 3).map((student, index) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                      index === 0 ? "bg-yellow-500 text-white" :
                      index === 1 ? "bg-gray-400 text-white" :
                      "bg-amber-600 text-white"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Level {student.level || 1}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{student.totalPoints}</div>
                    <div className="text-sm text-muted-foreground">points</div>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() => router.push(`/teacher/classes/${classId}/leaderboard`)}
              >
                View Full Leaderboard
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No leaderboard data available</p>
              <p className="text-sm">Students will appear here as they earn points</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
