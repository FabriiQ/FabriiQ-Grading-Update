/**
 * Collapsed Post Creator Component
 * Follows social media psychology principles for reduced cognitive load
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { 
  PlusCircle, 
  ImageIcon, 
  AtSignIcon, 
  Smile,
  ChevronDown,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCreator } from './PostCreator';
import { useSession } from 'next-auth/react';

interface CollapsedPostCreatorProps {
  classId: string;
  onPostCreated?: () => void;
  className?: string;
}

export function CollapsedPostCreator({
  classId,
  onPostCreated,
  className
}: CollapsedPostCreatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { data: session } = useSession();

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
  };

  const handlePostCreated = () => {
    setIsExpanded(false);
    onPostCreated?.();
  };

  // Get user initials for avatar fallback
  const getUserInitials = () => {
    const name = session?.user?.name || 'User';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          // Collapsed State - Minimal, inviting
          <motion.div
            key="collapsed"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card 
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                isHovered ? "border-primary/20 shadow-sm" : "border-border"
              )}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={handleExpand}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session?.user?.image || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Create Post Input Placeholder */}
                  <div className="flex-1">
                    <motion.div
                      className={cn(
                        "flex items-center justify-between p-3 rounded-full border transition-all duration-200",
                        isHovered 
                          ? "border-primary/30 bg-primary/5" 
                          : "border-muted bg-muted/50"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <span className="text-muted-foreground text-sm">
                        Share an update with your class...
                      </span>
                      <motion.div
                        animate={{ rotate: isHovered ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <PlusCircle className="h-5 w-5 text-primary" />
                      </motion.div>
                    </motion.div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <motion.div 
                  className="flex items-center justify-center space-x-6 mt-4 pt-3 border-t"
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: isHovered ? 1 : 0.7 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Photo</span>
                  </motion.div>

                  <motion.div
                    className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <AtSignIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">Mention</span>
                  </motion.div>

                  <motion.div
                    className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Smile className="h-4 w-4" />
                    <span className="text-sm font-medium">Feeling</span>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          // Expanded State - Full Editor
          <motion.div
            key="expanded"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardContent className="p-0">
                {/* Header with Close Button */}
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium text-sm">Create Post</h3>
                      <p className="text-xs text-muted-foreground">
                        Share with your class
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCollapse}
                    className="h-8 w-8 p-0 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Full Post Creator */}
                <div className="p-4">
                  <PostCreator
                    classId={classId}
                    onPostCreated={handlePostCreated}
                    isExpanded={true}
                    showHeader={false}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
