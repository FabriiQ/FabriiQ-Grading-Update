'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  BookOpen,
  Award,
  Target as TargetIcon,
  Zap
} from 'lucide-react';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';

interface TeacherPerformanceMetricsProps {
  teacherId: string;
  timeframe?: 'week' | 'month' | 'term' | 'year';
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  progress?: number;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'success' | 'warning' | 'error';
}

function MetricCard({ title, value, subtitle, icon, progress, trend, color = 'primary' }: MetricCardProps) {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-orange-600',
    error: 'text-red-600'
  };

  const trendIcon = trend === 'up' ? (
    <TrendingUp className="h-3 w-3 text-green-500" />
  ) : trend === 'down' ? (
    <TrendingDown className="h-3 w-3 text-red-500" />
  ) : null;

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-md bg-muted ${colorClasses[color]}`}>
          {icon}
        </div>
        {trendIcon}
      </div>
      <div className="space-y-1">
        <div className={`text-2xl font-bold ${colorClasses[color]}`}>
          {value}
        </div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
        {progress !== undefined && (
          <div className="mt-2">
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
}

export function TeacherPerformanceMetrics({ teacherId, timeframe = 'term' }: TeacherPerformanceMetricsProps) {
  const { toast } = useToast();

  // Fetch teacher performance metrics
  const { data: metrics, isLoading } = api.teacherAnalytics.getTeacherMetrics.useQuery(
    { 
      teacherId,
      timeframe 
    },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching teacher metrics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load performance metrics',
          variant: 'error',
        });
      }
    }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Your teaching performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-12 w-12 rounded-md" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Your teaching performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <TargetIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No performance data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trends (mock data for now - would be calculated from historical data)
  const getTrend = (value: number) => {
    if (value >= 85) return 'up';
    if (value <= 60) return 'down';
    return 'neutral';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Your teaching performance overview for this {timeframe}</CardDescription>
          </div>
          <Badge variant="outline" className="capitalize">
            {timeframe}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Overall Rating"
            value={metrics.overallRating?.toFixed(1) || 'N/A'}
            subtitle="Out of 5.0"
            icon={<Award className="h-5 w-5" />}
            progress={metrics.overallRating ? (metrics.overallRating / 5) * 100 : undefined}
            trend={metrics.overallRating ? getTrend(metrics.overallRating * 20) : 'neutral'}
            color="primary"
          />
          
          <MetricCard
            title="Student Performance"
            value={metrics.studentPerformance ? `${metrics.studentPerformance.toFixed(1)}%` : 'N/A'}
            subtitle="Avg class performance"
            icon={<Users className="h-5 w-5" />}
            progress={metrics.studentPerformance}
            trend={metrics.studentPerformance ? getTrend(metrics.studentPerformance) : 'neutral'}
            color="success"
          />
          
          <MetricCard
            title="Attendance Rate"
            value={metrics.attendanceRate ? `${metrics.attendanceRate.toFixed(1)}%` : 'N/A'}
            subtitle="Class attendance"
            icon={<BookOpen className="h-5 w-5" />}
            progress={metrics.attendanceRate}
            trend={metrics.attendanceRate ? getTrend(metrics.attendanceRate) : 'neutral'}
            color="primary"
          />
          
          <MetricCard
            title="Feedback Time"
            value={metrics.feedbackTime ? `${metrics.feedbackTime.toFixed(1)}h` : 'N/A'}
            subtitle="Avg response time"
            icon={<Clock className="h-5 w-5" />}
            trend={metrics.feedbackTime ? (metrics.feedbackTime <= 24 ? 'up' : 'down') : 'neutral'}
            color="warning"
          />
        </div>

        {/* Additional metrics if available */}
        {(metrics.classEngagement || metrics.contentQuality) && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {metrics.classEngagement && (
              <MetricCard
                title="Class Engagement"
                value={`${metrics.classEngagement.toFixed(1)}%`}
                subtitle="Student participation"
                icon={<Zap className="h-5 w-5" />}
                progress={metrics.classEngagement}
                trend={getTrend(metrics.classEngagement)}
                color="success"
              />
            )}
            
            {metrics.contentQuality && (
              <MetricCard
                title="Content Quality"
                value={`${metrics.contentQuality.toFixed(1)}/5`}
                subtitle="Material rating"
                icon={<Award className="h-5 w-5" />}
                progress={(metrics.contentQuality / 5) * 100}
                trend={getTrend(metrics.contentQuality * 20)}
                color="primary"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
