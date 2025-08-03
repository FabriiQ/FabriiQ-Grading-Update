'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/trpc/react';
import { Clock, TrendingUp, BookOpen, Target } from 'lucide-react';

interface LearningTimeSummaryProps {
  studentId: string;
  classId?: string;
  timeframe?: 'week' | 'month' | 'term';
  compact?: boolean;
}

export function LearningTimeSummary({ 
  studentId, 
  classId, 
  timeframe = 'month',
  compact = false 
}: LearningTimeSummaryProps) {
  // Get learning time statistics
  const { data: timeStats, isLoading } = api.learningTime.getLearningTimeStats.useQuery({
    classId,
    startDate: getStartDate(timeframe),
    endDate: new Date()
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeStats) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No time data available</p>
          </div>
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

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'term': return 'This Term';
      default: return 'This Month';
    }
  };

  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Learning Time</span>
            </div>
            <Badge variant="outline">{getTimeframeLabel()}</Badge>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold">{formatTimeDecimal(timeStats.totalTimeSpentMinutes)}</div>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span>{timeStats.totalActivitiesCompleted} activities</span>
              <span>Avg: {formatTime(Math.round(timeStats.averageTimePerActivity || 0))}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Learning Time Investment
        </CardTitle>
        <CardDescription>{getTimeframeLabel()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {formatTimeDecimal(timeStats.totalTimeSpentMinutes)}
            </div>
            <p className="text-sm text-muted-foreground">Total Time</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {timeStats.totalActivitiesCompleted}
            </div>
            <p className="text-sm text-muted-foreground">Activities</p>
          </div>
        </div>

        {/* Average Time per Activity */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Average per Activity</span>
            <span className="font-medium">{formatTime(Math.round(timeStats.averageTimePerActivity || 0))}</span>
          </div>
          <Progress
            value={Math.min(100, (timeStats.averageTimePerActivity || 0) / 30 * 100)}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Target: 30 minutes per activity
          </p>
        </div>

        {/* Top Subject */}
        {timeStats.timeSpentBySubject && timeStats.timeSpentBySubject.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">Most Time Spent</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium">{timeStats.timeSpentBySubject[0].subjectName}</div>
                <div className="text-sm text-muted-foreground">
                  {timeStats.timeSpentBySubject[0].activityCount || 0} activities
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {formatTime(timeStats.timeSpentBySubject[0].timeSpentMinutes)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {Math.round((timeStats.timeSpentBySubject[0].timeSpentMinutes / timeStats.totalTimeSpentMinutes) * 100)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Learning Efficiency */}
        {timeStats.efficiencyScore !== undefined && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Learning Efficiency</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>Efficiency Score</span>
              <span className="font-medium">{Math.round(timeStats.efficiencyScore)}%</span>
            </div>
            <Progress value={timeStats.efficiencyScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Based on time spent vs. performance achieved
            </p>
          </div>
        )}

        {/* Study Pattern Insights */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm font-medium">Study Insights</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Daily Average:</span>
              <span className="font-medium">{formatTime(Math.round(timeStats.dailyAverage || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peak Time:</span>
              <span className="font-medium">{timeStats.peakLearningTime || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session Length:</span>
              <span className="font-medium">{formatTime(Math.round(timeStats.averageSessionLength || 0))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Consistency:</span>
              <Badge variant={(timeStats.consistencyScore || 0) > 70 ? 'default' : 'secondary'} className="text-xs">
                {(timeStats.consistencyScore || 0) > 70 ? 'High' : 'Moderate'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
