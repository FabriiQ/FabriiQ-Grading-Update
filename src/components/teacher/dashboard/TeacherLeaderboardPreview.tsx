'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Award, Medal as MedalIcon, Crown } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/use-toast';

interface TeacherLeaderboardPreviewProps {
  teacherId: string;
  campusId?: string;
}

export function TeacherLeaderboardPreview({ teacherId, campusId }: TeacherLeaderboardPreviewProps) {
  const { toast } = useToast();

  // Fetch teacher leaderboard data (top 5 teachers)
  const { data: leaderboardData, isLoading } = api.teacherLeaderboard.getTeacherLeaderboard.useQuery(
    {
      campusId,
      timeframe: 'term',
      limit: 5,
      sortBy: 'points'
    },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching teacher leaderboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to load leaderboard data',
          variant: 'error',
        });
      }
    }
  );

  // Find current teacher's position in the leaderboard
  const currentTeacherPosition = leaderboardData?.leaderboard?.find(
    teacher => teacher.teacherId === teacherId
  );

  // Get position icon
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Award className="h-4 w-4 text-gray-400" />;
      case 3:
        return <MedalIcon className="h-4 w-4 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{position}</span>;
    }
  };

  // Get position badge color
  const getPositionBadgeColor = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-100 text-yellow-800';
      case 2:
        return 'bg-gray-100 text-gray-800';
      case 3:
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Teacher Leaderboard
            </CardTitle>
            <CardDescription>Your ranking among campus teachers</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/teacher/leaderboard">
              View Full Leaderboard
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        ) : leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 ? (
          <div className="space-y-3">
            {/* Current teacher's position (if not in top 5) */}
            {currentTeacherPosition && currentTeacherPosition.position > 5 && (
              <>
                <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-md border">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getPositionBadgeColor(currentTeacherPosition.position)}`}>
                    {getPositionIcon(currentTeacherPosition.position)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-primary">You</div>
                    <div className="text-xs text-muted-foreground">
                      {currentTeacherPosition.classCount} classes
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {currentTeacherPosition.points} pts
                  </Badge>
                </div>
                <div className="border-t pt-2">
                  <p className="text-xs text-muted-foreground text-center mb-2">Top Teachers</p>
                </div>
              </>
            )}

            {/* Top teachers */}
            {leaderboardData.leaderboard.slice(0, 5).map((teacher, index) => {
              const isCurrentTeacher = teacher.teacherId === teacherId;
              
              return (
                <div 
                  key={teacher.teacherId} 
                  className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                    isCurrentTeacher ? 'bg-primary/5 border border-primary/20' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${getPositionBadgeColor(teacher.position)}`}>
                    {getPositionIcon(teacher.position)}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={teacher.avatar} alt={teacher.name} />
                    <AvatarFallback className="text-xs">
                      {teacher.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className={`font-medium ${isCurrentTeacher ? 'text-primary' : ''}`}>
                      {isCurrentTeacher ? 'You' : teacher.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {teacher.classCount} classes
                    </div>
                  </div>
                  <Badge variant={isCurrentTeacher ? 'default' : 'secondary'}>
                    {teacher.points} pts
                  </Badge>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No leaderboard data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
