'use client';

import { BloomsTaxonomyLevel } from '@prisma/client';
import { Question } from '../models/types';

/**
 * Bloom's Taxonomy Distribution Interface
 */
export interface BloomsDistribution {
  [BloomsTaxonomyLevel.REMEMBER]: number;
  [BloomsTaxonomyLevel.UNDERSTAND]: number;
  [BloomsTaxonomyLevel.APPLY]: number;
  [BloomsTaxonomyLevel.ANALYZE]: number;
  [BloomsTaxonomyLevel.EVALUATE]: number;
  [BloomsTaxonomyLevel.CREATE]: number;
}

/**
 * Calculate Bloom's taxonomy distribution from selected questions
 * This function automatically calculates the cognitive level distribution
 * based on questions selected from the question bank
 */
export function calculateBloomsDistributionFromQuestions(
  questions: Question[]
): BloomsDistribution {
  // Initialize distribution with zeros
  const distribution: BloomsDistribution = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  if (questions.length === 0) {
    return distribution;
  }

  // Count questions by Bloom's level
  const levelCounts: Record<BloomsTaxonomyLevel, number> = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  // Count questions for each level
  questions.forEach(question => {
    if (question.bloomsLevel) {
      levelCounts[question.bloomsLevel]++;
    }
  });

  // Calculate percentages
  const totalQuestions = questions.length;
  Object.entries(levelCounts).forEach(([level, count]) => {
    distribution[level as BloomsTaxonomyLevel] = Math.round((count / totalQuestions) * 100);
  });

  return distribution;
}

/**
 * Calculate weighted Bloom's distribution based on question points/scores
 * This gives more accurate representation when questions have different point values
 */
export function calculateWeightedBloomsDistribution(
  questions: Array<{ bloomsLevel?: BloomsTaxonomyLevel; points?: number }>
): BloomsDistribution {
  // Initialize distribution with zeros
  const distribution: BloomsDistribution = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  if (questions.length === 0) {
    return distribution;
  }

  // Calculate total points and points by level
  const pointsByLevel: Record<BloomsTaxonomyLevel, number> = {
    [BloomsTaxonomyLevel.REMEMBER]: 0,
    [BloomsTaxonomyLevel.UNDERSTAND]: 0,
    [BloomsTaxonomyLevel.APPLY]: 0,
    [BloomsTaxonomyLevel.ANALYZE]: 0,
    [BloomsTaxonomyLevel.EVALUATE]: 0,
    [BloomsTaxonomyLevel.CREATE]: 0,
  };

  let totalPoints = 0;

  questions.forEach(question => {
    const points = question.points || 1; // Default to 1 point if not specified
    totalPoints += points;

    if (question.bloomsLevel) {
      pointsByLevel[question.bloomsLevel] += points;
    }
  });

  // Calculate percentage distribution based on points
  if (totalPoints > 0) {
    Object.entries(pointsByLevel).forEach(([level, points]) => {
      distribution[level as BloomsTaxonomyLevel] = Math.round((points / totalPoints) * 100);
    });
  }

  return distribution;
}

/**
 * Analyze Bloom's distribution and provide insights
 */
export interface BloomsAnalysis {
  isBalanced: boolean;
  dominantLevel: BloomsTaxonomyLevel | null;
  missingLevels: BloomsTaxonomyLevel[];
  recommendations: string[];
  cognitiveComplexity: 'low' | 'medium' | 'high';
}

export function analyzeBloomsDistribution(distribution: BloomsDistribution): BloomsAnalysis {
  const levels = Object.entries(distribution) as [BloomsTaxonomyLevel, number][];
  const nonZeroLevels = levels.filter(([_, percentage]) => percentage > 0);
  const missingLevels = levels.filter(([_, percentage]) => percentage === 0).map(([level]) => level);
  
  // Find dominant level (highest percentage)
  const dominantLevel = levels.reduce((max, current) => 
    current[1] > max[1] ? current : max
  )[0];

  // Check if distribution is balanced (no single level > 50%)
  const isBalanced = !levels.some(([_, percentage]) => percentage > 50);

  // Calculate cognitive complexity based on higher-order thinking levels
  const higherOrderPercentage = 
    distribution[BloomsTaxonomyLevel.ANALYZE] +
    distribution[BloomsTaxonomyLevel.EVALUATE] +
    distribution[BloomsTaxonomyLevel.CREATE];

  let cognitiveComplexity: 'low' | 'medium' | 'high';
  if (higherOrderPercentage >= 60) {
    cognitiveComplexity = 'high';
  } else if (higherOrderPercentage >= 30) {
    cognitiveComplexity = 'medium';
  } else {
    cognitiveComplexity = 'low';
  }

  // Generate recommendations
  const recommendations: string[] = [];
  
  if (!isBalanced) {
    recommendations.push(`Consider balancing the distribution - ${dominantLevel} level dominates at ${distribution[dominantLevel]}%`);
  }
  
  if (missingLevels.length > 0) {
    recommendations.push(`Consider adding questions for: ${missingLevels.join(', ')}`);
  }
  
  if (cognitiveComplexity === 'low') {
    recommendations.push('Add more higher-order thinking questions (Analyze, Evaluate, Create)');
  }
  
  if (distribution[BloomsTaxonomyLevel.REMEMBER] > 40) {
    recommendations.push('Too many recall-based questions - consider adding application and analysis questions');
  }

  return {
    isBalanced,
    dominantLevel: dominantLevel || null,
    missingLevels,
    recommendations,
    cognitiveComplexity
  };
}

/**
 * Suggest questions to balance Bloom's distribution
 * This function can be used to recommend additional questions from the question bank
 */
export function suggestQuestionsForBalance(
  currentDistribution: BloomsDistribution,
  targetDistribution: Partial<BloomsDistribution>,
  availableQuestions: Question[]
): {
  suggestedQuestions: Question[];
  reasoning: string[];
} {
  const suggestions: Question[] = [];
  const reasoning: string[] = [];

  // Find levels that need more questions
  Object.entries(targetDistribution).forEach(([level, targetPercentage]) => {
    const bloomsLevel = level as BloomsTaxonomyLevel;
    const currentPercentage = currentDistribution[bloomsLevel];
    
    if (targetPercentage && currentPercentage < targetPercentage) {
      const deficit = targetPercentage - currentPercentage;
      reasoning.push(`Need ${deficit}% more ${bloomsLevel} level questions`);
      
      // Find available questions for this level
      const levelQuestions = availableQuestions.filter(q => q.bloomsLevel === bloomsLevel);
      suggestions.push(...levelQuestions.slice(0, Math.ceil(deficit / 10))); // Rough estimate
    }
  });

  return {
    suggestedQuestions: suggestions,
    reasoning
  };
}

/**
 * Convert question bank questions to assessment format with Bloom's data preserved
 */
export function convertQuestionBankToAssessmentFormat(
  questions: Question[]
): Array<{
  id: string;
  questionBankRef: string;
  text: string;
  type: string;
  bloomsLevel?: BloomsTaxonomyLevel;
  learningOutcomeIds?: string[];
  actionVerbs?: string[];
  points: number;
  content: any;
}> {
  return questions.map(question => ({
    id: question.id,
    questionBankRef: question.id,
    text: question.title,
    type: question.questionType,
    bloomsLevel: question.bloomsLevel,
    learningOutcomeIds: question.learningOutcomeIds,
    actionVerbs: question.metadata?.actionVerbs || [],
    points: 1, // Default points, can be customized
    content: question.content
  }));
}

/**
 * Validate Bloom's distribution totals to 100%
 */
export function validateBloomsDistribution(distribution: BloomsDistribution): {
  isValid: boolean;
  total: number;
  error?: string;
} {
  const total = Object.values(distribution).reduce((sum, value) => sum + value, 0);
  
  if (Math.abs(total - 100) > 1) { // Allow 1% tolerance for rounding
    return {
      isValid: false,
      total,
      error: `Distribution totals ${total}% instead of 100%`
    };
  }
  
  return {
    isValid: true,
    total
  };
}
