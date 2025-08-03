"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, CheckCircle, FileText, Edit } from "lucide-react";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { SubmissionStatus, SystemStatus } from "@/server/api/constants";
import { AssessmentAnalyticsDashboard, AssessmentResultsDashboard } from "@/features/assessments/components";
import { BloomsTaxonomyLevel } from "@/features/bloom/types/bloom-taxonomy";

// Define the assessment interface to fix TypeScript errors
interface AssessmentWithDetails {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  maxScore?: number;
  passingScore?: number;
  weightage?: number;
  status: SystemStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  rubricId?: string;
  bloomsRubric?: {
    id: string;
    title: string;
    description?: string;
    type: string;
    maxScore: number;
    criteria?: Array<{
      id: string;
      name: string;
      description?: string;
      bloomsLevel: BloomsTaxonomyLevel;
      weight: number;
      criteriaLevels?: Array<{
        id: string;
        performanceLevel?: {
          id: string;
          name: string;
          description?: string;
          minScore: number;
          maxScore: number;
          color?: string;
        };
      }>;
    }>;
    performanceLevels?: Array<{
      id: string;
      name: string;
      description?: string;
      minScore: number;
      maxScore: number;
      color?: string;
    }>;
  };
  subject?: {
    id: string;
    code: string;
    name: string;
    course?: {
      id: string;
      code: string;
      name: string;
    };
  };
  submissions?: {
    id: string;
    status: SubmissionStatus;
    score: number | null;
    submittedAt: Date | null;
    createdAt: Date;
    timeSpentMinutes?: number;
    bloomsLevelScores?: string;
    topicMasteryChanges?: string;
    learningOutcomeAchievements?: string;
    student?: {
      id: string;
      user: {
        name: string | null;
        email?: string;
      };
    };
  }[];
  _count?: {
    submissions: number;
  };
}

export default function AssessmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.classId as string;
  const assessmentId = params?.assessmentId as string;

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Fetch assessment details
  const { data: assessmentData, isLoading: isLoadingAssessment } = api.assessment.getById.useQuery({
    assessmentId,
    includeSubmissions: true
  }, {
    enabled: !!assessmentId,
    onError: (error) => {
      console.error("Error fetching assessment:", error);
    }
  });

  // Fetch class details
  const { data: classDetails } = api.class.getById.useQuery({
    classId
  }, {
    enabled: !!classId
  });

  // Fetch real analytics data
  const { data: analyticsData } = api.assessment.getAnalytics.useQuery(
    { assessmentId },
    { enabled: !!assessmentId }
  );

  // Cast the assessment data to our interface to fix TypeScript errors
  const assessment = assessmentData as unknown as AssessmentWithDetails;

  // Calculate submission stats with proper null checks
  const submissions = assessment?.submissions || [];
  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter(
    (sub) => sub.status === SubmissionStatus.GRADED
  ).length;
  const pendingSubmissions = totalSubmissions - gradedSubmissions;

  // Calculate real analytics from submissions
  const realAnalytics = useMemo(() => {
    if (!assessment || !submissions || submissions.length === 0) {
      return {
        totalSubmissions: 0,
        gradedSubmissions: 0,
        averageScore: 0,
        passingRate: 0,
        completionRate: 0,
        averageTimeSpent: 0,
        bloomsDistribution: {
          [BloomsTaxonomyLevel.REMEMBER]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
          [BloomsTaxonomyLevel.UNDERSTAND]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
          [BloomsTaxonomyLevel.APPLY]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
          [BloomsTaxonomyLevel.ANALYZE]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
          [BloomsTaxonomyLevel.EVALUATE]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
          [BloomsTaxonomyLevel.CREATE]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
        },
        topicMasteryImpact: [],
        learningOutcomeAchievement: [],
        performanceDistribution: [],
        strugglingStudents: [],
        topPerformers: [],
      };
    }

    const gradedSubs = submissions.filter(s => s.status === 'GRADED' && s.score !== null);

    // Calculate basic metrics
    const totalScore = gradedSubs.reduce((sum, s) => sum + (s.score || 0), 0);
    const averageScore = gradedSubs.length > 0 ? totalScore / gradedSubs.length : 0;
    const passingScore = assessment.passingScore || 60;
    const passingStudents = gradedSubs.filter(s => (s.score || 0) >= passingScore).length;
    const passingRate = gradedSubs.length > 0 ? passingStudents / gradedSubs.length : 0;
    const completionRate = submissions.length > 0 ? submissions.filter(s => s.status !== SubmissionStatus.PENDING).length / submissions.length : 0;

    // Performance distribution
    const performanceDistribution = [
      { range: '90-100%', count: gradedSubs.filter(s => (s.score || 0) >= 90).length, percentage: 0 },
      { range: '80-89%', count: gradedSubs.filter(s => (s.score || 0) >= 80 && (s.score || 0) < 90).length, percentage: 0 },
      { range: '70-79%', count: gradedSubs.filter(s => (s.score || 0) >= 70 && (s.score || 0) < 80).length, percentage: 0 },
      { range: '60-69%', count: gradedSubs.filter(s => (s.score || 0) >= 60 && (s.score || 0) < 70).length, percentage: 0 },
      { range: 'Below 60%', count: gradedSubs.filter(s => (s.score || 0) < 60).length, percentage: 0 },
    ];

    // Calculate percentages
    performanceDistribution.forEach(dist => {
      dist.percentage = gradedSubs.length > 0 ? Math.round((dist.count / gradedSubs.length) * 100) : 0;
    });

    return analyticsData || {
      totalSubmissions: submissions.length,
      gradedSubmissions: gradedSubs.length,
      averageScore,
      passingRate: passingRate * 100, // Convert to percentage
      completionRate: completionRate * 100, // Convert to percentage
      averageTimeSpent: gradedSubs.reduce((sum, s) => sum + (s.timeSpentMinutes || 0), 0) / Math.max(gradedSubs.length, 1),
      bloomsDistribution: {
        [BloomsTaxonomyLevel.REMEMBER]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
        [BloomsTaxonomyLevel.UNDERSTAND]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
        [BloomsTaxonomyLevel.APPLY]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
        [BloomsTaxonomyLevel.ANALYZE]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
        [BloomsTaxonomyLevel.EVALUATE]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
        [BloomsTaxonomyLevel.CREATE]: { averageScore: 0, maxScore: 100, percentage: 0, studentCount: 0 },
      },
      topicMasteryImpact: [],
      learningOutcomeAchievement: [],
      performanceDistribution,
      strugglingStudents: gradedSubs.filter(s => (s.score || 0) < 60).map(s => ({
        studentId: s.student?.id || '',
        studentName: s.student?.user?.name || 'Unknown',
        score: s.score || 0,
        weakAreas: [] // Will be populated by analytics service
      })),
      topPerformers: gradedSubs.filter(s => (s.score || 0) >= 90).map(s => ({
        studentId: s.student?.id || '',
        studentName: s.student?.user?.name || 'Unknown',
        score: s.score || 0,
        strongAreas: [] // Will be populated by analytics service
      })),
    };
  }, [assessment, analyticsData, totalSubmissions, gradedSubmissions, assessmentId]);

  // Real results data from submissions - with proper null checks
  const realResults = useMemo(() => {
    if (!assessment || !assessment.submissions) {
      return [];
    }

    return assessment.submissions.map((sub) => {
      const score = sub.score || 0;
      const maxScore = assessment.maxScore || 100;
      const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;

      // Calculate letter grade
      const getLetterGrade = (percentage: number) => {
        if (percentage >= 90) return 'A';
        if (percentage >= 80) return 'B';
        if (percentage >= 70) return 'C';
        if (percentage >= 60) return 'D';
        return 'F';
      };

      return {
        studentId: sub.student?.id || '',
        studentName: sub.student?.user?.name || 'Unknown Student',
        studentEmail: sub.student?.user?.email || '',
        score,
        percentage,
        grade: getLetterGrade(percentage),
        submittedAt: sub.submittedAt || sub.createdAt,
        timeSpent: sub.timeSpentMinutes || 0,
        bloomsLevelScores: sub.bloomsLevelScores ? JSON.parse(sub.bloomsLevelScores as string) : {},
        topicMasteryChanges: sub.topicMasteryChanges ? JSON.parse(sub.topicMasteryChanges as string) : [],
        learningOutcomeAchievements: sub.learningOutcomeAchievements ? JSON.parse(sub.learningOutcomeAchievements as string) : [],
      };
    });
  }, [assessment]);

  // CONDITIONAL RETURNS AFTER ALL HOOKS
  if (isLoadingAssessment) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 p-4 rounded-md border border-red-200 text-red-800">
          <h3 className="text-lg font-medium mb-2">Assessment Not Found</h3>
          <p>The assessment you're looking for doesn't exist or has been removed.</p>
          <Link href={`/teacher/classes/${classId}/assessments`}>
            <Button variant="outline" className="mt-4">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Assessments
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const mockBloomsDistribution = {
    [BloomsTaxonomyLevel.REMEMBER]: 85,
    [BloomsTaxonomyLevel.UNDERSTAND]: 80,
    [BloomsTaxonomyLevel.APPLY]: 75,
    [BloomsTaxonomyLevel.ANALYZE]: 70,
    [BloomsTaxonomyLevel.EVALUATE]: 65,
    [BloomsTaxonomyLevel.CREATE]: 60,
  };

  return (
    <div className="container mx-auto p-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/teacher/classes">Classes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/classes/${classId}`}>
              {classDetails?.name || "Class"}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/teacher/classes/${classId}/assessments`}>
              Assessments
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{assessment.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href={`/teacher/classes/${classId}/assessments`}>
              <Button size="sm" variant="ghost">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{assessment.title}</h1>
            <Badge variant={assessment.status === 'ACTIVE' ? "success" : "secondary"}>
              {assessment.status === 'ACTIVE' ? "Published" : "Draft"}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {assessment.subject?.name || "No subject"} • Max Score: {assessment.maxScore || 100}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/teacher/classes/${classId}/assessments/${assessmentId}/grade`}>
            <Button variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Grade Submissions
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="results">Results Dashboard</TabsTrigger>
          {assessment.bloomsRubric && (
            <TabsTrigger value="rubric">Rubric</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {assessment.description ?? "No description provided"}
                  </p>
                </div>
                <div className="border-b my-4"></div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Instructions</h3>
                  <p className="text-sm text-muted-foreground">
                    {assessment.instructions ?? "No instructions provided"}
                  </p>
                </div>
                <div className="border-b my-4"></div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Due Date</h3>
                  <p className="text-sm">
                    {assessment.dueDate
                      ? new Date(assessment.dueDate).toLocaleDateString()
                      : "No due date"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submission Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Submissions</p>
                    <p className="text-2xl font-bold">{totalSubmissions}</p>
                  </div>
                  <div className="border-b my-4"></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Graded</p>
                    <p className="text-2xl font-bold">{gradedSubmissions}</p>
                  </div>
                  <div className="border-b my-4"></div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold">{pendingSubmissions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Submissions</CardTitle>
              <CardDescription>
                View and grade student submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assessment?.submissions && assessment.submissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Student</th>
                        <th className="text-left py-2 px-4">Status</th>
                        <th className="text-left py-2 px-4">Submitted</th>
                        <th className="text-left py-2 px-4">Score</th>
                        <th className="text-right py-2 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assessment.submissions.map((submission) => (
                        <tr key={submission.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">
                            <div>
                              <p className="font-medium">{submission.student?.user?.name || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{submission.student?.user?.email ?? ""}</p>
                            </div>
                          </td>
                          <td className="py-2 px-4">
                            <Badge
                              variant={
                                submission.status === SubmissionStatus.GRADED
                                  ? "success"
                                  : submission.status === SubmissionStatus.LATE
                                  ? "warning"
                                  : "secondary"
                              }
                            >
                              {submission.status}
                            </Badge>
                          </td>
                          <td className="py-2 px-4">
                            {submission.submittedAt
                              ? new Date(submission.submittedAt).toLocaleDateString()
                              : "N/A"}
                          </td>
                          <td className="py-2 px-4">
                            {submission.score !== null
                              ? `${submission.score}/${assessment.maxScore || 100}`
                              : "Not graded"}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => router.push(`/teacher/classes/${classId}/assessments/${assessmentId}/grade`)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Grade
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No submissions yet</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    There are no submissions for this assessment yet. Check back later.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AssessmentAnalyticsDashboard
            assessmentId={assessmentId}
            assessmentTitle={assessment.title}
            maxScore={assessment.maxScore || 100}
            passingScore={assessment.passingScore || 60}
            analytics={realAnalytics}
            onRefresh={() => {
              // Refresh analytics data
              console.log('Refreshing analytics...');
            }}
          />
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          <AssessmentResultsDashboard
            assessmentId={assessmentId}
            assessmentTitle={assessment.title}
            maxScore={assessment.maxScore || 100}
            passingScore={assessment.passingScore || 60}
            results={realResults || []}
            bloomsDistribution={mockBloomsDistribution}
            onExportResults={() => {
              // Export results functionality
              console.log('Exporting results...');
            }}
            onViewStudentDetail={(studentId) => {
              // Navigate to student detail view
              console.log('Viewing student detail:', studentId);
            }}
          />
        </TabsContent>

        {/* Rubric Tab */}
        {assessment?.bloomsRubric && (
          <TabsContent value="rubric" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Assessment Rubric</CardTitle>
                <CardDescription>
                  Detailed grading criteria and performance levels for this assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Rubric Header */}
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-semibold">{assessment.bloomsRubric.title}</h3>
                    {assessment.bloomsRubric.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {assessment.bloomsRubric.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Max Score: {assessment.bloomsRubric.maxScore}</span>
                      <span>Type: {assessment.bloomsRubric.type}</span>
                      <span>Criteria: {assessment.bloomsRubric.criteria?.length || 0}</span>
                    </div>
                  </div>

                  {/* Performance Levels */}
                  {assessment.bloomsRubric.performanceLevels && assessment.bloomsRubric.performanceLevels.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Performance Levels</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {assessment.bloomsRubric.performanceLevels.map((level) => (
                          <div key={level.id} className="border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: level.color || '#3b82f6' }}
                              />
                              <span className="font-medium">{level.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {level.minScore} - {level.maxScore} points
                            </p>
                            {level.description && (
                              <p className="text-sm mt-2">{level.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Criteria */}
                  {assessment.bloomsRubric.criteria && assessment.bloomsRubric.criteria.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Grading Criteria</h4>
                      <div className="space-y-4">
                        {assessment.bloomsRubric.criteria.map((criterion) => (
                          <div key={criterion.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h5 className="font-medium">{criterion.name}</h5>
                                {criterion.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {criterion.description}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {criterion.bloomsLevel}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Weight: {criterion.weight}
                                </span>
                              </div>
                            </div>

                            {/* Criterion Performance Levels */}
                            {criterion.criteriaLevels && criterion.criteriaLevels.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                {criterion.criteriaLevels.map((criteriaLevel) => (
                                  <div key={criteriaLevel.id} className="bg-muted/50 rounded p-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: criteriaLevel.performanceLevel?.color || '#3b82f6' }}
                                      />
                                      <span className="text-sm font-medium">
                                        {criteriaLevel.performanceLevel?.name}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {criteriaLevel.performanceLevel?.minScore} - {criteriaLevel.performanceLevel?.maxScore} pts
                                    </p>
                                    {criteriaLevel.performanceLevel?.description && (
                                      <p className="text-xs mt-1">
                                        {criteriaLevel.performanceLevel.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
