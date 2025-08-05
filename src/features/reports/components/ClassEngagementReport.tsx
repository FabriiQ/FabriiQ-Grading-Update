'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  Activity,
  Clock,
  MessageSquare,
  Eye,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { MousePointer } from '@/components/ui/icons-fix';

interface ClassEngagementReportProps {
  classId: string;
  period: 'daily' | 'weekly' | 'monthly';
  data?: any;
  isLoading: boolean;
}

export function ClassEngagementReport({ classId, period, data, isLoading }: ClassEngagementReportProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    );
  }

  // Mock data for demonstration - replace with actual data
  const engagementData = data || {
    overallEngagement: 78.5,
    activeStudents: 28,
    totalStudents: 32,
    averageSessionTime: 45,
    engagementTrend: [
      { date: '2024-01-01', engagement: 72 },
      { date: '2024-01-08', engagement: 75 },
      { date: '2024-01-15', engagement: 73 },
      { date: '2024-01-22', engagement: 79 },
      { date: '2024-01-29', engagement: 78.5 }
    ],
    activityEngagement: [
      { activity: 'Quizzes', engagement: 85, participation: 90 },
      { activity: 'Discussions', engagement: 72, participation: 65 },
      { activity: 'Assignments', engagement: 78, participation: 88 },
      { activity: 'Videos', engagement: 82, participation: 95 },
      { activity: 'Reading', engagement: 68, participation: 70 }
    ],
    timeDistribution: [
      { timeSlot: '8-10 AM', students: 12, engagement: 85 },
      { timeSlot: '10-12 PM', students: 18, engagement: 78 },
      { timeSlot: '12-2 PM', students: 8, engagement: 65 },
      { timeSlot: '2-4 PM', students: 15, engagement: 82 },
      { timeSlot: '4-6 PM', students: 10, engagement: 75 }
    ],
    engagementMetrics: [
      { metric: 'Participation', value: 78, fullMark: 100 },
      { metric: 'Interaction', value: 65, fullMark: 100 },
      { metric: 'Completion', value: 82, fullMark: 100 },
      { metric: 'Time Spent', value: 75, fullMark: 100 },
      { metric: 'Discussion', value: 68, fullMark: 100 },
      { metric: 'Collaboration', value: 72, fullMark: 100 }
    ],
    topEngagedStudents: [
      { name: 'Alice Johnson', engagement: 95, activities: 24 },
      { name: 'Bob Smith', engagement: 92, activities: 22 },
      { name: 'Carol Davis', engagement: 89, activities: 20 }
    ],
    lowEngagementStudents: [
      { name: 'David Wilson', engagement: 45, activities: 8 },
      { name: 'Eva Brown', engagement: 52, activities: 10 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Engagement Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overall Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData.overallEngagement}%</div>
            <Progress value={engagementData.overallEngagement} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {engagementData.activeStudents}/{engagementData.totalStudents}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((engagementData.activeStudents / engagementData.totalStudents) * 100)}% participation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Session Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementData.averageSessionTime}m</div>
            <p className="text-xs text-muted-foreground">Per student session</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+5.2%</div>
            <p className="text-xs text-muted-foreground">From last {period}</p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Trend</CardTitle>
          <CardDescription>Class engagement levels over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={engagementData.engagementTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="engagement" 
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Activity Engagement and Time Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Engagement</CardTitle>
            <CardDescription>Engagement levels by activity type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData.activityEngagement || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="activity" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="engagement" fill="#8884d8" />
                <Bar dataKey="participation" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peak Engagement Times</CardTitle>
            <CardDescription>When students are most active</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={engagementData.timeDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timeSlot" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="students" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Radar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
          <CardDescription>Multi-dimensional view of class engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={engagementData.engagementMetrics || []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Engagement"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.3}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Student Engagement Lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Most Engaged Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(engagementData.topEngagedStudents || []).map((student: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.activities} activities completed</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {student.engagement}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Need Engagement Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(engagementData.lowEngagementStudents || []).map((student: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.activities} activities completed</p>
                  </div>
                  <Badge variant="destructive">
                    {student.engagement}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
