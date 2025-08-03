'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/trpc/react';
import { Clock } from 'lucide-react';

interface StudentTimeWidgetProps {
  studentId: string;
  classId?: string;
  timeframe?: 'week' | 'month' | 'term';
  compact?: boolean;
}

export function StudentTimeWidget({ 
  studentId, 
  classId, 
  timeframe = 'month',
  compact = true 
}: StudentTimeWidgetProps) {
  // Get learning time statistics
  const { data: timeStats, isLoading } = api.learningTime.getLearningTimeStats.useQuery({
    classId,
    startDate: getStartDate(timeframe),
    endDate: new Date()
  }, {
    enabled: !!studentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="flex justify-between text-sm mb-1">
        <span>Learning Time</span>
        <div className="h-4 w-12 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!timeStats || timeStats.totalTimeSpentMinutes === 0) {
    return (
      <div className="flex justify-between text-sm mb-1">
        <span>Learning Time</span>
        <span className="text-muted-foreground">No data</span>
      </div>
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

  if (compact) {
    return (
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Learning Time
          </span>
          <span className="font-medium">{formatTimeDecimal(timeStats.totalTimeSpentMinutes)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{timeStats.totalActivitiesCompleted} activities</span>
          <span>Avg: {formatTime(Math.round(timeStats.averageTimePerActivity || 0))}</span>
        </div>
      </div>
    );
  }

  // Calculate efficiency score for progress bar (0-100)
  const efficiencyScore = timeStats.efficiencyScore || 0;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Learning Time
        </span>
        <span className="font-medium">{formatTimeDecimal(timeStats.totalTimeSpentMinutes)}</span>
      </div>
      <Progress value={Math.min(100, (timeStats.totalTimeSpentMinutes / 120) * 100)} className="h-2 mb-1" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{timeStats.totalActivitiesCompleted} activities</span>
        <Badge variant={efficiencyScore > 70 ? 'default' : 'secondary'} className="text-xs px-1 py-0">
          {efficiencyScore > 70 ? 'Efficient' : 'Moderate'}
        </Badge>
      </div>
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
