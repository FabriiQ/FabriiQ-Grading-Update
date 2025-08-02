'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ClassNav } from '@/components/teacher/navigation/ClassNav';
import { ClassBottomNav } from '@/components/teacher/navigation/ClassBottomNav';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  FileText,
  Award,
  BarChart,
  LayoutGrid,
  LineChart,
  AlertCircle,
  MessageSquare,
  Settings
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface ClassLayoutProps {
  children: React.ReactNode;
}

// Custom icons for missing lucide-react icons
const BookMarked = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20l-6-6-6 6V2z" />
  </svg>
);

const Coins = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="8" cy="8" r="6" />
    <path d="M18.09 10.37A6 6 0 1 1 10.37 18.09" />
    <path d="M7 6h1v4" />
    <path d="M16.71 13.88L18.09 10.37" />
  </svg>
);

const Brain = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <path d="M6 18a4 4 0 0 1-1.967-.516" />
    <path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </svg>
);

const Medal = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.61 2.14a2 2 0 0 1 .13 2.2L16.79 15" />
    <path d="M11 12 5.12 2.2" />
    <path d="m13 12 5.88-9.8" />
    <path d="M8 7h8" />
    <circle cx="12" cy="17" r="5" />
    <path d="m9 22 3-3 3 3" />
    <path d="M9 12h6" />
  </svg>
);

export default function ClassLayout({ children }: ClassLayoutProps) {
  // Use the useParams hook for client components
  const params = useParams();
  const classId = params?.classId as string;

  const tabs = [
    {
      id: 'overview',
      name: 'Overview',
      href: `/teacher/classes/${classId}`,
      icon: LayoutGrid,
    },
    {
      id: 'students',
      name: 'Students',
      href: `/teacher/classes/${classId}/students`,
      icon: Users,
    },
    {
      id: 'social-wall',
      name: 'Social Wall',
      href: `/teacher/classes/${classId}/social-wall`,
      icon: MessageSquare,
    },
    {
      id: 'subjects',
      name: 'Subjects',
      href: `/teacher/classes/${classId}/subjects`,
      icon: BookOpen,
    },
    {
      id: 'activities',
      name: 'Activities',
      href: `/teacher/classes/${classId}/activities`,
      icon: FileText,
    },
    {
      id: 'assessments',
      name: 'Assessments',
      href: `/teacher/classes/${classId}/assessments`,
      icon: ClipboardList,
    },
    {
      id: 'lesson-plans',
      name: 'Lesson Plans',
      href: `/teacher/classes/${classId}/lesson-plans`,
      icon: BookMarked,
    },
    {
      id: 'attendance',
      name: 'Attendance',
      href: `/teacher/classes/${classId}/attendance`,
      icon: Calendar,
    },
    {
      id: 'grades',
      name: 'Grades',
      href: `/teacher/classes/${classId}/grades`,
      icon: Award,
    },
    {
      id: 'rewards',
      name: 'Rewards',
      href: `/teacher/classes/${classId}/rewards`,
      icon: Coins,
    },
    {
      id: 'reports',
      name: 'Reports',
      href: `/teacher/classes/${classId}/reports`,
      icon: BarChart,
    },
    {
      id: 'bloom-analytics',
      name: 'Bloom\'s Analytics',
      href: `/teacher/classes/${classId}/bloom-analytics`,
      icon: Brain,
    },
    {
      id: 'bloom-reports',
      name: 'Bloom\'s Reports',
      href: `/teacher/classes/${classId}/bloom-reports`,
      icon: LineChart,
    },
    {
      id: 'leaderboard',
      name: 'Leaderboard',
      href: `/teacher/classes/${classId}/leaderboard`,
      icon: Medal,
    },
  ];

  return (
    <div className="h-full flex relative">
      {/* Class Navigation - responsive (handles mobile/desktop internally) */}
      <ClassNav tabs={tabs} />

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6 pb-6 pt-16 md:pt-4">
        <ErrorBoundary
          fallback={
            <div className="p-4 space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Something went wrong while loading this page. Please try refreshing.
                </AlertDescription>
              </Alert>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          }
        >
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
