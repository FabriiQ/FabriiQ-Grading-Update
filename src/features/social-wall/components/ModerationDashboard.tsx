/**
 * Moderation Dashboard Component
 * Provides moderation tools and analytics for teachers
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Eye,
  Trash2,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import {
  Shield,
  EyeOff,
  Flag
} from './icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModerationActions } from './ModerationActions';
import { ModerationQueue } from './moderation/ModerationQueue';
import { ModerationAnalytics } from './moderation/ModerationAnalytics';
import { ModerationLogs } from './moderation/ModerationLogs';

interface ModerationDashboardProps {
  classId: string;
  className?: string;
}

export function ModerationDashboard({ classId, className }: ModerationDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch reports data with optimized intervals
  const {
    data: reportsData,
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = api.socialWall.getReports.useQuery(
    {
      classId,
      status: 'PENDING',
      limit: 20,
    },
    {
      enabled: !!classId,
      refetchOnWindowFocus: false,
      // REMOVED: refetchInterval - socket-only updates
      staleTime: Infinity, // Cache indefinitely, only update via sockets
      cacheTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    }
  );

  // Get all reports for analytics with caching
  const {
    data: allReportsData,
    isLoading: allReportsLoading,
  } = api.socialWall.getReports.useQuery(
    {
      classId,
      limit: 50, // Maximum allowed limit
    },
    {
      enabled: !!classId,
      refetchOnWindowFocus: false,
      // REMOVED: refetchInterval - analytics updated via sockets
      staleTime: Infinity, // Cache indefinitely for analytics
      cacheTime: 1000 * 60 * 60, // Keep in cache for 1 hour
    }
  );

  // Fetch class posts count for real data
  const {
    data: postsData,
    isLoading: postsLoading,
  } = api.socialWall.getClassPostsCount.useQuery(
    {
      classId,
    },
    {
      enabled: !!classId,
      refetchOnWindowFocus: false,
    }
  );

  const pendingReports = reportsData?.items || [];
  const allReports = allReportsData?.items || [];

  // Calculate analytics
  const totalReports = allReports.length;
  const pendingCount = allReports.filter(r => r.status === 'PENDING').length;
  const resolvedCount = allReports.filter(r => r.status === 'RESOLVED').length;
  const dismissedCount = allReports.filter(r => r.status === 'DISMISSED').length;

  return (
    <div className={cn("moderation-dashboard space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Moderation Dashboard</span>
          </CardTitle>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Posts</p>
                    {postsLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-2xl font-bold">{postsData?.totalCount || 0}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Flag className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Pending Reports</p>
                    {allReportsLoading ? (
                      <Skeleton className="h-8 w-12" />
                    ) : (
                      <p className="text-2xl font-bold">{pendingCount}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <EyeOff className="w-4 h-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Hidden</p>
                    <p className="text-2xl font-bold">1</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Active Users</p>
                    <p className="text-2xl font-bold">18</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Post approved</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                  <Badge variant="outline">Approved</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Comment flagged</p>
                      <p className="text-xs text-muted-foreground">15 minutes ago</p>
                    </div>
                  </div>
                  <Badge variant="outline">Pending</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <EyeOff className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Post hidden</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  <Badge variant="outline">Hidden</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="space-y-4">
          <ModerationQueue classId={classId} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Moderation Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <EyeOff className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Hidden post by John Doe</p>
                      <p className="text-xs text-muted-foreground">
                        Reason: Inappropriate content
                      </p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Deleted comment by Jane Smith</p>
                      <p className="text-xs text-muted-foreground">
                        Reason: Spam content
                      </p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <ModerationAnalytics classId={classId} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <ModerationLogs classId={classId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ModerationDashboard;
