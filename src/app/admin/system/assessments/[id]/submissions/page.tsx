import { Metadata } from 'next';
import { PageHeader } from '~/components/ui/layout/page-header';
import { SubmissionsList } from '~/components/assessment/submission/submissions-list';

export const metadata: Metadata = {
  title: 'Assessment Submissions | System Admin',
  description: 'View and manage assessment submissions',
};

interface SubmissionsPageProps {
  params: Promise<{
    id: string;
  
  }>;
}

export default async function SubmissionsPage({ params }: SubmissionsPageProps) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Submissions"
        description="View and manage submissions for this assessment"
      />
      <SubmissionsList assessmentId={id} />
    </div>
  );
}