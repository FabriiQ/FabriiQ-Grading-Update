'use client';

import { useRouter } from "next/navigation";
import { UnifiedActivityCreator } from "@/features/activties/components/UnifiedActivityCreator";

interface CreateSpecificActivityClientProps {
  activityTypeId: string;
  classId: string;
}

export function CreateSpecificActivityClient({ 
  activityTypeId, 
  classId 
}: CreateSpecificActivityClientProps) {
  const router = useRouter();

  return (
    <UnifiedActivityCreator
      activityTypeId={activityTypeId}
      classId={classId}
      onSuccess={() => {
        // Navigate back to activities list
        router.push(`/teacher/classes/${classId}/activities`);
      }}
      onCancel={() => {
        // Navigate back to activity type selector
        router.push(`/teacher/classes/${classId}/activities/create`);
      }}
    />
  );
}
