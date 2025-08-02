'use client';
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopicForm } from "~/components/admin/subjects/TopicForm";
import { Button } from "~/components/ui";
import { ChevronLeft } from "lucide-react";
import { use } from "react";

// Create a wrapper component to handle the params
function TopicPageContent({ id }: { id: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Fix: Handle possible null searchParams
  const parentTopicId = searchParams?.get('parentTopicId') || undefined;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/system/subjects/${id}`)}
          className="mb-2"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Subject
        </Button>
        <h1 className="text-2xl font-bold">Add New Topic</h1>
      </div>

      <TopicForm
        subjectId={id}
        parentTopicId={parentTopicId}
      />
    </div>
  );
}

// Main page component - FIXED TYPE DEFINITION
export default function AddTopicPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  // Use React.use() to unwrap the Promise
  const { id } = use(params);

  return <TopicPageContent id={id} />;
}