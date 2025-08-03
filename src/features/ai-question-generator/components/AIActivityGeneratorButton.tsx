'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/feedback/toast';
import { Loader2, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { Star } from '@/components/ui/icons-fix';
import { cn } from '@/lib/utils';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { api } from '@/trpc/react';

interface AIActivityGeneratorButtonProps {
  // Activity context
  activityType: string;
  activityTitle?: string;
  
  // Pre-filled context data
  selectedTopics?: string[];
  selectedLearningOutcomes?: string[];
  selectedBloomsLevel?: BloomsTaxonomyLevel;
  selectedActionVerbs?: string[];
  subject?: string;
  gradeLevel?: string;
  className?: string;
  
  // Callbacks
  onContentGenerated?: (content: any) => void;
  onError?: (error: string) => void;
}

const bloomsLevels: BloomsTaxonomyLevel[] = [
  BloomsTaxonomyLevel.REMEMBER,
  BloomsTaxonomyLevel.UNDERSTAND, 
  BloomsTaxonomyLevel.APPLY,
  BloomsTaxonomyLevel.ANALYZE,
  BloomsTaxonomyLevel.EVALUATE,
  BloomsTaxonomyLevel.CREATE
];

const difficultyLevels = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

const commonActionVerbs: Record<BloomsTaxonomyLevel, string[]> = {
  [BloomsTaxonomyLevel.REMEMBER]: ['define', 'list', 'recall', 'identify', 'name', 'state'],
  [BloomsTaxonomyLevel.UNDERSTAND]: ['explain', 'describe', 'interpret', 'summarize', 'classify', 'compare'],
  [BloomsTaxonomyLevel.APPLY]: ['solve', 'demonstrate', 'use', 'implement', 'execute', 'operate'],
  [BloomsTaxonomyLevel.ANALYZE]: ['analyze', 'examine', 'investigate', 'categorize', 'differentiate', 'deconstruct'],
  [BloomsTaxonomyLevel.EVALUATE]: ['evaluate', 'assess', 'critique', 'judge', 'justify', 'validate'],
  [BloomsTaxonomyLevel.CREATE]: ['create', 'design', 'develop', 'compose', 'construct', 'formulate']
};

const activityTypeLabels: Record<string, string> = {
  'multiple-choice': 'Multiple Choice Questions',
  'true-false': 'True/False Statements',
  'multiple-response': 'Multiple Response Questions',
  'fill-in-the-blanks': 'Fill in the Blanks Passages',
  'matching': 'Matching Sets',
  'sequence': 'Sequence Items',
  'drag-and-drop': 'Drag and Drop Items',
  'drag-the-words': 'Drag the Words Passages',
  'essay': 'Essay Prompts',
  'numeric': 'Numeric Problems',
  'flash-cards': 'Flash Cards',
  'reading': 'Reading Passages',
  'video': 'Video Activities',
  'quiz': 'Quiz Questions'
};

export function AIActivityGeneratorButton({
  activityType,
  activityTitle,
  selectedTopics = [],
  selectedLearningOutcomes = [],
  selectedBloomsLevel = BloomsTaxonomyLevel.UNDERSTAND,
  selectedActionVerbs = [],
  subject,
  gradeLevel,
  className,
  onContentGenerated,
  onError
}: AIActivityGeneratorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  // Form state
  const [topics, setTopics] = useState<string[]>(selectedTopics);
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(selectedLearningOutcomes);
  const [bloomsLevel, setBloomsLevel] = useState<BloomsTaxonomyLevel>(selectedBloomsLevel);
  const [actionVerbs, setActionVerbs] = useState<string[]>(selectedActionVerbs.length > 0 ? selectedActionVerbs : commonActionVerbs[selectedBloomsLevel]);
  const [itemCount, setItemCount] = useState(5);
  const [difficultyLevel, setDifficultyLevel] = useState('medium');
  const [customPrompt, setCustomPrompt] = useState('');

  // Input states for adding new items
  const [newTopic, setNewTopic] = useState('');
  const [newLearningOutcome, setNewLearningOutcome] = useState('');
  const [newActionVerb, setNewActionVerb] = useState('');

  // tRPC mutation for generating activity content
  const generateContentMutation = api.aiQuestionGenerator.generateActivityContent.useMutation();

  // Update action verbs when Bloom's level changes
  const handleBloomsLevelChange = (level: BloomsTaxonomyLevel) => {
    setBloomsLevel(level);
    if (actionVerbs.length === 0) {
      setActionVerbs(commonActionVerbs[level]);
    }
  };

  // Add new items to arrays
  const addTopic = () => {
    if (newTopic.trim() && !topics.includes(newTopic.trim())) {
      setTopics([...topics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const addLearningOutcome = () => {
    if (newLearningOutcome.trim() && !learningOutcomes.includes(newLearningOutcome.trim())) {
      setLearningOutcomes([...learningOutcomes, newLearningOutcome.trim()]);
      setNewLearningOutcome('');
    }
  };

  const addActionVerb = () => {
    if (newActionVerb.trim() && !actionVerbs.includes(newActionVerb.trim())) {
      setActionVerbs([...actionVerbs, newActionVerb.trim()]);
      setNewActionVerb('');
    }
  };

  // Remove items from arrays
  const removeTopic = (topic: string) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const removeLearningOutcome = (outcome: string) => {
    setLearningOutcomes(learningOutcomes.filter(o => o !== outcome));
  };

  const removeActionVerb = (verb: string) => {
    setActionVerbs(actionVerbs.filter(v => v !== verb));
  };

  // Generate activity content
  const handleGenerateContent = async () => {
    setIsGenerating(true);

    try {
      // Basic validation
      if (topics.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'At least one topic is required',
          variant: 'error'
        });
        return;
      }

      if (learningOutcomes.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'At least one learning outcome is required',
          variant: 'error'
        });
        return;
      }

      if (actionVerbs.length === 0) {
        toast({
          title: 'Validation Error',
          description: 'At least one action verb is required',
          variant: 'error'
        });
        return;
      }

      const response = await generateContentMutation.mutateAsync({
        activityType,
        topics,
        learningOutcomes,
        bloomsLevel,
        actionVerbs,
        itemCount,
        difficultyLevel: difficultyLevel as any,
        subject,
        gradeLevel,
        customPrompt: customPrompt.trim() || undefined
      });

      toast({
        title: 'Content Generated',
        description: `Successfully generated ${response.metadata.totalGenerated} items in ${response.metadata.generationTime}ms`,
      });

      if (onContentGenerated) {
        onContentGenerated(response.content);
      }

      // Close the accordion after successful generation
      setIsOpen(false);

    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to generate content';
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'error'
      });

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const activityLabel = activityTypeLabels[activityType] || `${activityType} content`;

  return (
    <div className={cn('w-full', className)}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={isGenerating}
          >
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Generate {activityLabel} with AI
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                AI {activityLabel} Generator
              </CardTitle>
              <CardDescription>
                Generate {activityLabel.toLowerCase()} based on your topics, learning outcomes, and Bloom's taxonomy level
                {activityTitle && (
                  <span className="block mt-1 font-medium">For activity: {activityTitle}</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Topics */}
              <div className="space-y-2">
                <Label>Topics</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a topic..."
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTopic()}
                  />
                  <Button onClick={addTopic} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {topics.map((topic) => (
                    <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                      {topic}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTopic(topic)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Learning Outcomes */}
              <div className="space-y-2">
                <Label>Learning Outcomes</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a learning outcome..."
                    value={newLearningOutcome}
                    onChange={(e) => setNewLearningOutcome(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addLearningOutcome()}
                  />
                  <Button onClick={addLearningOutcome} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {learningOutcomes.map((outcome) => (
                    <Badge key={outcome} variant="secondary" className="flex items-center gap-1">
                      {outcome}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeLearningOutcome(outcome)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Bloom's Taxonomy Level */}
              <div className="space-y-2">
                <Label>Bloom's Taxonomy Level</Label>
                <Select value={bloomsLevel} onValueChange={handleBloomsLevelChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {bloomsLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Verbs */}
              <div className="space-y-2">
                <Label>Action Verbs</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an action verb..."
                    value={newActionVerb}
                    onChange={(e) => setNewActionVerb(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addActionVerb()}
                  />
                  <Button onClick={addActionVerb} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {actionVerbs.map((verb) => (
                    <Badge key={verb} variant="secondary" className="flex items-center gap-1">
                      {verb}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeActionVerb(verb)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Generation Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Items</Label>
                  <Input
                    type="number"
                    min="1"
                    max="20"
                    value={itemCount}
                    onChange={(e) => setItemCount(parseInt(e.target.value) || 1)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficultyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <Label>Custom Instructions (Optional)</Label>
                <Textarea
                  placeholder="Add any specific instructions for content generation..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateContent}
                disabled={isGenerating || topics.length === 0 || learningOutcomes.length === 0}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 mr-2" />
                    Generate {itemCount} {activityLabel}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
