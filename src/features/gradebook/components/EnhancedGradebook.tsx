'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/trpc/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/atoms/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { QuickTeacherLoading } from '@/components/teacher/loading/TeacherLoadingState';
import {
  Download,
  Upload,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  FileText,
  Eye,
  Edit,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

interface EnhancedGradebookProps {
  classId: string;
}

interface GradeStats {
  totalStudents: number;
  averageGrade: number;
  passingRate: number;
  completionRate: number;
  gradedActivities: number;
  gradedAssessments: number;
}

interface StudentGradeData {
  studentId: string;
  studentName: string;
  studentEmail: string;
  currentGrade: number | null;
  letterGrade: string | null;
  activitiesCompleted: number;
  assessmentsCompleted: number;
  lastActivity: Date | null;
  trend: 'up' | 'down' | 'stable';
}

export function EnhancedGradebook({ classId }: EnhancedGradebookProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch class details with real-time updates
  const { data: classDetails, isLoading: isLoadingClass, refetch: refetchClass } = api.class.getById.useQuery({
    classId,
    include: {
      students: true,
      teachers: true
    }
  }, {
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Fetch activities with grades
  const { data: activities, isLoading: isLoadingActivities, refetch: refetchActivities } = api.activity.getByClass.useQuery({
    classId,
    includeGrades: true
  }, {
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch assessments with submissions
  const { data: assessments, isLoading: isLoadingAssessments, refetch: refetchAssessments } = api.assessment.getByClass.useQuery({
    classId,
    includeSubmissions: true
  }, {
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch gradebook data
  const { data: gradebook, isLoading: isLoadingGradebook, refetch: refetchGradebook } = api.gradebook.getByClass.useQuery({
    classId
  }, {
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Calculate grade statistics
  const gradeStats: GradeStats = useMemo(() => {
    if (!classDetails || !activities || !assessments) {
      return {
        totalStudents: 0,
        averageGrade: 0,
        passingRate: 0,
        completionRate: 0,
        gradedActivities: 0,
        gradedAssessments: 0
      };
    }

    const students = classDetails.students || [];
    const totalStudents = students.length;
    
    // Calculate graded activities and assessments
    const gradedActivities = activities.filter(activity => 
      activity.activityGrades && activity.activityGrades.length > 0
    ).length;
    
    const gradedAssessments = assessments.filter(assessment => 
      assessment.submissions && assessment.submissions.some(sub => sub.status === 'GRADED')
    ).length;

    // Calculate average grade and passing rate from gradebook
    let averageGrade = 0;
    let passingRate = 0;
    let completionRate = 0;

    if (gradebook && gradebook.studentGrades) {
      const validGrades = gradebook.studentGrades.filter(sg => sg.finalGrade !== null);
      if (validGrades.length > 0) {
        averageGrade = validGrades.reduce((sum, sg) => sum + (sg.finalGrade || 0), 0) / validGrades.length;
        passingRate = (validGrades.filter(sg => (sg.finalGrade || 0) >= 60).length / validGrades.length) * 100;
        completionRate = (validGrades.length / totalStudents) * 100;
      }
    }

    return {
      totalStudents,
      averageGrade,
      passingRate,
      completionRate,
      gradedActivities,
      gradedAssessments
    };
  }, [classDetails, activities, assessments, gradebook]);

  // Process student grade data
  const studentGradeData: StudentGradeData[] = useMemo(() => {
    if (!classDetails || !activities || !assessments) return [];

    return (classDetails.students || []).map(enrollment => {
      const student = enrollment.student;
      const studentId = student.id;
      
      // Find student grade in gradebook
      const studentGrade = gradebook?.studentGrades?.find(sg => sg.studentId === studentId);
      
      // Count completed activities
      const activitiesCompleted = activities.filter(activity =>
        activity.activityGrades?.some(grade => 
          grade.studentId === studentId && grade.status === 'GRADED'
        )
      ).length;

      // Count completed assessments
      const assessmentsCompleted = assessments.filter(assessment =>
        assessment.submissions?.some(submission =>
          submission.studentId === studentId && submission.status === 'GRADED'
        )
      ).length;

      // Find last activity (simplified - would need more complex logic for real trend)
      const lastActivity = studentGrade?.updatedAt || null;
      
      return {
        studentId,
        studentName: student.user?.name || 'Unknown',
        studentEmail: student.user?.email || '',
        currentGrade: studentGrade?.finalGrade || null,
        letterGrade: studentGrade?.letterGrade || null,
        activitiesCompleted,
        assessmentsCompleted,
        lastActivity,
        trend: 'stable' as const // Simplified - would calculate based on grade history
      };
    });
  }, [classDetails, activities, assessments, gradebook]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchClass(),
        refetchActivities(),
        refetchAssessments(),
        refetchGradebook()
      ]);
      setLastRefresh(new Date());
      toast({
        title: 'Data refreshed',
        description: 'Gradebook data has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: 'Failed to refresh gradebook data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = isLoadingClass || isLoadingActivities || isLoadingAssessments || isLoadingGradebook;

  if (isLoading) {
    return <QuickTeacherLoading configKey="grades" />;
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Class Gradebook</h1>
          <p className="text-muted-foreground">
            {classDetails?.name} • Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {gradeStats.completionRate.toFixed(1)}% have grades
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeStats.averageGrade.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {gradeStats.passingRate.toFixed(1)}% passing rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeStats.gradedActivities}</div>
            <p className="text-xs text-muted-foreground">
              {activities?.length || 0} total activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradeStats.gradedAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {assessments?.length || 0} total assessments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>A (90-100%)</span>
                  <span>{studentGradeData.filter(s => (s.currentGrade || 0) >= 90).length} students</span>
                </div>
                <Progress 
                  value={(studentGradeData.filter(s => (s.currentGrade || 0) >= 90).length / gradeStats.totalStudents) * 100} 
                  className="h-2" 
                />
                
                <div className="flex justify-between text-sm">
                  <span>B (80-89%)</span>
                  <span>{studentGradeData.filter(s => (s.currentGrade || 0) >= 80 && (s.currentGrade || 0) < 90).length} students</span>
                </div>
                <Progress 
                  value={(studentGradeData.filter(s => (s.currentGrade || 0) >= 80 && (s.currentGrade || 0) < 90).length / gradeStats.totalStudents) * 100} 
                  className="h-2" 
                />
                
                <div className="flex justify-between text-sm">
                  <span>C (70-79%)</span>
                  <span>{studentGradeData.filter(s => (s.currentGrade || 0) >= 70 && (s.currentGrade || 0) < 80).length} students</span>
                </div>
                <Progress 
                  value={(studentGradeData.filter(s => (s.currentGrade || 0) >= 70 && (s.currentGrade || 0) < 80).length / gradeStats.totalStudents) * 100} 
                  className="h-2" 
                />
                
                <div className="flex justify-between text-sm">
                  <span>D (60-69%)</span>
                  <span>{studentGradeData.filter(s => (s.currentGrade || 0) >= 60 && (s.currentGrade || 0) < 70).length} students</span>
                </div>
                <Progress 
                  value={(studentGradeData.filter(s => (s.currentGrade || 0) >= 60 && (s.currentGrade || 0) < 70).length / gradeStats.totalStudents) * 100} 
                  className="h-2" 
                />
                
                <div className="flex justify-between text-sm">
                  <span>F (Below 60%)</span>
                  <span>{studentGradeData.filter(s => (s.currentGrade || 0) < 60).length} students</span>
                </div>
                <Progress 
                  value={(studentGradeData.filter(s => (s.currentGrade || 0) < 60).length / gradeStats.totalStudents) * 100} 
                  className="h-2" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Grades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Student</th>
                      <th className="text-left py-3 px-4 font-medium">Current Grade</th>
                      <th className="text-left py-3 px-4 font-medium">Activities</th>
                      <th className="text-left py-3 px-4 font-medium">Assessments</th>
                      <th className="text-left py-3 px-4 font-medium">Trend</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGradeData.map((student) => (
                      <tr key={student.studentId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{student.studentName}</div>
                            <div className="text-sm text-gray-500">{student.studentEmail}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {student.currentGrade !== null ? `${student.currentGrade.toFixed(1)}%` : '-'}
                            </span>
                            {student.letterGrade && (
                              <Badge variant="outline">{student.letterGrade}</Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {student.activitiesCompleted}/{activities?.length || 0}
                        </td>
                        <td className="py-3 px-4">
                          {student.assessmentsCompleted}/{assessments?.length || 0}
                        </td>
                        <td className="py-3 px-4">
                          {student.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                          {student.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                          {student.trend === 'stable' && <div className="h-4 w-4" />}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/teacher/classes/${classId}/students/${student.studentId}/grades`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities and Assessments tabs would be similar */}
        <TabsContent value="activities">
          <Card>
            <CardHeader>
              <CardTitle>Activities Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Activities grading interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardHeader>
              <CardTitle>Assessments Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Assessments grading interface will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
