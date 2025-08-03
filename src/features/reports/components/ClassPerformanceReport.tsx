'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Users, Target, Award } from 'lucide-react';

interface ClassPerformanceReportProps {
  classId: string;
  period: 'daily' | 'weekly' | 'monthly';
  data?: any;
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ClassPerformanceReport({ classId, period, data, isLoading }: ClassPerformanceReportProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  // Mock data for demonstration - replace with actual data
  const performanceData = data || {
    averageScore: 78.5,
    trend: 'up',
    trendPercentage: 5.2,
    scoreDistribution: [
      { range: '90-100%', count: 8, percentage: 25 },
      { range: '80-89%', count: 12, percentage: 37.5 },
      { range: '70-79%', count: 7, percentage: 21.9 },
      { range: '60-69%', count: 3, percentage: 9.4 },
      { range: 'Below 60%', count: 2, percentage: 6.2 }
    ],
    timeSeriesData: [
      { date: '2024-01-01', score: 75 },
      { date: '2024-01-08', score: 77 },
      { date: '2024-01-15', score: 76 },
      { date: '2024-01-22', score: 79 },
      { date: '2024-01-29', score: 78.5 }
    ],
    topPerformers: [
      { name: 'Alice Johnson', score: 95, improvement: 8 },
      { name: 'Bob Smith', score: 92, improvement: 5 },
      { name: 'Carol Davis', score: 89, improvement: 12 }
    ],
    strugglingStudents: [
      { name: 'David Wilson', score: 58, decline: -10 },
      { name: 'Eva Brown', score: 62, decline: -5 }
    ],
    subjectPerformance: [
      { subject: 'Mathematics', average: 82, students: 32 },
      { subject: 'Science', average: 78, students: 32 },
      { subject: 'English', average: 75, students: 32 },
      { subject: 'History', average: 80, students: 32 }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Class Average</span>
              <Target className="h-5 w-5 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-2">{performanceData.averageScore}%</div>
            <div className="flex items-center gap-2">
              {performanceData.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={`text-sm ${performanceData.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {performanceData.trendPercentage}% from last {period}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Top Performers</span>
              <Award className="h-5 w-5 text-yellow-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceData.topPerformers.slice(0, 3).map((student: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{student.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{student.score}%</Badge>
                    <span className="text-xs text-green-500">+{student.improvement}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Need Support</span>
              <Users className="h-5 w-5 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performanceData.strugglingStudents.map((student: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{student.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{student.score}%</Badge>
                    <span className="text-xs text-red-500">{student.decline}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Class average performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData.timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Score Distribution and Subject Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
            <CardDescription>How students are performing across grade ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={performanceData.scoreDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percentage }) => `${range}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {performanceData.scoreDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Average performance by subject area</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={performanceData.subjectPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
          <CardDescription>Detailed analysis of student performance ranges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.scoreDistribution.map((range: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{range.range}</span>
                  <span className="text-sm text-muted-foreground">
                    {range.count} students ({range.percentage}%)
                  </span>
                </div>
                <Progress value={range.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
