'use client';

import { ReactNode } from 'react';
import { StudentSidebar } from '@/components/student/StudentSidebar';
import { StudentHeader } from '@/components/student/StudentHeader';
import { useParams } from 'next/navigation';
import { ThemeProvider } from '@/providers/theme-provider';
import { TimeTrackingProvider } from '@/components/providers/TimeTrackingProvider';
import { StudentAssistantProvider } from '@/features/student-assistant';
import { useResponsive } from '@/lib/hooks/use-responsive';

interface ClassLayoutProps {
  children: ReactNode;
}

/**
 * Layout for class-specific pages in the student portal
 *
 * This layout includes:
 * - StudentSidebar for navigation (responsive)
 * - Sidebar navigation on desktop, mobile overlay on mobile
 * - Consistent navigation experience
 *
 * Features:
 * - Responsive design with sidebar navigation
 * - Mobile-first approach with overlay sidebar
 * - Consistent with teacher portal patterns
 * - Theme support and user management
 */
export default function ClassLayout({ children }: ClassLayoutProps) {
  const params = useParams();
  const classId = params?.id as string || "";
  const { isMobile } = useResponsive();

  return (
    <ThemeProvider>
      <TimeTrackingProvider>
        <div className="flex h-screen overflow-hidden bg-background">
          {/* Sidebar navigation */}
          <StudentSidebar classId={classId} />

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header for desktop */}
            {!isMobile && (
              <StudentHeader title="Class Portal" />
            )}

            {/* Main content */}
            <main className={`flex-1 overflow-auto ${isMobile ? 'pt-16' : ''}`}>
              <StudentAssistantProvider>
                <div className="p-4 md:p-6">
                  {children}
                </div>
              </StudentAssistantProvider>
            </main>
          </div>
        </div>
      </TimeTrackingProvider>
    </ThemeProvider>
  );
}
