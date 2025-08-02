'use client';

import React, { useState, useEffect } from 'react';
import { BloomsTaxonomyLevel } from '@prisma/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, GraduationCap, Info } from 'lucide-react';
import { api } from '@/trpc/react';

// Bloom's level metadata with colors and action verbs
const BLOOMS_METADATA = {
  [BloomsTaxonomyLevel.REMEMBER]: {
    name: 'Remember',
    color: '#ef4444',
    description: 'Recall facts and basic concepts',
    actionVerbs: ['define', 'list', 'recall', 'identify', 'name', 'state'],
    icon: '🧠'
  },
  [BloomsTaxonomyLevel.UNDERSTAND]: {
    name: 'Understand',
    color: '#f97316',
    description: 'Explain ideas or concepts',
    actionVerbs: ['explain', 'describe', 'summarize', 'interpret', 'classify'],
    icon: '💡'
  },
  [BloomsTaxonomyLevel.APPLY]: {
    name: 'Apply',
    color: '#eab308',
    description: 'Use information in new situations',
    actionVerbs: ['apply', 'demonstrate', 'solve', 'use', 'implement'],
    icon: '⚡'
  },
  [BloomsTaxonomyLevel.ANALYZE]: {
    name: 'Analyze',
    color: '#22c55e',
    description: 'Draw connections among ideas',
    actionVerbs: ['analyze', 'compare', 'contrast', 'examine', 'categorize'],
    icon: '🔍'
  },
  [BloomsTaxonomyLevel.EVALUATE]: {
    name: 'Evaluate',
    color: '#3b82f6',
    description: 'Justify a stand or decision',
    actionVerbs: ['evaluate', 'judge', 'critique', 'assess', 'defend'],
    icon: '⚖️'
  },
  [BloomsTaxonomyLevel.CREATE]: {
    name: 'Create',
    color: '#8b5cf6',
    description: 'Produce new or original work',
    actionVerbs: ['create', 'design', 'compose', 'construct', 'develop'],
    icon: '🎨'
  }
};

interface BloomsTaxonomySelectorProps {
  selectedLevel?: BloomsTaxonomyLevel;
  selectedTopicId?: string;
  selectedLearningOutcomes?: string[];
  onLevelChange: (level?: BloomsTaxonomyLevel) => void;
  onLearningOutcomesChange: (outcomes: string[]) => void;
  onActionVerbsChange: (verbs: string[]) => void;
  className?: string;
}

export function BloomsTaxonomySelector({
  selectedLevel,
  selectedTopicId,
  selectedLearningOutcomes = [],
  onLevelChange,
  onLearningOutcomesChange,
  onActionVerbsChange,
  className = ''
}: BloomsTaxonomySelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedActionVerbs, setSelectedActionVerbs] = useState<string[]>([]);

  // Get learning outcomes for the topic
  const { data: learningOutcomes } = api.learningOutcome.getByTopic.useQuery(
    { topicId: selectedTopicId! },
    { enabled: !!selectedTopicId }
  );

  // Update action verbs when level changes
  useEffect(() => {
    if (selectedLevel) {
      const metadata = BLOOMS_METADATA[selectedLevel];
      setSelectedActionVerbs([]);
      onActionVerbsChange([]);
    }
  }, [selectedLevel, onActionVerbsChange]);

  const handleLevelSelect = (level: BloomsTaxonomyLevel) => {
    if (selectedLevel === level) {
      // Deselect if clicking the same level
      onLevelChange(undefined);
      setSelectedActionVerbs([]);
      onActionVerbsChange([]);
    } else {
      onLevelChange(level);
    }
  };

  const handleActionVerbClick = (verb: string) => {
    const newVerbs = selectedActionVerbs.includes(verb)
      ? selectedActionVerbs.filter(v => v !== verb)
      : [...selectedActionVerbs, verb];
    
    setSelectedActionVerbs(newVerbs);
    onActionVerbsChange(newVerbs);
  };

  const handleLearningOutcomeToggle = (outcomeId: string) => {
    const newOutcomes = selectedLearningOutcomes.includes(outcomeId)
      ? selectedLearningOutcomes.filter(id => id !== outcomeId)
      : [...selectedLearningOutcomes, outcomeId];
    
    onLearningOutcomesChange(newOutcomes);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Compact Level Selector */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          <GraduationCap className="inline w-4 h-4 mr-1" />
          Cognitive Level (Optional)
        </label>
        
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(BLOOMS_METADATA).map(([level, metadata]) => (
            <Button
              key={level}
              type="button"
              variant={selectedLevel === level ? "default" : "outline"}
              size="sm"
              onClick={() => handleLevelSelect(level as BloomsTaxonomyLevel)}
              className={`h-auto p-2 text-left justify-start ${
                selectedLevel === level 
                  ? 'border-2' 
                  : 'hover:border-gray-300'
              }`}
              style={{
                borderColor: selectedLevel === level ? metadata.color : undefined,
                backgroundColor: selectedLevel === level ? `${metadata.color}10` : undefined
              }}
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">{metadata.icon}</span>
                <div>
                  <div className="font-medium text-xs" style={{ color: metadata.color }}>
                    {metadata.name}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Expandable Advanced Options */}
      {selectedLevel && (
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between p-2">
              <span className="text-sm text-gray-600">
                <Info className="inline w-4 h-4 mr-1" />
                Advanced Options
              </span>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3">
            <Card className="border-gray-200">
              <CardContent className="p-3 space-y-3">
                {/* Action Verbs */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">
                    Suggested Action Verbs
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {BLOOMS_METADATA[selectedLevel].actionVerbs.map((verb) => (
                      <button
                        key={verb}
                        type="button"
                        onClick={() => handleActionVerbClick(verb)}
                        className={`px-2 py-1 text-xs rounded-md border cursor-pointer transition-colors ${
                          selectedActionVerbs.includes(verb)
                            ? 'text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        style={{
                          backgroundColor: selectedActionVerbs.includes(verb)
                            ? BLOOMS_METADATA[selectedLevel].color
                            : undefined,
                          borderColor: BLOOMS_METADATA[selectedLevel].color
                        }}
                      >
                        {verb}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Learning Outcomes */}
                {learningOutcomes && learningOutcomes.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-2 block">
                      Related Learning Outcomes
                    </label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {learningOutcomes
                        .filter(outcome => outcome.bloomsLevel === selectedLevel)
                        .map((outcome) => (
                          <label key={outcome.id} className="flex items-start space-x-2 text-xs">
                            <input
                              type="checkbox"
                              checked={selectedLearningOutcomes.includes(outcome.id)}
                              onChange={() => handleLearningOutcomeToggle(outcome.id)}
                              className="mt-0.5"
                            />
                            <span className="flex-1 text-gray-700">{outcome.statement}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Selected Level Summary */}
      {selectedLevel && (
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <strong style={{ color: BLOOMS_METADATA[selectedLevel].color }}>
            {BLOOMS_METADATA[selectedLevel].name}:
          </strong>{' '}
          {BLOOMS_METADATA[selectedLevel].description}
        </div>
      )}
    </div>
  );
}
