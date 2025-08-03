"use client";

import { useSession } from 'next-auth/react';
import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ChevronLeft, User, BookOpen, TrendingUp, Award } from 'lucide-react';
import Link from 'next/link';
import { StudentMasteryProfile } from '@/features/bloom/components/mastery/StudentMasteryProfile';
import { StudentLearningProfile } from '@/features/learning-patterns/components/StudentLearningProfile';

/**
 * Student Profile Analytics Page
 * Shows comprehensive student profile information and analytics for teachers
 */
export default function StudentProfilePage() {
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

  // Get student profile
  const { data: studentProfile, isLoading: profileLoading } =
    api.user.getProfile.useQuery(
      { userId: studentId, userType: 'CAMPUS_STUDENT' },
      { enabled: !!studentId }
    );

  // Type guard to ensure we have a student profile
  const isStudentProfile = (profile: any): profile is {
    id: string;
    userId: string;
    enrollmentNumber: string;
    currentGrade: string | null;
    interests: string[];
    specialNeeds: any;
  } => {
    return profile && 'enrollmentNumber' in profile;
  };

  // Get student achievements
  const { data: achievements, isLoading: achievementsLoading } =
    api.achievement.getStudentAchievements.useQuery(
      { studentId, classId },
      { enabled: !!studentId && !!classId }
    );

  // Get student learning patterns
  const { data: learningPatterns, isLoading: patternsLoading, error: patternsError } =
    api.learningPatterns.analyzeStudentPatterns.useQuery({ studentId });

  // Loading state
  if (classLoading || studentLoading || profileLoading) {
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
  if (classError || studentError) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading student profile: {classError?.message || studentError?.message}
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
            href={`/teacher/classes/${classId}/students`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold">
            Student Profile - {studentInfo.name}
          </h1>
        </div>
        <p className="text-muted-foreground">
          Comprehensive profile and analytics for {studentInfo.name} in {classInfo.name}
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Student ID</p>
                <p className="text-xs text-muted-foreground">
                  {isStudentProfile(studentProfile) ? studentProfile.enrollmentNumber : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Grade Level</p>
                <p className="text-xs text-muted-foreground">
                  {isStudentProfile(studentProfile) ? studentProfile.currentGrade || 'N/A' : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Achievements</p>
                <p className="text-xs text-muted-foreground">{achievements?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="mastery">Mastery Profile</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Information</CardTitle>
                <CardDescription>Basic profile information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-sm text-muted-foreground">{studentInfo.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{studentInfo.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Enrollment Number</label>
                    <p className="text-sm text-muted-foreground">
                      {isStudentProfile(studentProfile) ? studentProfile.enrollmentNumber : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Current Grade</label>
                    <p className="text-sm text-muted-foreground">
                      {isStudentProfile(studentProfile) ? studentProfile.currentGrade || 'N/A' : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Academic Information</CardTitle>
                <CardDescription>Academic history and interests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Interests</label>
                    <p className="text-sm text-muted-foreground">
                      {isStudentProfile(studentProfile) && studentProfile.interests?.length > 0
                        ? studentProfile.interests.join(', ')
                        : 'No interests recorded'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Special Needs</label>
                    <p className="text-sm text-muted-foreground">
                      {isStudentProfile(studentProfile) && studentProfile.specialNeeds
                        ? String(studentProfile.specialNeeds)
                        : 'None recorded'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
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

        <TabsContent value="mastery">
          <StudentMasteryProfile
            studentId={studentId}
            studentName={studentInfo.name}
            className={classInfo.name}
          />
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Student Achievements</CardTitle>
              <CardDescription>Awards and recognitions earned</CardDescription>
            </CardHeader>
            <CardContent>
              {achievementsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : achievements && achievements.length > 0 ? (
                <div className="space-y-4">
                  {achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                      <Award className="h-5 w-5 text-yellow-500" />
                      <div>
                        <p className="font-medium">{achievement.title}</p>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No achievements recorded yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
