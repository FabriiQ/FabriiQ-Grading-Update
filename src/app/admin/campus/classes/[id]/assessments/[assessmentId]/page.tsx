'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/trpc/react';
import { PageLayout } from '@/components/layout/page-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/navigation/tabs';
import {
  Edit,
  FileText,
  ChevronLeft,
  User,
  BarChart,
  Eye,
  Trash
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/data-display/badge';
import { Separator } from '@/components/ui/atoms/separator';
import { SystemStatus } from '@/server/api/constants';

// Define interfaces for type safety
interface AssessmentStats {
  totalSubmissions: number;
  scoreStats?: {
    min: number;
    max: number;
    average: number;
    median: number;
  };
  submissionStatusDistribution?: Record<string, number>;
  submissionTimeline?: Record<string, number>;
}

export default function AssessmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  
  // ✅ Fixed: Handle null params case
  if (!params) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Loading...</h3>
          <p className="text-muted-foreground">Please wait while we load the page.</p>
        </div>
      </div>
    );
  }
  
  const classId = params.id as string;
  const assessmentId = params.assessmentId as string;
  
  // Additional validation for required params
  if (!classId || !assessmentId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium mb-2">Invalid URL</h3>
          <p className="text-muted-foreground mb-4">
            Required parameters are missing from the URL.
          </p>
          <Link href="/admin/campus/classes">
            <Button>Back to Classes</Button>
          </Link>
        </div>
      </div>
    );
  }
  
  // ✅ Fixed: Use correct TRPC API calls based on assessment router
  const { data: assessment, isLoading: isAssessmentLoading, error: assessmentError } = api.assessment.getById.useQuery({
    id: assessmentId // ✅ Fixed: Use 'id' parameter as defined in assessmentRouter
  }, {
    enabled: !!assessmentId,
    retry: 1,
    onError: (err) => {
      console.error('Error fetching assessment:', err);
    }
  });
  
  const { data: stats, isLoading: isStatsLoading } = api.assessment.getStats.useQuery({
    id: assessmentId
  }, {
    enabled: !!assessmentId && !!assessment,
    retry: 1
  }) as { data: AssessmentStats | undefined, isLoading: boolean };
  
  // Mutations for assessment actions
  const updateMutation = api.assessment.update.useMutation({
    onSuccess: () => {
      window.location.reload();
    },
    onError: (err) => {
      console.error('Error updating assessment:', err);
      alert('Failed to update assessment');
    }
  });
  
  const deleteMutation = api.assessment.delete.useMutation({
    onSuccess: () => {
      router.push(`/admin/campus/classes/${classId}/assessments`);
    },
    onError: (err) => {
      console.error('Error deleting assessment:', err);
      alert('Failed to delete assessment');
    }
  });
  
  // Loading state
  const loading = isAssessmentLoading || isStatsLoading;
  const error = assessmentError ? 'Failed to load assessment data' : null;
  
  if (loading) {
    return (
      <PageLayout
        title="Loading Assessment"
        description="Please wait while we load the assessment details"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },  
          { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
          { label: 'Loading...', href: '#' },
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assessment details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }
  
  if (error) {
    return (
      <PageLayout
        title="Error"
        description="There was a problem loading the assessment"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
          { label: 'Error', href: '#' },
        ]}
      >
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error}</p>
          <Link href={`/admin/campus/classes/${classId}/assessments`}>
            <Button className="mt-4">Back to Assessments</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }
  
  if (!assessment) {
    return (
      <PageLayout
        title="Assessment Not Found"
        description="The requested assessment could not be found"
        breadcrumbs={[
          { label: 'Classes', href: '/admin/campus/classes' },
          { label: 'Class', href: `/admin/campus/classes/${classId}` },
          { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
          { label: 'Not Found', href: '#' },
        ]}
      >
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 text-yellow-800">
          <h3 className="text-lg font-medium mb-2">Assessment Not Found</h3>
          <p>The assessment you're looking for doesn't exist or has been removed.</p>
          <Link href={`/admin/campus/classes/${classId}/assessments`}>
            <Button className="mt-4">Back to Assessments</Button>
          </Link>
        </div>
      </PageLayout>
    );
  }
  
 // ✅ Alternative: Use available properties to create description
const assessmentDescription = assessment.subject ? `${assessment.subject.course.name} - ${assessment.subject.name}` : '';
const assessmentInstructions = assessment.subject ? `Subject Code: ${assessment.subject.code}` : '';
  const assessmentGradingScale = assessment.gradingScaleId || 'Default'; // ✅ Fixed: Use gradingScaleId not gradingScale
  
  // Helper function to publish/unpublish assessment
  const togglePublishStatus = () => {
    const newStatus = assessment.status === SystemStatus.ACTIVE 
      ? SystemStatus.INACTIVE  // ✅ Fixed: Use INACTIVE instead of DRAFT
      : SystemStatus.ACTIVE;
      
    updateMutation.mutate({
      id: assessmentId,
      status: newStatus
    });
  };
  
  return (
    <PageLayout
      title={assessment.title}
      description="Assessment details"
      breadcrumbs={[
        { label: 'Classes', href: '/admin/campus/classes' },
        { label: 'Class', href: `/admin/campus/classes/${classId}` },
        { label: 'Assessments', href: `/admin/campus/classes/${classId}/assessments` },
        { label: assessment.title, href: '#' },
      ]}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/admin/campus/classes/${classId}/assessments`}>
              <Button size="sm" variant="ghost">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            {/* ✅ Fixed: Remove variant prop from Badge */}
            <Badge>
              {assessment.status === SystemStatus.ACTIVE ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {assessment.category || 'Assessment'} • {assessment.subject?.name || 'No Subject'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={togglePublishStatus}
          >
            <Eye className="h-4 w-4 mr-2" />
            {assessment.status === SystemStatus.ACTIVE ? 'Unpublish' : 'Publish'}
          </Button>

          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}/submissions`}>
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Submissions
            </Button>
          </Link>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
                // ✅ Fixed: Pass string directly, not object
                deleteMutation.mutate(assessmentId);
              }
            }}
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {assessmentDescription && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Description</h3>
                    <p className="text-sm text-muted-foreground">{assessmentDescription}</p>
                  </div>
                )}

                {assessmentInstructions && (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Instructions</h3>
                    <p className="text-sm text-muted-foreground">{assessmentInstructions}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Max Score</h3>
                    <p className="text-sm">{assessment.maxScore || 100}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Passing Score</h3>
                    <p className="text-sm">{assessment.passingScore || 'Not set'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Weightage</h3>
                    <p className="text-sm">{assessment.weightage || 0}%</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Grading Type</h3>
                    <p className="text-sm">{assessment.gradingType || 'Not set'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Grading Scale</h3>
                    <p className="text-sm">{assessmentGradingScale}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Due Date</h3>
                    <p className="text-sm">
                      {assessment.dueDate
                        ? format(new Date(assessment.dueDate), 'PPP')
                        : 'No due date'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Submissions</span>
                    <span className="text-sm font-medium">{stats?.totalSubmissions || 0}</span>
                  </div>
                  
                  {stats?.scoreStats && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Average Score</span>
                        <span className="text-sm font-medium">{stats.scoreStats.average.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Highest Score</span>
                        <span className="text-sm font-medium">{stats.scoreStats.max}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Lowest Score</span>
                        <span className="text-sm font-medium">{stats.scoreStats.min}</span>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>
                <BarChart className="h-5 w-5 mr-2 inline" />
                Assessment Statistics
              </CardTitle>
              <CardDescription>
                Detailed analytics for this assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-2xl font-bold">{stats.totalSubmissions}</div>
                      <div className="text-sm text-muted-foreground">Total Submissions</div>
                    </div>
                    
                    {stats.scoreStats && (
                      <>
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="text-2xl font-bold">{stats.scoreStats.average.toFixed(1)}</div>
                          <div className="text-sm text-muted-foreground">Average Score</div>
                        </div>
                        
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="text-2xl font-bold">{stats.scoreStats.max}</div>
                          <div className="text-sm text-muted-foreground">Highest Score</div>
                        </div>
                        
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="text-2xl font-bold">{stats.scoreStats.min}</div>
                          <div className="text-sm text-muted-foreground">Lowest Score</div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No statistics available yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Statistics will appear once students start submitting
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}