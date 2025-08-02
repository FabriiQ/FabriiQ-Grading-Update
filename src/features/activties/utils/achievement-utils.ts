import { type AchievementConfig } from '../components/achievement/AchievementConfigEditor';

/**
 * Default achievement configuration
 */
export const DEFAULT_ACHIEVEMENT_CONFIG: AchievementConfig = {
  enableAchievements: true,
  enablePointsAnimation: true,
  celebrationLevel: 'standard',
  basePoints: 20,
  customPointsMultiplier: 1.0,
  bonusPointsForPerfectScore: 10,
  bonusPointsForSpeed: 5,
  bonusPointsForFirstAttempt: 5,
  enablePerfectScoreAchievement: true,
  enableSpeedAchievement: true,
  enableFirstAttemptAchievement: true,
  enableImprovementAchievement: true,
  speedBonusThreshold: 60,
  estimatedPoints: {
    minimum: 20,
    average: 30,
    maximum: 40
  }
};

/**
 * Activity type specific base points
 */
const ACTIVITY_TYPE_BASE_POINTS: Record<string, number> = {
  'multiple-choice': 20,
  'true-false': 15,
  'fill-in-the-blanks': 30,
  'matching': 35,
  'sequence': 35,
  'numeric': 30,
  'essay': 50,
  'quiz': 20,
  'reading': 10,
  'video': 15,
  'multiple-response': 25,
  'drag-and-drop': 30,
  'drag-the-words': 25,
  'flash-cards': 15,
};

/**
 * Extract achievement configuration from activity data
 * Falls back to default configuration if not found
 */
export function getAchievementConfig(activity: any): AchievementConfig {
  // Try to get achievement config from various possible locations
  let achievementConfig: Partial<AchievementConfig> | undefined;

  // Check if it's directly on the activity
  if (activity?.achievementConfig) {
    achievementConfig = activity.achievementConfig;
  }
  // Check if it's in the content
  else if (activity?.content?.achievementConfig) {
    achievementConfig = activity.content.achievementConfig;
  }
  // Check if it's in settings
  else if (activity?.settings?.achievementConfig) {
    achievementConfig = activity.settings.achievementConfig;
  }
  // Check if it's in metadata
  else if (activity?.metadata?.achievementConfig) {
    achievementConfig = activity.metadata.achievementConfig;
  }

  // Get activity type for base points
  const activityType = activity?.activityType || activity?.content?.activityType || 'default';
  const basePoints = ACTIVITY_TYPE_BASE_POINTS[activityType] || DEFAULT_ACHIEVEMENT_CONFIG.basePoints;

  // Merge with defaults
  const config: AchievementConfig = {
    ...DEFAULT_ACHIEVEMENT_CONFIG,
    basePoints,
    ...achievementConfig
  };

  // Recalculate estimated points based on the configuration
  const basePointsWithMultiplier = Math.floor(config.basePoints * config.customPointsMultiplier);
  const minimum = basePointsWithMultiplier;
  const average = Math.floor(basePointsWithMultiplier + (config.bonusPointsForFirstAttempt / 2));
  const maximum = Math.floor(
    basePointsWithMultiplier + 
    config.bonusPointsForPerfectScore + 
    config.bonusPointsForSpeed + 
    config.bonusPointsForFirstAttempt
  );

  config.estimatedPoints = { minimum, average, maximum };

  return config;
}

/**
 * Check if achievement configuration is enabled for an activity
 */
export function isAchievementEnabled(activity: any): boolean {
  const config = getAchievementConfig(activity);
  return config.enableAchievements;
}

/**
 * Get celebration level for an activity
 */
export function getCelebrationLevel(activity: any): 'minimal' | 'standard' | 'enthusiastic' {
  const config = getAchievementConfig(activity);
  return config.celebrationLevel;
}

/**
 * Check if points animation is enabled for an activity
 */
export function isPointsAnimationEnabled(activity: any): boolean {
  const config = getAchievementConfig(activity);
  return config.enablePointsAnimation;
}

/**
 * Get base points for an activity type
 */
export function getBasePointsForActivityType(activityType: string): number {
  return ACTIVITY_TYPE_BASE_POINTS[activityType] || DEFAULT_ACHIEVEMENT_CONFIG.basePoints;
}

/**
 * Create achievement configuration for a new activity
 */
export function createAchievementConfigForActivity(activityType: string, customConfig?: Partial<AchievementConfig>): AchievementConfig {
  const basePoints = getBasePointsForActivityType(activityType);
  
  const config: AchievementConfig = {
    ...DEFAULT_ACHIEVEMENT_CONFIG,
    basePoints,
    ...customConfig
  };

  // Recalculate estimated points
  const basePointsWithMultiplier = Math.floor(config.basePoints * config.customPointsMultiplier);
  const minimum = basePointsWithMultiplier;
  const average = Math.floor(basePointsWithMultiplier + (config.bonusPointsForFirstAttempt / 2));
  const maximum = Math.floor(
    basePointsWithMultiplier + 
    config.bonusPointsForPerfectScore + 
    config.bonusPointsForSpeed + 
    config.bonusPointsForFirstAttempt
  );

  config.estimatedPoints = { minimum, average, maximum };

  return config;
}
