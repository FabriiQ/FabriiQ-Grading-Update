/**
 * Typing Indicators Component
 * Shows real-time typing indicators for the social wall
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSocialWallSocket } from '../hooks/useSocialWallSocket';
import type { UserSummary } from '../types/social-wall.types';

interface TypingIndicator {
  user: UserSummary;
  location: 'post' | 'comment' | 'reply';
  postId?: string;
  commentId?: string;
  timestamp: Date;
}

interface TypingIndicatorsProps {
  classId: string;
  className?: string;
}

export function TypingIndicators({ classId, className }: TypingIndicatorsProps) {
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const { subscribe, isConnected } = useSocialWallSocket({ classId });

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers = [
      subscribe('user:typing', (event: any) => {
        setTypingUsers(prev => {
          // Remove existing indicator for this user
          const filtered = prev.filter(indicator => indicator.user.id !== event.user.id);
          
          // Add new indicator
          return [...filtered, {
            user: event.user,
            location: event.context.location,
            postId: event.context.postId,
            commentId: event.context.commentId,
            timestamp: new Date(event.timestamp),
          }];
        });
      }),

      subscribe('user:stopped_typing', (event: any) => {
        setTypingUsers(prev => 
          prev.filter(indicator => indicator.user.id !== event.user.id)
        );
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, subscribe]);

  // Auto-remove stale typing indicators after 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTypingUsers(prev => 
        prev.filter(indicator => 
          now.getTime() - indicator.timestamp.getTime() < 5000
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isConnected || typingUsers.length === 0) {
    return null;
  }

  return (
    <Card className={cn("typing-indicators", className)}>
      <CardContent className="p-3">
        <div className="flex items-center space-x-2">
          <div className="flex -space-x-2">
            {typingUsers.slice(0, 3).map((indicator) => (
              <Avatar key={indicator.user.id} className="w-6 h-6 border-2 border-background">
                <AvatarImage src={indicator.user.avatar} />
                <AvatarFallback className="text-xs">
                  {indicator.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" />
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-1 h-1 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            
            <span className="text-xs text-muted-foreground">
              {typingUsers.length === 1 ? (
                `${typingUsers[0]?.user.name} is typing...`
              ) : typingUsers.length === 2 ? (
                `${typingUsers[0]?.user.name} and ${typingUsers[1]?.user.name} are typing...`
              ) : (
                `${typingUsers[0]?.user.name} and ${typingUsers.length - 1} others are typing...`
              )}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default TypingIndicators;
