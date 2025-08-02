'use client';

import { useSession } from 'next-auth/react';
import { redirect, useParams } from 'next/navigation';
import { StudentLearningProfileDetailed } from '@/features/learning-patterns/components/StudentLearningProfileDetailed';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StudentLearningProfilePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const classId = params.classId as string;
  const studentId = params.studentId as string;

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
    api.class.getClassById.useQuery({ classId });

  // Get student information
  const { data: studentInfo, isLoading: studentLoading, error: studentError } = 
    api.student.getStudentById.useQuery({ studentId });

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
  if (classInfo.teacherId !== session.user.id) {
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
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">
            Learning Profile - {studentInfo.user.name}
          </h1>
        </div>
        <p className="text-muted-foreground">
          Detailed learning pattern analysis for {studentInfo.user.name} in {classInfo.name}
        </p>
      </div>

      <StudentLearningProfileDetailed
        studentId={studentId}
        studentName={studentInfo.user.name}
        classId={classId}
        className={classInfo.name}
        profile={learningPatterns}
      />
    </div>
  );
}
