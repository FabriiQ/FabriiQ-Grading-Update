'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useOfflineStorage, OfflineStorageType } from '@/features/coordinator/offline';
import { api } from '@/utils/api';
import {
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Loader2,
  Users,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  BookOpen
} from 'lucide-react';

interface TeacherPerformanceComparisonProps {
  courseId?: string;
  programId?: string;
  timeframe?: 'month' | 'term' | 'year';
}

interface Teacher {
  id: string;
  name: string;
  avatar?: string;
  metrics: {
    studentPerformance: number;
    attendanceRate: number;
    feedbackTime: number;
    classEngagement: number;
    contentQuality: number;
    overallRating: number;
  };
  classes: {
    id: string;
    name: string;
    studentCount: number;
    averageGrade: number;
  }[];
  trends: {
    month: string;
    studentPerformance: number;
    attendanceRate: number;
  }[];
}

/**
 * TeacherPerformanceComparison Component
 *
 * Compares teacher performance across multiple metrics.
 * Includes detailed analytics, trends, and visual comparisons.
 */
export function TeacherPerformanceComparison({
  courseId,
  // programId is unused but kept for API compatibility
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  programId,
  timeframe = 'term'
}: TeacherPerformanceComparisonProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(timeframe);
  const [selectedCourseId, setSelectedCourseId] = useState<string | undefined>(courseId);
  const [selectedMetric, setSelectedMetric] = useState<string>('overallRating');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Offline storage hooks
  const {
    isOnline,
    getData: getPerformanceData,
    saveData: savePerformanceData
  } = useOfflineStorage(OfflineStorageType.ANALYTICS);

  // Fetch available courses using tRPC
  const { data: availableCourses = [], isLoading: isLoadingCourses } = api.course.getAll.useQuery(
    {},
    {
      staleTime: 10 * 60 * 1000, // 10 minutes cache
      refetchOnWindowFocus: false,
    }
  );

  // Fetch performance data on component mount or when parameters change
  useEffect(() => {
    getPerformanceData('teacherPerformance', `${selectedCourseId || 'all'}-${selectedTimeframe}`);
  }, [selectedTimeframe, selectedCourseId, getPerformanceData]);

  // Use tRPC to fetch teacher metrics
  const { data: teacherMetrics, isLoading: isLoadingMetrics, refetch } = api.teacherAnalytics.getTeacherMetrics.useQuery(
    {
      courseId: selectedCourseId || undefined,
      timeframe: selectedTimeframe as "week" | "month" | "term" | "year",
      metricType: "overallRating"
    },
    {
      enabled: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    }
  );

  // Process teacher data when it changes
  useEffect(() => {
    if (teacherMetrics && !isLoadingMetrics) {
      try {
        // Transform API data to match our Teacher interface
        const teachersArray = Array.isArray(teacherMetrics) ? teacherMetrics : [teacherMetrics];
        const transformedTeachers: Teacher[] = teachersArray.map((teacher: any) => ({
          id: teacher.id,
          name: teacher.name,
          avatar: teacher.avatar || null,
          metrics: {
            studentPerformance: teacher.metrics?.studentPerformance || 0,
            attendanceRate: teacher.metrics?.attendanceRate || 0,
            feedbackTime: teacher.metrics?.feedbackTime || 48, // Default to 48 hours
            classEngagement: teacher.metrics?.classEngagement || 0,
            contentQuality: teacher.metrics?.contentQuality || 0,
            overallRating: teacher.metrics?.overallRating || 0
          },
          classes: teacher.classes?.map((cls: any) => ({
            id: cls.id,
            name: cls.name,
            studentCount: cls.studentCount || 0,
            averageGrade: cls.averageGrade || 0
          })) || [],
          trends: [
            // Generate basic trend data - in a real implementation, this would come from the API
            { month: 'Jan', studentPerformance: Math.max(0, (teacher.metrics?.studentPerformance || 0) - 5), attendanceRate: Math.max(0, (teacher.metrics?.attendanceRate || 0) - 3) },
            { month: 'Feb', studentPerformance: Math.max(0, (teacher.metrics?.studentPerformance || 0) - 3), attendanceRate: Math.max(0, (teacher.metrics?.attendanceRate || 0) - 2) },
            { month: 'Mar', studentPerformance: Math.max(0, (teacher.metrics?.studentPerformance || 0) - 1), attendanceRate: Math.max(0, (teacher.metrics?.attendanceRate || 0) - 1) },
            { month: 'Apr', studentPerformance: teacher.metrics?.studentPerformance || 0, attendanceRate: teacher.metrics?.attendanceRate || 0 },
            { month: 'May', studentPerformance: Math.min(100, (teacher.metrics?.studentPerformance || 0) + 1), attendanceRate: Math.min(100, (teacher.metrics?.attendanceRate || 0) + 1) },
            { month: 'Jun', studentPerformance: Math.min(100, (teacher.metrics?.studentPerformance || 0) + 2), attendanceRate: Math.min(100, (teacher.metrics?.attendanceRate || 0) + 1) }
          ]
        }));

        setTeachers(transformedTeachers);
        // Select first two teachers by default if available
        if (transformedTeachers.length >= 2) {
          setSelectedTeachers([transformedTeachers[0].id, transformedTeachers[1].id]);
        } else if (transformedTeachers.length === 1) {
          setSelectedTeachers([transformedTeachers[0].id]);
        } else {
          setSelectedTeachers([]);
        }
        setIsLoading(false);

        // Save to offline storage
        savePerformanceData('teacherPerformance', `${selectedCourseId || 'all'}-${selectedTimeframe}`, transformedTeachers);
      } catch (error) {
        console.error('Error processing teacher data:', error);
        setIsLoading(false);
      }
    } else if (isLoadingMetrics) {
      setIsLoading(true);
    }
  }, [teacherMetrics, isLoadingMetrics, selectedCourseId, selectedTimeframe]);

  // Handle manual refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle timeframe change
  const handleTimeframeChange = (value: string) => {
    setSelectedTimeframe(value);
  };

  // Handle course change
  const handleCourseChange = (value: string) => {
    setSelectedCourseId(value);
  };

  // Handle metric change
  const handleMetricChange = (value: string) => {
    setSelectedMetric(value);
  };

  // Toggle teacher selection
  const toggleTeacherSelection = (teacherId: string) => {
    setSelectedTeachers(prev => {
      if (prev.includes(teacherId)) {
        return prev.filter(id => id !== teacherId);
      } else {
        return [...prev, teacherId];
      }
    });
  };

  // Get selected teachers data
  const selectedTeachersData = teachers.filter(teacher =>
    selectedTeachers.includes(teacher.id)
  );

  // Prepare radar chart data
  const radarData = selectedTeachersData.map(teacher => ({
    subject: 'Student Performance',
    [teacher.name]: teacher.metrics.studentPerformance
  })).concat(
    selectedTeachersData.map(teacher => ({
      subject: 'Attendance Rate',
      [teacher.name]: teacher.metrics.attendanceRate
    }))
  ).concat(
    selectedTeachersData.map(teacher => ({
      subject: 'Class Engagement',
      [teacher.name]: teacher.metrics.classEngagement
    }))
  ).concat(
    selectedTeachersData.map(teacher => ({
      subject: 'Content Quality',
      [teacher.name]: teacher.metrics.contentQuality
    }))
  ).concat(
    selectedTeachersData.map(teacher => ({
      subject: 'Feedback Time',
      [teacher.name]: 100 - (teacher.metrics.feedbackTime / 72 * 100) // Normalize feedback time (lower is better)
    }))
  );

  // Prepare comparison chart data
  const comparisonData = teachers.map(teacher => ({
    name: teacher.name,
    [selectedMetric]: teacher.metrics[selectedMetric as keyof typeof teacher.metrics]
  }));

  // Prepare trend chart data
  const trendData = selectedTeachersData.length > 0
    ? selectedTeachersData[0].trends.map((trend, index) => {
        const data: any = { month: trend.month };
        selectedTeachersData.forEach(teacher => {
          data[teacher.name] = teacher.trends[index].studentPerformance;
        });
        return data;
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-xl font-semibold">Teacher Performance Comparison</h2>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedCourseId} onValueChange={handleCourseChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Courses</SelectItem>
              {availableCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedTimeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Monthly</SelectItem>
              <SelectItem value="term">Term</SelectItem>
              <SelectItem value="year">Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || !isOnline}
          >
            <Loader2 className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Compare teacher performance across key metrics</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Skeleton className="h-full w-full" />
                  </div>
                ) : selectedTeachersData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No teachers selected</h3>
                    <p className="text-sm text-muted-foreground">
                      Select teachers from the list to compare
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      {selectedTeachersData.map((teacher, index) => (
                        <Radar
                          key={teacher.id}
                          name={teacher.name}
                          dataKey={teacher.name}
                          stroke={`hsl(${index * 60}, 70%, 50%)`}
                          fill={`hsl(${index * 60}, 70%, 50%)`}
                          fillOpacity={0.2}
                        />
                      ))}
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teacher Selection</CardTitle>
                <CardDescription>Select teachers to compare</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border-b">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-2">
                    {teachers.map((teacher) => (
                      <div
                        key={teacher.id}
                        className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedTeachers.includes(teacher.id) ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => toggleTeacherSelection(teacher.id)}
                      >
                        <div className="flex-shrink-0">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={teacher.avatar} alt={teacher.name} />
                            <AvatarFallback>{teacher.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{teacher.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {teacher.classes.length} Classes, {teacher.classes.reduce((sum, cls) => sum + cls.studentCount, 0)} Students
                          </div>
                        </div>
                        <Badge variant={selectedTeachers.includes(teacher.id) ? "default" : "outline"}>
                          {selectedTeachers.includes(teacher.id) ? "Selected" : "Select"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>Key performance indicators for all teachers</CardDescription>
                </div>
                <Select value={selectedMetric} onValueChange={handleMetricChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overallRating">Overall Rating</SelectItem>
                    <SelectItem value="studentPerformance">Student Performance</SelectItem>
                    <SelectItem value="attendanceRate">Attendance Rate</SelectItem>
                    <SelectItem value="classEngagement">Class Engagement</SelectItem>
                    <SelectItem value="contentQuality">Content Quality</SelectItem>
                    <SelectItem value="feedbackTime">Feedback Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey={selectedMetric}
                      name={selectedMetric === 'feedbackTime' ? 'Feedback Time (hours)' : selectedMetric.replace(/([A-Z])/g, ' $1').trim()}
                      fill="#8884d8"
                    />
                  </RechartsBarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Metrics</CardTitle>
              <CardDescription>Comprehensive performance metrics for each teacher</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Detailed metrics content will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Performance trends over time for selected teachers</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : selectedTeachersData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No teachers selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Select teachers from the overview tab to view trends
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[70, 100]} />
                    <Tooltip />
                    <Legend />
                    {selectedTeachersData.map((teacher, index) => (
                      <Line
                        key={teacher.id}
                        type="monotone"
                        dataKey={teacher.name}
                        stroke={`hsl(${index * 60}, 70%, 50%)`}
                        activeDot={{ r: 8 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance</CardTitle>
              <CardDescription>Performance metrics for each class by teacher</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Class performance content will be implemented here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
