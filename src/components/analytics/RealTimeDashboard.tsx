'use client';

/**
 * Real-Time Dashboard
 * 
 * Dashboard component that subscribes to event-driven analytics updates
 * and displays real-time performance data with live updates.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/core/alert';
import { Button } from '@/components/ui/button';
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
  Activity,
  Zap,
  RefreshCw,
  Bell,
  Eye
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/trpc/react';

interface RealTimeMetrics {
  totalStudents: number;
  averageScore: number;
  completionRate: number;
  engagementScore: number;
  recentActivity: {
    id: string;
    studentName: string;
    activityTitle: string;
    score: number;
    percentage: number;
    gradedAt: Date;
    gradingType: string;
  }[];
  performanceAlerts: {
    id: string;
    type: string;
    studentName: string;
    message: string;
    confidence: number;
    createdAt: Date;
    isRead: boolean;
  }[];
  bloomsDistribution: Record<string, number>;
  lastUpdated: Date;
}

interface RealTimeDashboardProps {
  entityType: 'student' | 'class' | 'subject';
  entityId: string;
  refreshInterval?: number; // in milliseconds
  showAlerts?: boolean;
  showRecentActivity?: boolean;
}

export function RealTimeDashboard({
  entityType,
  entityId,
  refreshInterval = 5000, // 5 seconds
  showAlerts = true,
  showRecentActivity = true,
}: RealTimeDashboardProps) {
  const { toast } = useToast();
  
  // State management
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [unreadAlerts, setUnreadAlerts] = useState(0);

  // Fetch real-time analytics
  const { data: analyticsData, isLoading, error, refetch } = api.analytics.getRealTime.useQuery({
    entityType,
    entityId,
  }, {
    refetchInterval: refreshInterval,
    refetchOnWindowFocus: true,
    onSuccess: (data) => {
      setMetrics(data);
      setLastUpdate(new Date());
      setIsConnected(true);
      
      // Count unread alerts
      if (data.performanceAlerts) {
        const unread = data.performanceAlerts.filter(alert => !alert.isRead).length;
        setUnreadAlerts(unread);
      }
    },
    onError: (error) => {
      setIsConnected(false);
      toast({
        title: "Connection Error",
        description: "Failed to fetch real-time analytics",
        variant: "error",
      });
    },
  });

  // Manual refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Mark alert as read
  const markAlertAsRead = api.analytics.markAlertAsRead.useMutation({
    onSuccess: () => {
      // Refresh data to update read status
      refetch();
    },
  });

  // Handle alert click
  const handleAlertClick = (alertId: string) => {
    markAlertAsRead.mutate({ alertId });
  };

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="text-xs text-muted-foreground">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
      <span className="text-xs text-muted-foreground">
        • Last update: {lastUpdate.toLocaleTimeString()}
      </span>
    </div>
  );

  // Loading state
  if (isLoading && !metrics) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Real-Time Analytics</h2>
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
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

  // Error state
  if (error && !metrics) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load real-time analytics: {error.message}
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
      {/* Header with connection status */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Zap className="h-6 w-6 mr-2 text-yellow-500" />
            Real-Time Analytics
          </h2>
          <ConnectionStatus />
        </div>
        <div className="flex items-center space-x-2">
          {unreadAlerts > 0 && (
            <Badge variant="destructive" className="flex items-center">
              <Bell className="h-3 w-3 mr-1" />
              {unreadAlerts} alert{unreadAlerts !== 1 ? 's' : ''}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Active participants
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
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

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completionRate.toFixed(1)}%</div>
            <Progress value={metrics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
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

      {/* Performance Alerts */}
      {showAlerts && metrics.performanceAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Performance Alerts
              {unreadAlerts > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadAlerts} new
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              AI-powered insights and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.performanceAlerts.slice(0, 5).map((alert) => (
                <Alert 
                  key={alert.id} 
                  variant={alert.type === 'struggling_student' ? 'destructive' : 'default'}
                  className={`cursor-pointer transition-opacity ${alert.isRead ? 'opacity-60' : ''}`}
                  onClick={() => handleAlertClick(alert.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium flex items-center">
                        {alert.studentName}
                        {!alert.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />
                        )}
                      </div>
                      <AlertDescription className="mt-1">
                        {alert.message}
                      </AlertDescription>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {(alert.confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {showRecentActivity && metrics.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest graded submissions with real-time updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.recentActivity.slice(0, 10).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
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
      )}
    </div>
  );
}
