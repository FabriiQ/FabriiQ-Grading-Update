'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { StudentLearningProfile } from '@/features/learning-patterns/components/StudentLearningProfile';
import { LearningTimeAnalytics } from '@/components/analytics/LearningTimeAnalytics';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudentLearningProfilePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const classId = params?.classId as string;
  const studentId = params?.studentId as string;

  // Redirect if not authenticated or not a teacher
  if (status === 'loading') {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-64" />
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
    api.class.getById.useQuery({ classId });

  // Get student information
  const { data: studentInfo, isLoading: studentLoading, error: studentError } =
    api.systemAnalytics.getStudentById.useQuery({ id: studentId });

  // Get student learning patterns
  const { data: learningPatterns, isLoading: patternsLoading, error: patternsError } = 
    api.learningPatterns.analyzeStudentPatterns.useQuery({ studentId });

  if (classLoading || studentLoading || patternsLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (classError || studentError || patternsError || !classInfo || !studentInfo || !learningPatterns) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Student or class not found, or you don't have permission to view this data.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Verify teacher has access to this class
  const hasAccess = classInfo.teachers?.some(teacher => teacher.teacherId === session.user.id) ||
                   classInfo.classTeacher?.userId === session.user.id;

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have permission to view this student's learning profile.
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
            href={`/teacher/classes/${classId}/learning-patterns`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">
            Learning Profile - {studentInfo.name}
          </h1>
        </div>
        <p className="text-muted-foreground">
          Detailed learning pattern analysis for {studentInfo.name} in {classInfo.name}
        </p>
      </div>

      <Tabs defaultValue="patterns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="patterns">Learning Patterns</TabsTrigger>
          <TabsTrigger value="time-analytics">Time Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns">
          <StudentLearningProfile
            studentId={studentId}
            studentName={studentInfo.name}
            classId={classId}
            profile={learningPatterns}
          />
        </TabsContent>

        <TabsContent value="time-analytics">
          <LearningTimeAnalytics
            studentId={studentId}
            classId={classId}
            timeframe="month"
            showComparison={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
