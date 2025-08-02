'use client';
import { useParams } from 'next/navigation';


import { useRouter } from "next/navigation";
import { TopicForm } from "~/components/admin/subjects/TopicForm";
import { Button } from "~/components/ui";
import { ChevronLeft } from "lucide-react";

export default function EditTopicPage() {
  const params = useParams();
  const router = useRouter();

  // Use params directly
  const subjectId = (params.id as string);
  const topicId = (params.topicId as string);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push(`/admin/system/subjects/${subjectId}`)}
          className="mb-2"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Subject
        </Button>
        <h1 className="text-2xl font-bold">Edit Topic</h1>
      </div>

      <TopicForm
        subjectId={subjectId}
        topicId={topicId}
      />
    </div>
  );
}