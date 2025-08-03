'use client';

import { useSession } from 'next-auth/react';
import { LearningTimeSummary } from '@/components/analytics/LearningTimeSummary';

interface LearningTimeInvestmentProps {
  classId: string;
}

export function LearningTimeInvestment({ classId }: LearningTimeInvestmentProps) {
  const { data: session } = useSession();

  if (!session?.user?.id) {
    return null;
  }

  return (
    <LearningTimeSummary
      studentId={session.user.id}
      classId={classId}
      timeframe="month"
      compact={false}
    />
  );
}
