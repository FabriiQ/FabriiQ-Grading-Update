'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Check,
  Eye,
  X,
  Award,
  List,
  Plus,
  AlertCircle,
  Calculator,
  FileText,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/trpc/react';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { LearningOutcomeCriteriaEditor } from '@/features/bloom/components/learning-outcomes/LearningOutcomeCriteriaEditor';
import {
  LearningOutcomeCriterion,
  LearningOutcomePerformanceLevel,
  BloomsTaxonomyLevel as BloomsLevel,
  RubricType
} from '@/features/bloom/types';

// Type for the rubric criteria returned by the API
interface RubricCriteriaItem {
  id: string;
  rubric: {
    id: string;
    title: string;
  };
  criteriaLevels: Array<{
    performanceLevel: {
      description: string | null;
      name: string;
      id: string;
      createdAt: Date;
      updatedAt: Date;
      maxScore: number;
      rubricId: string;
      minScore: number;
      color: string | null;
    };
  }>;
}

interface Rubric {
  id: string;
  name: string;
  title?: string;
  description?: string | null;
  bloomsLevel?: BloomsTaxonomyLevel | null;
  subjectId: string;
  topicId?: string | null;
  _count?: {
    criteria?: number;
    assessments?: number;
  };
  criteria?: {
    id: string;
    name: string;
    description?: string | null;
    bloomsLevel?: BloomsTaxonomyLevel | null;
  }[];
}

interface RubricSelectorProps {
  subjectId: string;
  topicId: string;
  selectedRubricId: string;
  selectedLearningOutcomes: string[];
  onSelect: (rubricId: string) => void;
  isLoading: boolean;
}

const BLOOMS_COLORS = {
  [BloomsTaxonomyLevel.REMEMBER]: 'bg-red-100 text-red-800 border-red-200',
  [BloomsTaxonomyLevel.UNDERSTAND]: 'bg-orange-100 text-orange-800 border-orange-200',
  [BloomsTaxonomyLevel.APPLY]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [BloomsTaxonomyLevel.ANALYZE]: 'bg-green-100 text-green-800 border-green-200',
  [BloomsTaxonomyLevel.EVALUATE]: 'bg-blue-100 text-blue-800 border-blue-200',
  [BloomsTaxonomyLevel.CREATE]: 'bg-purple-100 text-purple-800 border-purple-200',
};

export function RubricSelector({
  subjectId,
  topicId,
  selectedRubricId,
  selectedLearningOutcomes,
  onSelect,
  isLoading
}: RubricSelectorProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [createRubricOpen, setCreateRubricOpen] = useState(false);
  const [criteriaSearch, setCriteriaSearch] = useState('');

  // State for comprehensive rubric creation
  const [rubricTitle, setRubricTitle] = useState('');
  const [rubricDescription, setRubricDescription] = useState('');
  const [rubricType, setRubricType] = useState<RubricType>(RubricType.ANALYTIC);
  const [maxScore, setMaxScore] = useState(100);
  const [hasCriteria, setHasCriteria] = useState(true);
  const [criteria, setCriteria] = useState<LearningOutcomeCriterion[]>([]);
  const [performanceLevels, setPerformanceLevels] = useState<LearningOutcomePerformanceLevel[]>([]);
  const [selectedExistingCriteria, setSelectedExistingCriteria] = useState<string[]>([]);

  // Fetch rubrics for this subject/topic - optimized with proper conditions
  const { data: rubricCriteria, isLoading: isLoadingRubrics, refetch } = api.rubric.getCriteriaByTopic.useQuery(
    { topicId },
    {
      enabled: !!topicId && !!subjectId,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      cacheTime: 10 * 60 * 1000, // 10 minutes cache
    }
  );

  // Fetch reusable criteria with search functionality - optimized
  const { data: reusableCriteriaData } = api.rubric.getReusableCriteria.useQuery(
    {
      topicId,
      learningOutcomeIds: selectedLearningOutcomes,
      search: criteriaSearch || undefined,
      limit: 50
    },
    {
      enabled: !!topicId || selectedLearningOutcomes.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );

  // Fetch learning outcome details only when needed - optimized
  const { data: learningOutcomesData } = api.learningOutcome.getByIds.useQuery(
    { ids: selectedLearningOutcomes },
    {
      enabled: selectedLearningOutcomes.length > 0,
      staleTime: 5 * 60 * 1000, // 5 minutes cache
    }
  );

  // Create rubric mutation
  const createRubricMutation = api.rubric.create.useMutation({
    onSuccess: (data) => {
      // Select the newly created rubric
      onSelect(data.id);
      // Refetch rubrics to show the new one
      refetch();
      // Close dialog and reset form
      setCreateRubricOpen(false);
      resetRubricForm();
    },
    onError: (error) => {
      console.error('Failed to create rubric:', error);
    }
  });

  // Reset rubric form
  const resetRubricForm = () => {
    setRubricTitle('');
    setRubricDescription('');
    setRubricType(RubricType.ANALYTIC);
    setMaxScore(100);
    setHasCriteria(true);
    setCriteria([]);
    setPerformanceLevels([]);
    setSelectedExistingCriteria([]);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold mb-2">Choose Grading Method</h3>
        <p className="text-muted-foreground">
          Select between simple scoring or detailed rubric-based grading for this assessment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Simple Scoring Option */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            !selectedRubricId ? 'ring-2 ring-primary' : 'hover:border-primary/50'
          }`}
          onClick={() => onSelect('')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Simple Scoring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use a simple point-based scoring system. Quick and straightforward for basic assessments.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Easy to set up</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Quick grading</span>
            </div>
          </CardContent>
        </Card>

        {/* Rubric-Based Grading Option */}
        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedRubricId ? 'ring-2 ring-primary' : 'hover:border-primary/50'
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rubric-Based Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Use detailed rubrics with criteria and performance levels for comprehensive assessment.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Detailed feedback</span>
            </div>
            <div className="flex items-center gap-2 text-sm mt-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Consistent grading</span>
            </div>

            <div className="mt-4 space-y-2">
              {/* Existing Rubrics */}
              {rubrics && rubrics.length > 0 && (
                <div>
                  <Label className="text-xs font-medium">Select Existing Rubric:</Label>
                  <Select value={selectedRubricId || ''} onValueChange={onSelect}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a rubric..." />
                    </SelectTrigger>
                    <SelectContent>
                      {rubrics.map((rubric) => (
                        <SelectItem key={rubric.id} value={rubric.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{rubric.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {rubric.criteria?.length || 0} criteria • Max: {rubric.maxScore} pts
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Create New Rubric Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setCreateRubricOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Rubric
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Rubric Dialog */}
      <Dialog open={createRubricOpen} onOpenChange={setCreateRubricOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Rubric</DialogTitle>
            <DialogDescription>
              Create a detailed rubric for comprehensive assessment grading.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Rubric Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rubric-title">Rubric Title *</Label>
                <Input
                  id="rubric-title"
                  value={rubricTitle}
                  onChange={(e) => setRubricTitle(e.target.value)}
                  placeholder="Enter rubric title..."
                />
              </div>
              <div>
                <Label htmlFor="rubric-max-score">Max Score *</Label>
                <Input
                  id="rubric-max-score"
                  type="number"
                  min="1"
                  max="1000"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="rubric-description">Description</Label>
              <Textarea
                id="rubric-description"
                value={rubricDescription}
                onChange={(e) => setRubricDescription(e.target.value)}
                placeholder="Describe the purpose and scope of this rubric..."
                rows={3}
              />
            </div>

            {/* Rubric Type Selection */}
            <div>
              <Label>Rubric Type</Label>
              <Select value={rubricType} onValueChange={(value) => setRubricType(value as RubricType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={RubricType.ANALYTIC}>
                    <div className="flex flex-col">
                      <span>Analytic Rubric</span>
                      <span className="text-xs text-muted-foreground">
                        Separate scores for different criteria
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value={RubricType.HOLISTIC}>
                    <div className="flex flex-col">
                      <span>Holistic Rubric</span>
                      <span className="text-xs text-muted-foreground">
                        Single overall score
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateRubricOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Create the rubric with basic information
                createRubricMutation.mutate({
                  title: rubricTitle,
                  description: rubricDescription,
                  type: rubricType,
                  maxScore,
                  subjectId,
                  topicId,
                  learningOutcomeIds: selectedLearningOutcomes,
                  criteria: [], // Will be added later in rubric builder
                  performanceLevels: [], // Will be added later in rubric builder
                });
              }}
              disabled={!rubricTitle || maxScore <= 0 || createRubricMutation.isLoading}
            >
              {createRubricMutation.isLoading ? 'Creating...' : 'Create Rubric'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
