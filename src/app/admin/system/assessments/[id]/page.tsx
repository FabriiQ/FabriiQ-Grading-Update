import { Metadata } from 'next';
import { AssessmentDetail } from '~/components/assessment/assessment-detail';

export const metadata: Metadata = {
  title: 'Assessment Details | System Admin',
  description: 'View and manage assessment details',
};

interface AssessmentDetailPageProps {
  params: Promise<{
    id: string;
  
  }>;
}

export default async function AssessmentDetailPage({ params }: AssessmentDetailPageProps) {
  const { id } = await params;
  return <AssessmentDetail assessmentId={id} />;
}