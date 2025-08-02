'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/trpc/react';
import { Lightbulb, Target, Clock, BookOpen, Users, TrendingUp } from 'lucide-react';

interface AdaptiveRecommendationsProps {
  classId?: string;
  studentPatterns: Array<{
    studentId: string;
    studentName: string;
    patterns: any;
  }>;
}

export function AdaptiveRecommendations({ classId, studentPatterns }: AdaptiveRecommendationsProps) {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('mathematics');
  const [selectedTopic, setSelectedTopic] = useState<string>('algebra');

  // Fetch adaptive content for selected student
  const { data: adaptiveContent, isLoading, refetch } = 
    api.learningPatterns.generateAdaptiveContent.useQuery(
      {
        studentId: selectedStudentId,
        subject: selectedSubject,
        currentTopic: selectedTopic
      },
      { enabled: !!selectedStudentId }
    );

  // Generate class-wide recommendations
  const generateClassRecommendations = () => {
    if (!studentPatterns.length) return [];

    const recommendations: Array<{
      type: string;
      title: string;
      description: string;
      priority: string;
      icon: string;
    }> = [];

    // Analyze learning style distribution
    const learningStyles = studentPatterns.reduce((acc, student) => {
      const style = student.patterns.learningStyle?.primary;
      if (style) acc[style] = (acc[style] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantStyle = Object.entries(learningStyles).reduce((a, b) => 
      learningStyles[a[0]] > learningStyles[b[0]] ? a : b
    )[0];

    if (dominantStyle === 'visual') {
      recommendations.push({
        type: 'teaching_strategy',
        title: 'Increase Visual Content',
        description: 'Most students are visual learners. Include more diagrams, charts, and visual aids.',
        priority: 'high',
        icon: 'eye'
      });
    }

    // Analyze performance trends
    const decliningStudents = studentPatterns.filter(s => 
      s.patterns.performancePatterns?.improvementTrend === 'declining'
    ).length;

    if (decliningStudents > studentPatterns.length * 0.3) {
      recommendations.push({
        type: 'intervention',
        title: 'Performance Intervention Needed',
        description: `${decliningStudents} students showing declining performance. Consider review sessions.`,
        priority: 'high',
        icon: 'alert'
      });
    }

    // Analyze attention spans
    const shortAttentionStudents = studentPatterns.filter(s =>
      s.patterns.engagementPatterns?.attentionSpan === 'short'
    ).length;

    if (shortAttentionStudents > studentPatterns.length * 0.4) {
      recommendations.push({
        type: 'pacing',
        title: 'Break Down Content',
        description: 'Many students have short attention spans. Use shorter, more frequent activities.',
        priority: 'medium',
        icon: 'clock'
      });
    }

    return recommendations;
  };

  const classRecommendations = generateClassRecommendations();

  return (
    <div className="space-y-6">
      {/* Class-wide Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Class-wide Recommendations
          </CardTitle>
          <CardDescription>
            AI-generated recommendations based on class learning patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          {classRecommendations.length > 0 ? (
            <div className="space-y-4">
              {classRecommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {rec.icon === 'eye' && <Target className="h-5 w-5 text-blue-600" />}
                    {rec.icon === 'alert' && <TrendingUp className="h-5 w-5 text-red-600" />}
                    {rec.icon === 'clock' && <Clock className="h-5 w-5 text-yellow-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{rec.title}</h4>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No specific recommendations at this time.</p>
          )}
        </CardContent>
      </Card>

      {/* Individual Student Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Individual Student Recommendations
          </CardTitle>
          <CardDescription>
            Personalized content and activity recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student and Subject Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {studentPatterns.map((student) => (
                  <SelectItem key={student.studentId} value={student.studentId}>
                    {student.studentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="history">History</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="algebra">Algebra</SelectItem>
                <SelectItem value="geometry">Geometry</SelectItem>
                <SelectItem value="statistics">Statistics</SelectItem>
                <SelectItem value="calculus">Calculus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedStudentId && (
            <Button onClick={() => refetch()} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Recommendations'}
            </Button>
          )}

          {/* Adaptive Content Display */}
          {adaptiveContent && (
            <div className="space-y-4">
              {/* Recommended Activities */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Recommended Activities
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adaptiveContent.recommendedActivities.map((activity, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-sm">{activity.title}</h5>
                        <Badge variant="outline">{activity.bloomsLevel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{activity.rationale}</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Difficulty: {activity.difficulty}/10
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning Supports */}
              {adaptiveContent.learningSupports.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Learning Supports</h4>
                  <div className="flex flex-wrap gap-2">
                    {adaptiveContent.learningSupports.map((support, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {support}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Pacing Recommendation */}
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-1">Recommended Pacing</h4>
                <p className="text-sm">
                  <span className="font-medium capitalize">{adaptiveContent.pacing.recommended}</span> pace
                </p>
                <p className="text-xs text-muted-foreground">{adaptiveContent.pacing.rationale}</p>
              </div>

              {/* Assessment Strategy */}
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium mb-1">Assessment Strategy</h4>
                <p className="text-sm">
                  <span className="font-medium capitalize">{adaptiveContent.assessmentStrategy.type}</span> assessment
                  {adaptiveContent.assessmentStrategy.frequency && (
                    <span> - {adaptiveContent.assessmentStrategy.frequency}</span>
                  )}
                </p>
                {adaptiveContent.assessmentStrategy.adaptations.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground mb-1">Adaptations:</p>
                    <div className="flex flex-wrap gap-1">
                      {adaptiveContent.assessmentStrategy.adaptations.map((adaptation, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {adaptation}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
