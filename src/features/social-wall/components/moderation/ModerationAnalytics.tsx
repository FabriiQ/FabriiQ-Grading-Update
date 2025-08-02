/**
 * Real-time Moderation Analytics Component
 * Displays comprehensive moderation statistics and trends
 */

'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useSocialWallSocket } from '../../hooks/useSocialWallSocket';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/data-display/card';
import {
  Badge,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Clock,
  Target,
  Activity,
  PieChart,
  User,
  CheckCircle,
} from 'lucide-react';
import { Shield } from '../icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, subDays } from 'date-fns';

interface ModerationAnalyticsProps {
  classId: string;
  className?: string;
}

interface AnalyticsData {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  averageResolutionTime: number;
  topViolationTypes: Array<{ type: string; count: number; percentage: number }>;
  moderationTrends: Array<{ date: string; reports: number; actions: number }>;
  userViolations: Array<{ userId: string; userName: string; userType: string; violationCount: number }>;
  responseTime: {
    average: number;
    fastest: number;
    slowest: number;
  };
  actionDistribution: Array<{ action: string; count: number; percentage: number }>;
}

export function ModerationAnalytics({ classId, className }: ModerationAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  // Fetch moderation analytics with optimized real-time updates
  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = api.socialWall.getReports.useQuery(
    {
      classId,
      limit: 50, // Fixed to comply with API limits
    },
    {
      enabled: !!classId,
      // REMOVED: refetchInterval - socket-only updates
      refetchOnWindowFocus: false,
      staleTime: Infinity, // Cache indefinitely, only update via sockets
      cacheTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    }
  );

  // Fetch moderation logs
  const {
    data: logsData,
    isLoading: logsLoading,
    refetch: refetchLogs,
  } = api.socialWall.getModerationLogs.useQuery(
    {
      classId,
      limit: 50, // Fixed to comply with API limits
    },
    {
      enabled: !!classId,
      // REMOVED: refetchInterval - socket-only updates
      refetchOnWindowFocus: false,
      staleTime: Infinity, // Cache indefinitely, only update via sockets
      cacheTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    }
  );

  // Socket connection for real-time updates
  const { subscribe } = useSocialWallSocket({
    classId,
    enabled: !!classId,
    autoConnect: true,
  });

  // Subscribe to real-time events
  useEffect(() => {
    if (!subscribe) return;

    const unsubscribeReport = subscribe('moderation:new_report', () => {
      refetchReports();
    });

    const unsubscribeAction = subscribe('moderation:action_taken', () => {
      refetchReports();
      refetchLogs();
    });

    return () => {
      unsubscribeReport?.();
      unsubscribeAction?.();
    };
  }, [subscribe, refetchReports, refetchLogs]);

  // Process analytics data
  useEffect(() => {
    // Handle loading states and empty data
    if (reportsLoading || logsLoading) {
      return;
    }

    // Handle API response structures - reportsData has 'items', logsData has 'logs'
    const reports = reportsData?.items || [];
    const logs = logsData?.logs || [];

    // Always process data, even if empty (for proper empty states)

    // Calculate basic metrics
    const totalReports = reports.length;
    const resolvedReports = reports.filter(r => r.status === 'RESOLVED').length;
    const pendingReports = reports.filter(r => r.status === 'PENDING').length;

    // Calculate average resolution time
    const resolvedWithTime = reports.filter(r => r.status === 'RESOLVED' && r.resolvedAt);
    const averageResolutionTime = resolvedWithTime.length > 0
      ? resolvedWithTime.reduce((acc, r) => {
          const resolutionTime = new Date(r.resolvedAt!).getTime() - new Date(r.createdAt).getTime();
          return acc + resolutionTime;
        }, 0) / resolvedWithTime.length
      : 0;

    // Top violation types
    const violationCounts = reports.reduce((acc, report) => {
      const reason = report.reason || 'Other';
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalViolations = Object.values(violationCounts).reduce((sum, count) => sum + count, 0);
    const topViolationTypes = Object.entries(violationCounts)
      .map(([type, count]) => ({
        type,
        count: count as number,
        percentage: totalViolations > 0 ? (count / totalViolations) * 100 : 0
      }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5);

    // Action distribution
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalActions = logs.length;
    const actionDistribution = Object.entries(actionCounts)
      .map(([action, count]) => ({
        action,
        count,
        percentage: totalActions > 0 ? (count / totalActions) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // User violations
    const userViolationCounts = reports.reduce((acc, report) => {
      if (report.post?.author) {
        const userId = report.post.author.id;
        const userName = report.post.author.name || 'Unknown';
        const userType = (report.post.author as any).userType || 'STUDENT';
        acc[userId] = acc[userId] || { userId, userName, userType, violationCount: 0 };
        acc[userId].violationCount++;
      }
      if (report.comment?.author) {
        const userId = report.comment.author.id;
        const userName = report.comment.author.name || 'Unknown';
        const userType = (report.comment.author as any).userType || 'STUDENT';
        acc[userId] = acc[userId] || { userId, userName, userType, violationCount: 0 };
        acc[userId].violationCount++;
      }
      return acc;
    }, {} as Record<string, { userId: string; userName: string; userType: string; violationCount: number }>);

    const userViolations = Object.values(userViolationCounts)
      .sort((a, b) => (b as any).violationCount - (a as any).violationCount)
      .slice(0, 10) as Array<{ userId: string; userName: string; userType: string; violationCount: number }>;

    // Response time metrics
    const responseTimes = resolvedWithTime.map(r => {
      return new Date(r.resolvedAt!).getTime() - new Date(r.createdAt).getTime();
    });

    const responseTime = {
      average: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
      fastest: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      slowest: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
    };

    // Moderation trends (daily data)
    const trendData = Array.from({ length: parseInt(timeRange.replace('d', '')) }, (_, i) => {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const dayReports = reports.filter(r => 
        format(new Date(r.createdAt), 'yyyy-MM-dd') === dateStr
      ).length;
      
      const dayActions = logs.filter(l => 
        format(new Date(l.createdAt), 'yyyy-MM-dd') === dateStr
      ).length;

      return {
        date: format(date, 'MMM dd'),
        reports: dayReports,
        actions: dayActions,
      };
    }).reverse();

    setAnalyticsData({
      totalReports,
      resolvedReports,
      pendingReports,
      averageResolutionTime,
      topViolationTypes,
      moderationTrends: trendData,
      userViolations,
      responseTime,
      actionDistribution,
    });
  }, [reportsData, logsData, timeRange]);

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (reportsError) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load moderation analytics. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const isLoading = reportsLoading || logsLoading;

  return (
    <div className={cn("moderation-analytics space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Moderation Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time insights into content moderation activities and trends
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Reports"
          value={analyticsData?.totalReports || 0}
          icon={<Shield className="w-5 h-5" />}
          isLoading={isLoading}
        />
        <MetricCard
          title="Resolved"
          value={analyticsData?.resolvedReports || 0}
          icon={<Target className="w-5 h-5" />}
          isLoading={isLoading}
          trend={analyticsData ? {
            value: analyticsData.totalReports > 0 
              ? Math.round((analyticsData.resolvedReports / analyticsData.totalReports) * 100)
              : 0,
            label: "resolution rate"
          } : undefined}
        />
        <MetricCard
          title="Pending"
          value={analyticsData?.pendingReports || 0}
          icon={<Clock className="w-5 h-5" />}
          isLoading={isLoading}
          variant={analyticsData && analyticsData.pendingReports > 5 ? "warning" : "default"}
        />
        <MetricCard
          title="Avg Response Time"
          value={analyticsData ? formatDuration(analyticsData.averageResolutionTime) : "0m"}
          icon={<Activity className="w-5 h-5" />}
          isLoading={isLoading}
        />
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Moderation Trends Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Moderation Activity Trends</CardTitle>
              <CardDescription>
                Daily reports and moderation actions over the selected time period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : analyticsData?.moderationTrends ? (
                <div className="h-64 w-full">
                  <div className="text-sm text-muted-foreground mb-4">
                    Reports and Actions by Day
                  </div>
                  <div className="space-y-3">
                    {analyticsData.moderationTrends.map((trend, index) => {
                      const maxValue = Math.max(
                        ...analyticsData.moderationTrends.map(t => Math.max(t.reports, t.actions))
                      );
                      const reportsWidth = maxValue > 0 ? (trend.reports / maxValue) * 100 : 0;
                      const actionsWidth = maxValue > 0 ? (trend.actions / maxValue) * 100 : 0;

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{trend.date}</span>
                            <div className="flex space-x-4 text-xs">
                              <span className="text-red-600">Reports: {trend.reports}</span>
                              <span className="text-blue-600">Actions: {trend.actions}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <div className="w-16 text-xs text-red-600">Reports</div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${reportsWidth}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-16 text-xs text-blue-600">Actions</div>
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${actionsWidth}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No trend data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Action Distribution</CardTitle>
              <CardDescription>
                Breakdown of moderation actions taken
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : analyticsData?.actionDistribution ? (
                <div className="space-y-4">
                  {/* Visual pie chart representation */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-32 h-32">
                      {analyticsData.actionDistribution.map((action, index) => {
                        const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#f97316'];
                        const color = colors[index % colors.length];
                        return (
                          <div
                            key={index}
                            className="absolute inset-0 rounded-full border-8"
                            style={{
                              borderColor: `${color}20`,
                              borderTopColor: color,
                              transform: `rotate(${(index * 360) / analyticsData.actionDistribution.length}deg)`,
                            }}
                          />
                        );
                      })}
                      <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold">
                            {analyticsData.actionDistribution.reduce((sum, action) => sum + action.count, 0)}
                          </div>
                          <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action breakdown */}
                  <div className="space-y-3">
                    {analyticsData.actionDistribution.map((action, index) => {
                      const colors = ['bg-blue-500', 'bg-red-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
                      const bgColor = colors[index % colors.length];

                      return (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`w-3 h-3 rounded-full ${bgColor}`} />
                            <span className="text-sm font-medium">{action.action}</span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${bgColor}`}
                                style={{ width: `${action.percentage}%` }}
                              />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">{action.count}</div>
                              <div className="text-xs text-muted-foreground">{action.percentage}%</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No action data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Violation Types</CardTitle>
              <CardDescription>
                Most common types of reported violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : analyticsData?.topViolationTypes ? (
                <div className="space-y-4">
                  {analyticsData.topViolationTypes.map((violation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{violation.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {violation.percentage}% of all reports
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{violation.count}</p>
                        <p className="text-sm text-muted-foreground">reports</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No violation data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Violations</CardTitle>
              <CardDescription>
                Users with the most reported content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : analyticsData?.userViolations ? (
                <div className="space-y-3">
                  <Accordion type="single" collapsible>
                  {analyticsData.userViolations.map((user, index) => {
                    // Get all reports for this user
                    const userReports = (reportsData?.items || []).filter(report =>
                      (report.post?.author?.id === user.userId) ||
                      (report.comment?.author?.id === user.userId)
                    );

                    return (
                      <AccordionItem key={user.userId} value={`user-${index}`} className="border rounded-lg">
                        <AccordionTrigger className="px-3 py-2 hover:no-underline">
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-orange-600" />
                              </div>
                              <div className="text-left">
                                <p className="font-medium">{user.userName}</p>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm text-muted-foreground">
                                    {user.violationCount} violations
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    {user.userType === 'TEACHER' || user.userType === 'COORDINATOR' ? 'Teacher' : 'Student'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right mr-4">
                              <Badge variant={user.violationCount > 5 ? "destructive" : "secondary"}>
                                {user.violationCount > 5 ? "High Risk" : "Moderate"}
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-3 pb-3">
                          <div className="space-y-2 mt-2">
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              Reported Violations ({userReports.length})
                            </h4>
                            {userReports.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No detailed reports available</p>
                            ) : (
                              <div className="space-y-2">
                                {userReports.map((report) => (
                                  <div key={report.id} className="bg-muted rounded-lg p-3 text-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <Badge variant="outline" className="text-xs">
                                        {report.post ? 'Post' : 'Comment'}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1">
                                      <strong>Reason:</strong> {report.reason || 'No reason provided'}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      <strong>Content:</strong> {report.post?.content || report.comment?.content}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                      <Badge
                                        variant={
                                          report.status === 'PENDING' ? 'default' :
                                          report.status === 'RESOLVED' ? 'secondary' : 'outline'
                                        }
                                        className="text-xs"
                                      >
                                        {report.status}
                                      </Badge>
                                      {report.reporter && (
                                        <span className="text-xs text-muted-foreground">
                                          Reported by {report.reporter.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                  </Accordion>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No user violation data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response Time Metrics</CardTitle>
              <CardDescription>
                How quickly moderation actions are taken
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : analyticsData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {formatDuration(analyticsData.averageResolutionTime)}
                    </p>
                    <p className="text-sm text-muted-foreground">Average Response</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {analyticsData.resolvedReports}
                    </p>
                    <p className="text-sm text-muted-foreground">Resolved Reports</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {analyticsData.pendingReports}
                    </p>
                    <p className="text-sm text-muted-foreground">Pending Reports</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No metrics data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Moderation Efficiency */}
          <Card>
            <CardHeader>
              <CardTitle>Moderation Efficiency</CardTitle>
              <CardDescription>
                Performance metrics for the moderation team
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : analyticsData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Resolution Rate</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {analyticsData.totalReports > 0
                        ? Math.round((analyticsData.resolvedReports / analyticsData.totalReports) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Avg Response Time</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600">
                      {formatDuration(analyticsData.responseTime.average)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No efficiency data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  title, 
  value, 
  icon, 
  isLoading, 
  trend, 
  variant = "default" 
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  isLoading: boolean;
  trend?: { value: number; label: string };
  variant?: "default" | "warning";
}) {
  return (
    <Card className={cn(
      variant === "warning" && "border-yellow-200 bg-yellow-50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {trend && !isLoading && (
              <p className="text-xs text-muted-foreground">
                {trend.value}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            variant === "warning" ? "bg-yellow-100" : "bg-muted"
          )}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ModerationAnalytics;
