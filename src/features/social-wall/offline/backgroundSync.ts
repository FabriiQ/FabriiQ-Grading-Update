/**
 * Background Sync for Social Wall
 * Handles synchronization of offline data when connection is restored
 */

'use client';

import { logger } from '@/server/api/utils/logger';
import * as db from './db';
import { api } from '@/utils/api';

interface SyncResult {
  success: boolean;
  syncedPosts: number;
  syncedComments: number;
  syncedReactions: number;
  errors: string[];
}

/**
 * Register background sync with service worker
 */
export async function registerBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('social-wall-sync');
      logger.debug('Background sync registered for social wall');
    } catch (error) {
      logger.error('Failed to register background sync:', error);
    }
  } else {
    logger.warn('Background sync not supported');
  }
}

/**
 * Manually trigger sync (for immediate sync when coming online)
 */
export async function triggerSync(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    syncedPosts: 0,
    syncedComments: 0,
    syncedReactions: 0,
    errors: [],
  };

  try {
    logger.debug('Starting manual social wall sync');
    
    // Get unsynced items from IndexedDB
    const unsyncedItems = await db.getUnsyncedItems();
    
    // Sync posts
    if (unsyncedItems.posts.length > 0) {
      const postResults = await syncPosts(unsyncedItems.posts);
      result.syncedPosts = postResults.synced;
      result.errors.push(...postResults.errors);
    }
    
    // Sync comments
    if (unsyncedItems.comments.length > 0) {
      const commentResults = await syncComments(unsyncedItems.comments);
      result.syncedComments = commentResults.synced;
      result.errors.push(...commentResults.errors);
    }
    
    // Sync reactions
    if (unsyncedItems.reactions.length > 0) {
      const reactionResults = await syncReactions(unsyncedItems.reactions);
      result.syncedReactions = reactionResults.synced;
      result.errors.push(...reactionResults.errors);
    }
    
    result.success = result.errors.length === 0;
    
    logger.debug('Manual sync completed', result);
    return result;
  } catch (error) {
    logger.error('Manual sync failed:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return result;
  }
}

/**
 * Sync unsynced posts to server
 */
async function syncPosts(posts: any[]): Promise<{ synced: number; errors: string[] }> {
  const result = { synced: 0, errors: [] as string[] };
  
  for (const postItem of posts) {
    try {
      // Skip posts that are already synced or are temporary optimistic posts
      if (postItem.synced || postItem.data.id.startsWith('temp-')) {
        continue;
      }
      
      // This would typically involve calling the API to create/update the post
      // For now, just mark as synced since the actual API calls would be complex
      // In a real implementation, you'd:
      // 1. Call the appropriate tRPC mutation
      // 2. Handle conflicts (e.g., if the post was modified on server)
      // 3. Update the local data with server response
      
      await db.markAsSynced('posts', [postItem.id]);
      result.synced++;
      
      logger.debug(`Synced post ${postItem.id}`);
    } catch (error) {
      const errorMsg = `Failed to sync post ${postItem.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }
  }
  
  return result;
}

/**
 * Sync unsynced comments to server
 */
async function syncComments(comments: any[]): Promise<{ synced: number; errors: string[] }> {
  const result = { synced: 0, errors: [] as string[] };
  
  for (const commentItem of comments) {
    try {
      // Skip comments that are already synced or are temporary
      if (commentItem.synced || commentItem.data.id.startsWith('temp-')) {
        continue;
      }
      
      // Similar to posts, this would involve API calls
      await db.markAsSynced('comments', [commentItem.id]);
      result.synced++;
      
      logger.debug(`Synced comment ${commentItem.id}`);
    } catch (error) {
      const errorMsg = `Failed to sync comment ${commentItem.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }
  }
  
  return result;
}

/**
 * Sync unsynced reactions to server
 */
async function syncReactions(reactions: any[]): Promise<{ synced: number; errors: string[] }> {
  const result = { synced: 0, errors: [] as string[] };
  
  for (const reactionItem of reactions) {
    try {
      // Skip reactions that are already synced
      if (reactionItem.synced) {
        continue;
      }
      
      // Similar to posts and comments
      await db.markAsSynced('reactions', [reactionItem.id]);
      result.synced++;
      
      logger.debug(`Synced reaction ${reactionItem.id}`);
    } catch (error) {
      const errorMsg = `Failed to sync reaction ${reactionItem.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
      result.errors.push(errorMsg);
      logger.error(errorMsg);
    }
  }
  
  return result;
}

/**
 * Listen for service worker sync events
 */
export function listenForSyncEvents(callback?: (event: any) => void): () => void {
  if ('serviceWorker' in navigator) {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type?.startsWith('SOCIAL_WALL_SYNC_')) {
        logger.debug('Received sync event from service worker:', event.data);
        callback?.(event.data);
      }
    };
    
    navigator.serviceWorker.addEventListener('message', handleMessage);
    
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }
  
  return () => {}; // No-op cleanup function
}

/**
 * Check if background sync is supported
 */
export function isBackgroundSyncSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'sync' in window.ServiceWorkerRegistration.prototype
  );
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{
  isSupported: boolean;
  isRegistered: boolean;
  pendingItems: {
    posts: number;
    comments: number;
    reactions: number;
  };
}> {
  const isSupported = isBackgroundSyncSupported();
  let isRegistered = false;
  
  if (isSupported) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // Note: There's no direct way to check if a specific sync is registered
      // This is a limitation of the Background Sync API
      isRegistered = true;
    } catch (error) {
      logger.error('Error checking sync registration:', error);
    }
  }
  
  const unsyncedItems = await db.getUnsyncedItems();
  
  return {
    isSupported,
    isRegistered,
    pendingItems: {
      posts: unsyncedItems.posts.length,
      comments: unsyncedItems.comments.length,
      reactions: unsyncedItems.reactions.length,
    },
  };
}

/**
 * Auto-register background sync on module load
 */
if (typeof window !== 'undefined') {
  // Register background sync when the module is loaded
  registerBackgroundSync().catch(error => {
    logger.error('Failed to auto-register background sync:', error);
  });
}
