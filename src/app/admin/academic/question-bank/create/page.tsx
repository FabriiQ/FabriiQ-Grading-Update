'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuestionEditor } from '@/features/question-bank/components/editor/QuestionEditor';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/utils/api';

/**
 * Question Creation Page
 * 
 * This page handles question creation for a specific question bank.
 * It extracts the bankId from the URL parameters and uses the QuestionEditor component.
 */
export default function CreateQuestionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const bankId = searchParams?.get('bankId');

  // Fetch question bank to verify it exists
  const { data: questionBank, isLoading: isLoadingBank, error: bankError } = api.questionBank.getQuestionBank.useQuery(
    { id: bankId || '' },
    {
      enabled: !!bankId,
      retry: 1,
      onError: (error) => {
        console.error('Error fetching question bank:', error);
        toast({
          title: 'Error',
          description: `Question bank not found: ${error.message}`,
          variant: 'error',
        });
        // Redirect to question bank list after a short delay
        setTimeout(() => {
          router.push('/admin/academic/question-bank');
        }, 2000);
      }
    }
  );

  // Redirect if no bankId is provided
  useEffect(() => {
    if (!bankId) {
      toast({
        title: 'Error',
        description: 'Question bank ID is required to create a question.',
        variant: 'error',
      });
      router.push('/admin/academic/question-bank');
    }
  }, [bankId, router, toast]);

  // Handle successful question creation
  const handleQuestionCreated = (question: any) => {
    toast({
      title: 'Success',
      description: 'Question created successfully.',
    });
    // Navigate back to the question bank detail page
    router.push(`/admin/academic/question-bank/${bankId}`);
  };

  // Handle cancel
  const handleCancel = () => {
    router.push(`/admin/academic/question-bank/${bankId}`);
  };

  // Show loading state
  if (!bankId || isLoadingBank) {
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
          <h1 className="text-3xl font-bold">Create Question</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">Loading question bank...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (bankError || !questionBank) {
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
          <h1 className="text-3xl font-bold">Create Question</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <p className="text-red-600">Question bank not found</p>
              <p className="text-muted-foreground">
                The question bank with ID "{bankId}" could not be found.
              </p>
              <Button asChild>
                <Link href="/admin/academic/question-bank">
                  Back to Question Banks
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
        >
          <Link href={`/admin/academic/question-bank/${bankId}`}>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Create Question</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>New Question</CardTitle>
          <CardDescription>
            Create a new question for "{questionBank.name}".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionEditor
            questionBankId={bankId}
            onSave={handleQuestionCreated}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>
    </div>
  );
}
