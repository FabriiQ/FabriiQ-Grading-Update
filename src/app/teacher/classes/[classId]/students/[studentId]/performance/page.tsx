"use client";

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronLeft, TrendingUp, BarChart3, Target, Clock } from 'lucide-react';
import Link from 'next/link';
import { StudentLearningProfile } from '@/features/learning-patterns/components/StudentLearningProfile';
import { LearningTimeAnalytics } from '@/components/analytics/LearningTimeAnalytics';
import { StudentTopicMasteryDashboard } from '@/features/bloom/components/student/StudentTopicMasteryDashboard';

/**
 * Student Performance Analytics Page
 * Shows detailed learning performance and analytics for teachers
 */
export default function StudentPerformancePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const classId = params?.classId as string;
  const studentId = params?.studentId as string;

  // Loading state
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!session?.user) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Authorization check
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
    api.class.getById.useQuery({ classId });

  // Get student information
  const { data: studentInfo, isLoading: studentLoading, error: studentError } =
    api.systemAnalytics.getStudentById.useQuery({ id: studentId });

  // Get student learning patterns
  const { data: learningPatterns, isLoading: patternsLoading, error: patternsError } = 
    api.learningPatterns.analyzeStudentPatterns.useQuery({ studentId });

  // Get student analytics (using a different approach since getStudentMasteryAnalytics doesn't exist)
  const { data: analytics, isLoading: analyticsLoading } =
    api.learningPatterns.analyzeStudentPatterns.useQuery(
      { studentId },
      { enabled: !!studentId }
    );

  // Loading state
  if (classLoading || studentLoading || patternsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  // Error handling
  if (classError || studentError || patternsError) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading student performance data: {classError?.message || studentError?.message || patternsError?.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Data validation
  if (!classInfo || !studentInfo) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Student or class information not found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link 
            href={`/teacher/classes/${classId}/students/${studentId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">
            Performance Analytics - {studentInfo.name}
          </h1>
        </div>
        <p className="text-muted-foreground">
          Detailed learning performance and analytics for {studentInfo.name} in {classInfo.name}
        </p>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Overall Progress</p>
                <p className="text-xs text-muted-foreground">
                  {analytics?.performancePatterns?.consistencyScore ? `${Math.round(analytics.performancePatterns.consistencyScore)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Learning Confidence</p>
                <p className="text-xs text-muted-foreground">
                  {analytics?.learningStyle?.confidence ? `${Math.round(analytics.learningStyle.confidence * 100)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Learning Style</p>
                <p className="text-xs text-muted-foreground">
                  {analytics?.learningStyle?.primary ? analytics.learningStyle.primary.replace('_', ' ').toUpperCase() : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Improvement Trend</p>
                <p className="text-xs text-muted-foreground">
                  {analytics?.performancePatterns?.improvementTrend ?
                    analytics.performancePatterns.improvementTrend.charAt(0).toUpperCase() +
                    analytics.performancePatterns.improvementTrend.slice(1) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Performance Analytics */}
      <Tabs defaultValue="learning-patterns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="learning-patterns">Learning Patterns</TabsTrigger>
          <TabsTrigger value="time-analytics">Time Analytics</TabsTrigger>
          <TabsTrigger value="topic-mastery">Topic Mastery</TabsTrigger>
          <TabsTrigger value="progress-tracking">Progress Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="learning-patterns">
          {learningPatterns ? (
            <StudentLearningProfile
              studentId={studentId}
              studentName={studentInfo.name}
              classId={classId}
              profile={learningPatterns}
            />
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No learning patterns data available yet. Data will appear as the student completes more activities.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="time-analytics">
          <LearningTimeAnalytics
            studentId={studentId}
            classId={classId}
            timeframe="month"
            showComparison={true}
          />
        </TabsContent>

        <TabsContent value="topic-mastery">
          <StudentTopicMasteryDashboard
            studentId={studentId}
            classId={classId}
          />
        </TabsContent>

        <TabsContent value="progress-tracking">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest learning activities and submissions</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Recent activity tracking will be displayed here as data becomes available.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Progress over time</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Performance trend analysis will be displayed here as more data is collected.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <Button asChild>
          <Link href={`/teacher/classes/${classId}/students/${studentId}/learning-profile`}>
            View Detailed Learning Profile
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/teacher/classes/${classId}/students`}>
            Back to Students List
          </Link>
        </Button>
      </div>
    </div>
  );
}
