/**
 * Reaction Bar Component
 * Displays and manages reactions on posts and comments
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Plus } from 'lucide-react';
import {
  Heart,
  ThumbsUp,
  Smile,
  Laugh,
  Surprised,
  Frown
} from './icons/social-wall-icons';
import { cn } from '@/lib/utils';
import type { ReactionSummary } from '../types/social-wall.types';
import type { ReactionType } from '@prisma/client';

interface ReactionBarProps {
  reactions: ReactionSummary[];
  userReaction?: ReactionType;
  onReactionClick: (reactionType: ReactionType) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const REACTION_ICONS: Record<ReactionType, React.ComponentType<any>> = {
  LIKE: ThumbsUp,
  LOVE: Heart,
  CELEBRATE: Smile,
  LAUGH: Laugh,
  SURPRISED: Surprised,
  ANGRY: Frown,
  SAD: Frown,
};

const REACTION_COLORS: Record<ReactionType, string> = {
  LIKE: 'text-primary', // Changed from blue to primary color
  LOVE: 'text-red-500',
  CELEBRATE: 'text-yellow-500',
  LAUGH: 'text-green-500',
  SURPRISED: 'text-purple-500',
  ANGRY: 'text-orange-500',
  SAD: 'text-gray-500',
};

export function ReactionBar({ 
  reactions, 
  userReaction, 
  onReactionClick, 
  size = 'md',
  className 
}: ReactionBarProps) {
  const [showPicker, setShowPicker] = useState(false);
  
  const totalReactions = reactions.reduce((sum, r) => sum + r.count, 0);
  
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 'w-3 h-3';
      case 'lg': return 'w-5 h-5';
      default: return 'w-4 h-4';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'h-6 px-2 text-xs';
      case 'lg': return 'h-10 px-4 text-base';
      default: return 'h-8 px-3 text-sm';
    }
  };

  if (totalReactions === 0) {
    return (
      <div className={cn("flex items-center", className)}>
        <Popover open={showPicker} onOpenChange={setShowPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-muted-foreground hover:text-foreground",
                getButtonSize()
              )}
            >
              <Heart className={cn("mr-1", getIconSize())} />
              React
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <ReactionPicker onReactionSelect={(type) => onReactionClick(type)} />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Get all available reaction types
  const allReactionTypes: ReactionType[] = ['LIKE', 'LOVE', 'CELEBRATE', 'LAUGH', 'SURPRISED', 'ANGRY'];

  // Create a map of existing reactions for quick lookup
  const reactionMap = new Map(reactions.map(r => [r.type, r]));

  // Show all reaction types, with counts for existing ones
  const displayReactions = allReactionTypes.map(type => ({
    type,
    count: reactionMap.get(type)?.count || 0,
    hasReactions: reactionMap.has(type)
  }));

  return (
    <div className={cn("flex items-center space-x-1", className)}>
      {/* Show all reaction types */}
      {displayReactions.map((reaction) => {
        const Icon = REACTION_ICONS[reaction.type as keyof typeof REACTION_ICONS];
        const isSelected = userReaction === reaction.type;
        const showButton = reaction.hasReactions || isSelected;

        // Only show reactions that have been used or are selected by current user
        if (!showButton) return null;

        return (
          <Button
            key={reaction.type}
            variant={isSelected ? "default" : "ghost"}
            size="sm"
            onClick={() => onReactionClick(reaction.type as ReactionType)}
            className={cn(
              "flex items-center space-x-1 transition-all duration-200",
              getButtonSize(),
              isSelected && "bg-primary/10 text-primary border-primary/20",
              !isSelected && "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn(
              getIconSize(),
              isSelected && REACTION_COLORS[reaction.type as keyof typeof REACTION_COLORS]
            )} />
            <span>{reaction.count}</span>
          </Button>
        );
      })}

      {/* Add reaction button - only show if user hasn't reacted */}
      {!userReaction && (
        <Popover open={showPicker} onOpenChange={setShowPicker}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-muted-foreground hover:text-foreground transition-all duration-200",
                getButtonSize()
              )}
            >
              <Plus className={cn(getIconSize())} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <ReactionPicker
              onReactionSelect={(type) => {
                onReactionClick(type as ReactionType);
                setShowPicker(false);
              }}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function ReactionPicker({ onReactionSelect }: { onReactionSelect: (type: ReactionType) => void }) {
  const reactions = [
    { type: 'LIKE' as ReactionType, icon: ThumbsUp, label: 'Like' },
    { type: 'LOVE' as ReactionType, icon: Heart, label: 'Love' },
    { type: 'CELEBRATE' as ReactionType, icon: Smile, label: 'Celebrate' },
    { type: 'LAUGH' as ReactionType, icon: Laugh, label: 'Laugh' },
    { type: 'SURPRISED' as ReactionType, icon: Surprised, label: 'Surprised' },
    { type: 'ANGRY' as ReactionType, icon: Frown, label: 'Angry' },
  ];

  return (
    <div className="flex space-x-1">
      {reactions.map(({ type, icon: Icon, label }) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          onClick={() => onReactionSelect(type)}
          className="w-8 h-8 p-0 hover:bg-muted"
          title={label}
        >
          <Icon className={cn(
            "w-4 h-4",
            REACTION_COLORS[type as keyof typeof REACTION_COLORS]
          )} />
        </Button>
      ))}
    </div>
  );
}

export default ReactionBar;
