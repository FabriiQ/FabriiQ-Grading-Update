/**
 * Real-time Moderation Logs Component
 * Displays comprehensive audit trail of all moderation actions
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
  Button,
  Alert,
  AlertDescription,
  Input,
} from '@/components/ui';
import { Skeleton } from '@/components/ui/feedback/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { Shield, EyeOff } from '../icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';

interface ModerationLogsProps {
  classId: string;
  className?: string;
}

interface ModerationLog {
  id: string;
  action: string;
  reason: string | null; // Changed to match database schema
  notes: string | null; // Changed to match database schema
  createdAt: Date;
  moderator: {
    id: string;
    name: string | null; // Changed to match database schema
    userType: string;
  };
  targetUser?: {
    id: string;
    name: string | null; // Changed to match database schema
  } | null;
  post?: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string | null; // Changed to match database schema
    };
  } | null;
  comment?: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string | null; // Changed to match database schema
    };
  } | null;
}

export function ModerationLogs({ classId, className }: ModerationLogsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [moderatorFilter, setModeratorFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Fetch moderation logs with optimized real-time updates
  const {
    data: logsData,
    isLoading,
    error,
    refetch,
  } = api.socialWall.getModerationLogs.useQuery(
    {
      classId,
      limit: 50, // Reduced from 100 to 50 to comply with API limits
      action: actionFilter !== 'all' ? actionFilter : undefined,
      moderatorId: moderatorFilter !== 'all' ? moderatorFilter : undefined,
      search: searchTerm || undefined,
    },
    {
      enabled: !!classId,
      // REMOVED: refetchInterval - socket-only updates
      refetchOnWindowFocus: false,
      staleTime: Infinity, // Cache indefinitely, only update via sockets
      cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    }
  );

  // Get unique moderators for filter
  const {
    data: moderatorsData,
  } = api.socialWall.getClassModerators.useQuery(
    { classId },
    { enabled: !!classId }
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

    const unsubscribeAction = subscribe('moderation:action_taken', (data) => {
      refetch();
    });

    const unsubscribeLog = subscribe('moderation:log_created', (data) => {
      refetch();
    });

    return () => {
      unsubscribeAction?.();
      unsubscribeLog?.();
    };
  }, [subscribe, refetch]);

  const handleExportLogs = async () => {
    try {
      // In a real implementation, this would call an API to generate and download a CSV/PDF
      const logs = logsData?.logs || [];
      const csvContent = generateCSV(logs);
      downloadCSV(csvContent, `moderation-logs-${classId}-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const generateCSV = (logs: ModerationLog[]) => {
    const headers = ['Date', 'Time', 'Action', 'Moderator', 'Target User', 'Content Type', 'Reason', 'Notes'];
    const rows = logs.map(log => [
      format(new Date(log.createdAt), 'yyyy-MM-dd'),
      format(new Date(log.createdAt), 'HH:mm:ss'),
      log.action,
      log.moderator.name,
      log.targetUser?.name || 'N/A',
      log.post ? 'Post' : log.comment ? 'Comment' : 'N/A',
      log.reason || 'N/A',
      log.notes || 'N/A',
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'HIDE_POST':
      case 'HIDE_COMMENT':
        return <EyeOff className="w-4 h-4 text-orange-500" />;
      case 'DELETE_POST':
      case 'DELETE_COMMENT':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case 'WARN_USER':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'RESOLVE_REPORT':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'DISMISS_REPORT':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case 'RESTRICT_USER':
        return <Shield className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-blue-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'HIDE_POST':
      case 'HIDE_COMMENT':
        return 'bg-orange-100 text-orange-800';
      case 'DELETE_POST':
      case 'DELETE_COMMENT':
        return 'bg-red-100 text-red-800';
      case 'WARN_USER':
        return 'bg-yellow-100 text-yellow-800';
      case 'RESOLVE_REPORT':
        return 'bg-green-100 text-green-800';
      case 'DISMISS_REPORT':
        return 'bg-gray-100 text-gray-800';
      case 'RESTRICT_USER':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatActionText = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load moderation logs. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const logs = logsData?.logs || [];
  const moderators = moderatorsData?.moderators || [];

  return (
    <div className={cn("moderation-logs space-y-4", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Moderation Logs</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportLogs}
              disabled={logs.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardTitle>
          <CardDescription>
            Complete audit trail of all moderation actions with real-time updates
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="HIDE_POST">Hide Post</SelectItem>
                  <SelectItem value="HIDE_COMMENT">Hide Comment</SelectItem>
                  <SelectItem value="DELETE_POST">Delete Post</SelectItem>
                  <SelectItem value="DELETE_COMMENT">Delete Comment</SelectItem>
                  <SelectItem value="WARN_USER">Warn User</SelectItem>
                  <SelectItem value="RESTRICT_USER">Restrict User</SelectItem>
                  <SelectItem value="RESOLVE_REPORT">Resolve Report</SelectItem>
                  <SelectItem value="DISMISS_REPORT">Dismiss Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Moderator</label>
              <Select value={moderatorFilter} onValueChange={setModeratorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All moderators" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moderators</SelectItem>
                  {moderators.map((moderator) => (
                    <SelectItem key={moderator.id} value={moderator.id}>
                      {moderator.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Logs Found</h3>
              <p className="text-muted-foreground">
                No moderation actions match the current filters
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => (
                <LogEntry key={log.id} log={log} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  function LogEntry({ log }: { log: ModerationLog }) {
    const [showDetails, setShowDetails] = useState(false);

    return (
      <div className="p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getActionIcon(log.action)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <Badge className={cn("text-xs", getActionColor(log.action))}>
                {formatActionText(log.action)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{log.moderator.name}</span>
                {log.targetUser && (
                  <>
                    <span className="text-muted-foreground">acted on</span>
                    <span className="font-medium">{log.targetUser.name}</span>
                  </>
                )}
              </div>

              {log.reason && (
                <p className="text-sm text-muted-foreground">
                  Reason: {log.reason}
                </p>
              )}

              {(log.post || log.comment) && (
                <div className="bg-muted rounded-lg p-2 mt-2">
                  <div className="flex items-center space-x-2 mb-1">
                    {log.post ? (
                      <FileText className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    )}
                    <span className="text-xs font-medium">
                      {log.post ? 'Post' : 'Comment'} by {log.post?.author.name || log.comment?.author.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {log.post?.content || log.comment?.content}
                  </p>
                </div>
              )}

              {log.notes && showDetails && (
                <div className="bg-blue-50 rounded-lg p-2 mt-2">
                  <p className="text-xs text-blue-700">
                    <strong>Notes:</strong> {log.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <span className="text-xs text-muted-foreground">
              {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
            </span>
            {log.notes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs h-6 px-2"
              >
                {showDetails ? 'Less' : 'Details'}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export default ModerationLogs;
