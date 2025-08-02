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
import { Zap, TrendingUp, AlertTriangle, Target, Users, Clock, ArrowLeft } from 'lucide-react';
import { StudentLearningProfile } from './StudentLearningProfile';
import { AdaptiveRecommendations } from './AdaptiveRecommendations';
import { EarlyWarningSystem } from './EarlyWarningSystem';
import Link from 'next/link';

interface ClassLearningPatternsViewProps {
  classId: string;
  className: string;
  teacherId: string;
}

export function ClassLearningPatternsView({
  classId,
  className,
  teacherId
}: ClassLearningPatternsViewProps) {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'term'>('month');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch class learning patterns
  const { data: classPatterns, isLoading: classPatternsLoading, error: classPatternsError } = 
    api.learningPatterns.getClassLearningPatterns.useQuery({ classId });

  // Fetch early warnings for class
  const { data: earlyWarnings, isLoading: warningsLoading } = 
    api.learningPatterns.detectEarlyWarnings.useQuery(
      { studentId: '', classId },
      { enabled: !!classId }
    );

  if (classPatternsLoading) {
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

  if (classPatternsError) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load learning patterns data: {classPatternsError.message}
        </AlertDescription>
      </Alert>
    );
  }

  const patterns = classPatterns;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link 
              href={`/teacher/classes/${classId}`}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="h-6 w-6 text-primary" />
              Learning Patterns - {className}
            </h1>
          </div>
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
            <div className="text-2xl font-bold">{patterns?.studentCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Students analyzed
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
              {Math.round(patterns?.classAverages.consistencyScore || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Performance consistency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Factors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(patterns?.classAverages.riskFactorCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Students needing attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Early Warnings</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earlyWarnings?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active warnings
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Student Profiles</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="warnings">Early Warnings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {patterns && patterns.studentPatterns.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {patterns.studentPatterns.map((student) => (
                <StudentLearningProfile
                  key={student.studentId}
                  studentId={student.studentId}
                  studentName={student.studentName}
                  profile={student.patterns}
                  classId={classId}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  No student learning patterns available yet. Students need to complete more activities for analysis.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <AdaptiveRecommendations 
            classId={classId}
            studentPatterns={patterns?.studentPatterns || []}
          />
        </TabsContent>

        <TabsContent value="warnings" className="space-y-4">
          <EarlyWarningSystem 
            warnings={earlyWarnings || []}
            isLoading={warningsLoading}
            classId={classId}
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Analytics</CardTitle>
              <CardDescription>
                Detailed analytics and trends for {className}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Advanced analytics dashboard coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
