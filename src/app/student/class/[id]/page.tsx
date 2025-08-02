import { redirect } from 'next/navigation';

/**
 * Redirect from /student/class/[id] to /student/class/[id]/dashboard
 * This ensures that when a user navigates to the class page, they are redirected to the dashboard
 */
export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Redirect to the dashboard page
  redirect(`/student/class/${id}/dashboard`);
}
