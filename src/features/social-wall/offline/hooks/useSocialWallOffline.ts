/**
 * Social Wall Offline Hook
 * Manages offline storage and synchronization for social wall data
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { api } from '@/utils/api';
import { logger } from '@/server/api/utils/logger';
import * as db from '../db';
import type { PostWithEngagement } from '../../types/social-wall.types';

interface UseSocialWallOfflineProps {
  classId: string;
  enabled?: boolean;
}

interface UseSocialWallOfflineResult {
  isOnline: boolean;
  isLoading: boolean;
  posts: PostWithEngagement[];
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSyncTime: Date | null;
  
  // Methods
  refreshFromCache: () => Promise<void>;
  syncToServer: () => Promise<void>;
  savePostOffline: (post: PostWithEngagement) => Promise<void>;
  deletePostOffline: (postId: string) => Promise<void>;
  clearCache: () => Promise<void>;
}

export function useSocialWallOffline({
  classId,
  enabled = true,
}: UseSocialWallOfflineProps): UseSocialWallOfflineResult {
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [isLoading, setIsLoading] = useState(false);
  const [posts, setPosts] = useState<PostWithEngagement[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Online/offline detection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      logger.debug('Social wall: Back online, triggering sync');
      if (enabled) {
        syncToServer();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      logger.debug('Social wall: Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled]);

  // tRPC queries for online data
  const {
    data: onlinePostsData,
    isLoading: isOnlineLoading,
    refetch: refetchPosts,
  } = api.socialWall.getClassPosts.useInfiniteQuery(
    {
      classId,
      limit: 20,
    },
    {
      enabled: enabled && isOnline && !!session?.user?.id && !!classId,
      staleTime: Infinity,
      cacheTime: 1000 * 60 * 30,
      onSuccess: async (data) => {
        if (data?.pages) {
          const allPosts = data.pages.flatMap(page => page.items);
          await db.savePosts(classId, allPosts);
          setPosts(allPosts);
          setLastSyncTime(new Date());
          logger.debug(`Cached ${allPosts.length} posts offline`);
        }
      },
      onError: (error: any) => {
        logger.error('Error fetching online posts:', error);
        // Fall back to offline data
        refreshFromCache();
      },
    }
  );

  // Load cached data on mount
  useEffect(() => {
    if (!enabled || !classId) return;

    const loadCachedData = async () => {
      setIsLoading(true);
      try {
        const cachedPosts = await db.getPosts(classId);
        setPosts(cachedPosts);
        logger.debug(`Loaded ${cachedPosts.length} posts from cache`);
      } catch (error) {
        logger.error('Error loading cached posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCachedData();
  }, [classId, enabled]);

  // Refresh from cache
  const refreshFromCache = useCallback(async () => {
    if (!enabled || !classId) return;

    setIsLoading(true);
    try {
      const cachedPosts = await db.getPosts(classId);
      setPosts(cachedPosts);
      logger.debug(`Refreshed ${cachedPosts.length} posts from cache`);
    } catch (error) {
      logger.error('Error refreshing from cache:', error);
    } finally {
      setIsLoading(false);
    }
  }, [classId, enabled]);

  // Sync to server
  const syncToServer = useCallback(async () => {
    if (!enabled || !isOnline || !session?.user?.id) return;

    // Skip sync for now as it's causing client-side errors
    // TODO: Implement proper offline sync when needed
    logger.debug('Offline sync disabled - using online data only');
    return;

    setSyncStatus('syncing');
    try {
      // Get unsynced items
      const unsyncedItems = await db.getUnsyncedItems();

      // Sync posts, comments, reactions
      // This would involve calling appropriate tRPC mutations
      // For now, just refetch online data
      await refetchPosts();

      setSyncStatus('idle');
      setLastSyncTime(new Date());
      logger.debug('Sync completed successfully');
    } catch (error) {
      logger.error('Error syncing to server:', error);
      setSyncStatus('error');
    }
  }, [enabled, isOnline, session?.user?.id, refetchPosts]);

  // Save post offline (for optimistic updates)
  const savePostOffline = useCallback(async (post: PostWithEngagement) => {
    if (!enabled) return;

    try {
      await db.savePost(classId, post, false); // Mark as unsynced
      setPosts(prev => {
        const existing = prev.find(p => p.id === post.id);
        if (existing) {
          return prev.map(p => p.id === post.id ? post : p);
        } else {
          return [post, ...prev];
        }
      });
      logger.debug(`Saved post ${post.id} offline`);
    } catch (error) {
      logger.error('Error saving post offline:', error);
      throw error;
    }
  }, [classId, enabled]);

  // Delete post offline
  const deletePostOffline = useCallback(async (postId: string) => {
    if (!enabled) return;

    try {
      await db.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      logger.debug(`Deleted post ${postId} offline`);
    } catch (error) {
      logger.error('Error deleting post offline:', error);
      throw error;
    }
  }, [enabled]);

  // Clear cache
  const clearCache = useCallback(async () => {
    if (!enabled) return;

    try {
      await db.clearOldData();
      await refreshFromCache();
      logger.debug('Cache cleared successfully');
    } catch (error) {
      logger.error('Error clearing cache:', error);
      throw error;
    }
  }, [enabled, refreshFromCache]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && enabled && session?.user?.id) {
      const timer = setTimeout(() => {
        syncToServer();
      }, 1000); // Delay to avoid immediate sync on page load

      return () => clearTimeout(timer);
    }
  }, [isOnline, enabled, session?.user?.id, syncToServer]);

  return {
    isOnline,
    isLoading: isLoading || isOnlineLoading,
    posts,
    syncStatus,
    lastSyncTime,
    
    // Methods
    refreshFromCache,
    syncToServer,
    savePostOffline,
    deletePostOffline,
    clearCache,
  };
}

export default useSocialWallOffline;
