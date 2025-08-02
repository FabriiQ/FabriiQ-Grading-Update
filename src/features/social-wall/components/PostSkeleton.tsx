/**
 * Post Skeleton Component
 * Loading skeleton for social wall posts
 */

'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PostSkeletonProps {
  className?: string;
}

export function PostSkeleton({ className }: PostSkeletonProps) {
  return (
    <Card className={cn("post-skeleton", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          {/* Avatar */}
          <Skeleton className="w-10 h-10 rounded-full" />
          
          <div className="flex-1 space-y-2">
            {/* Author name and type */}
            <div className="flex items-center space-x-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            
            {/* Timestamp */}
            <Skeleton className="h-3 w-20" />
          </div>
          
          {/* Menu button */}
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Post content */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        
        {/* Engagement bar */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-4">
            {/* Reactions */}
            <div className="flex items-center space-x-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
            
            {/* Comments */}
            <div className="flex items-center space-x-1">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          
          {/* Share button */}
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

export default PostSkeleton;
