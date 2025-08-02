/**
 * Notification Bell Component
 * Mobile-first notification indicator with real-time updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  BellRing,
  Check,
  X,
  MessageSquare,
  Heart,
  AtSign,
  BookOpen,
  Award,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/utils/api';
import { NotificationType, type NotificationData } from '../types/notification.types';
import { toast } from 'sonner';

interface NotificationBellProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const NOTIFICATION_ICONS = {
  [NotificationType.SOCIAL_POST]: MessageSquare,
  [NotificationType.SOCIAL_COMMENT]: MessageSquare,
  [NotificationType.SOCIAL_REACTION]: Heart,
  [NotificationType.SOCIAL_MENTION]: AtSign,
  [NotificationType.ASSIGNMENT_DUE]: BookOpen,
  [NotificationType.GRADE_POSTED]: Award,
  [NotificationType.ANNOUNCEMENT]: AlertCircle,
  [NotificationType.SYSTEM]: AlertCircle,
};

const NOTIFICATION_COLORS = {
  [NotificationType.SOCIAL_POST]: 'text-blue-500',
  [NotificationType.SOCIAL_COMMENT]: 'text-green-500',
  [NotificationType.SOCIAL_REACTION]: 'text-red-500',
  [NotificationType.SOCIAL_MENTION]: 'text-purple-500',
  [NotificationType.ASSIGNMENT_DUE]: 'text-orange-500',
  [NotificationType.GRADE_POSTED]: 'text-yellow-500',
  [NotificationType.ANNOUNCEMENT]: 'text-indigo-500',
  [NotificationType.SYSTEM]: 'text-gray-500',
};

export function NotificationBell({ className, size = 'md' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch notifications
  const {
    data: notifications,
    isLoading,
    refetch: refetchNotifications
  } = api.notification.getUserNotifications.useQuery(
    {
      limit: 20,
      includeRead: false
    },
    {
      // Remove continuous polling to prevent memory leaks and server crashes
      // refetchInterval: 30000, // Refetch every 30 seconds - REMOVED
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes - cache data to reduce queries
      cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache longer
      refetchOnMount: false, // Don't refetch on every mount
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: 1, // Limit retries
    }
  );

  // Mark notification as read mutation
  const markAsReadMutation = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
    },
    onError: (error) => {
      toast.error(`Failed to mark notification as read: ${error.message}`);
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      refetchNotifications();
      toast.success('All notifications marked as read');
    },
    onError: (error) => {
      toast.error(`Failed to mark all notifications as read: ${error.message}`);
    },
  });

  // Check for new notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      const hasUnread = notifications.some(n => !n.isRead);
      setHasNewNotifications(hasUnread);
    } else {
      setHasNewNotifications(false);
    }
  }, [notifications]);

  const handleNotificationClick = (notification: NotificationData) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }

    // Navigate to action URL if provided
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchNotifications();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4';
      case 'lg': return 'h-6 w-6';
      default: return 'h-5 w-5';
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'sm': return 'h-4 w-4 text-xs';
      case 'lg': return 'h-6 w-6 text-sm';
      default: return 'h-5 w-5 text-xs';
    }
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size={size}
          className={cn(
            "relative hover:bg-accent",
            className
          )}
        >
          <motion.div
            animate={hasNewNotifications ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3, repeat: hasNewNotifications ? Infinity : 0, repeatDelay: 3 }}
          >
            {hasNewNotifications ? (
              <BellRing className={cn(getIconSize(), "text-primary")} />
            ) : (
              <Bell className={getIconSize()} />
            )}
          </motion.div>
          
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className={cn(
                "absolute -top-1 -right-1 flex items-center justify-center",
                getBadgeSize(),
                "min-w-0 p-0"
              )}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-80 p-0" 
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs h-6 px-2"
            >
              <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs h-6 px-2"
              >
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-80">
          <AnimatePresence>
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading notifications...
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-1">
                {notifications.map((notification, index) => {
                  const Icon = NOTIFICATION_ICONS[notification.type];
                  const iconColor = NOTIFICATION_COLORS[notification.type];
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "p-3 hover:bg-accent cursor-pointer transition-colors border-l-2",
                        notification.isRead 
                          ? "border-l-transparent opacity-60" 
                          : "border-l-primary"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={cn("mt-0.5", iconColor)}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You're all caught up!
                </p>
              </div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {notifications && notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to full notifications page
                  window.location.href = '/notifications';
                }}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
