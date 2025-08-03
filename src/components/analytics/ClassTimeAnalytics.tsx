'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import { Clock, Users, TrendingUp, BookOpen, Target, Download, Eye } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Link from 'next/link';

interface ClassTimeAnalyticsProps {
  classId: string;
  timeframe?: 'week' | 'month' | 'term';
}

export function ClassTimeAnalytics({ 
  classId, 
  timeframe = 'month'
}: ClassTimeAnalyticsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);

  // Get class time statistics
  const { data: classTimeStats, isLoading } = api.learningTime.getClassTimeStats.useQuery({
    classId,
    startDate: getStartDate(selectedTimeframe),
    endDate: new Date()
  });

  // Get individual student time stats for comparison
  const { data: studentTimeStats } = api.learningTime.getStudentTimeComparison.useQuery({
    classId,
    startDate: getStartDate(selectedTimeframe),
    endDate: new Date()
  });

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!classTimeStats) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No time tracking data available for this class yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatTimeDecimal = (minutes: number) => {
    return (minutes / 60).toFixed(1) + 'h';
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Class Time Analytics</h3>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="term">This Term</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total Class Time</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{formatTimeDecimal(classTimeStats.totalTimeSpent)}</div>
              <p className="text-xs text-muted-foreground">
                {classTimeStats.totalActivitiesCompleted} activities completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Active Students</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{classTimeStats.activeStudents}</div>
              <p className="text-xs text-muted-foreground">
                of {classTimeStats.totalStudents} students
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Class Average</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {formatTime(Math.round(classTimeStats.averageTimePerStudent || 0))}
              </div>
              <p className="text-xs text-muted-foreground">
                Per student
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Engagement Rate</span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{Math.round(classTimeStats.engagementRate || 0)}%</div>
              <p className="text-xs text-muted-foreground">
                Class participation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Time Distribution by Subject */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Time by Subject</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={classTimeStats.timeBySubject}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${formatTime(value)}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="timeSpent"
                    >
                      {classTimeStats.timeBySubject?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatTime(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Activity Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Activity Types</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={classTimeStats.timeByActivityType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="activityType" />
                    <YAxis tickFormatter={(value) => formatTime(value)} />
                    <Tooltip formatter={(value: any) => formatTime(value)} />
                    <Bar dataKey="timeSpent" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student Time Comparison</CardTitle>
              <CardDescription>Individual student learning time analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {studentTimeStats?.map((student, index) => (
                  <div key={student.studentId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm font-medium">
                        {student.studentName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{student.studentName}</div>
                        <div className="text-sm text-muted-foreground">
                          {student.activitiesCompleted} activities completed
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold">{formatTime(student.totalTimeSpent)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTime(Math.round(student.averageTimePerActivity || 0))} avg
                        </div>
                      </div>
                      <div className="w-24">
                        <Progress 
                          value={Math.min(100, (student.totalTimeSpent / (classTimeStats.averageTimePerStudent || 1)) * 100)} 
                          className="h-2" 
                        />
                      </div>
                      <Link href={`/teacher/classes/${classId}/students/${student.studentId}/learning-profile`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Subject Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {classTimeStats.timeBySubject?.map((subject, index) => (
                <div key={subject.subjectId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{subject.subjectName}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatTime(subject.timeSpent)}</div>
                      <div className="text-xs text-muted-foreground">
                        {subject.activitiesCompleted} activities
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(subject.timeSpent / classTimeStats.totalTimeSpent) * 100} 
                    className="h-2" 
                  />
                  <div className="text-xs text-muted-foreground">
                    {Math.round((subject.timeSpent / classTimeStats.totalTimeSpent) * 100)}% of total class time
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Class Time Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={classTimeStats.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatTime(value)} />
                  <Tooltip formatter={(value: any) => formatTime(value)} />
                  <Line type="monotone" dataKey="totalTimeSpent" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="averageTimePerStudent" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to get start date based on timeframe
function getStartDate(timeframe: string): Date {
  const now = new Date();
  switch (timeframe) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case 'term':
      // Assuming term starts 3 months ago
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}
