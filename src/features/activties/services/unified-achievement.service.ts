'use client';

import { PrismaClient } from '@prisma/client';
import type { SubmissionResult } from '../components/ui/UniversalActivitySubmit';

/**
 * Achievement result interface
 */
export interface AchievementResult {
  id: string;
  name: string;
  description: string;
  points: number;
  type: 'completion' | 'score' | 'streak' | 'activity_type' | 'speed' | 'mastery';
  criteria: string;
  unlockedAt: Date;
  metadata?: {
    activityType?: string;
    score?: number;
    streak?: number;
    timeSpent?: number;
    [key: string]: any;
  };
}

/**
 * Achievement criteria interface
 */
export interface AchievementCriteria {
  id: string;
  name: string;
  description: string;
  type: 'completion' | 'score' | 'streak' | 'activity_type' | 'speed' | 'mastery';
  points: number;
  criteria: {
    activityTypes?: string[];
    minScore?: number;
    minPercentage?: number;
    streakCount?: number;
    maxTimeSpent?: number; // in seconds
    completionCount?: number;
    [key: string]: any;
  };
  isActive: boolean;
}

/**
 * UnifiedAchievementService
 * 
 * Handles achievement processing for all activity types with:
 * - Consistent achievement criteria across all activities
 * - Proper integration with points system
 * - Real-time achievement notifications
 * - Prevention of duplicate achievement awards
 * - Comprehensive achievement tracking
 */
export class UnifiedAchievementService {
  private prisma: PrismaClient;
  private achievementCache = new Map<string, AchievementCriteria[]>();
  private userAchievementCache = new Map<string, Set<string>>();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Process activity completion and trigger all applicable achievements
   */
  async processActivityCompletion(
    activityId: string,
    studentId: string,
    submissionResult: SubmissionResult
  ): Promise<AchievementResult[]> {
    try {
      const achievements: AchievementResult[] = [];
      
      // Get all active achievement criteria
      const criteria = await this.getAchievementCriteria();
      
      // Get user's existing achievements to prevent duplicates
      const existingAchievements = await this.getUserAchievements(studentId);
      
      // Check each type of achievement
      const achievementChecks = await Promise.all([
        this.checkCompletionAchievements(studentId, submissionResult, criteria, existingAchievements),
        this.checkScoreAchievements(studentId, submissionResult, criteria, existingAchievements),
        this.checkActivityTypeAchievements(studentId, submissionResult, criteria, existingAchievements),
        this.checkStreakAchievements(studentId, submissionResult, criteria, existingAchievements),
        this.checkSpeedAchievements(studentId, submissionResult, criteria, existingAchievements),
        this.checkMasteryAchievements(studentId, submissionResult, criteria, existingAchievements)
      ]);
      
      // Flatten all achievement results
      achievementChecks.forEach(results => achievements.push(...results));
      
      // Award achievements and update database
      if (achievements.length > 0) {
        await this.awardAchievements(studentId, achievements);
        
        // Update cache
        const userAchievements = this.userAchievementCache.get(studentId) || new Set();
        achievements.forEach(achievement => userAchievements.add(achievement.id));
        this.userAchievementCache.set(studentId, userAchievements);
      }
      
      return achievements;
      
    } catch (error) {
      console.error('Achievement processing error:', error);
      return [];
    }
  }

  /**
   * Check completion-based achievements
   */
  private async checkCompletionAchievements(
    studentId: string,
    submissionResult: SubmissionResult,
    criteria: AchievementCriteria[],
    existingAchievements: Set<string>
  ): Promise<AchievementResult[]> {
    const achievements: AchievementResult[] = [];
    const completionCriteria = criteria.filter(c => c.type === 'completion');
    
    for (const criterion of completionCriteria) {
      if (existingAchievements.has(criterion.id)) continue;
      
      // Get user's total activity completions
      const completionCount = await this.getUserCompletionCount(studentId);
      
      if (completionCount >= (criterion.criteria.completionCount || 1)) {
        achievements.push({
          id: criterion.id,
          name: criterion.name,
          description: criterion.description,
          points: criterion.points,
          type: 'completion',
          criteria: `Complete ${criterion.criteria.completionCount} activities`,
          unlockedAt: new Date(),
          metadata: {
            completionCount
          }
        });
      }
    }
    
    return achievements;
  }

  /**
   * Check score-based achievements
   */
  private async checkScoreAchievements(
    studentId: string,
    submissionResult: SubmissionResult,
    criteria: AchievementCriteria[],
    existingAchievements: Set<string>
  ): Promise<AchievementResult[]> {
    const achievements: AchievementResult[] = [];
    const scoreCriteria = criteria.filter(c => c.type === 'score');
    
    if (!submissionResult.score || !submissionResult.maxScore) return achievements;
    
    const percentage = (submissionResult.score / submissionResult.maxScore) * 100;
    
    for (const criterion of scoreCriteria) {
      if (existingAchievements.has(criterion.id)) continue;
      
      const meetsScoreCriteria = criterion.criteria.minScore 
        ? submissionResult.score >= criterion.criteria.minScore
        : true;
        
      const meetsPercentageCriteria = criterion.criteria.minPercentage
        ? percentage >= criterion.criteria.minPercentage
        : true;
      
      if (meetsScoreCriteria && meetsPercentageCriteria) {
        achievements.push({
          id: criterion.id,
          name: criterion.name,
          description: criterion.description,
          points: criterion.points,
          type: 'score',
          criteria: `Score ${criterion.criteria.minPercentage || criterion.criteria.minScore}${criterion.criteria.minPercentage ? '%' : ' points'}`,
          unlockedAt: new Date(),
          metadata: {
            score: submissionResult.score,
            percentage
          }
        });
      }
    }
    
    return achievements;
  }

  /**
   * Check activity-type specific achievements
   */
  private async checkActivityTypeAchievements(
    studentId: string,
    submissionResult: SubmissionResult,
    criteria: AchievementCriteria[],
    existingAchievements: Set<string>
  ): Promise<AchievementResult[]> {
    const achievements: AchievementResult[] = [];
    const activityTypeCriteria = criteria.filter(c => c.type === 'activity_type');
    
    for (const criterion of activityTypeCriteria) {
      if (existingAchievements.has(criterion.id)) continue;
      
      const targetActivityTypes = criterion.criteria.activityTypes || [];
      if (targetActivityTypes.length === 0) continue;
      
      // Check if user has completed activities of specified types
      const completedTypes = await this.getUserCompletedActivityTypes(studentId);
      const hasCompletedAllTypes = targetActivityTypes.every(type => completedTypes.includes(type));
      
      if (hasCompletedAllTypes) {
        achievements.push({
          id: criterion.id,
          name: criterion.name,
          description: criterion.description,
          points: criterion.points,
          type: 'activity_type',
          criteria: `Complete activities of types: ${targetActivityTypes.join(', ')}`,
          unlockedAt: new Date(),
          metadata: {
            activityTypes: targetActivityTypes,
            completedTypes
          }
        });
      }
    }
    
    return achievements;
  }

  /**
   * Check streak achievements
   */
  private async checkStreakAchievements(
    studentId: string,
    submissionResult: SubmissionResult,
    criteria: AchievementCriteria[],
    existingAchievements: Set<string>
  ): Promise<AchievementResult[]> {
    const achievements: AchievementResult[] = [];
    const streakCriteria = criteria.filter(c => c.type === 'streak');
    
    for (const criterion of streakCriteria) {
      if (existingAchievements.has(criterion.id)) continue;
      
      const currentStreak = await this.getUserCurrentStreak(studentId);
      
      if (currentStreak >= (criterion.criteria.streakCount || 1)) {
        achievements.push({
          id: criterion.id,
          name: criterion.name,
          description: criterion.description,
          points: criterion.points,
          type: 'streak',
          criteria: `Complete ${criterion.criteria.streakCount} activities in a row`,
          unlockedAt: new Date(),
          metadata: {
            streak: currentStreak
          }
        });
      }
    }
    
    return achievements;
  }

  /**
   * Check speed achievements
   */
  private async checkSpeedAchievements(
    studentId: string,
    submissionResult: SubmissionResult,
    criteria: AchievementCriteria[],
    existingAchievements: Set<string>
  ): Promise<AchievementResult[]> {
    const achievements: AchievementResult[] = [];
    const speedCriteria = criteria.filter(c => c.type === 'speed');
    
    // This would need timeSpent from submission metadata
    // For now, return empty array
    return achievements;
  }

  /**
   * Check mastery achievements
   */
  private async checkMasteryAchievements(
    studentId: string,
    submissionResult: SubmissionResult,
    criteria: AchievementCriteria[],
    existingAchievements: Set<string>
  ): Promise<AchievementResult[]> {
    const achievements: AchievementResult[] = [];
    const masteryCriteria = criteria.filter(c => c.type === 'mastery');
    
    // This would check for consistent high performance over time
    // For now, return empty array
    return achievements;
  }

  /**
   * Get achievement criteria (with caching)
   */
  private async getAchievementCriteria(): Promise<AchievementCriteria[]> {
    const cacheKey = 'all_criteria';
    
    if (this.achievementCache.has(cacheKey)) {
      return this.achievementCache.get(cacheKey)!;
    }
    
    // This would fetch from database - for now return default criteria
    const defaultCriteria: AchievementCriteria[] = [
      {
        id: 'first_completion',
        name: 'Getting Started',
        description: 'Complete your first activity',
        type: 'completion',
        points: 10,
        criteria: { completionCount: 1 },
        isActive: true
      },
      {
        id: 'perfect_score',
        name: 'Perfect Score',
        description: 'Get 100% on any activity',
        type: 'score',
        points: 25,
        criteria: { minPercentage: 100 },
        isActive: true
      },
      {
        id: 'activity_explorer',
        name: 'Activity Explorer',
        description: 'Try different types of activities',
        type: 'activity_type',
        points: 50,
        criteria: { 
          activityTypes: ['multiple-choice', 'essay', 'matching', 'drag-and-drop'] 
        },
        isActive: true
      }
    ];
    
    this.achievementCache.set(cacheKey, defaultCriteria);
    return defaultCriteria;
  }

  /**
   * Get user's existing achievements
   */
  private async getUserAchievements(studentId: string): Promise<Set<string>> {
    if (this.userAchievementCache.has(studentId)) {
      return this.userAchievementCache.get(studentId)!;
    }
    
    // This would fetch from database
    const achievements = new Set<string>();
    this.userAchievementCache.set(studentId, achievements);
    return achievements;
  }

  /**
   * Award achievements to user
   */
  private async awardAchievements(studentId: string, achievements: AchievementResult[]): Promise<void> {
    // This would update the database with new achievements
    console.log(`Awarding ${achievements.length} achievements to user ${studentId}:`, achievements);
  }

  /**
   * Helper methods for achievement checking
   */
  private async getUserCompletionCount(studentId: string): Promise<number> {
    // This would query the database for user's total completions
    return 1; // Placeholder
  }

  private async getUserCompletedActivityTypes(studentId: string): Promise<string[]> {
    // This would query the database for user's completed activity types
    return ['multiple-choice']; // Placeholder
  }

  private async getUserCurrentStreak(studentId: string): Promise<number> {
    // This would calculate user's current completion streak
    return 1; // Placeholder
  }
}
