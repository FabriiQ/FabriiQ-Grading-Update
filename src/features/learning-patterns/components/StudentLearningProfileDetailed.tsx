'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { api } from '@/trpc/react';
import {
  Eye,
  BookOpen,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Users,
  User,
  Target,
  Lightbulb
} from 'lucide-react';
import { Volume2, MousePointer } from '@/components/ui/icons-fix';

interface StudentLearningProfileDetailedProps {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  profile: any; // Learning pattern profile data
}

export function StudentLearningProfileDetailed({
  studentId,
  studentName,
  classId,
  className,
  profile
}: StudentLearningProfileDetailedProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Get adaptive content recommendations
  const { data: adaptiveContent, isLoading: contentLoading, refetch: refetchContent } = 
    api.learningPatterns.generateAdaptiveContent.useQuery({
      studentId,
      subject: 'mathematics',
      currentTopic: 'algebra'
    });

  // Get performance predictions
  const { data: performancePrediction, isLoading: predictionLoading } = 
    api.learningPatterns.predictPerformance.useQuery({
      studentId,
      activityType: 'multiple_choice',
      bloomsLevel: 'APPLY',
      difficulty: 5
    });

  const learningStyleIcons = {
    visual: Eye,
    auditory: Volume2,
    kinesthetic: MousePointer,
    reading_writing: BookOpen
  };

  const LearningStyleIcon = learningStyleIcons[profile.learningStyle?.primary] || Eye;

  return (
    <div className="space-y-6">
      {/* Student Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LearningStyleIcon className="h-8 w-8 text-primary" />
              <div>
                <h2 className="text-xl">{studentName}</h2>
                <p className="text-sm text-muted-foreground">{className}</p>
              </div>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <span>Primary Learning Style:</span>
              <span className="capitalize font-medium">
                {profile.learningStyle?.primary || 'Unknown'}
              </span>
            </Badge>
          </CardTitle>
          <CardDescription>
            Learning profile confidence: {Math.round((profile.learningStyle?.confidence || 0) * 100)}%
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="patterns">Learning Patterns</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Learning Style Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LearningStyleIcon className="h-5 w-5" />
                  Learning Style Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Primary Style Confidence</span>
                    <span className="font-medium">
                      {Math.round((profile.learningStyle?.confidence || 0) * 100)}%
                    </span>
                  </div>
                  <Progress value={(profile.learningStyle?.confidence || 0) * 100} className="h-2" />
                </div>
                
                {profile.learningStyle?.secondary && (
                  <div>
                    <span className="text-sm text-muted-foreground">Secondary Style:</span>
                    <div className="font-medium capitalize">{profile.learningStyle.secondary}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Consistency Score</span>
                    <span className="font-medium">
                      {Math.round(profile.performancePatterns?.consistencyScore || 0)}%
                    </span>
                  </div>
                  <Progress value={profile.performancePatterns?.consistencyScore || 0} className="h-2" />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Trend:</span>
                    <div className="font-medium capitalize">
                      {profile.performancePatterns?.improvementTrend || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Peak Time:</span>
                    <div className="font-medium capitalize">
                      {profile.performancePatterns?.peakPerformanceTime || 'Unknown'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Factors and Strengths */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Factors */}
            {profile.riskFactors && profile.riskFactors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {profile.riskFactors.map((risk: any, index: number) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{risk.factor}</span>
                          <Badge variant={risk.severity === 'high' ? 'destructive' : 'secondary'}>
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{risk.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Strengths */}
            {profile.strengths && profile.strengths.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {profile.strengths.map((strength: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-sm">
                        {strength}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cognitive Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Cognitive Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Processing Speed:</span>
                    <div className="font-medium capitalize">
                      {profile.cognitivePreferences?.processingSpeed || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Complexity:</span>
                    <div className="font-medium capitalize">
                      {profile.cognitivePreferences?.complexityPreference || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Feedback:</span>
                    <div className="font-medium capitalize">
                      {profile.cognitivePreferences?.feedbackSensitivity || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Collaboration:</span>
                    <div className="font-medium capitalize">
                      {profile.cognitivePreferences?.collaborationPreference?.replace('_', ' ') || 'Unknown'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Patterns */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Patterns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Attention Span:</span>
                    <div className="font-medium capitalize">
                      {profile.engagementPatterns?.attentionSpan || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Help Seeking:</span>
                    <div className="font-medium capitalize">
                      {profile.engagementPatterns?.helpSeekingBehavior || 'Unknown'}
                    </div>
                  </div>
                </div>
                
                {profile.engagementPatterns?.motivationTriggers && (
                  <div>
                    <span className="text-muted-foreground text-sm">Motivation Triggers:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profile.engagementPatterns.motivationTriggers.map((trigger: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {trigger}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance Prediction */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Prediction
              </CardTitle>
              <CardDescription>
                Predicted performance for upcoming activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {predictionLoading ? (
                <p className="text-muted-foreground">Loading prediction...</p>
              ) : performancePrediction ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Predicted Score</span>
                      <span className="font-medium">
                        {Math.round(performancePrediction.predictedScore)}%
                      </span>
                    </div>
                    <Progress value={performancePrediction.predictedScore} className="h-2" />
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-muted-foreground">Confidence Level:</span>
                    <span className="font-medium ml-2">
                      {Math.round(performancePrediction.confidence * 100)}%
                    </span>
                  </div>
                  
                  {performancePrediction.recommendations && (
                    <div>
                      <span className="text-sm font-medium">Recommendations:</span>
                      <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                        {performancePrediction.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-primary">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">No prediction data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* Adaptive Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Adaptive Content Recommendations
              </CardTitle>
              <CardDescription>
                Personalized learning recommendations based on learning patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {contentLoading ? (
                <p className="text-muted-foreground">Loading recommendations...</p>
              ) : adaptiveContent ? (
                <div className="space-y-6">
                  {/* Recommended Activities */}
                  <div>
                    <h4 className="font-medium mb-3">Recommended Activities</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {adaptiveContent.recommendedActivities.map((activity: any, index: number) => (
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

                  {/* Pacing and Assessment */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-1">Recommended Pacing</h4>
                      <p className="text-sm">
                        <span className="font-medium capitalize">{adaptiveContent.pacing.recommended}</span> pace
                      </p>
                      <p className="text-xs text-muted-foreground">{adaptiveContent.pacing.rationale}</p>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="font-medium mb-1">Assessment Strategy</h4>
                      <p className="text-sm">
                        <span className="font-medium capitalize">{adaptiveContent.assessmentStrategy.type}</span> assessment
                      </p>
                      {adaptiveContent.assessmentStrategy.frequency && (
                        <p className="text-xs text-muted-foreground">{adaptiveContent.assessmentStrategy.frequency}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-4">No recommendations available</p>
                  <Button onClick={() => refetchContent()}>
                    Generate Recommendations
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-6">
          {/* Intervention Strategies */}
          <Card>
            <CardHeader>
              <CardTitle>Intervention Strategies</CardTitle>
              <CardDescription>
                Recommended interventions based on risk factors and learning patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile.riskFactors && profile.riskFactors.length > 0 ? (
                <div className="space-y-4">
                  {profile.riskFactors.map((risk: any, index: number) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{risk.factor}</h4>
                        <Badge variant={risk.severity === 'high' ? 'destructive' : 'secondary'}>
                          {risk.severity} risk
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{risk.description}</p>
                      
                      <div>
                        <h5 className="font-medium text-sm mb-2">Recommended Interventions:</h5>
                        <ul className="text-sm space-y-1">
                          {risk.interventions.map((intervention: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{intervention}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No specific interventions needed at this time. Student is performing well.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
