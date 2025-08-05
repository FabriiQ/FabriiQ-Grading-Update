'use client';

import { useRouter } from "next/navigation";
import { ActivityTypeSelectorGrid } from "@/features/activties";

interface CreateActivityClientProps {
  classId: string;
}

export function CreateActivityClient({ classId }: CreateActivityClientProps) {
  const router = useRouter();

  return (
    <ActivityTypeSelectorGrid
      onSelect={(activityType) => {
        // Navigate to unified activity creator with selected type
        router.push(`/teacher/classes/${classId}/activities/create/${activityType.id}`);
      }}
    />
  );
}
