'use client';

import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/atoms/button';
import { Spinner } from '@/components/ui/atoms/spinner';
import { Badge } from '@/components/ui/atoms/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Clock, Edit, Eye, Trash } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ActivityConfigSummary, type ActivityConfiguration } from '@/features/activties/components/ui/StandardizedActivityConfig';

interface Activity {
  id: string;
  title: string;
  purpose: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  subject?: {
    name: string;
  };
  topic?: {
    title: string;
  };
  isGradable?: boolean;
  _count?: {
    activityGrades?: number;
  };
  [key: string]: any;
}

interface ActivityListProps {
  classId: string;
  activities: Activity[];
  isLoading: boolean;
  onDelete: (activityId: string) => void;
  onRefresh: () => void;
}

export function ActivityList({ classId, activities, isLoading, onDelete, onRefresh }: ActivityListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-center">
          <p className="mb-2 text-muted-foreground">No activities found</p>
          <Button onClick={onRefresh}>Refresh</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          classId={classId}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface ActivityCardProps {
  activity: Activity;
  classId: string;
  onDelete: (activityId: string) => void;
}

function ActivityCard({ activity, classId, onDelete }: ActivityCardProps) {
  // Convert activity to ActivityConfiguration format
  const activityConfig: ActivityConfiguration = {
    title: activity.title,
    description: activity.description || '',
    instructions: activity.instructions || '',
    subject: activity.subject?.name || 'No subject',
    topic: activity.topic?.title,
    bloomsLevel: activity.bloomsLevel || 'Remember',
    activityType: activity.activityType || 'Unknown',
    gradingType: activity.gradingType || 'manual',
    maxScore: activity.maxScore || 100,
    passingScore: activity.passingScore || 60,
    timeLimit: activity.timeLimit,
    maxAttempts: activity.maxAttempts || 1,
    dueDate: activity.dueDate ? new Date(activity.dueDate) : undefined,
    allowLateSubmissions: activity.allowLateSubmissions || false,
    allowFileUpload: activity.allowFileUpload || false,
    allowTextSubmission: activity.allowTextSubmission || true,
    showRubricToStudents: activity.showRubricToStudents || false,
    randomizeQuestions: activity.randomizeQuestions || false,
    isPublished: activity.status === 'published',
    rubricId: activity.rubricId,
    customSettings: activity.customSettings
  };

  return (
    <Card className="overflow-hidden hover:border-primary/50 transition-colors">
      <CardContent className="p-0">
        <ActivityConfigSummary
          configuration={activityConfig}
          className="border-0 rounded-none"
        />

        <div className="p-4 pt-2 border-t">
          <div className="flex items-center text-sm text-muted-foreground mb-2">
            <Calendar className="mr-1 h-4 w-4" />
            <span>Created {format(new Date(activity.createdAt), 'MMM d, yyyy')}</span>
          </div>

          {activity.isGradable && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Gradable
              </Badge>
              <span className="ml-2">
                {activity._count?.activityGrades || 0} submissions
              </span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/teacher/classes/${classId}/activities/${activity.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/teacher/classes/${classId}/activities/${activity.id}?edit=true`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will delete the activity "{activity.title}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(activity.id)}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}
