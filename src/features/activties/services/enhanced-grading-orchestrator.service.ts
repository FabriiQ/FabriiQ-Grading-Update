'use client';

/**
 * Enhanced Grading Orchestrator Service
 * 
 * Provides a unified grading system that handles:
 * - All activity types (not just essays)
 * - AI grading with confidence thresholds
 * - Manual grading workflows
 * - Rubric-based assessment
 * - Hybrid AI + manual grading
 * - Performance optimization
 * - Memory leak prevention
 */

import { PrismaClient } from '@prisma/client';
import { UnifiedAchievementService } from './unified-achievement.service';
import { useMemoryLeakPrevention } from './memory-leak-prevention.service';

/**
 * Grading configuration for any activity type
 */
export interface EnhancedGradingConfig {
  activityId: string;
  activityType: string;
  gradingMethod: 'auto' | 'manual' | 'hybrid' | 'rubric';
  
  // AI grading settings
  aiGrading?: {
    enabled: boolean;
    model: 'gpt-4' | 'gpt-3.5-turbo' | 'claude-3';
    confidenceThreshold: number;
    maxRetries: number;
  };
  
  // Manual grading settings
  manualGrading?: {
    requiresReview: boolean;
    allowTeacherOverride: boolean;
    notifyOnCompletion: boolean;
    deadlineHours?: number;
  };
  
  // Rubric settings
  rubricGrading?: {
    rubricId: string;
    weightedScoring: boolean;
    bloomsIntegration: boolean;
    criteriaWeights?: Record<string, number>;
  };
  
  // Quality assurance
  qualityAssurance?: {
    enableSecondReview: boolean;
    maxScoreDifference: number;
    flagSuspiciousSubmissions: boolean;
    antiCheatEnabled: boolean;
  };
}

/**
 * Comprehensive grading result
 */
export interface EnhancedGradingResult {
  submissionId: string;
  activityId: string;
  activityType: string;
  
  // Scoring
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  
  // Grading details
  gradingMethod: 'auto' | 'manual' | 'hybrid' | 'rubric';
  gradedBy: string;
  gradedAt: Date;
  
  // AI grading details (if applicable)
  aiGrading?: {
    score: number;
    confidence: number;
    model: string;
    processingTime: number;
    feedback: string;
  };
  
  // Manual grading details (if applicable)
  manualGrading?: {
    score: number;
    feedback: string;
    gradedBy: string;
    timeSpent: number;
  };
  
  // Rubric grading details (if applicable)
  rubricGrading?: {
    criteriaScores: Record<string, number>;
    bloomsLevelScores?: Record<string, number>;
    overallFeedback: string;
  };
  
  // Quality flags
  qualityFlags?: {
    requiresReview: boolean;
    reviewReasons: string[];
    suspiciousActivity: boolean;
    confidenceLevel: 'high' | 'medium' | 'low';
  };
  
  // Performance metrics
  performance?: {
    gradingTime: number;
    memoryUsage?: number;
    cacheHits?: number;
  };
}

/**
 * Enhanced Grading Orchestrator
 */
export class EnhancedGradingOrchestrator {
  private prisma: PrismaClient;
  private achievementService: UnifiedAchievementService;
  private gradingCache = new Map<string, EnhancedGradingResult>();
  private processingQueue = new Set<string>();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.achievementService = new UnifiedAchievementService(prisma);
  }

  /**
   * Grade any activity type with the appropriate method
   */
  async gradeActivity(
    submissionId: string,
    submissionData: any,
    config: EnhancedGradingConfig
  ): Promise<EnhancedGradingResult> {
    const startTime = Date.now();
    
    // Prevent duplicate processing
    if (this.processingQueue.has(submissionId)) {
      throw new Error('Submission is already being processed');
    }
    
    // Check cache first
    const cached = this.gradingCache.get(submissionId);
    if (cached) {
      return cached;
    }
    
    this.processingQueue.add(submissionId);
    
    try {
      let result: EnhancedGradingResult;
      
      switch (config.gradingMethod) {
        case 'auto':
          result = await this.performAutoGrading(submissionId, submissionData, config);
          break;
        case 'manual':
          result = await this.performManualGrading(submissionId, submissionData, config);
          break;
        case 'hybrid':
          result = await this.performHybridGrading(submissionId, submissionData, config);
          break;
        case 'rubric':
          result = await this.performRubricGrading(submissionId, submissionData, config);
          break;
        default:
          throw new Error(`Unsupported grading method: ${config.gradingMethod}`);
      }
      
      // Add performance metrics
      result.performance = {
        gradingTime: Date.now() - startTime,
        cacheHits: this.gradingCache.size
      };
      
      // Cache the result
      this.gradingCache.set(submissionId, result);
      
      // Trigger achievements
      await this.triggerAchievements(result);
      
      // Save to database
      await this.saveGradingResult(result);
      
      return result;
      
    } finally {
      this.processingQueue.delete(submissionId);
    }
  }

  /**
   * Perform automatic grading (for objective activities)
   */
  private async performAutoGrading(
    submissionId: string,
    submissionData: any,
    config: EnhancedGradingConfig
  ): Promise<EnhancedGradingResult> {
    // Import the appropriate grading function based on activity type
    const gradingFunction = await this.getGradingFunction(config.activityType);
    
    if (!gradingFunction) {
      throw new Error(`No auto-grading function available for ${config.activityType}`);
    }
    
    // Perform grading
    const gradingResult = await gradingFunction(submissionData.activity, submissionData.answers);
    
    return {
      submissionId,
      activityId: config.activityId,
      activityType: config.activityType,
      score: gradingResult.score,
      maxScore: gradingResult.maxScore,
      percentage: gradingResult.percentage,
      passed: gradingResult.passed,
      gradingMethod: 'auto',
      gradedBy: 'system',
      gradedAt: new Date()
    };
  }

  /**
   * Perform manual grading (queued for teacher review)
   */
  private async performManualGrading(
    submissionId: string,
    submissionData: any,
    config: EnhancedGradingConfig
  ): Promise<EnhancedGradingResult> {
    // Queue for manual review
    await this.queueForManualReview(submissionId, config);
    
    return {
      submissionId,
      activityId: config.activityId,
      activityType: config.activityType,
      score: 0, // Placeholder until manually graded
      maxScore: submissionData.activity.maxScore || 100,
      percentage: 0,
      passed: false,
      gradingMethod: 'manual',
      gradedBy: 'pending',
      gradedAt: new Date(),
      qualityFlags: {
        requiresReview: true,
        reviewReasons: ['Manual grading required'],
        suspiciousActivity: false,
        confidenceLevel: 'medium'
      }
    };
  }

  /**
   * Perform hybrid AI + manual grading
   */
  private async performHybridGrading(
    submissionId: string,
    submissionData: any,
    config: EnhancedGradingConfig
  ): Promise<EnhancedGradingResult> {
    // First, try AI grading
    let aiResult: any = null;
    let requiresManualReview = false;
    
    if (config.aiGrading?.enabled) {
      try {
        aiResult = await this.performAIGrading(submissionData, config);
        
        // Check if manual review is needed based on confidence
        if (aiResult.confidence < (config.aiGrading.confidenceThreshold || 0.7)) {
          requiresManualReview = true;
        }
      } catch (error) {
        console.warn('AI grading failed, falling back to manual:', error);
        requiresManualReview = true;
      }
    } else {
      requiresManualReview = true;
    }
    
    // If manual review is required, queue it
    if (requiresManualReview) {
      await this.queueForManualReview(submissionId, config);
    }
    
    return {
      submissionId,
      activityId: config.activityId,
      activityType: config.activityType,
      score: aiResult?.score || 0,
      maxScore: submissionData.activity.maxScore || 100,
      percentage: aiResult?.percentage || 0,
      passed: aiResult?.passed || false,
      gradingMethod: 'hybrid',
      gradedBy: requiresManualReview ? 'pending' : 'ai',
      gradedAt: new Date(),
      aiGrading: aiResult ? {
        score: aiResult.score,
        confidence: aiResult.confidence,
        model: config.aiGrading?.model || 'gpt-4',
        processingTime: aiResult.processingTime || 0,
        feedback: aiResult.feedback || ''
      } : undefined,
      qualityFlags: {
        requiresReview: requiresManualReview,
        reviewReasons: requiresManualReview ? ['Low AI confidence', 'Manual review required'] : [],
        suspiciousActivity: false,
        confidenceLevel: aiResult?.confidence > 0.8 ? 'high' : aiResult?.confidence > 0.6 ? 'medium' : 'low'
      }
    };
  }

  /**
   * Perform rubric-based grading
   */
  private async performRubricGrading(
    submissionId: string,
    submissionData: any,
    config: EnhancedGradingConfig
  ): Promise<EnhancedGradingResult> {
    if (!config.rubricGrading?.rubricId) {
      throw new Error('Rubric ID is required for rubric grading');
    }
    
    // Queue for manual rubric grading
    await this.queueForRubricGrading(submissionId, config);
    
    return {
      submissionId,
      activityId: config.activityId,
      activityType: config.activityType,
      score: 0, // Placeholder until rubric is completed
      maxScore: submissionData.activity.maxScore || 100,
      percentage: 0,
      passed: false,
      gradingMethod: 'rubric',
      gradedBy: 'pending',
      gradedAt: new Date(),
      qualityFlags: {
        requiresReview: true,
        reviewReasons: ['Rubric grading required'],
        suspiciousActivity: false,
        confidenceLevel: 'medium'
      }
    };
  }

  /**
   * Get the appropriate grading function for an activity type
   */
  private async getGradingFunction(activityType: string): Promise<Function | null> {
    // Dynamic import to avoid loading all grading functions at once
    try {
      switch (activityType) {
        case 'multiple-choice':
          const { gradeMultipleChoiceActivity } = await import('../grading/multiple-choice');
          return gradeMultipleChoiceActivity;
        case 'true-false':
          const { gradeTrueFalseActivity } = await import('../grading/true-false');
          return gradeTrueFalseActivity;
        case 'essay':
          const { gradeEssayActivity } = await import('../grading/essay');
          return gradeEssayActivity;
        // Add more activity types as needed
        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to load grading function for ${activityType}:`, error);
      return null;
    }
  }

  /**
   * Perform AI grading (placeholder - would integrate with actual AI service)
   */
  private async performAIGrading(submissionData: any, config: EnhancedGradingConfig): Promise<any> {
    // This would integrate with the actual AI grading service
    // For now, return a mock result
    return {
      score: 85,
      confidence: 0.75,
      percentage: 85,
      passed: true,
      feedback: 'AI-generated feedback',
      processingTime: 1500
    };
  }

  /**
   * Queue submission for manual review
   */
  private async queueForManualReview(submissionId: string, config: EnhancedGradingConfig): Promise<void> {
    // Implementation would add to manual grading queue
    console.log(`Queued ${submissionId} for manual review`);
  }

  /**
   * Queue submission for rubric grading
   */
  private async queueForRubricGrading(submissionId: string, config: EnhancedGradingConfig): Promise<void> {
    // Implementation would add to rubric grading queue
    console.log(`Queued ${submissionId} for rubric grading`);
  }

  /**
   * Trigger achievements based on grading result
   */
  private async triggerAchievements(result: EnhancedGradingResult): Promise<void> {
    try {
      await this.achievementService.processActivityCompletion(
        result.activityId,
        'student-id', // Would get from context
        {
          success: true,
          submissionId: result.submissionId,
          score: result.score,
          maxScore: result.maxScore,
          percentage: result.percentage
        }
      );
    } catch (error) {
      console.warn('Achievement processing failed:', error);
    }
  }

  /**
   * Save grading result to database
   */
  private async saveGradingResult(result: EnhancedGradingResult): Promise<void> {
    // Implementation would save to database
    console.log('Saving grading result:', result.submissionId);
  }

  /**
   * Batch grade multiple submissions
   */
  async batchGradeActivities(
    submissions: Array<{
      submissionId: string;
      submissionData: any;
      config: EnhancedGradingConfig;
    }>
  ): Promise<EnhancedGradingResult[]> {
    const results: EnhancedGradingResult[] = [];

    // Process in batches to prevent memory issues
    const batchSize = 10;
    for (let i = 0; i < submissions.length; i += batchSize) {
      const batch = submissions.slice(i, i + batchSize);

      const batchPromises = batch.map(({ submissionId, submissionData, config }) =>
        this.gradeActivity(submissionId, submissionData, config)
      );

      const batchResults = await Promise.allSettled(batchPromises);

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Batch grading failed for submission ${batch[index].submissionId}:`, result.reason);
        }
      });

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < submissions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get grading statistics
   */
  async getGradingStatistics(activityId: string): Promise<{
    totalSubmissions: number;
    averageScore: number;
    gradingMethodDistribution: Record<string, number>;
    averageGradingTime: number;
    achievementRate: number;
  }> {
    // This would query the database for statistics
    return {
      totalSubmissions: 0,
      averageScore: 0,
      gradingMethodDistribution: {},
      averageGradingTime: 0,
      achievementRate: 0
    };
  }

  /**
   * Clear cache to prevent memory leaks
   */
  public clearCache(): void {
    this.gradingCache.clear();
    this.processingQueue.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  public getCacheStats(): {
    cacheSize: number;
    processingQueueSize: number;
    memoryUsage: number;
  } {
    return {
      cacheSize: this.gradingCache.size,
      processingQueueSize: this.processingQueue.size,
      memoryUsage: process.memoryUsage?.().heapUsed || 0
    };
  }
}
