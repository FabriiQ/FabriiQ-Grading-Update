/**
 * Social Wall Container Component
 * Main container for the Social Wall feature with real-time updates
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserType } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  MessageSquare,
  TrendingUp,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { ThumbsUp } from './icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { useSocialWallSocket } from '../hooks/useSocialWallSocket';
import { CollapsedPostCreator } from './CollapsedPostCreator';
import { PostFeed } from './PostFeed';
import { TypingIndicators } from './TypingIndicators';
import { ModerationDashboard } from './ModerationDashboard';
import type { PostWithEngagement } from '../types/social-wall.types';

interface SocialWallContainerProps {
  classId: string;
  className?: string;
}

export function SocialWallContainer({ classId, className }: SocialWallContainerProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'feed' | 'moderation'>('feed');
  const [posts, setPosts] = useState<PostWithEngagement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Socket connection for real-time updates
  const {
    isConnected,
    isConnecting,
    connectionError,
    subscribe,
    emit,
    hasError,
  } = useSocialWallSocket({
    classId,
    enabled: !!session?.user,
    autoConnect: true,
  });

  // User permissions
  const userType = session?.user?.userType as UserType;
  const canCreatePost = userType === UserType.TEACHER || userType === UserType.CAMPUS_TEACHER || userType === UserType.CAMPUS_COORDINATOR;
  const canModerate = userType === UserType.TEACHER || userType === UserType.CAMPUS_TEACHER || userType === UserType.CAMPUS_COORDINATOR;

  // Real-time event subscriptions with optimistic updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers = [
      // Post events with optimistic UI updates
      subscribe('post:created', (event: any) => {
        setPosts(prev => {
          // Check if post already exists (optimistic update)
          const exists = prev.some(p => p.id === event.post.id);
          if (exists) {
            // Update existing optimistic post with server data
            return prev.map(p => p.id === event.post.id ? event.post : p);
          } else {
            // Add new post
            return [event.post, ...prev];
          }
        });
        console.log('New post created via socket:', event.post);
      }),

      subscribe('post:updated', (event: any) => {
        setPosts(prev => prev.map(post =>
          post.id === event.postId
            ? { ...post, ...event.changes }
            : post
        ));
        console.log('Post updated via socket:', event.postId);
      }),

      subscribe('post:deleted', (event: any) => {
        setPosts(prev => prev.filter(post => post.id !== event.postId));
        console.log('Post deleted via socket:', event.postId);
      }),

      // Comment events with real-time count updates
      subscribe('comment:created', (event: any) => {
        setPosts(prev => prev.map(post =>
          post.id === event.comment.postId
            ? {
                ...post,
                commentCount: post.commentCount + 1,
                // Update last activity for sorting
                updatedAt: new Date()
              }
            : post
        ));
        console.log('Comment created via socket:', event.comment);
      }),

      subscribe('comment:deleted', (event: any) => {
        setPosts(prev => prev.map(post =>
          post.id === event.comment.postId
            ? {
                ...post,
                commentCount: Math.max(0, post.commentCount - 1)
              }
            : post
        ));
        console.log('Comment deleted via socket:', event.comment);
      }),

      // Reaction events with real-time count updates
      subscribe('reaction:added', (event: any) => {
        if (event.targetType === 'post') {
          setPosts(prev => prev.map(post =>
            post.id === event.targetId
              ? {
                  ...post,
                  reactionCount: Object.values(event.newCounts).reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0) as number,
                  // Update user's reaction state if it's their reaction
                  userReaction: event.userId === session?.user?.id ? event.reactionType : post.userReaction
                }
              : post
          ));
        }
        console.log('Reaction added via socket:', event);
      }),

      subscribe('reaction:removed', (event: any) => {
        if (event.targetType === 'post') {
          setPosts(prev => prev.map(post =>
            post.id === event.targetId
              ? {
                  ...post,
                  reactionCount: Math.max(0, post.reactionCount - 1),
                  // Clear user's reaction if it's their reaction
                  userReaction: event.userId === session?.user?.id ? undefined : post.userReaction
                }
              : post
          ));
        }
        console.log('Reaction removed via socket:', event);
      }),

      // User presence events (for future features)
      subscribe('user:joined', (event: any) => {
        console.log('User joined class:', event.user);
      }),

      subscribe('user:left', (event: any) => {
        console.log('User left class:', event.user);
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub?.());
    };
  }, [isConnected, subscribe, session?.user?.id]);

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2 text-sm">
      {isConnecting ? (
        <>
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-muted-foreground">Connecting...</span>
        </>
      ) : isConnected ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-600">Live</span>
        </>
      ) : (
        <>
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-600">Offline</span>
        </>
      )}
    </div>
  );

  // Error display
  if (hasError || connectionError) {
    return (
      <Card className={cn("social-wall-container", className)}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {connectionError || 'Failed to connect to Social Wall. Please refresh the page.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("social-wall-container space-y-6 min-h-screen w-full overflow-x-hidden", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-4 xs:gap-0">
            <div className="flex items-center space-x-2 xs:space-x-4">
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 xs:w-5 xs:h-5" />
                <span className="text-sm xs:text-base">Class Social Wall</span>
              </CardTitle>
              <ConnectionStatus />
            </div>
            
            <div className="flex flex-col xs:flex-row items-start xs:items-center space-y-2 xs:space-y-0 xs:space-x-2 w-full xs:w-auto">
              {/* Tab Navigation */}
              <div className="flex items-center space-x-1 bg-muted rounded-lg p-1 w-full xs:w-auto">
                <Button
                  variant={activeTab === 'feed' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('feed')}
                  className="h-8 flex-1 xs:flex-none"
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Feed
                </Button>
                
                {canModerate && (
                  <Button
                    variant={activeTab === 'moderation' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('moderation')}
                    className="h-8 flex-1 xs:flex-none"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Moderation
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content */}
      {activeTab === 'feed' ? (
        <div className="space-y-6">
          {/* Post Creator - Only for teachers/coordinators */}
          {canCreatePost && (
            <CollapsedPostCreator
              classId={classId}
              onPostCreated={() => {
                // Posts will be updated via socket events
                console.log('Post created, waiting for socket update');
              }}
            />
          )}

          {/* Post Feed */}
          <PostFeed
            classId={classId}
            posts={posts}
            onPostsChange={setPosts}
            isLoading={isLoading}
            onLoadingChange={setIsLoading}
          />

          {/* Typing Indicators */}
          <TypingIndicators classId={classId} />
        </div>
      ) : (
        /* Moderation Dashboard */
        canModerate && (
          <ModerationDashboard classId={classId} />
        )
      )}

      {/* Quick Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">{posts.length}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <ThumbsUp className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">
                  {posts.reduce((sum, post) => sum + post.reactionCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Reactions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">
                  {posts.reduce((sum, post) => sum + post.commentCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Comments</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">
                  {isConnected ? 'Active' : 'Offline'}
                </p>
                <p className="text-xs text-muted-foreground">Status</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SocialWallContainer;
