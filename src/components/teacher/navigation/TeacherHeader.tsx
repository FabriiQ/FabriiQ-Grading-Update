'use client';

import React from 'react';
import { ProfileMenu } from '../profile/ProfileMenu';
import { useResponsive } from '@/lib/hooks/use-responsive';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import Link from 'next/link';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

interface TeacherHeaderProps {
  teacherId: string;
  userName: string;
  userEmail?: string;
  userImage?: string;
  title?: string;
  className?: string;
  isOffline?: boolean;
}

/**
 * TeacherHeader component for the teacher portal
 *
 * Features:
 * - Responsive design for mobile and desktop
 * - Profile menu integration
 * - Customizable title
 * - Offline status indicator
 */
export function TeacherHeader({
  teacherId,
  userName,
  userEmail,
  userImage,
  title = 'Teacher Dashboard',
  className,
  isOffline = false,
}: TeacherHeaderProps) {
  const { isMobile } = useResponsive();

  return (
    <header className={cn(
      "sticky top-0 z-10 w-full border-b bg-background px-4 md:px-6 h-16",
      className
    )}>
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold truncate text-primary-foreground">{title}</h1>
          {isOffline && (
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              Offline
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Classes Button */}
          <Link href="/teacher/classes">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {!isMobile && <span>Classes</span>}
            </Button>
          </Link>

          {/* Notification Bell */}
          <NotificationBell size={isMobile ? 'sm' : 'md'} />

          <ProfileMenu
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            isOffline={isOffline}
          />
        </div>
      </div>
    </header>
  );
}
