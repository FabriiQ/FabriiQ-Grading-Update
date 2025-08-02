'use client';

import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  User,
  Settings,
  LogOut,
  Bell,
  Menu,
  X
} from 'lucide-react';
import { StudentThemeSelector } from './StudentThemeSelector';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

interface StudentHeaderProps {
  title?: string;
  className?: string;
  isOffline?: boolean;
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
  notifications?: number;
}

/**
 * StudentHeader component for the student portal
 *
 * Features:
 * - Responsive design for mobile and desktop
 * - Profile menu with logout and settings
 * - Theme selector integration
 * - Notification bell
 * - Mobile menu toggle
 */
export function StudentHeader({
  title = 'Student Portal',
  className,
  isOffline = false,
  onMenuToggle,
  showMenuButton = false,
  notifications = 0,
}: StudentHeaderProps) {
  const { data: session } = useSession();
  const { isMobile } = useResponsive();

  const handleSignOut = () => {
    signOut();
  };

  const handleProfileClick = () => {
    window.location.href = '/student/profile';
  };

  const handleSettingsClick = () => {
    window.location.href = '/student/settings';
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="flex h-16 items-center justify-between px-4">
        {/* Left side - Menu button (mobile) and title */}
        <div className="flex items-center gap-3">
          {showMenuButton && isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="md:hidden"
            >
              <Menu size={20} />
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold truncate">{title}</h1>
            {isOffline && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                Offline
              </span>
            )}
          </div>
        </div>

        {/* Right side - Theme, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Theme Selector */}
          <StudentThemeSelector />

          {/* Notification Bell */}
          <NotificationBell
            size={isMobile ? 'sm' : 'md'}
          />

          {/* Profile Menu */}
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage 
                      src={session.user.image || ""} 
                      alt={session.user.name || "Student"} 
                    />
                    <AvatarFallback>
                      {session.user.name?.charAt(0)?.toUpperCase() || "S"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {session.user.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSettingsClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
