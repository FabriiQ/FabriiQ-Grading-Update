
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { QuestionBankManager } from '@/features/question-bank/components/manager/QuestionBankManager';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Question Bank Detail Page
 * 
 * This page displays the details of a question bank and its questions.
 * It uses the QuestionBankManager component to manage the questions.
 */
export default function QuestionBankDetailPage() {
  const params = useParams();
  
  // Handle the case where params might be null or id might be undefined
  if (!params?.id) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2 text-gray-600">Question bank ID not found</p>
          <Button asChild className="mt-4">
            <Link href="/admin/academic/question-bank">
              Back to Question Banks
            </Link>
          </Button>
        </div>
      </div>
    );
  }
  
  const questionBankId = Array.isArray(params.id) ? params.id[0] : params.id;
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
        >
          <Link href="/admin/academic/question-bank">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Question Bank</h1>
      </div>
      
      <QuestionBankManager questionBankId={questionBankId} />
    </div>
  );
}