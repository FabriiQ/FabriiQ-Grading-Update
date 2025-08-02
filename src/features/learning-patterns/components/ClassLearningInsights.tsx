'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, AlertTriangle, Target } from 'lucide-react';

interface ClassInsight {
  classId: string;
  studentCount: number;
  studentPatterns: Array<{
    studentId: string;
    studentName: string;
    patterns: any;
  }>;
  classAverages: {
    consistencyScore: number;
    riskFactorCount: number;
  };
}

interface ClassLearningInsightsProps {
  insights: ClassInsight[];
  isLoading?: boolean;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function ClassLearningInsights({ insights, isLoading }: ClassLearningInsightsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!insights || insights.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No learning insights data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const classPerformanceData = insights.map(insight => ({
    classId: `Class ${insight.classId.slice(-4)}`,
    consistency: Math.round(insight.classAverages.consistencyScore),
    students: insight.studentCount,
    riskFactors: Math.round(insight.classAverages.riskFactorCount)
  }));

  // Aggregate learning style distribution
  const learningStyleData = insights.reduce((acc, insight) => {
    insight.studentPatterns.forEach(student => {
      const style = student.patterns.learningStyle?.primary || 'unknown';
      acc[style] = (acc[style] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const learningStyleChartData = Object.entries(learningStyleData).map(([style, count]) => ({
    name: style.replace('_', ' '),
    value: count,
    percentage: Math.round((count / insights.reduce((sum, i) => sum + i.studentCount, 0)) * 100)
  }));

  // Performance trend analysis
  const performanceTrends = insights.reduce((acc, insight) => {
    insight.studentPatterns.forEach(student => {
      const trend = student.patterns.performancePatterns?.improvementTrend || 'unknown';
      acc[trend] = (acc[trend] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const trendChartData = Object.entries(performanceTrends).map(([trend, count]) => ({
    trend: trend.charAt(0).toUpperCase() + trend.slice(1),
    count,
    percentage: Math.round((count / insights.reduce((sum, i) => sum + i.studentCount, 0)) * 100)
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">
              Active classes analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Class Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(insights.reduce((sum, i) => sum + i.studentCount, 0) / insights.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              Students per class
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Consistency</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(insights.reduce((sum, i) => sum + i.classAverages.consistencyScore, 0) / insights.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Performance consistency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Indicators</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(insights.reduce((sum, i) => sum + i.classAverages.riskFactorCount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Total risk factors
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Class Performance Overview</CardTitle>
            <CardDescription>
              Consistency scores and student counts by class
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="classId" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="consistency" fill="#8884d8" name="Consistency %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Learning Style Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Style Distribution</CardTitle>
            <CardDescription>
              Distribution of primary learning styles across all students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={learningStyleChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {learningStyleChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends Analysis</CardTitle>
          <CardDescription>
            Distribution of improvement trends across all students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={trendChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="trend" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Class Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight) => (
          <Card key={insight.classId}>
            <CardHeader>
              <CardTitle className="text-lg">Class {insight.classId.slice(-4)}</CardTitle>
              <CardDescription>
                {insight.studentCount} students
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Consistency Score</span>
                  <span className="font-medium">{Math.round(insight.classAverages.consistencyScore)}%</span>
                </div>
                <Progress value={insight.classAverages.consistencyScore} className="h-2" />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Risk Factors</span>
                <Badge variant={insight.classAverages.riskFactorCount > 2 ? "destructive" : "secondary"}>
                  {Math.round(insight.classAverages.riskFactorCount)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
