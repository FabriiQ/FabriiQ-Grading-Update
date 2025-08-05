'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  Target,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  BarChart3
} from 'lucide-react';
import { Brain } from '@/components/ui/icons-fix';

interface ClassAnalyticsReportProps {
  classId: string;
  period: 'daily' | 'weekly' | 'monthly';
  data?: any;
  isLoading: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ClassAnalyticsReport({ classId, period, data, isLoading }: ClassAnalyticsReportProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-[120px]" />
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
  const analyticsData = data || {
    totalStudents: 32,
    completionRate: 78.5,
    averageTimeSpent: 45,
    bloomsDistribution: [
      { level: 'Remember', count: 120, percentage: 25 },
      { level: 'Understand', count: 96, percentage: 20 },
      { level: 'Apply', count: 84, percentage: 17.5 },
      { level: 'Analyze', count: 72, percentage: 15 },
      { level: 'Evaluate', count: 60, percentage: 12.5 },
      { level: 'Create', count: 48, percentage: 10 }
    ],
    learningPatterns: [
      { pattern: 'Visual Learners', count: 12, percentage: 37.5 },
      { pattern: 'Auditory Learners', count: 8, percentage: 25 },
      { pattern: 'Kinesthetic Learners', count: 7, percentage: 21.9 },
      { pattern: 'Reading/Writing', count: 5, percentage: 15.6 }
    ],
    performanceCorrelation: [
      { timeSpent: 20, performance: 65, student: 'Student A' },
      { timeSpent: 35, performance: 78, student: 'Student B' },
      { timeSpent: 45, performance: 85, student: 'Student C' },
      { timeSpent: 60, performance: 92, student: 'Student D' },
      { timeSpent: 25, performance: 70, student: 'Student E' },
      { timeSpent: 50, performance: 88, student: 'Student F' }
    ],
    weeklyProgress: [
      { week: 'Week 1', activities: 15, completion: 68, performance: 72 },
      { week: 'Week 2', activities: 18, completion: 75, performance: 76 },
      { week: 'Week 3', activities: 20, completion: 82, performance: 78 },
      { week: 'Week 4', activities: 22, completion: 78, performance: 79 }
    ],
    riskFactors: [
      { factor: 'Low Engagement', students: 5, severity: 'high' },
      { factor: 'Poor Attendance', students: 3, severity: 'medium' },
      { factor: 'Late Submissions', students: 8, severity: 'low' },
      { factor: 'Declining Performance', students: 4, severity: 'high' }
    ],
    strengths: [
      { area: 'Problem Solving', score: 85, trend: 'up' },
      { area: 'Collaboration', score: 78, trend: 'stable' },
      { area: 'Critical Thinking', score: 82, trend: 'up' },
      { area: 'Communication', score: 75, trend: 'down' }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active learners</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.completionRate}%</div>
            <Progress value={analyticsData.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.averageTimeSpent}m</div>
            <p className="text-xs text-muted-foreground">Per activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Cognitive Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Apply</div>
            <p className="text-xs text-muted-foreground">Most common level</p>
          </CardContent>
        </Card>
      </div>

      {/* Bloom's Taxonomy Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Bloom's Taxonomy Distribution</CardTitle>
          <CardDescription>Cognitive levels of learning activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.bloomsDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ level, percentage }) => `${level}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(analyticsData.bloomsDistribution || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="space-y-3">
              {(analyticsData.bloomsDistribution || []).map((level: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{level.level}</span>
                    <span className="text-sm text-muted-foreground">
                      {level.count} activities ({level.percentage}%)
                    </span>
                  </div>
                  <Progress value={level.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance vs Time Correlation */}
      <Card>
        <CardHeader>
          <CardTitle>Performance vs Time Spent</CardTitle>
          <CardDescription>Correlation between time investment and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={analyticsData.performanceCorrelation || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timeSpent" name="Time Spent (minutes)" />
              <YAxis dataKey="performance" name="Performance %" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Students" dataKey="performance" fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weekly Progress and Learning Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Progress</CardTitle>
            <CardDescription>Activities, completion, and performance trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analyticsData.weeklyProgress || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="activities" fill="#8884d8" />
                <Line type="monotone" dataKey="completion" stroke="#82ca9d" />
                <Line type="monotone" dataKey="performance" stroke="#ffc658" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Patterns</CardTitle>
            <CardDescription>Distribution of learning styles in the class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(analyticsData.learningPatterns || []).map((pattern: any, index: number) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{pattern.pattern}</span>
                    <span className="text-sm text-muted-foreground">
                      {pattern.count} students ({pattern.percentage}%)
                    </span>
                  </div>
                  <Progress value={pattern.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Factors and Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Risk Factors
            </CardTitle>
            <CardDescription>Areas requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analyticsData.riskFactors || []).map((risk: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{risk.factor}</p>
                    <p className="text-sm text-muted-foreground">{risk.students} students affected</p>
                  </div>
                  <Badge 
                    variant={risk.severity === 'high' ? 'destructive' : risk.severity === 'medium' ? 'default' : 'secondary'}
                  >
                    {risk.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Class Strengths
            </CardTitle>
            <CardDescription>Areas where the class excels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(analyticsData.strengths || []).map((strength: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium">{strength.area}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={strength.score} className="h-2 w-20" />
                      <span className="text-sm text-muted-foreground">{strength.score}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {strength.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : strength.trend === 'down' ? (
                      <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
                    ) : (
                      <BarChart3 className="h-4 w-4 text-gray-500" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
