'use client';

import React from 'react';
import { BloomsTaxonomyLevel } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertCircle, GraduationCap } from 'lucide-react';
import { Question } from '../../models/types';
import { 
  calculateBloomsDistributionFromQuestions, 
  analyzeBloomsDistribution,
  BloomsDistribution 
} from '../../utils/bloom-integration';

// Bloom's level metadata with colors
const BLOOMS_METADATA = {
  [BloomsTaxonomyLevel.REMEMBER]: {
    name: 'Remember',
    color: '#ef4444',
    icon: '🧠'
  },
  [BloomsTaxonomyLevel.UNDERSTAND]: {
    name: 'Understand',
    color: '#f97316',
    icon: '💡'
  },
  [BloomsTaxonomyLevel.APPLY]: {
    name: 'Apply',
    color: '#eab308',
    icon: '⚡'
  },
  [BloomsTaxonomyLevel.ANALYZE]: {
    name: 'Analyze',
    color: '#22c55e',
    icon: '🔍'
  },
  [BloomsTaxonomyLevel.EVALUATE]: {
    name: 'Evaluate',
    color: '#3b82f6',
    icon: '⚖️'
  },
  [BloomsTaxonomyLevel.CREATE]: {
    name: 'Create',
    color: '#8b5cf6',
    icon: '🎨'
  }
};

interface BloomsDistributionPreviewProps {
  questions: Question[];
  className?: string;
  showAnalysis?: boolean;
}

export function BloomsDistributionPreview({
  questions,
  className = '',
  showAnalysis = true
}: BloomsDistributionPreviewProps) {
  // Calculate distribution from questions
  const distribution = calculateBloomsDistributionFromQuestions(questions);
  const analysis = analyzeBloomsDistribution(distribution);

  // Count questions with and without Bloom's levels
  const questionsWithBloomsLevel = questions.filter(q => q.bloomsLevel).length;
  const questionsWithoutBloomsLevel = questions.length - questionsWithBloomsLevel;

  if (questions.length === 0) {
    return (
      <Card className={`border-dashed ${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <GraduationCap className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No questions selected</p>
          <p className="text-xs text-gray-400">Select questions to see Bloom's distribution</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Cognitive Level Distribution
          <Badge variant="outline" className="ml-auto">
            {questions.length} question{questions.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Distribution Bars */}
        <div className="space-y-2">
          {Object.entries(BLOOMS_METADATA).map(([level, metadata]) => {
            const percentage = distribution[level as BloomsTaxonomyLevel];
            return (
              <div key={level} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span>{metadata.icon}</span>
                    <span style={{ color: metadata.color }} className="font-medium">
                      {metadata.name}
                    </span>
                  </div>
                  <span className="text-gray-500">{percentage}%</span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-2"
                  style={{
                    '--progress-background': metadata.color,
                  } as React.CSSProperties}
                />
              </div>
            );
          })}
        </div>

        {/* Questions without Bloom's level warning */}
        {questionsWithoutBloomsLevel > 0 && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <div className="text-xs text-amber-700">
              <span className="font-medium">{questionsWithoutBloomsLevel}</span> question
              {questionsWithoutBloomsLevel !== 1 ? 's' : ''} without cognitive level assigned
            </div>
          </div>
        )}

        {/* Analysis */}
        {showAnalysis && questionsWithBloomsLevel > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="h-3 w-3" />
              <span className="font-medium">Analysis</span>
            </div>
            
            {/* Cognitive Complexity */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Cognitive Complexity:</span>
              <Badge 
                variant={analysis.cognitiveComplexity === 'high' ? 'default' : 
                        analysis.cognitiveComplexity === 'medium' ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {analysis.cognitiveComplexity}
              </Badge>
            </div>

            {/* Balance Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Distribution:</span>
              <Badge 
                variant={analysis.isBalanced ? 'default' : 'destructive'}
                className="text-xs"
              >
                {analysis.isBalanced ? 'Balanced' : 'Unbalanced'}
              </Badge>
            </div>

            {/* Dominant Level */}
            {analysis.dominantLevel && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Dominant Level:</span>
                <span 
                  className="font-medium"
                  style={{ color: BLOOMS_METADATA[analysis.dominantLevel].color }}
                >
                  {BLOOMS_METADATA[analysis.dominantLevel].name}
                </span>
              </div>
            )}

            {/* Recommendations */}
            {analysis.recommendations.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-gray-600">Suggestions:</div>
                <div className="space-y-1">
                  {analysis.recommendations.slice(0, 2).map((recommendation, index) => (
                    <div key={index} className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                      {recommendation}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t">
          <div className="text-center">
            <div className="text-xs text-gray-500">Lower Order</div>
            <div className="text-sm font-medium">
              {distribution[BloomsTaxonomyLevel.REMEMBER] + 
               distribution[BloomsTaxonomyLevel.UNDERSTAND]}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Application</div>
            <div className="text-sm font-medium">
              {distribution[BloomsTaxonomyLevel.APPLY]}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Higher Order</div>
            <div className="text-sm font-medium">
              {distribution[BloomsTaxonomyLevel.ANALYZE] + 
               distribution[BloomsTaxonomyLevel.EVALUATE] + 
               distribution[BloomsTaxonomyLevel.CREATE]}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
