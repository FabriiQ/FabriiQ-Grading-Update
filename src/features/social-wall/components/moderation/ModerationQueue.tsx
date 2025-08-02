/**
 * Real-time Moderation Queue Component
 * Displays pending reports and moderation actions with real-time updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { useSocialWallSocket } from '../../hooks/useSocialWallSocket';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/data-display/card';
import {
  Badge,
  Button,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import {
  AlertTriangle,
  Clock,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  User,
  MessageSquare,
  FileText,
  Calendar,
  Settings,
} from 'lucide-react';
import { EyeOff, Flag } from '../icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ModerationQueueProps {
  classId: string;
  className?: string;
}

interface QueueItem {
  id: string;
  type: 'report' | 'auto_flag';
  status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  contentType: 'post' | 'comment';
  contentId: string;
  content: string;
  author: {
    id: string;
    name: string;
    userType: string;
  };
  reporter?: {
    id: string;
    name: string;
  };
  reason: string;
  createdAt: Date;
  metadata?: any;
}

export function ModerationQueue({ classId, className }: ModerationQueueProps) {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Get status filter based on active tab
  const getStatusFilter = (tab: string) => {
    switch (tab) {
      case 'pending':
        return 'PENDING';
      case 'reviewing':
        return 'UNDER_REVIEW';
      case 'resolved':
        return 'RESOLVED';
      case 'all':
        return undefined; // No filter for all reports
      default:
        return 'PENDING';
    }
  };

  // Fetch reports with optimized real-time updates
  const {
    data: reportsData,
    isLoading,
    error,
    refetch,
  } = api.socialWall.getReports.useQuery(
    {
      classId,
      status: getStatusFilter(activeTab),
      limit: 50,
    },
    {
      enabled: !!classId,
      // REMOVED: refetchInterval - socket-only updates
      refetchOnWindowFocus: false,
      staleTime: Infinity, // Cache indefinitely, only update via sockets
      cacheTime: 1000 * 60 * 15, // Keep in cache for 15 minutes
    }
  );

  // Fetch pending reports for count
  const {
    data: pendingReportsData,
    refetch: refetchPendingCounts,
  } = api.socialWall.getReports.useQuery(
    {
      classId,
      status: 'PENDING',
      limit: 50,
    },
    {
      enabled: !!classId,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: 1000 * 60 * 15,
    }
  );

  // Fetch under review reports for count
  const {
    data: underReviewReportsData,
    refetch: refetchUnderReviewCounts,
  } = api.socialWall.getReports.useQuery(
    {
      classId,
      status: 'UNDER_REVIEW',
      limit: 50,
    },
    {
      enabled: !!classId,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      cacheTime: 1000 * 60 * 15,
    }
  );

  // Socket connection for real-time updates
  const { subscribe } = useSocialWallSocket({
    classId,
    enabled: !!classId,
    autoConnect: true,
  });

  // Subscribe to real-time moderation events
  useEffect(() => {
    if (!subscribe) return;

    const unsubscribeReport = subscribe('moderation:new_report', (data: any) => {
      toast.info(`New report received: ${data?.reason || 'Unknown reason'}`);
      refetch();
      refetchPendingCounts();
      refetchUnderReviewCounts();
    });

    const unsubscribeAction = subscribe('moderation:action_taken', (data: any) => {
      toast.success(`Moderation action completed: ${data?.action || 'Unknown action'}`);
      refetch();
      refetchPendingCounts();
      refetchUnderReviewCounts();
    });

    const unsubscribeUpdate = subscribe('moderation:status_update', (data) => {
      refetch();
      refetchPendingCounts();
      refetchUnderReviewCounts();
    });

    return () => {
      unsubscribeReport?.();
      unsubscribeAction?.();
      unsubscribeUpdate?.();
    };
  }, [subscribe, refetch]);

  // Moderation action mutation
  const moderationMutation = api.socialWall.moderateReport.useMutation({
    onSuccess: (result) => {
      toast.success(`Action completed: ${result.action}`);
      setSelectedItems([]);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to complete action: ${error.message}`);
    },
  });

  const handleModerationAction = async (
    reportId: string,
    action: string,
    reason?: string
  ) => {
    try {
      await moderationMutation.mutateAsync({
        reportId,
        action: action as any,
        reason,
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedItems.length === 0) {
      toast.warning('Please select items to perform bulk action');
      return;
    }

    try {
      await Promise.all(
        selectedItems.map(reportId =>
          moderationMutation.mutateAsync({
            reportId,
            action: action as any,
          })
        )
      );
      toast.success(`Bulk action completed for ${selectedItems.length} items`);
      setSelectedItems([]);
    } catch (error) {
      toast.error('Failed to complete bulk action');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'DISMISSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load moderation queue. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const reports = reportsData?.items || [];
  const pendingCount = pendingReportsData?.items?.length || 0;
  const underReviewCount = underReviewReportsData?.items?.length || 0;

  return (
    <div className={cn("moderation-queue space-y-4", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flag className="w-5 h-5" />
              <span>Moderation Queue</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-yellow-50">
                {pendingCount} pending
              </Badge>
              <Badge variant="outline" className="bg-blue-50">
                {underReviewCount} reviewing
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Review and moderate reported content in real-time
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending">
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="reviewing">
            Reviewing ({underReviewCount})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            Resolved
          </TabsTrigger>
          <TabsTrigger value="all">
            All Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedItems.length} items selected
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('RESOLVE_REPORT')}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolve All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('DISMISS_REPORT')}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Dismiss All
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedItems([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Queue Items */}
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : reports.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Reports Found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'pending' 
                      ? 'No pending reports to review'
                      : 'No reports match the current filter'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              reports.map((report) => (
                <QueueItemCard
                  key={report.id}
                  report={report}
                  isSelected={selectedItems.includes(report.id)}
                  onSelect={(selected) => {
                    if (selected) {
                      setSelectedItems(prev => [...prev, report.id]);
                    } else {
                      setSelectedItems(prev => prev.filter(id => id !== report.id));
                    }
                  }}
                  onAction={handleModerationAction}
                  isLoading={moderationMutation.isLoading}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Queue Item Card Component
function QueueItemCard({
  report,
  isSelected,
  onSelect,
  onAction,
  isLoading
}: {
  report: any;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onAction: (reportId: string, action: string, reason?: string) => void;
  isLoading: boolean;
}) {
  const [showActions, setShowActions] = useState(false);
  const [actionReason, setActionReason] = useState('');

  const handleQuickAction = (action: string) => {
    onAction(report.id, action, actionReason || undefined);
    setShowActions(false);
    setActionReason('');
  };

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      isSelected && "ring-2 ring-blue-500 bg-blue-50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Selection Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(e.target.checked)}
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />

          {/* Content Preview */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={cn("text-xs", getPriorityColor(report.priority || 'LOW'))}>
                {report.priority || 'LOW'}
              </Badge>
              <Badge className={cn("text-xs", getStatusColor(report.status || 'PENDING'))}>
                {report.status || 'PENDING'}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground">
                {report.post ? (
                  <FileText className="w-3 h-3 mr-1" />
                ) : (
                  <MessageSquare className="w-3 h-3 mr-1" />
                )}
                {report.post ? 'post' : report.comment ? 'comment' : 'unknown'}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{report.post?.author?.name || report.comment?.author?.name || 'Unknown User'}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-muted-foreground">
                  {report.createdAt ? formatDistanceToNow(new Date(report.createdAt), { addSuffix: true }) : 'Unknown time'}
                </span>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 line-clamp-3">
                  {report.post?.content || report.comment?.content || 'No content available'}
                </p>
              </div>

              <div className="flex items-center space-x-2 text-sm">
                <Flag className="w-4 h-4 text-red-500" />
                <span className="text-red-600 font-medium">
                  Reported for: {report.reason || 'No reason provided'}
                </span>
                {report.reporter && (
                  <>
                    <span className="text-muted-foreground">by</span>
                    <span className="font-medium">{report.reporter?.name || 'Unknown Reporter'}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col space-y-2">
            {!showActions ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowActions(true)}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <Settings className="w-3 h-3" />
                <span>Actions</span>
              </Button>
            ) : (
              <div className="space-y-2 min-w-[180px]">
                <div className="grid grid-cols-1 gap-1">
                  {/* Primary Actions */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickAction('RESOLVE_REPORT')}
                    disabled={isLoading}
                    className="text-xs flex items-center justify-start px-3 py-2 h-auto border-green-200 hover:bg-green-50"
                  >
                    <CheckCircle className="w-3 h-3 text-green-600 mr-2" />
                    <span>Approve Report</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickAction('DISMISS_REPORT')}
                    disabled={isLoading}
                    className="text-xs flex items-center justify-start px-3 py-2 h-auto border-gray-200 hover:bg-gray-50"
                  >
                    <XCircle className="w-3 h-3 text-gray-600 mr-2" />
                    <span>Dismiss Report</span>
                  </Button>

                  {/* Content Actions */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickAction('HIDE_' + (report.post ? 'POST' : 'COMMENT'))}
                    disabled={isLoading}
                    className="text-xs flex items-center justify-start px-3 py-2 h-auto border-orange-200 hover:bg-orange-50"
                  >
                    <EyeOff className="w-3 h-3 text-orange-600 mr-2" />
                    <span>Hide Content</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickAction('DELETE_' + (report.post ? 'POST' : 'COMMENT'))}
                    disabled={isLoading}
                    className="text-xs flex items-center justify-start px-3 py-2 h-auto border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 text-red-600 mr-2" />
                    <span>Delete Content</span>
                  </Button>

                  {/* User Actions */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickAction('WARN_USER')}
                    disabled={isLoading}
                    className="text-xs flex items-center justify-start px-3 py-2 h-auto border-yellow-200 hover:bg-yellow-50"
                  >
                    <AlertTriangle className="w-3 h-3 text-yellow-600 mr-2" />
                    <span>Warn User</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickAction('ESCALATE_REPORT')}
                    disabled={isLoading}
                    className="text-xs flex items-center justify-start px-3 py-2 h-auto border-purple-200 hover:bg-purple-50"
                  >
                    <Flag className="w-3 h-3 text-purple-600 mr-2" />
                    <span>Escalate Report</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowActions(false)}
                    className="text-xs w-full mt-2"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  function getPriorityColor(priority: string) {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW': return 'bg-blue-100 text-blue-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'DISMISSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}

export default ModerationQueue;
