'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, GraduationCap, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/atoms/button';
import { Badge } from '@/components/ui/atoms/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/data-display/card';
import { api } from '@/trpc/react';
import { BloomsDistributionChart } from '@/features/bloom/components/taxonomy/BloomsDistributionChart';
import { BloomsDistribution, BloomsTaxonomyLevel } from '@/features/bloom/types';
import { ThemeWrapper } from '@/features/activties/components/ui/ThemeWrapper';
import { useRouter } from 'next/navigation';
import { constructLearningOutcomesUrl } from '@/utils/admin-navigation';

// Define the topic type based on the database schema
type Topic = {
  id: string;
  code: string;
  title: string;
  description?: string;
  nodeType: string;
  orderIndex: number;
  subjectId: string;
  parentTopicId?: string | null;
  status: string;
  childTopics?: Topic[];
  _count?: {
    activities: number;
    assessments: number;
    childTopics: number;
  };
};

interface TopicNodeProps {
  topic: Topic;
  level: number;
  subjectId: string;
  classId: string;
}

const TopicNode: React.FC<TopicNodeProps> = ({ topic, level, subjectId, classId }) => {
  // Default to collapsed state for all levels
  const [expanded, setExpanded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const hasChildren = topic.childTopics && topic.childTopics.length > 0;
  const router = useRouter();

  // Fetch topic details when dialog is opened
  const { data: topicDetails, isLoading } = api.subjectTopic.get.useQuery(
    { id: topic.id },
    { enabled: dialogOpen }
  );

  // Fetch learning outcomes for this topic
  const { data: learningOutcomes } = api.learningOutcome.getByTopic.useQuery(
    { topicId: topic.id },
    { enabled: dialogOpen }
  );

  // Fetch rubric criteria for this topic
  const { data: rubricCriteria } = api.rubric.getCriteriaByTopic.useQuery(
    { topicId: topic.id },
    { enabled: dialogOpen }
  );

  // Navigate to learning outcomes page for this topic
  const handleNavigateToLearningOutcomes = () => {
    // Check if we're in teacher portal context
    const currentPath = window.location.pathname;
    if (currentPath.includes('/teacher/classes/')) {
      // For teacher portal, we don't have a separate learning outcomes page
      // Instead, we'll show the learning outcomes in the dialog
      setDialogOpen(true);
      // After dialog opens, switch to outcomes tab
      setTimeout(() => {
        const outcomesTab = document.querySelector('[value="outcomes"]') as HTMLElement;
        if (outcomesTab) {
          outcomesTab.click();
        }
      }, 100);
    } else {
      // For admin contexts, use the existing navigation
      const url = constructLearningOutcomesUrl(subjectId, topic.id, currentPath);
      router.push(url);
    }
  };

  const getNodeTypeColor = (nodeType: string) => {
    switch (nodeType) {
      case 'CHAPTER':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'TOPIC':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'SUBTOPIC':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="mb-2">
      <div
        className={cn(
          "flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
          level === 0 ? "bg-gray-50 dark:bg-gray-900" : ""
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className="p-1 mr-1"
          onClick={() => setExpanded(!expanded)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="w-4" />
          )}
        </Button>

        <div className="flex-1 flex items-center">
          <span className="font-medium">{topic.title}</span>
          <Badge className={cn("ml-2 text-xs", getNodeTypeColor(topic.nodeType))}>
            {topic.nodeType}
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          {/* Learning Outcomes button */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={handleNavigateToLearningOutcomes}
            title="View learning outcomes and topic details"
          >
            <GraduationCap className="h-4 w-4 text-primary-green" />
          </Button>

          {/* Info button for topic details */}
          <Button
            variant="ghost"
            size="sm"
            className="p-1"
            onClick={() => setDialogOpen(true)}
            title="View comprehensive topic information"
          >
            <Info className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className={cn("pl-6 border-l ml-3 mt-1")}>
          {topic.childTopics?.map((childTopic) => (
            <TopicNode
              key={childTopic.id}
              topic={childTopic}
              level={level + 1}
              subjectId={subjectId}
              classId={classId}
            />
          ))}
        </div>
      )}

      {/* Topic Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{topic.title}</span>
              <Badge className={cn("ml-2", getNodeTypeColor(topic.nodeType))}>
                {topic.nodeType}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Topic Code: {topic.code}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="py-8 text-center">Loading topic details...</div>
          ) : topicDetails ? (
            <Tabs defaultValue="stats" className="mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="outcomes">Learning Outcomes</TabsTrigger>
                <TabsTrigger value="criteria">Rubric Criteria</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Topic Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="text-sm font-medium mb-2 dark:text-gray-300">Learning Outcomes</h3>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold text-primary-green dark:text-medium-teal">
                            {learningOutcomes?.length || 0}
                          </div>
                          <div className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                            {learningOutcomes?.length === 1 ? 'outcome' : 'outcomes'} defined
                          </div>
                        </div>
                      </div>

                      <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                        <h3 className="text-sm font-medium mb-2 dark:text-gray-300">Rubric Criteria</h3>
                        <div className="flex items-center">
                          <div className="text-2xl font-bold text-primary-green dark:text-medium-teal">
                            {rubricCriteria?.length || 0}
                          </div>
                          <div className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                            {rubricCriteria?.length === 1 ? 'criterion' : 'criteria'} defined
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Bloom's Taxonomy Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {topicDetails.bloomsDistribution ? (
                      <div className="h-64">
                        <ThemeWrapper>
                          <BloomsDistributionChart
                            distribution={topicDetails.bloomsDistribution as BloomsDistribution}
                            editable={false}
                            showLabels={true}
                            showPercentages={true}
                            variant="pie"
                          />
                        </ThemeWrapper>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        No Bloom's taxonomy distribution defined for this topic.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="overview" className="space-y-4">
                {topicDetails.description && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: topicDetails.description }} />
                    </CardContent>
                  </Card>
                )}

                {topicDetails.context && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Context</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: topicDetails.context }} />
                    </CardContent>
                  </Card>
                )}

                {topicDetails.learningOutcomesText && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Preliminary Learning Outcomes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-wrap dark:text-gray-300">{topicDetails.learningOutcomesText}</p>
                    </CardContent>
                  </Card>
                )}

                {!topicDetails.description && !topicDetails.context && !topicDetails.learningOutcomesText && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        No overview information available for this topic.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="outcomes" className="space-y-4">
                {learningOutcomes && learningOutcomes.length > 0 ? (
                  <div className="space-y-4">
                    {learningOutcomes.map((outcome: any, index: number) => (
                      <Card key={outcome.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-base">Learning Outcome {index + 1}</span>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="text-xs">
                                {outcome.bloomsLevel}
                              </Badge>
                              {outcome.actionVerb && (
                                <Badge variant="secondary" className="text-xs">
                                  {outcome.actionVerb}
                                </Badge>
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm dark:text-gray-300 mb-3">{outcome.statement}</p>

                          {outcome.description && (
                            <div className="mt-2">
                              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Description</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{outcome.description}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Difficulty Level</p>
                              <p className="text-sm font-medium dark:text-gray-300">{outcome.difficultyLevel || 'Not specified'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Assessment Method</p>
                              <p className="text-sm font-medium dark:text-gray-300">{outcome.assessmentMethod || 'Not specified'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        No learning outcomes defined for this topic yet.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="criteria" className="space-y-4">
                {rubricCriteria && rubricCriteria.length > 0 ? (
                  <div className="space-y-4">
                    {rubricCriteria.map((criterion: any, index: number) => (
                      <Card key={criterion.id}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span className="text-base">Criterion {index + 1}</span>
                            <div className="flex items-center space-x-2">
                              {criterion.bloomsLevel && (
                                <Badge variant="outline" className="text-xs">
                                  {criterion.bloomsLevel}
                                </Badge>
                              )}
                              <Badge variant="secondary" className="text-xs">
                                {criterion.maxPoints} pts
                              </Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <h4 className="font-medium text-sm mb-2 dark:text-gray-300">{criterion.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{criterion.description}</p>

                          {criterion.performanceLevels && criterion.performanceLevels.length > 0 && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Performance Levels</h5>
                              <div className="grid grid-cols-1 gap-2">
                                {criterion.performanceLevels.map((level: any, levelIndex: number) => (
                                  <div key={levelIndex} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                                    <div className="flex-1">
                                      <span className="font-medium text-sm dark:text-gray-300">{level.name}</span>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">{level.description}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-2">
                                      {level.points} pts
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {criterion.learningOutcome && (
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <p className="text-xs text-gray-500 dark:text-gray-400">Associated Learning Outcome</p>
                              <p className="text-sm dark:text-gray-300">{criterion.learningOutcome.statement}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                        No rubric criteria defined for this topic yet.
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Topic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Code</p>
                            <p className="font-medium dark:text-gray-300">{topicDetails.code}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                            <Badge className={cn("text-xs", getNodeTypeColor(topicDetails.nodeType))}>
                              {topicDetails.nodeType}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                            <Badge variant={topicDetails.status === 'ACTIVE' ? "success" : "secondary"}>
                              {topicDetails.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Order Index</p>
                            <p className="font-medium dark:text-gray-300">{topicDetails.orderIndex}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Learning Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Competency Level</p>
                          <p className="font-medium dark:text-gray-300">{topicDetails.competencyLevel || "Not specified"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Estimated Duration</p>
                          <p className="font-medium dark:text-gray-300">
                            {topicDetails.estimatedMinutes ? `${topicDetails.estimatedMinutes} minutes` : "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Prerequisites</p>
                          <p className="font-medium dark:text-gray-300">{(topicDetails as any).prerequisites || "None specified"}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {topicDetails.keywords && topicDetails.keywords.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {topicDetails.keywords.map((keyword: string, index: number) => (
                          <Badge key={index} variant="outline" className="dark:border-gray-600 dark:text-gray-300">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {(topicDetails as any).objectives && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Learning Objectives</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: (topicDetails as any).objectives }} />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="py-8 text-center">Failed to load topic details.</div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface SubjectTopicTreeReadonlyProps {
  topics: Topic[];
  subjectId: string;
  classId: string;
}

export function SubjectTopicTreeReadonly({ topics, subjectId, classId }: SubjectTopicTreeReadonlyProps) {
  return (
    <div className="space-y-2 transition-colors dark:text-gray-200">
      {topics.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No topics defined for this subject yet.
        </div>
      ) : (
        topics.map(topic => (
          <TopicNode
            key={topic.id}
            topic={topic}
            level={0}
            subjectId={subjectId}
            classId={classId}
          />
        ))
      )}
    </div>
  );
}
