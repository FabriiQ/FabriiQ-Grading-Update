'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, BarChart, Lightbulb, LineChart, Users, Clock } from 'lucide-react';
import { ClassTimeAnalytics } from '@/components/analytics/ClassTimeAnalytics';

export default function ClassAnalyticsPage() {
  const params = useParams();
  const classId = params?.classId as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Get class details
  const { data: classDetails, isLoading: isLoadingClass } = api.class.getById.useQuery(
    { id: classId },
    { enabled: !!classId }
  );

  // Get current teacher profile
  const { data: teacher, isLoading: isLoadingTeacher } = api.teacher.getCurrentTeacher.useQuery(
    undefined,
    { enabled: !!session?.user?.id }
  );
  
  // Loading state
  if (status === 'loading' || isLoadingClass || isLoadingTeacher) {
    return (
      <div className="container py-6">
        <Skeleton className="h-12 w-3/4 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64 mb-6" />
      </div>
    );
  }
  
  // Not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="container py-6">
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Error</AlertTitle>
          <AlertDescription>
            You must be signed in to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No teacher found
  if (!teacher) {
    return (
      <div className="container py-6">
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Error</AlertTitle>
          <AlertDescription>
            You must be a teacher to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No class found
  if (!classDetails) {
    return (
      <div className="container py-6">
        <Alert className="border-destructive bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Class Not Found</AlertTitle>
          <AlertDescription>
            The requested class could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  // Navigate to specific analytics
  const navigateToAnalytics = (type: string) => {
    router.push(`/teacher/classes/${classId}/analytics/${type}`);
  };
  
  return (
    <div className="container py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Class Analytics</h1>
          <p className="text-muted-foreground">
            Analytics and insights for {classDetails.name}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="mr-2 h-5 w-5" />
              Bloom's Taxonomy
            </CardTitle>
            <CardDescription>
              Cognitive level analysis and mastery tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze student performance across different cognitive levels of Bloom's Taxonomy.
              Track mastery progress and identify cognitive gaps.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigateToAnalytics('blooms')}
              className="w-full"
            >
              View Bloom's Analytics
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="mr-2 h-5 w-5" />
              Performance
            </CardTitle>
            <CardDescription>
              Academic performance metrics and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track student performance across assessments and activities.
              Analyze grade distributions and identify areas for improvement.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigateToAnalytics('performance')}
              className="w-full"
              disabled
            >
              Coming Soon
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Learning Time Analytics
            </CardTitle>
            <CardDescription>
              Time investment and learning efficiency metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track how students spend time on learning activities.
              Analyze time investment patterns and learning efficiency.
            </p>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => {
                // Scroll to time analytics section
                document.getElementById('time-analytics')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full"
            >
              View Time Analytics
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Time Analytics Section */}
      <div id="time-analytics">
        <ClassTimeAnalytics classId={classId} timeframe="month" />
      </div>
    </div>
  );
}
