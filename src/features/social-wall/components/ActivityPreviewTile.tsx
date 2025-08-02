/**
 * Activity Preview Tile Component
 * Displays activity and assessment previews in social wall posts
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  Target,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
  FileText
} from 'lucide-react';
import { PlayCircle } from './icons/social-wall-icons';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserType } from '@prisma/client';

interface ActivityPreviewTileProps {
  activity: {
    id: string;
    title: string;
    type: 'ACTIVITY' | 'ASSESSMENT';
    description?: string;
    dueDate?: Date;
    status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'DELETED' | 'ARCHIVED_CURRENT_YEAR' | 'ARCHIVED_PREVIOUS_YEAR' | 'ARCHIVED_HISTORICAL';
    subjectName?: string;
    topicName?: string;
    participantCount?: number;
    totalParticipants?: number;
    bloomsLevel?: string;
    estimatedDuration?: number; // in minutes
    maxScore?: number;
    averageScore?: number;
    completionRate?: number;
    subjectId?: string; // Add subjectId for proper routing
  };
  classId?: string; // Add classId for proper routing
  size?: 'sm' | 'md' | 'lg';
  showActions?: boolean;
  className?: string;
}

export function ActivityPreviewTile({
  activity,
  classId,
  size = 'md',
  showActions = true,
  className
}: ActivityPreviewTileProps) {
  const { data: session } = useSession();
  const Icon = activity.type === 'ACTIVITY' ? BookOpen : FileText;

  const getStatusColor = () => {
    switch (activity.status) {
      case 'ACTIVE': return 'bg-green-500';
      case 'INACTIVE': return 'bg-yellow-500';
      case 'ARCHIVED': return 'bg-blue-500';
      case 'DELETED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (activity.status) {
      case 'ACTIVE': return CheckCircle;
      case 'INACTIVE': return AlertCircle;
      case 'ARCHIVED': return CheckCircle;
      case 'DELETED': return AlertCircle;
      default: return AlertCircle;
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'p-3';
      case 'lg': return 'p-6';
      default: return 'p-4';
    }
  };

  const getActivityUrl = () => {
    const userType = session?.user?.userType as UserType;
    const isStudent = userType === UserType.STUDENT || userType === UserType.CAMPUS_STUDENT;

    if (isStudent && classId && activity.subjectId) {
      // For students, use the nested route structure: /student/class/[classId]/subjects/[subjectId]/activities/[activityId]
      return activity.type === 'ACTIVITY'
        ? `/student/class/${classId}/subjects/${activity.subjectId}/activities/${activity.id}`
        : `/student/class/${classId}/subjects/${activity.subjectId}/assessments/${activity.id}`;
    } else if (isStudent) {
      // Fallback to direct activity route if classId or subjectId is missing
      return activity.type === 'ACTIVITY'
        ? `/student/activities/${activity.id}`
        : `/student/assessments/${activity.id}`;
    } else {
      // For teachers, link to teacher portal activity pages
      return activity.type === 'ACTIVITY'
        ? `/teacher/activities/${activity.id}`
        : `/teacher/assessments/${activity.id}`;
    }
  };

  const getStartActivityUrl = () => {
    const userType = session?.user?.userType as UserType;
    const isStudent = userType === UserType.STUDENT || userType === UserType.CAMPUS_STUDENT;

    if (isStudent && classId && activity.subjectId) {
      // For students, use the nested route structure to start activities
      return activity.type === 'ACTIVITY'
        ? `/student/class/${classId}/subjects/${activity.subjectId}/activities/${activity.id}`
        : `/student/class/${classId}/subjects/${activity.subjectId}/assessments/${activity.id}`;
    } else if (isStudent) {
      // Fallback to direct activity route if classId or subjectId is missing
      return activity.type === 'ACTIVITY'
        ? `/student/activities/${activity.id}`
        : `/student/assessments/${activity.id}`;
    } else {
      // For teachers, link to teacher portal with start action
      return activity.type === 'ACTIVITY'
        ? `/teacher/activities/${activity.id}/start`
        : `/teacher/assessments/${activity.id}/start`;
    }
  };

  const StatusIcon = getStatusIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("w-full", className)}
    >
      <Card className="border-l-4 border-l-primary hover:shadow-md transition-all duration-200">
        <CardContent className={getSizeClasses()}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {activity.title}
                    </h3>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                    >
                      {activity.type.toLowerCase()}
                    </Badge>
                  </div>
                  {activity.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Status Indicator */}
              <div className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-full", getStatusColor())} />
                <StatusIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Due Date */}
              {activity.dueDate && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Due {formatDistanceToNow(new Date(activity.dueDate), { addSuffix: true })}
                  </span>
                </div>
              )}

              {/* Duration */}
              {activity.estimatedDuration && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {activity.estimatedDuration} min
                  </span>
                </div>
              )}

              {/* Participants */}
              {activity.participantCount !== undefined && activity.totalParticipants && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {activity.participantCount}/{activity.totalParticipants} students
                  </span>
                </div>
              )}

              {/* Bloom's Level */}
              {activity.bloomsLevel && (
                <div className="flex items-center gap-1">
                  <Target className="w-3 h-3 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {activity.bloomsLevel}
                  </span>
                </div>
              )}
            </div>

            {/* Progress Bar (for assessments with completion data) */}
            {activity.completionRate !== undefined && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Completion</span>
                  <span className="font-medium">{Math.round(activity.completionRate)}%</span>
                </div>
                <Progress value={activity.completionRate} className="h-2" />
              </div>
            )}

            {/* Score Information (for assessments) */}
            {activity.type === 'ASSESSMENT' && activity.averageScore !== undefined && activity.maxScore && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Average Score</span>
                <span className="font-medium">
                  {activity.averageScore.toFixed(1)}/{activity.maxScore}
                </span>
              </div>
            )}

            {/* Tags */}
            {(activity.subjectName || activity.topicName) && (
              <div className="flex flex-wrap gap-1">
                {activity.subjectName && (
                  <Badge variant="secondary" className="text-xs">
                    {activity.subjectName}
                  </Badge>
                )}
                {activity.topicName && (
                  <Badge variant="secondary" className="text-xs">
                    {activity.topicName}
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-2 pt-2 border-t">
                {(() => {
                  const userType = session?.user?.userType as UserType;
                  const isStudent = userType === UserType.STUDENT || userType === UserType.CAMPUS_STUDENT;

                  if (isStudent && activity.status === 'ACTIVE') {
                    // For students, prioritize "Start Activity" button
                    return (
                      <>
                        <Link href={getStartActivityUrl()} className="flex-1">
                          <Button
                            size="sm"
                            className="w-full flex items-center gap-2"
                          >
                            <PlayCircle className="w-3 h-3" />
                            Start Activity
                          </Button>
                        </Link>
                        <Link href={getActivityUrl()}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            Details
                          </Button>
                        </Link>
                      </>
                    );
                  } else {
                    // For teachers or inactive activities, show View Details
                    return (
                      <>
                        <Link href={getActivityUrl()} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full flex items-center gap-2"
                          >
                            <ArrowUpRight className="w-3 h-3" />
                            View Details
                          </Button>
                        </Link>

                        {activity.status === 'ACTIVE' && !isStudent && (
                          <Link href={getStartActivityUrl()}>
                            <Button
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <PlayCircle className="w-3 h-3" />
                              Preview
                            </Button>
                          </Link>
                        )}
                      </>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Multiple Activity Tiles Container
interface ActivityTilesContainerProps {
  activities: ActivityPreviewTileProps['activity'][];
  classId?: string;
  maxDisplay?: number;
  className?: string;
}

export function ActivityTilesContainer({
  activities,
  classId,
  maxDisplay = 3,
  className
}: ActivityTilesContainerProps) {
  const displayedActivities = activities.slice(0, maxDisplay);
  const remainingCount = activities.length - maxDisplay;

  if (activities.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          Tagged Activities & Assessments ({activities.length})
        </span>
      </div>
      
      <div className="space-y-2">
        {displayedActivities.map((activity) => (
          <ActivityPreviewTile
            key={activity.id}
            activity={activity}
            classId={classId}
            size="sm"
            showActions={true}
          />
        ))}
        
        {remainingCount > 0 && (
          <div className="text-center py-2">
            <Button variant="ghost" size="sm" className="text-xs">
              +{remainingCount} more {remainingCount === 1 ? 'item' : 'items'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


