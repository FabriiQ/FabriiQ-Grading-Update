'use client';

/**
 * Bloom's Distribution Chart Component
 * 
 * Real-time visualization of Bloom's Taxonomy distribution for selected questions
 * with target comparison and balance indicators.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle } from 'lucide-react';
import { BloomsDistribution } from '../../types/quiz-question-filters';
import { BloomsTaxonomyLevel } from '@prisma/client';

export interface BloomsDistributionChartProps {
  currentDistribution: BloomsDistribution;
  targetDistribution?: BloomsDistribution;
  totalQuestions: number;
  maxQuestions: number;
  showTargetComparison?: boolean;
  showRecommendations?: boolean;
}

export function BloomsDistributionChart({
  currentDistribution,
  targetDistribution,
  totalQuestions,
  maxQuestions,
  showTargetComparison = true,
  showRecommendations = true,
}: BloomsDistributionChartProps) {
  // Bloom's levels in order
  const bloomsLevels = [
    { key: 'REMEMBER', label: 'Remember', color: 'bg-blue-500', description: 'Recall facts and basic concepts' },
    { key: 'UNDERSTAND', label: 'Understand', color: 'bg-green-500', description: 'Explain ideas or concepts' },
    { key: 'APPLY', label: 'Apply', color: 'bg-yellow-500', description: 'Use information in new situations' },
    { key: 'ANALYZE', label: 'Analyze', color: 'bg-orange-500', description: 'Draw connections among ideas' },
    { key: 'EVALUATE', label: 'Evaluate', color: 'bg-red-500', description: 'Justify a stand or decision' },
    { key: 'CREATE', label: 'Create', color: 'bg-purple-500', description: 'Produce new or original work' },
  ];

  // Calculate recommendations
  const recommendations = showRecommendations ? generateRecommendations(
    currentDistribution,
    targetDistribution,
    totalQuestions,
    maxQuestions
  ) : [];

  // Calculate balance score
  const balanceScore = calculateBalanceScore(currentDistribution, targetDistribution);

  return (
    <div className="space-y-6">
      {/* Header with Balance Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Bloom's Taxonomy Distribution</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={balanceScore >= 0.8 ? 'default' : balanceScore >= 0.6 ? 'secondary' : 'destructive'}>
                Balance: {(balanceScore * 100).toFixed(0)}%
              </Badge>
              <Badge variant="outline">
                {totalQuestions} / {maxQuestions} questions
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bloomsLevels.map(level => {
              const currentPercentage = currentDistribution[level.key as keyof BloomsDistribution] || 0;
              const targetPercentage = targetDistribution?.[level.key as keyof BloomsDistribution] || 0;
              const currentCount = Math.round((currentPercentage / 100) * totalQuestions);
              const targetCount = Math.round((targetPercentage / 100) * maxQuestions);
              
              return (
                <BloomsLevelRow
                  key={level.key}
                  level={level}
                  currentPercentage={currentPercentage}
                  targetPercentage={targetPercentage}
                  currentCount={currentCount}
                  targetCount={targetCount}
                  showTarget={showTargetComparison && targetPercentage > 0}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cognitive Complexity Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {((currentDistribution.REMEMBER || 0) + (currentDistribution.UNDERSTAND || 0)).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Lower Order</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {((currentDistribution.APPLY || 0) + (currentDistribution.ANALYZE || 0)).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Middle Order</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {((currentDistribution.EVALUATE || 0) + (currentDistribution.CREATE || 0)).toFixed(0)}%
              </div>
              <div className="text-sm text-muted-foreground">Higher Order</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Individual Bloom's Level Row Component
interface BloomsLevelRowProps {
  level: {
    key: string;
    label: string;
    color: string;
    description: string;
  };
  currentPercentage: number;
  targetPercentage: number;
  currentCount: number;
  targetCount: number;
  showTarget: boolean;
}

function BloomsLevelRow({
  level,
  currentPercentage,
  targetPercentage,
  currentCount,
  targetCount,
  showTarget,
}: BloomsLevelRowProps) {
  const difference = currentPercentage - targetPercentage;
  const isOnTarget = Math.abs(difference) <= 5; // Within 5% is considered on target
  const isOver = difference > 5;
  const isUnder = difference < -5;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${level.color}`} />
          <div>
            <div className="font-medium text-sm">{level.label}</div>
            <div className="text-xs text-muted-foreground">{level.description}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {currentCount} ({currentPercentage.toFixed(0)}%)
          </span>
          {showTarget && (
            <>
              <span className="text-xs text-muted-foreground">
                / {targetCount} ({targetPercentage.toFixed(0)}%)
              </span>
              {isOnTarget && <Minus className="h-3 w-3 text-green-500" />}
              {isOver && <TrendingUp className="h-3 w-3 text-red-500" />}
              {isUnder && <TrendingDown className="h-3 w-3 text-amber-500" />}
            </>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        {/* Current Progress */}
        <Progress value={currentPercentage} className="h-2" />
        
        {/* Target Indicator */}
        {showTarget && targetPercentage > 0 && (
          <div className="relative h-1">
            <div 
              className="absolute top-0 w-0.5 h-full bg-gray-400"
              style={{ left: `${targetPercentage}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Helper Functions

function generateRecommendations(
  current: BloomsDistribution,
  target?: BloomsDistribution,
  totalQuestions: number = 0,
  maxQuestions: number = 20
): string[] {
  const recommendations: string[] = [];

  if (!target) {
    // General recommendations without target
    const higherOrder = (current.EVALUATE || 0) + (current.CREATE || 0);
    const lowerOrder = (current.REMEMBER || 0) + (current.UNDERSTAND || 0);
    
    if (higherOrder < 20) {
      recommendations.push('Consider adding more higher-order thinking questions (Evaluate, Create)');
    }
    if (lowerOrder > 60) {
      recommendations.push('Balance with more application and analysis questions');
    }
    if (totalQuestions < maxQuestions * 0.5) {
      recommendations.push('Add more questions to reach optimal quiz length');
    }
    
    return recommendations;
  }

  // Recommendations based on target comparison
  Object.entries(target).forEach(([level, targetPercentage]) => {
    const currentPercentage = current[level as keyof BloomsDistribution] || 0;
    const difference = currentPercentage - targetPercentage;
    
    if (difference < -10) {
      recommendations.push(`Add more ${level.toLowerCase()} questions (${Math.abs(difference).toFixed(0)}% below target)`);
    } else if (difference > 10) {
      recommendations.push(`Consider reducing ${level.toLowerCase()} questions (${difference.toFixed(0)}% above target)`);
    }
  });

  // Overall balance recommendations
  const balanceScore = calculateBalanceScore(current, target);
  if (balanceScore < 0.6) {
    recommendations.push('Overall distribution needs better balance with target');
  }

  return recommendations;
}

function calculateBalanceScore(
  current: BloomsDistribution,
  target?: BloomsDistribution
): number {
  if (!target) {
    // Calculate general balance score
    const values = Object.values(current);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.max(0, 1 - (variance / 1000));
  }

  // Calculate balance score against target
  let totalDifference = 0;
  let comparisons = 0;

  Object.entries(target).forEach(([level, targetPercentage]) => {
    const currentPercentage = current[level as keyof BloomsDistribution] || 0;
    totalDifference += Math.abs(currentPercentage - targetPercentage);
    comparisons++;
  });

  const averageDifference = comparisons > 0 ? totalDifference / comparisons : 0;
  return Math.max(0, 1 - (averageDifference / 100));
}
