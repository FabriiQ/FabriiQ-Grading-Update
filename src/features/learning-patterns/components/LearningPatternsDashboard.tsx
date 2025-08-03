'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/trpc/react';
import { Zap, TrendingUp, AlertTriangle, Target, Users, Clock } from 'lucide-react';
import { EarlyWarningSystem } from './EarlyWarningSystem';
import { ClassLearningInsights } from './ClassLearningInsights';
import { StudentLearningProfile } from './StudentLearningProfile';
import { AdaptiveRecommendations } from './AdaptiveRecommendations';

interface LearningPatternsDashboardProps {
  teacherId: string;
  classIds?: string[];
  defaultClassId?: string;
}

export function LearningPatternsDashboard({
  teacherId,
  classIds,
  defaultClassId
}: LearningPatternsDashboardProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>(defaultClassId || '');
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'term'>('month');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch teacher insights
  const { data: teacherInsights, isLoading: insightsLoading, error: insightsError } = 
    api.learningPatterns.getTeacherInsights.useQuery({
      teacherId,
      classIds,
      timeframe
    });

  // Fetch class learning patterns for selected class
  const { data: classPatterns, isLoading: classPatternsLoading } = 
    api.learningPatterns.getClassLearningPatterns.useQuery(
      { classId: selectedClassId },
      { enabled: !!selectedClassId }
    );

  // Fetch early warnings for selected class
  const { data: earlyWarnings, isLoading: warningsLoading } = 
    api.learningPatterns.detectEarlyWarnings.useQuery(
      { studentId: '', classId: selectedClassId },
      { enabled: !!selectedClassId }
    );

  if (insightsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (insightsError) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load learning patterns data: {insightsError.message}
        </AlertDescription>
      </Alert>
    );
  }

  const insights = teacherInsights;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Learning Patterns Analytics
          </h1>
          <p className="text-muted-foreground">
            AI-powered insights into student learning behaviors and performance patterns
          </p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="term">This Term</SelectItem>
            </SelectContent>
          </Select>
          
          {classIds && classIds.length > 1 && (
            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classIds.map(classId => (
                  <SelectItem key={classId} value={classId}>
                    Class {classId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.summary.totalStudents || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {insights?.classInsights.length || 0} classes
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
              {Math.round(insights?.summary.averageConsistency || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Performance consistency score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Factors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(insights?.summary.totalRiskFactors || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Students needing attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights?.classInsights.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Classes with data
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Learning Patterns</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="warnings">Early Warnings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ClassLearningInsights
            insights={insights?.classInsights?.map(insight => ({
              ...insight,
              studentPatterns: insight.studentPatterns.map(student => ({
                ...student,
                studentName: student.studentName || 'Unknown Student'
              }))
            })) || []}
            isLoading={classPatternsLoading}
          />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          {selectedClassId && classPatterns ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {classPatterns.studentPatterns.map((student) => (
                <StudentLearningProfile
                  key={student.studentId}
                  studentId={student.studentId}
                  studentName={student.studentName || 'Unknown Student'}
                  profile={student.patterns}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Select a class to view detailed learning patterns
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <AdaptiveRecommendations 
            classId={selectedClassId}
            studentPatterns={classPatterns?.studentPatterns.map(student => ({
              ...student,
              studentName: student.studentName || 'Unknown Student'
            })) || []}
          />
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          <EarlyWarningSystem 
            warnings={earlyWarnings || []}
            isLoading={warningsLoading}
            classId={selectedClassId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
