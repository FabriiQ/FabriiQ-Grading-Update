'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Medal, Award, TrendingUp, Users, BookOpen, Star } from 'lucide-react';
import { api } from '@/trpc/react';
import { useToast } from '@/components/ui/use-toast';

interface TeacherLeaderboardFullViewProps {
  campusId: string;
  campusName: string;
}

export function TeacherLeaderboardFullView({ campusId, campusName }: TeacherLeaderboardFullViewProps) {
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'term' | 'all'>('term');
  const [sortBy, setSortBy] = useState<'points' | 'activityCreation' | 'studentPerformance' | 'attendance' | 'feedback'>('points');

  // Fetch teacher leaderboard data
  const { data: leaderboardData, isLoading } = api.teacherLeaderboard.getTeacherLeaderboard.useQuery(
    {
      campusId,
      timeframe,
      sortBy,
      limit: 50,
    },
    {
      refetchOnWindowFocus: false,
      onError: (error) => {
        console.error('Error fetching teacher leaderboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to load teacher leaderboard data',
          variant: 'error',
        });
      }
    }
  );

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (position === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (position === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-sm font-medium">{position}</span>;
  };

  const getPositionBadgeColor = (position: number) => {
    if (position === 1) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (position === 2) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (position === 3) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (position <= 10) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-muted text-muted-foreground border-border';
  };

  const getSortByLabel = (sortBy: string) => {
    switch (sortBy) {
      case 'points': return 'Total Points';
      case 'activityCreation': return 'Activities Created';
      case 'studentPerformance': return 'Student Performance';
      case 'attendance': return 'Attendance Rate';
      case 'feedback': return 'Feedback Score';
      default: return 'Total Points';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Customize the leaderboard view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="term">This Term</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Sort By</label>
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Total Points</SelectItem>
                  <SelectItem value="activityCreation">Activities Created</SelectItem>
                  <SelectItem value="studentPerformance">Student Performance</SelectItem>
                  <SelectItem value="attendance">Attendance Rate</SelectItem>
                  <SelectItem value="feedback">Feedback Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Teacher Leaderboard - {campusName}
          </CardTitle>
          <CardDescription>
            Teachers ranked by {getSortByLabel(sortBy).toLowerCase()} for {timeframe === 'all' ? 'all time' : `the ${timeframe}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              ))}
            </div>
          ) : leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 ? (
            <div className="space-y-2">
              {leaderboardData.leaderboard.map((teacher, index) => (
                <div
                  key={teacher.teacherId}
                  className={`flex items-center gap-4 p-4 border rounded-lg transition-colors hover:bg-muted/50 ${
                    teacher.position <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent border-yellow-200' : ''
                  }`}
                >
                  {/* Position */}
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${getPositionBadgeColor(teacher.position)}`}>
                    {getPositionIcon(teacher.position)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={teacher.profileImage || undefined} alt={teacher.name} />
                    <AvatarFallback>
                      {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Teacher Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">{teacher.name}</h3>
                      {teacher.position <= 3 && (
                        <Badge variant="secondary" className="text-xs">
                          Top {teacher.position}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {teacher.classCount} classes
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {teacher.studentCount} students
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="text-right">
                    <div className="font-semibold text-lg">
                      {sortBy === 'points' && `${teacher.totalPoints} pts`}
                      {sortBy === 'activityCreation' && `${teacher.activitiesCreated}`}
                      {sortBy === 'studentPerformance' && `${teacher.avgStudentScore}%`}
                      {sortBy === 'attendance' && `${teacher.attendanceRate}%`}
                      {sortBy === 'feedback' && (
                        <span className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          {teacher.feedbackScore}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {teacher.rankChange > 0 && (
                        <span className="text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          +{teacher.rankChange}
                        </span>
                      )}
                      {teacher.rankChange < 0 && (
                        <span className="text-red-600">
                          {teacher.rankChange}
                        </span>
                      )}
                      {teacher.rankChange === 0 && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Teacher Data Available</h3>
              <p className="text-muted-foreground">
                Teacher performance data will appear here once activities and assessments are completed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
