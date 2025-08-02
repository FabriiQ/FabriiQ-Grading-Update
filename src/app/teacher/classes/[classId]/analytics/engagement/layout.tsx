import React from 'react';
import { Metadata } from 'next';
import { ClassNav } from '@/components/teacher/navigation/ClassNav';

export const metadata: Metadata = {
  title: "Student Engagement Analytics | Teacher Dashboard",
  description: "Participation and engagement metrics for your class"
};

interface EngagementAnalyticsLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    classId: string;
  }>;
}

export default async function EngagementAnalyticsLayout({ 
  children, 
  params 
}: EngagementAnalyticsLayoutProps) {
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
      id: 'engagement',
      name: 'Engagement',
      href: `/teacher/classes/${classId}/analytics/engagement`,
      icon: () => <span>👥</span>,
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