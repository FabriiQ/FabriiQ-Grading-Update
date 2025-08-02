import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ClassLayout } from '../../../components/ClassLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Edit Assessment',
  description: 'Edit assessment details',
};

export default async function EditAssessmentPage({
  params
}: {
  params: Promise<{ id: string; assessmentId: string }>
}) {
  const { id: classId, assessmentId } = await params;
  
  return (
    <ClassLayout classId={classId} activeTab="assessments">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}`}>
            <Button size="sm" variant="ghost">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Assessment</h1>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Assessment Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Assessment editing functionality coming soon...</p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Class ID: {classId}</p>
                <p>Assessment ID: {assessmentId}</p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" disabled>
                  Save Changes
                </Button>
                <Button variant="ghost" asChild>
                  <Link href={`/admin/campus/classes/${classId}/assessments/${assessmentId}`}>
                    Cancel
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClassLayout>
  );
}