'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { TeacherAttendanceTracker } from './TeacherAttendanceTracker';
import { TeacherPerformanceComparison } from './TeacherPerformanceComparison';
import { ClassTransferManager } from './ClassTransferManager';
import { api } from '@/utils/api';
import {
  Users,
  BarChart,
  Calendar,
  ArrowRight as ChevronLeftRight,
  Loader2
} from 'lucide-react';

interface TeacherManagementDashboardProps {
  initialCourseId?: string;
  initialProgramId?: string;
}

/**
 * TeacherManagementDashboard Component
 *
 * Comprehensive dashboard for teacher management.
 * Includes attendance tracking, performance comparison, and class transfers.
 */
export function TeacherManagementDashboard({
  initialCourseId,
  initialProgramId
}: TeacherManagementDashboardProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId || '');
  const [selectedProgramId, setSelectedProgramId] = useState(initialProgramId || '');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch available programs
  const programsQuery = api.program.getAllPrograms.useQuery();

  // Fetch available courses based on selected program
  const coursesQuery = api.curriculum.getAllCourses.useQuery();

  // Fetch real teacher data for coordinator
  const teachersQuery = api.coordinator.getTeachers.useQuery(
    {
      campusId: selectedCourseId, // Use selected course as filter
      programId: selectedProgramId,
    },
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to fetch teacher data: ${error.message}`,
          variant: "error",
        });
      }
    }
  );

  // Fetch teacher performance metrics
  const teacherMetricsQuery = api.teacherAnalytics.getTeacherMetrics.useQuery(
    {
      courseId: selectedCourseId,
      programId: selectedProgramId,
      timeframe: "term",
    },
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to fetch teacher metrics: ${error.message}`,
          variant: "error",
        });
      }
    }
  );

  // Fetch pending transfers
  const transfersQuery = api.classTransfer.getPendingTransfers.useQuery(
    {},
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      onError: (error) => {
        toast({
          title: "Error",
          description: `Failed to fetch transfer data: ${error.message}`,
          variant: "error",
        });
      }
    }
  );

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await Promise.all([
        teachersQuery.refetch(),
        teacherMetricsQuery.refetch(),
        transfersQuery.refetch()
      ]);
      toast({
        title: "Data refreshed",
        description: "Teacher management data has been refreshed.",
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh teacher management data.",
        variant: "error",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle program change
  const handleProgramChange = (value: string) => {
    setSelectedProgramId(value);
    setSelectedCourseId(''); // Reset course when program changes
  };

  // Handle course change
  const handleCourseChange = (value: string) => {
    setSelectedCourseId(value);
  };

  // Loading state
  const isLoading = programsQuery.isLoading || coursesQuery.isLoading || teachersQuery.isLoading || teacherMetricsQuery.isLoading || transfersQuery.isLoading;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold">Teacher Management</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedProgramId} onValueChange={handleProgramChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Programs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Programs</SelectItem>
              {programsQuery.data?.map(program => (
                <SelectItem key={program.id} value={program.id}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCourseId} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {coursesQuery.data?.courses?.map(course => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <Loader2 className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {isLoading ? '...' : teachersQuery.data?.teachers?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {isLoading ? '...' : teacherMetricsQuery.data && Array.isArray(teacherMetricsQuery.data) && teacherMetricsQuery.data.length > 0
                  ? `${Math.round(teacherMetricsQuery.data.reduce((acc, teacher) => acc + (teacher.metrics?.overallRating || 0), 0) / teacherMetricsQuery.data.length)}%`
                  : '0%'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {isLoading ? '...' : teacherMetricsQuery.data && Array.isArray(teacherMetricsQuery.data) && teacherMetricsQuery.data.length > 0
                  ? `${Math.round(teacherMetricsQuery.data.reduce((acc, teacher) => acc + (teacher.metrics?.attendanceRate || 0), 0) / teacherMetricsQuery.data.length)}%`
                  : '0%'}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ChevronLeftRight className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {isLoading ? '...' : transfersQuery.data?.transfers?.length || 0}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Management Overview</CardTitle>
              <CardDescription>Comprehensive view of teacher management metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select a tab above to view detailed information about teacher attendance,
                  performance metrics, or manage class transfers.
                </p>

                {isLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2">Loading teacher data...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Top Performing Teachers</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!isLoading && teacherMetricsQuery.data && Array.isArray(teacherMetricsQuery.data) && teacherMetricsQuery.data.length > 0 ? (
                          teacherMetricsQuery.data
                            .sort((a, b) => (b.metrics?.overallRating || 0) - (a.metrics?.overallRating || 0))
                            .slice(0, 3)
                            .map((teacher, index) => (
                              <div key={teacher.id} className="flex items-center justify-between py-2">
                                <div className="flex items-center">
                                  <div className="w-6 text-muted-foreground">{index + 1}.</div>
                                  <div>{teacher.name}</div>
                                </div>
                                <div className="font-medium">{(teacher.metrics?.overallRating || 0).toFixed(1)}%</div>
                              </div>
                            ))
                        ) : (
                          <div className="flex items-center justify-center py-4 text-muted-foreground">
                            {isLoading ? 'Loading...' : 'No teacher performance data available'}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Recent Activities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!isLoading ? (
                          // Mock recent activities data
                          [
                            { title: 'New lesson plan submitted', description: 'John Smith submitted a new lesson plan for Physics 101' },
                            { title: 'Attendance updated', description: 'Sarah Johnson updated attendance for Math 202' },
                            { title: 'Grades posted', description: 'Michael Brown posted grades for Chemistry 301' }
                          ].map((activity, index) => (
                            <div key={index} className="py-2">
                              <div className="flex items-center">
                                <div className="w-4 h-4 rounded-full bg-primary mr-2"></div>
                                <div className="font-medium">{activity.title}</div>
                              </div>
                              <div className="text-xs text-muted-foreground ml-6">
                                {activity.description}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center justify-center py-4 text-muted-foreground">
                            No recent activities available
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <TeacherAttendanceTracker
            courseId={selectedCourseId || undefined}
          />
        </TabsContent>

        <TabsContent value="performance">
          <TeacherPerformanceComparison
            courseId={selectedCourseId || undefined}
            programId={selectedProgramId || undefined}
          />
        </TabsContent>

        <TabsContent value="transfers">
          <ClassTransferManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
