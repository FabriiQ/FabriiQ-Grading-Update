/**
 * Social Wall IndexedDB Storage
 * Provides offline storage for posts, comments, reactions, and user data
 */

'use client';

import { openDB, IDBPDatabase } from 'idb';
import { logger } from '@/server/api/utils/logger';
import type { PostWithEngagement } from '../types/social-wall.types';

// Database configuration
const DB_NAME = 'social-wall-db';
const DB_VERSION = 1;

// Database stores configuration
// Using simplified approach to avoid DBSchema compatibility issues

// Database promise
let dbPromise: Promise<IDBPDatabase<any>> | null = null;

/**
 * Initialize the database
 */
export async function initDB(): Promise<IDBPDatabase<any>> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Posts store
        if (!db.objectStoreNames.contains('posts')) {
          const postsStore = db.createObjectStore('posts', { keyPath: 'id' });
          postsStore.createIndex('by-class', 'classId');
          postsStore.createIndex('by-last-updated', 'lastUpdated');
          postsStore.createIndex('by-synced', 'synced');
        }

        // Comments store
        if (!db.objectStoreNames.contains('comments')) {
          const commentsStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentsStore.createIndex('by-post', 'postId');
          commentsStore.createIndex('by-class', 'classId');
          commentsStore.createIndex('by-last-updated', 'lastUpdated');
          commentsStore.createIndex('by-synced', 'synced');
        }

        // Reactions store
        if (!db.objectStoreNames.contains('reactions')) {
          const reactionsStore = db.createObjectStore('reactions', { keyPath: 'id' });
          reactionsStore.createIndex('by-target', 'targetId');
          reactionsStore.createIndex('by-class', 'classId');
          reactionsStore.createIndex('by-last-updated', 'lastUpdated');
          reactionsStore.createIndex('by-synced', 'synced');
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('by-last-updated', 'lastUpdated');
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Save posts to offline storage
 */
export async function savePosts(classId: string, posts: PostWithEngagement[]): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction('posts', 'readwrite');
    
    await Promise.all(
      posts.map(post => 
        tx.store.put({
          id: post.id,
          classId,
          data: post,
          lastUpdated: Date.now(),
          synced: true,
        })
      )
    );
    
    await tx.done;
    logger.debug(`Saved ${posts.length} posts to offline storage for class ${classId}`);
  } catch (error) {
    logger.error('Error saving posts to offline storage:', error);
    throw error;
  }
}

/**
 * Get posts from offline storage
 */
export async function getPosts(classId: string): Promise<PostWithEngagement[]> {
  try {
    const db = await initDB();
    const posts = await db.getAllFromIndex('posts', 'by-class', classId);
    
    return posts
      .sort((a, b) => b.lastUpdated - a.lastUpdated)
      .map(post => post.data);
  } catch (error) {
    logger.error('Error getting posts from offline storage:', error);
    return [];
  }
}

/**
 * Save a single post (for optimistic updates)
 */
export async function savePost(classId: string, post: PostWithEngagement, synced: boolean = false): Promise<void> {
  try {
    const db = await initDB();
    await db.put('posts', {
      id: post.id,
      classId,
      data: post,
      lastUpdated: Date.now(),
      synced,
    });
    
    logger.debug(`Saved post ${post.id} to offline storage`);
  } catch (error) {
    logger.error('Error saving post to offline storage:', error);
    throw error;
  }
}

/**
 * Delete a post from offline storage
 */
export async function deletePost(postId: string): Promise<void> {
  try {
    const db = await initDB();
    await db.delete('posts', postId);
    
    logger.debug(`Deleted post ${postId} from offline storage`);
  } catch (error) {
    logger.error('Error deleting post from offline storage:', error);
    throw error;
  }
}

/**
 * Save comments for a post
 */
export async function saveComments(postId: string, classId: string, comments: any[]): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction('comments', 'readwrite');
    
    await Promise.all(
      comments.map(comment => 
        tx.store.put({
          id: comment.id,
          postId,
          classId,
          data: comment,
          lastUpdated: Date.now(),
          synced: true,
        })
      )
    );
    
    await tx.done;
    logger.debug(`Saved ${comments.length} comments for post ${postId}`);
  } catch (error) {
    logger.error('Error saving comments to offline storage:', error);
    throw error;
  }
}

/**
 * Get comments for a post
 */
export async function getComments(postId: string): Promise<any[]> {
  try {
    const db = await initDB();
    const comments = await db.getAllFromIndex('comments', 'by-post', postId);
    
    return comments
      .sort((a, b) => a.data.createdAt - b.data.createdAt)
      .map(comment => comment.data);
  } catch (error) {
    logger.error('Error getting comments from offline storage:', error);
    return [];
  }
}

/**
 * Get unsynced items for background sync
 */
export async function getUnsyncedItems(): Promise<{
  posts: any[];
  comments: any[];
  reactions: any[];
}> {
  try {
    // Check if IndexedDB is available
    if (typeof window === 'undefined' || !window.indexedDB) {
      logger.debug('IndexedDB not available, returning empty unsynced items');
      return { posts: [], comments: [], reactions: [] };
    }

    const db = await initDB();

    // Check if the required object stores exist
    if (!db.objectStoreNames.contains('posts') ||
        !db.objectStoreNames.contains('comments') ||
        !db.objectStoreNames.contains('reactions')) {
      logger.debug('Required object stores not found, returning empty unsynced items');
      return { posts: [], comments: [], reactions: [] };
    }

    const [posts, comments, reactions] = await Promise.all([
      db.getAllFromIndex('posts', 'by-synced', false).catch(() => []),
      db.getAllFromIndex('comments', 'by-synced', false).catch(() => []),
      db.getAllFromIndex('reactions', 'by-synced', false).catch(() => []),
    ]);

    return { posts, comments, reactions };
  } catch (error) {
    logger.error('Error getting unsynced items:', { error: error instanceof Error ? error.message : String(error) });
    return { posts: [], comments: [], reactions: [] };
  }
}

/**
 * Mark items as synced
 */
export async function markAsSynced(type: 'posts' | 'comments' | 'reactions', ids: string[]): Promise<void> {
  try {
    const db = await initDB();
    const tx = db.transaction(type, 'readwrite');
    
    await Promise.all(
      ids.map(async (id) => {
        const item = await tx.store.get(id);
        if (item) {
          item.synced = true;
          item.lastUpdated = Date.now();
          await tx.store.put(item);
        }
      })
    );
    
    await tx.done;
    logger.debug(`Marked ${ids.length} ${type} as synced`);
  } catch (error) {
    logger.error(`Error marking ${type} as synced:`, error);
    throw error;
  }
}

/**
 * Clear old cached data
 */
export async function clearOldData(maxAge: number = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  try {
    const db = await initDB();
    const cutoff = Date.now() - maxAge;
    
    const stores = ['posts', 'comments', 'reactions'] as const;
    
    for (const storeName of stores) {
      const tx = db.transaction(storeName, 'readwrite');
      const index = tx.store.index('by-last-updated');
      
      let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
      while (cursor) {
        // Only delete synced items
        if (cursor.value.synced) {
          await cursor.delete();
        }
        cursor = await cursor.continue();
      }
      
      await tx.done;
    }
    
    logger.debug('Cleared old cached data');
  } catch (error) {
    logger.error('Error clearing old data:', error);
  }
}
