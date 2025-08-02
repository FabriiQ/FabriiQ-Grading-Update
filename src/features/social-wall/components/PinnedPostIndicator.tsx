/**
 * Pinned Post Indicator Component
 * Visual indicator for pinned posts in the social wall
 */

'use client';

import React from 'react';
import { MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PinnedPostIndicatorProps {
  isPinned: boolean;
  variant?: 'badge' | 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PinnedPostIndicator({ 
  isPinned, 
  variant = 'full', 
  size = 'md',
  className 
}: PinnedPostIndicatorProps) {
  if (!isPinned) return null;

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }[size];

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];

  if (variant === 'icon') {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-full bg-primary/10 text-primary p-1",
        size === 'sm' && 'p-0.5',
        size === 'lg' && 'p-1.5',
        className
      )}>
        <MapPin className={cn(iconSize, "rotate-45")} />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <Badge
        className={cn(
          "bg-primary/10 text-primary border-primary/20 font-medium",
          textSize,
          className
        )}
      >
        <MapPin className={cn(iconSize, "mr-1 rotate-45")} />
        Pinned
      </Badge>
    );
  }

  // Full variant - simplified with just star and text
  return (
    <div className={cn(
      "flex items-center space-x-1 px-2 py-1 bg-primary/10 border border-primary/20 rounded-md",
      className
    )}>
      <MapPin className={cn(iconSize, "text-primary rotate-45")} />
      <span className={cn(
        "font-medium text-primary",
        textSize
      )}>
        Pinned
      </span>
    </div>
  );
}

/**
 * Pinned Post Card Wrapper
 * Wraps a post card with pinned styling
 */
interface PinnedPostWrapperProps {
  children: React.ReactNode;
  isPinned: boolean;
  className?: string;
}

export function PinnedPostWrapper({
  children,
  isPinned,
  className
}: PinnedPostWrapperProps) {
  if (!isPinned) {
    return <>{children}</>;
  }

  return (
    <div className={cn(
      "relative",
      className
    )}>
      {/* Subtle background for pinned posts */}
      <div className="absolute inset-0 bg-primary/5 rounded-lg -z-10" />

      {/* Simple container without borders */}
      <div className="relative rounded-lg bg-white">
        {/* Pinned indicator inside the post content */}
        <div className="absolute top-3 right-3 z-10">
          <PinnedPostIndicator isPinned={true} variant="badge" size="sm" />
        </div>

        {/* Content without extra padding */}
        {children}
      </div>
    </div>
  );
}

export default PinnedPostIndicator;
