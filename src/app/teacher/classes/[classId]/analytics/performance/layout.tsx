import React from 'react';
import { Metadata } from 'next';
import { ClassNav } from '@/components/teacher/navigation/ClassNav';

export const metadata: Metadata = {
  title: "Performance Analytics | Teacher Dashboard",
  description: "Academic performance metrics and trends for your class"
};

interface PerformanceAnalyticsLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    classId: string;
  }>;
}

export default async function PerformanceAnalyticsLayout({ 
  children, 
  params 
}: PerformanceAnalyticsLayoutProps) {
  // Await the params Promise in the async layout component
  const resolvedParams = await params;
  const { classId } = resolvedParams;

  // Create tabs for the ClassNav component
  const tabs = [
    {
      id: 'analytics',
      name: 'Analytics',
      href: `/teacher/classes/${classId}/analytics`,
      icon: () => <span>📊</span>,
    },
    {
      id: 'performance',
      name: 'Performance',
      href: `/teacher/classes/${classId}/analytics/performance`,
      icon: () => <span>📈</span>,
    },
    // Add other tabs as needed
  ];

  return (
    <div>
      <ClassNav tabs={tabs} />
      {children}
    </div>
  );
}