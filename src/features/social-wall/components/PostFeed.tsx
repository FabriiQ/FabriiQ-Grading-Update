/**
 * Post Feed Component
 * Displays a feed of social wall posts with real-time updates
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  AlertCircle,
  MessageSquare,
  Users,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { Wifi, WifiOff } from './icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';
import { PostCard } from './PostCard';
import { PostSkeleton } from './PostSkeleton';
import { useSocialWallOffline } from '../offline/hooks/useSocialWallOffline';
import type { PostWithEngagement } from '../types/social-wall.types';

interface PostFeedProps {
  classId: string;
  posts: PostWithEngagement[];
  onPostsChange: (posts: PostWithEngagement[]) => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
  className?: string;
}

export function PostFeed({
  classId,
  posts,
  onPostsChange,
  isLoading,
  onLoadingChange,
  className
}: PostFeedProps) {
  const { data: session } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | undefined>();

  // Offline storage integration
  const {
    isOnline,
    isLoading: isOfflineLoading,
    posts: offlinePosts,
    syncStatus,
    lastSyncTime,
    refreshFromCache,
    syncToServer,
  } = useSocialWallOffline({
    classId,
    enabled: true,
  });

  // Fetch posts query - NO POLLING, socket-only updates
  const {
    data: postsData,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = api.socialWall.getClassPosts.useInfiniteQuery(
    {
      classId,
      limit: 10,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      enabled: !!session?.user?.id && !!classId,
      refetchOnWindowFocus: false,
      // REMOVED: refetchInterval - no more polling!
      staleTime: Infinity, // Cache indefinitely, only update via sockets
      cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
      retry: (failureCount, error) => {
        // Don't retry on authentication errors
        if (error?.data?.code === 'UNAUTHORIZED' || error?.data?.code === 'FORBIDDEN') {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  // Update loading state
  useEffect(() => {
    onLoadingChange(isQueryLoading);
  }, [isQueryLoading, onLoadingChange]);

  // Update posts when data changes
  useEffect(() => {
    if (postsData?.pages) {
      const allPosts = postsData.pages.flatMap(page => page.items);
      onPostsChange(allPosts);
      setHasMore(!!hasNextPage);
    }
  }, [postsData, hasNextPage, onPostsChange]);

  // Handle query error
  useEffect(() => {
    if (queryError) {
      setError(queryError.message);
    } else {
      setError(null);
    }
  }, [queryError]);

  const handleRefresh = () => {
    setError(null);
    refetch();
  };

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  // Handle post updates
  const handlePostUpdate = (updatedPost: PostWithEngagement) => {
    onPostsChange(posts.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDelete = (postId: string) => {
    onPostsChange(posts.filter(post => post.id !== postId));
  };

  // Offline status indicator
  const OfflineStatusBanner = () => {
    if (isOnline) return null;

    return (
      <Alert className="mb-4 border-orange-200 bg-orange-50">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="flex items-center justify-between text-orange-800">
          <span>You're offline. Showing cached content.</span>
          <div className="flex items-center space-x-2">
            {lastSyncTime && (
              <span className="text-xs text-orange-600">
                Last sync: {lastSyncTime.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshFromCache}
              disabled={isOfflineLoading}
            >
              <RefreshCw className={cn("w-4 h-4 mr-1", isOfflineLoading && "animate-spin")} />
              Refresh Cache
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  };

  // Error state
  if (error && !posts.length && !offlinePosts.length) {
    return (
      <Card className={cn("post-feed", className)}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading && !posts.length) {
    return (
      <div className={cn("post-feed space-y-4", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <PostSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!isLoading && !posts.length) {
    return (
      <Card className={cn("post-feed", className)}>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">No posts yet</h3>
              <p className="text-muted-foreground max-w-md">
                Be the first to share something with your class! Posts, announcements, 
                and achievements will appear here.
              </p>
            </div>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("post-feed space-y-4", className)}>
      {/* Feed Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold">Class Feed</h2>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MessageSquare className="w-4 h-4" />
            <span>{posts.length} posts</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" disabled>
            <Filter className="w-4 h-4 mr-1" />
            Filter
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={isOnline ? handleRefresh : refreshFromCache}
            disabled={isQueryLoading || isOfflineLoading || syncStatus === 'syncing'}
          >
            {isOnline ? (
              <Wifi className="w-4 h-4 mr-1 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 mr-1 text-orange-600" />
            )}
            <RefreshCw className={cn(
              "w-4 h-4 mr-1",
              (isQueryLoading || isOfflineLoading || syncStatus === 'syncing') && "animate-spin"
            )} />
            {isOnline ? 'Refresh' : 'Cache'}
          </Button>
        </div>
      </div>

      {/* Offline Status Banner */}
      <OfflineStatusBanner />

      {/* Error Banner */}
      {error && posts.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Failed to load latest posts: {error}</span>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            classId={classId}
            onUpdate={handlePostUpdate}
            onDelete={handlePostDelete}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Show more posts
              </>
            )}
          </Button>
        </div>
      )}

      {/* Loading indicator for new posts */}
      {isFetchingNextPage && (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, index) => (
            <PostSkeleton key={`loading-${index}`} />
          ))}
        </div>
      )}

      {/* End of feed indicator */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="w-8 h-px bg-border" />
            <span>You've reached the end</span>
            <div className="w-8 h-px bg-border" />
          </div>
        </div>
      )}
    </div>
  );
}

export default PostFeed;
