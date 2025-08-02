import React from 'react';
import { Metadata } from 'next';
import { ClassNavigation } from '@/components/teacher/classes/ClassNavigation';

export const metadata: Metadata = {
  title: "Class Analytics | Teacher Dashboard",
  description: "Analytics and insights for your class"
};

interface ClassAnalyticsLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    classId: string;
  }>;
}

export default async function ClassAnalyticsLayout({ children, params }: ClassAnalyticsLayoutProps) {
  const { classId } = await params;
  
  return (
    <div>
      <ClassNavigation classId={classId} activeTab="analytics" />
      {children}
    </div>
  );
}
