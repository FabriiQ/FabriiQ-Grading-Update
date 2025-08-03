'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';
import { 
  ChevronLeft, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  BarChart3, 
  PieChart, 
  FileText,
  Clock,
  Target,
  Award,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { ClassPerformanceReport } from '@/features/reports/components/ClassPerformanceReport';
import { ClassEngagementReport } from '@/features/reports/components/ClassEngagementReport';
import { ClassAnalyticsReport } from '@/features/reports/components/ClassAnalyticsReport';

interface ClassReportsPageProps {
  params: Promise<{
    classId: string;
  }>;
}

export default function ClassReportsPage({ params }: ClassReportsPageProps) {
  const { classId } = React.use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState('performance');
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  // Get class data
  const { data: classData, isLoading: isLoadingClass } = api.teacher.getClassById.useQuery({
    classId
  });

  // Get class analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = api.analytics.getClassAnalytics.useQuery({
    classId,
    period: reportPeriod
  });

  // Get class performance data
  const { data: performanceData, isLoading: isLoadingPerformance } = api.analytics.getClassPerformanceReport.useQuery({
    classId,
    period: reportPeriod
  });

  // Get class engagement data
  const { data: engagementData, isLoading: isLoadingEngagement } = api.analytics.getClassEngagement.useQuery({
    classId,
    period: reportPeriod
  });

  // Show loading state
  if (status === 'loading' || isLoadingClass) {
    return (
      <div className="container py-8">
        <Skeleton className="h-12 w-1/3 mb-6" />
        <Skeleton className="h-8 w-1/4 mb-8" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  // Show error if class not found
  if (!classData) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Class not found or you don't have permission to view this class.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      
      // Generate comprehensive report
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classId,
          type: 'COMPREHENSIVE',
          period: reportPeriod,
          teacherId: session?.user?.id
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Report generated successfully',
        });
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'error',
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href={`/teacher/classes/${classId}`}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Class
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Class Reports</h1>
            <p className="text-muted-foreground">{classData.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={reportPeriod} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setReportPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
            {isGeneratingReport ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">Active learners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceData?.averageScore?.toFixed(1) || '0.0'}%</div>
            <p className="text-xs text-muted-foreground">Class average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Engagement Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData?.overallEngagement?.toFixed(1) || '0.0'}%</div>
            <p className="text-xs text-muted-foreground">Active participation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.completionRate?.toFixed(1) || '0.0'}%</div>
            <p className="text-xs text-muted-foreground">Activities completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <ClassPerformanceReport
            classId={classId}
            period={reportPeriod}
            data={performanceData}
            isLoading={isLoadingPerformance}
          />
        </TabsContent>

        <TabsContent value="engagement">
          <ClassEngagementReport
            classId={classId}
            period={reportPeriod}
            data={engagementData}
            isLoading={isLoadingEngagement}
          />
        </TabsContent>

        <TabsContent value="analytics">
          <ClassAnalyticsReport
            classId={classId}
            period={reportPeriod}
            data={analyticsData}
            isLoading={isLoadingAnalytics}
          />
        </TabsContent>

        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Report
              </CardTitle>
              <CardDescription>
                Generate a comprehensive report for {classData.name} ({reportPeriod} period)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-900">Ready to Export</p>
                    <p className="text-sm text-blue-700">
                      Comprehensive {reportPeriod} report for {classData.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Generate your report</p>
                    <p className="text-sm text-muted-foreground">
                      This will create a comprehensive report with all analytics data
                    </p>
                  </div>

                  <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
                    {isGeneratingReport ? (
                      <>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
