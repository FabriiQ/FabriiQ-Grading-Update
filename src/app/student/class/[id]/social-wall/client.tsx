'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { SocialWallContainer } from '@/features/social-wall/components';

interface StudentSocialWallClientProps {
  classId: string;
  className?: string;
  courseName?: string;
}

export function StudentSocialWallClient({
  classId,
  className,
  courseName
}: StudentSocialWallClientProps) {
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);

  // Wait for session to be fully loaded before rendering components that make tRPC calls
  useEffect(() => {
    if (status !== "loading") {
      // Add a small delay to ensure session is fully established
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [status]);

  // Redirect if not authenticated
  if (status === "unauthenticated") {
    redirect("/login");
  }

  // Show loading state while session is loading
  if (status === "loading" || !isReady) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        </div>
        <div className="space-y-4">
          <div className="h-32 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
          <div className="h-24 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Social Wall</h1>
        <p className="text-muted-foreground">
          Connect with your classmates in {className}
          {courseName && (
            <>
              {' • '}
              <span>{courseName}</span>
            </>
          )}
        </p>
      </div>

      {/* Social Wall Container - Only render when session is ready */}
      <SocialWallContainer classId={classId} />
    </div>
  );
}
