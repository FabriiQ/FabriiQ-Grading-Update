'use client';

/**
 * Unified Analytics Dashboard
 * 
 * Real-time dashboard showing integrated grading and analytics data
 * with Bloom's taxonomy progression and performance insights.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/core/alert';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  BookOpen, 
  Target, 
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Activity
} from 'lucide-react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { BLOOMS_LEVEL_METADATA } from '@/features/bloom/constants/taxonomy';

interface PerformanceMetrics {
  totalStudents: number;
  averageScore: number;
  completionRate: number;
  engagementScore: number;
  bloomsDistribution: Record<BloomsTaxonomyLevel, number>;
  recentActivity: {
    activityId: string;
    activityTitle: string;
    studentName: string;
    score: number;
    percentage: number;
    gradedAt: Date;
    gradingType: 'AUTO' | 'MANUAL' | 'AI' | 'HYBRID';
  }[];
  performanceAlerts: {
    type: 'struggling' | 'exceptional' | 'improvement';
    studentName: string;
    message: string;
    confidence: number;
  }[];
}

interface UnifiedAnalyticsDashboardProps {
  classId: string;
  subjectId?: string;
  timeRange?: '24h' | '7d' | '30d';
  refreshInterval?: number; // in milliseconds
}

export function UnifiedAnalyticsDashboard({
  classId,
  subjectId,
  timeRange = '7d',
  refreshInterval = 30000, // 30 seconds
}: UnifiedAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data
  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/analytics/unified?classId=${classId}&subjectId=${subjectId}&timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchAnalytics();
    
    const interval = setInterval(fetchAnalytics, refreshInterval);
    return () => clearInterval(interval);
  }, [classId, subjectId, timeRange, refreshInterval]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load analytics: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertDescription>
          No analytics data available for the selected criteria.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with last updated info */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Real-Time Analytics Dashboard</h2>
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Active in {timeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageScore.toFixed(1)}%</div>
            <div className="flex items-center text-xs">
              {metrics.averageScore >= 75 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={metrics.averageScore >= 75 ? 'text-green-600' : 'text-red-600'}>
                {metrics.averageScore >= 75 ? 'Above target' : 'Below target'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
            <Progress value={metrics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.engagementScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Out of 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="blooms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="blooms">Bloom's Taxonomy</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="alerts">Performance Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="blooms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bloom's Taxonomy Distribution</CardTitle>
              <CardDescription>
                Cognitive level progression across all activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(BLOOMS_LEVEL_METADATA).map(([level, metadata]) => {
                  const count = metrics.bloomsDistribution[level as BloomsTaxonomyLevel] || 0;
                  const percentage = metrics.totalStudents > 0 ? (count / metrics.totalStudents) * 100 : 0;
                  
                  return (
                    <div key={level} className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 min-w-[120px]">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: metadata.color }}
                        />
                        <span className="text-sm font-medium">{metadata.name}</span>
                      </div>
                      <div className="flex-1">
                        <Progress value={percentage} className="h-2" />
                      </div>
                      <div className="text-sm text-muted-foreground min-w-[60px] text-right">
                        {count} ({percentage.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest graded submissions with real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{activity.activityTitle}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.studentName}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={activity.gradingType === 'AUTO' ? 'secondary' : 'outline'}>
                        {activity.gradingType}
                      </Badge>
                      <div className="text-right">
                        <div className="font-medium">{activity.percentage.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.gradedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Alerts</CardTitle>
              <CardDescription>
                AI-powered insights and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.performanceAlerts.map((alert, index) => (
                  <Alert key={index} variant={alert.type === 'struggling' ? 'destructive' : 'default'}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{alert.studentName}</div>
                        <AlertDescription className="mt-1">
                          {alert.message}
                        </AlertDescription>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {(alert.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                  </Alert>
                ))}
                {metrics.performanceAlerts.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No performance alerts at this time
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
