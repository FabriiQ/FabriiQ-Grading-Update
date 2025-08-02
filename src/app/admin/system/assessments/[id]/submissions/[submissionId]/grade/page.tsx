import { Metadata } from 'next';
import { AssessmentSubmission } from '~/components/assessment/submission/assessment-submission';

export const metadata: Metadata = {
  title: 'Grade Submission | System Admin',
  description: 'Grade an assessment submission',
};

interface GradeSubmissionPageProps {
  params: Promise<{
    id: string;
    submissionId: string;
  
  }>;
}

export default async function GradeSubmissionPage({ params }: GradeSubmissionPageProps) {
  const { id, submissionId } = await params;

  return (
    <AssessmentSubmission
      assessmentId={id}
      submissionId={submissionId}
      isGrading={true}
    />
  );
}