'use client';

import React from "react";
import { useParams } from "next/navigation";
import { EnhancedGradebook } from "@/features/gradebook/components/EnhancedGradebook";
import { PageHeader } from "@/components/ui/page-header";

export default function ClassGradesPage() {
  const params = useParams();
  const classId = params?.classId as string;
  if (!classId) {
    return (
      <div className="container mx-auto py-6">
        <PageHeader
          title="Class Grades"
          description="Class not found"
        />
        <div className="text-center mt-8">
          <p className="text-muted-foreground">Invalid class ID provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <EnhancedGradebook classId={classId} />
    </div>
  );
}
