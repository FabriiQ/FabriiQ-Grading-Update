/**
 * Essay Activity Type Registration
 * 
 * Registers the essay activity type with AI grading capabilities,
 * Bloom's taxonomy integration, and rubric support.
 */

import { z } from 'zod';
import { ActivityPurpose, AssessmentType } from '@/server/api/constants';
import { BloomsTaxonomyLevel } from '@/features/bloom/types/bloom-taxonomy';
import { activityRegistry } from '../../registry/index';
import { EssayEditor } from '../../components/essay/EssayEditor';
import { EssayViewer } from '../../components/essay/EssayViewer';

/**
 * Essay Activity Configuration Schema
 */
const EssayActivitySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  instructions: z.string().min(10, 'Instructions must be at least 10 characters'),
  prompt: z.string().min(20, 'Essay prompt must be at least 20 characters'),
  bloomsLevel: z.nativeEnum(BloomsTaxonomyLevel),
  
  // Essay requirements
  minWords: z.number().min(50, 'Minimum words must be at least 50'),
  maxWords: z.number().min(100, 'Maximum words must be at least 100'),
  timeLimit: z.number().min(10, 'Time limit must be at least 10 minutes').optional(),
  
  // Grading configuration
  rubricId: z.string().optional(),
  enableAIGrading: z.boolean().default(true),
  requireManualReview: z.boolean().default(false),
  aiConfidenceThreshold: z.number().min(0.1).max(1).default(0.7),
  
  // Student experience
  showWordCount: z.boolean().default(true),
  allowSaveProgress: z.boolean().default(true),
  
  // Advanced AI grading settings
  aiGradingSettings: z.object({
    feedbackLevel: z.enum(['basic', 'detailed', 'comprehensive']).default('detailed'),
    enableBloomsDetection: z.boolean().default(true),
    enableGrammarCheck: z.boolean().default(true),
    enablePlagiarismCheck: z.boolean().default(false),
    customCriteria: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      weight: z.number().min(0).max(1),
      maxPoints: z.number().min(1),
    })).default([]),
  }).optional(),
  
  // Manual grading workflow
  manualGradingSettings: z.object({
    gradingWorkflow: z.enum(['ai_only', 'manual_only', 'ai_first', 'hybrid']).default('ai_first'),
    allowTeacherOverride: z.boolean().default(true),
    requireSecondReview: z.boolean().default(false),
    autoPublishHighConfidence: z.boolean().default(false),
    notifyOnLowConfidence: z.boolean().default(true),
  }).optional(),
});

/**
 * Default Essay Activity Configuration
 */
const defaultEssayConfig = {
  title: 'New Essay Activity',
  description: 'Write an analytical essay demonstrating your understanding of the topic.',
  instructions: 'Read the prompt carefully and write a well-structured essay with clear arguments and supporting evidence.',
  prompt: 'Analyze the given topic and present your perspective with supporting evidence and examples.',
  bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
  
  // Essay requirements
  minWords: 200,
  maxWords: 1000,
  timeLimit: 60, // 60 minutes
  
  // Grading configuration
  enableAIGrading: true,
  requireManualReview: false,
  aiConfidenceThreshold: 0.7,
  
  // Student experience
  showWordCount: true,
  allowSaveProgress: true,
  
  // AI grading settings
  aiGradingSettings: {
    feedbackLevel: 'detailed' as const,
    enableBloomsDetection: true,
    enableGrammarCheck: true,
    enablePlagiarismCheck: false,
    customCriteria: [
      {
        id: 'content-quality',
        name: 'Content Quality',
        description: 'Depth and accuracy of content',
        weight: 0.4,
        maxPoints: 40,
      },
      {
        id: 'structure-organization',
        name: 'Structure & Organization',
        description: 'Essay structure and logical flow',
        weight: 0.25,
        maxPoints: 25,
      },
      {
        id: 'language-mechanics',
        name: 'Language & Mechanics',
        description: 'Grammar, vocabulary, and writing mechanics',
        weight: 0.25,
        maxPoints: 25,
      },
      {
        id: 'critical-thinking',
        name: 'Critical Thinking',
        description: 'Analysis, evaluation, and reasoning',
        weight: 0.1,
        maxPoints: 10,
      },
    ],
  },
  
  // Manual grading workflow
  manualGradingSettings: {
    gradingWorkflow: 'ai_first' as const,
    allowTeacherOverride: true,
    requireSecondReview: false,
    autoPublishHighConfidence: false,
    notifyOnLowConfidence: true,
  },
};

/**
 * Register Essay Activity Type
 */
export function registerEssayActivity() {
  activityRegistry.register({
    id: 'essay',
    name: 'Essay Activity',
    description: 'Create essay assignments with AI-powered grading and comprehensive feedback',
    category: ActivityPurpose.ASSESSMENT,
    subCategory: AssessmentType.ESSAY,
    configSchema: EssayActivitySchema,
    defaultConfig: defaultEssayConfig,
    capabilities: {
      isGradable: true,
      hasSubmission: true,
      hasInteraction: true, // Rich text editing interaction
      hasRealTimeComponents: true, // Real-time word count, auto-save
      requiresTeacherReview: false, // Can be auto-graded with AI
    },
    components: {
      editor: EssayEditor,
      viewer: EssayViewer,
      // grader: EssayGrader, // Will be added to grading components
    },
  });

  console.log('Essay activity type registered with AI grading capabilities');
}

/**
 * Essay Activity Analytics Configuration
 */
export const essayAnalyticsConfig = {
  metrics: [
    'wordCount',
    'timeSpent',
    'revisionCount',
    'writingSpeed',
    'bloomsLevelAchieved',
    'aiConfidence',
    'manualOverrideRate',
    'averageScore',
    'grammarScore',
    'vocabularyScore',
    'structureScore',
    'contentScore',
  ],
  
  bloomsIntegration: {
    trackLevelProgression: true,
    detectLevelFromContent: true,
    correlateWithPerformance: true,
    generateRecommendations: true,
  },
  
  aiGradingAnalytics: {
    trackConfidenceScores: true,
    monitorOverrideRates: true,
    analyzeGradingConsistency: true,
    identifyBiasPatterns: true,
  },
  
  rubricIntegration: {
    trackCriteriaPerformance: true,
    identifyWeakAreas: true,
    generateTargetedFeedback: true,
    correlateWithBloomsLevels: true,
  },
};

/**
 * Essay Activity Bloom's Taxonomy Integration
 */
export const essayBloomsIntegration = {
  // Map essay prompts to Bloom's levels
  promptAnalysis: {
    keywords: {
      [BloomsTaxonomyLevel.REMEMBER]: ['list', 'identify', 'name', 'define', 'recall'],
      [BloomsTaxonomyLevel.UNDERSTAND]: ['explain', 'describe', 'summarize', 'interpret', 'classify'],
      [BloomsTaxonomyLevel.APPLY]: ['apply', 'demonstrate', 'use', 'implement', 'solve'],
      [BloomsTaxonomyLevel.ANALYZE]: ['analyze', 'compare', 'contrast', 'examine', 'break down'],
      [BloomsTaxonomyLevel.EVALUATE]: ['evaluate', 'judge', 'critique', 'assess', 'justify'],
      [BloomsTaxonomyLevel.CREATE]: ['create', 'design', 'compose', 'construct', 'develop'],
    },
  },
  
  // AI detection of demonstrated levels
  contentAnalysis: {
    enableAutoDetection: true,
    confidenceThreshold: 0.7,
    multiLevelDetection: true,
    evidenceTracking: true,
  },
  
  // Progression tracking
  progressionTracking: {
    trackLevelProgression: true,
    identifyGaps: true,
    suggestNextSteps: true,
    generateInsights: true,
  },
};

/**
 * Essay Activity Rubric Integration
 */
export const essayRubricIntegration = {
  // Standard essay rubric criteria
  standardCriteria: [
    {
      id: 'thesis-clarity',
      name: 'Thesis Clarity',
      description: 'Clear and focused thesis statement',
      bloomsLevel: BloomsTaxonomyLevel.UNDERSTAND,
      weight: 0.15,
    },
    {
      id: 'argument-development',
      name: 'Argument Development',
      description: 'Logical development of arguments with evidence',
      bloomsLevel: BloomsTaxonomyLevel.ANALYZE,
      weight: 0.25,
    },
    {
      id: 'critical-analysis',
      name: 'Critical Analysis',
      description: 'Depth of analysis and critical thinking',
      bloomsLevel: BloomsTaxonomyLevel.EVALUATE,
      weight: 0.20,
    },
    {
      id: 'organization-structure',
      name: 'Organization & Structure',
      description: 'Clear organization and logical flow',
      bloomsLevel: BloomsTaxonomyLevel.APPLY,
      weight: 0.15,
    },
    {
      id: 'evidence-support',
      name: 'Evidence & Support',
      description: 'Use of relevant evidence and examples',
      bloomsLevel: BloomsTaxonomyLevel.APPLY,
      weight: 0.15,
    },
    {
      id: 'writing-mechanics',
      name: 'Writing Mechanics',
      description: 'Grammar, spelling, and writing conventions',
      bloomsLevel: BloomsTaxonomyLevel.REMEMBER,
      weight: 0.10,
    },
  ],
  
  // AI-rubric alignment
  aiAlignment: {
    mapCriteriaToAIAnalysis: true,
    generateCriteriaFeedback: true,
    trackCriteriaPerformance: true,
    identifyImprovementAreas: true,
  },
};

// Export all configurations
export {
  EssayActivitySchema,
  defaultEssayConfig,
};
