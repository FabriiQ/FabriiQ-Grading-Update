'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/feedback/toast';
import { Loader2, CheckCircle, AlertCircle, RotateCcw, Award, Plus, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { type AchievementConfig } from '../achievement/AchievementConfigEditor';

/**
 * Configuration for activity submission
 */
export interface SubmissionConfig {
  activityId: string;
  activityType: string;
  studentId: string;
  answers: any;
  timeSpent: number;
  attemptNumber: number;
  metadata?: {
    startTime?: Date;
    endTime?: Date;
    interactionCount?: number;
    revisionCount?: number;
    [key: string]: any;
  };
}

/**
 * Result of activity submission
 */
export interface SubmissionResult {
  success: boolean;
  submissionId: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  feedback?: string;
  achievements?: Array<{
    id: string;
    name: string;
    description: string;
    points: number;
  }>;
  pointsAwarded?: number;
  gradingMethod?: 'auto' | 'manual' | 'hybrid';
  requiresManualReview?: boolean;
  error?: string;
}

/**
 * Props for UniversalActivitySubmit component
 */
export interface UniversalActivitySubmitProps {
  config: SubmissionConfig;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'default' | 'lg';
  
  // Event handlers
  onSubmissionStart?: () => void;
  onSubmissionComplete?: (result: SubmissionResult) => void;
  onSubmissionError?: (error: Error) => void;
  
  // Validation
  validateAnswers?: (answers: any) => boolean | string;
  
  // UI customization
  submitText?: string;
  submittingText?: string;
  successText?: string;
  tryAgainText?: string;
  showTryAgain?: boolean;
  autoReset?: boolean;
  resetDelay?: number; // milliseconds

  // Enhanced features
  showAchievements?: boolean;
  showPointsAnimation?: boolean;
  celebrationLevel?: 'minimal' | 'standard' | 'enthusiastic';
  customSuccessMessage?: string;

  // Achievement configuration
  achievementConfig?: AchievementConfig;
}

/**
 * UniversalActivitySubmit Component
 * 
 * A unified submission component that handles all activity types with:
 * - Consistent UI/UX across all activities
 * - Duplicate submission prevention
 * - Standardized error handling
 * - Achievement integration
 * - Analytics tracking
 * - Accessibility compliance
 */
export function UniversalActivitySubmit({
  config,
  disabled = false,
  className = '',
  children,
  variant = 'default',
  size = 'default',
  onSubmissionStart,
  onSubmissionComplete,
  onSubmissionError,
  validateAnswers,
  submitText = 'Submit Activity',
  submittingText = 'Submitting...',
  successText = 'Submitted Successfully!',
  tryAgainText = 'Try Again',
  showTryAgain = true,
  autoReset = false,
  resetDelay = 3000,
  showAchievements = true,
  showPointsAnimation = true,
  celebrationLevel = 'standard',
  customSuccessMessage,
  achievementConfig,
}: UniversalActivitySubmitProps) {
  const { toast } = useToast();
  
  // Component state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [achievementsToShow, setAchievementsToShow] = useState<any[]>([]);
  const [pointsEarned, setPointsEarned] = useState(0);
  
  // Refs for cleanup and preventing memory leaks
  const resetTimeoutRef = useRef<NodeJS.Timeout>();
  const submissionInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  
  // API mutations - using existing endpoints
  const submitActivityMutation = api.activity.autoGrade.useMutation();
  const triggerAchievementsMutation = api.achievement.createAchievement.useMutation();
  const updateAnalyticsMutation = api.analytics.trackEvent.useMutation();

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
      }
      submissionInProgressRef.current = false;
    };
  }, []);

  /**
   * Validate submission data
   */
  const validateSubmission = useCallback((): boolean | string => {
    // Check if answers are provided
    if (!config.answers || (typeof config.answers === 'object' && Object.keys(config.answers).length === 0)) {
      return 'Please provide answers before submitting.';
    }
    
    // Custom validation if provided
    if (validateAnswers) {
      const validationResult = validateAnswers(config.answers);
      if (validationResult !== true) {
        return typeof validationResult === 'string' ? validationResult : 'Please complete all required fields.';
      }
    }
    
    return true;
  }, [config.answers, validateAnswers]);

  /**
   * Calculate achievements and points based on configuration
   */
  const calculateAchievements = useCallback((submissionResult: any, timeSpent: number) => {
    if (!achievementConfig?.enableAchievements) {
      return {
        achievements: [],
        pointsAwarded: 0,
        celebrationData: null
      };
    }

    const achievements: Array<{
      id: string;
      name: string;
      description: string;
      points: number;
      type: string;
    }> = [];

    // Calculate base points
    const basePoints = Math.floor(achievementConfig.basePoints * achievementConfig.customPointsMultiplier);
    let totalPoints = basePoints;

    // Check for perfect score achievement
    if (achievementConfig.enablePerfectScoreAchievement && submissionResult.score === submissionResult.maxScore) {
      achievements.push({
        id: `perfect-score-${Date.now()}`,
        name: 'Perfect Score!',
        description: 'Achieved 100% on this activity',
        points: achievementConfig.bonusPointsForPerfectScore,
        type: 'perfect_score'
      });
      totalPoints += achievementConfig.bonusPointsForPerfectScore;
    }

    // Check for speed achievement
    if (achievementConfig.enableSpeedAchievement && timeSpent <= achievementConfig.speedBonusThreshold) {
      achievements.push({
        id: `speed-bonus-${Date.now()}`,
        name: 'Speed Demon!',
        description: `Completed in under ${achievementConfig.speedBonusThreshold} seconds`,
        points: achievementConfig.bonusPointsForSpeed,
        type: 'speed_bonus'
      });
      totalPoints += achievementConfig.bonusPointsForSpeed;
    }

    // Check for first attempt achievement (assuming this is tracked in metadata)
    if (achievementConfig.enableFirstAttemptAchievement && config.metadata?.attemptNumber === 1) {
      achievements.push({
        id: `first-attempt-${Date.now()}`,
        name: 'First Try Success!',
        description: 'Completed successfully on the first attempt',
        points: achievementConfig.bonusPointsForFirstAttempt,
        type: 'first_attempt'
      });
      totalPoints += achievementConfig.bonusPointsForFirstAttempt;
    }

    return {
      achievements,
      pointsAwarded: totalPoints,
      celebrationData: {
        level: achievementConfig.celebrationLevel,
        showAnimation: achievementConfig.enablePointsAnimation,
        totalPoints,
        achievements
      }
    };
  }, [achievementConfig, config.metadata]);

  /**
   * Handle activity submission with proper error handling and memory leak prevention
   */
  const handleSubmit = useCallback(async () => {
    // Prevent duplicate submissions
    if (isSubmitting || hasSubmitted || submissionInProgressRef.current || !mountedRef.current) {
      return;
    }
    
    // Validate submission
    const validation = validateSubmission();
    if (validation !== true) {
      toast({
        title: 'Validation Error',
        description: typeof validation === 'string' ? validation : 'Please complete all required fields.',
        variant: 'error'
      });
      return;
    }
    
    try {
      submissionInProgressRef.current = true;
      if (!mountedRef.current) return;
      
      setIsSubmitting(true);
      
      // Call submission start handler
      onSubmissionStart?.();
      
      // Prepare submission data
      const submissionData = {
        ...config,
        metadata: {
          ...config.metadata,
          endTime: new Date(),
          submissionTimestamp: new Date().toISOString(),
        }
      };
      
      // Submit activity
      const result = await submitActivityMutation.mutateAsync(submissionData);
      
      if (!mountedRef.current) return;
      
      // UPDATED: Calculate achievements based on configuration
      const achievementData = calculateAchievements(result, config.timeSpent || 0);

      // Process achievements and analytics in parallel (non-blocking)
      const achievementsPromise = achievementData.achievements.length > 0
        ? triggerAchievementsMutation.mutateAsync({
            type: 'activity_completion',
            title: `Activity Completed: ${config.activityType}`,
            description: `Student completed ${config.activityType} activity`,
            studentId: config.studentId,
            total: achievementData.pointsAwarded,
            achievements: achievementData.achievements
          }).catch(error => {
            console.warn('Achievement processing failed:', error);
            return achievementData.achievements; // Use calculated achievements as fallback
          })
        : Promise.resolve(achievementData.achievements);

      const analyticsPromise = updateAnalyticsMutation.mutateAsync({
        userId: config.studentId,
        category: 'activity',
        eventType: 'submission',
        metadata: {
          activityId: config.activityId,
          activityType: config.activityType,
          score: result.score,
          maxScore: result.maxScore || 100,
          timeSpent: config.timeSpent,
          submissionData: config.answers,
          achievementConfig: achievementConfig,
          pointsAwarded: achievementData.pointsAwarded
        }
      }).catch(error => {
        console.warn('Analytics update failed:', error);
      });

      // Wait for achievements and analytics
      const [achievements] = await Promise.all([achievementsPromise, analyticsPromise]);
      
      if (!mountedRef.current) return;
      
      // UPDATED: Create final result with calculated achievement data
      const finalResult: SubmissionResult = {
        success: true,
        submissionId: result.id,
        score: result.score ?? 0,
        maxScore: result.maxScore || 100,
        feedback: result.feedback ?? '',
        achievements: Array.isArray(achievements) ? achievements : [],
        pointsAwarded: achievementData.pointsAwarded
      };

      // Update component state
      setSubmissionResult(finalResult);
      setHasSubmitted(true);
      setLastSubmissionTime(new Date());

      // UPDATED: Handle achievements and points based on configuration
      if (finalResult.achievements && finalResult.achievements.length > 0 && showAchievements && achievementConfig?.enableAchievements) {
        setAchievementsToShow(finalResult.achievements);

        // Show celebration based on configuration
        if (achievementConfig.enablePointsAnimation) {
          setShowCelebration(true);
        }

        // Use calculated points from achievement data
        setPointsEarned(achievementData.pointsAwarded);
      } else {
        setPointsEarned(achievementData.pointsAwarded);
      }

      // UPDATED: Show enhanced success message with achievement-based points
      const successMessage = customSuccessMessage ||
        `Your submission has been recorded successfully! ${finalResult.score !== undefined ? `Score: ${finalResult.score}/${finalResult.maxScore}` : ''}${achievementData.pointsAwarded ? ` (+${achievementData.pointsAwarded} points)` : ''}`;

      toast({
        title: 'Activity Submitted',
        description: successMessage,
        variant: 'success'
      });

      // Call completion handler
      onSubmissionComplete?.(finalResult);

      // FIXED: Trigger real-time dashboard updates for consistent data propagation
      if (typeof window !== 'undefined') {
        // Dispatch custom events for real-time dashboard updates
        window.dispatchEvent(new CustomEvent('activity-submitted', {
          detail: {
            studentId: config.studentId,
            activityId: config.activityId,
            classId: config.classId,
            score: finalResult.score,
            maxScore: finalResult.maxScore,
            pointsEarned: pointsEarned,
            achievements: finalResult.achievements,
            timestamp: new Date().toISOString()
          }
        }));

        // Trigger dashboard refresh events
        window.dispatchEvent(new CustomEvent('dashboard-update-needed'));
        window.dispatchEvent(new CustomEvent('analytics-refresh-needed'));
        window.dispatchEvent(new CustomEvent('leaderboard-update-needed'));
      }

      // Auto-reset if enabled
      if (autoReset && showTryAgain && mountedRef.current) {
        resetTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            handleReset();
          }
        }, resetDelay);
      }
      
    } catch (error) {
      if (!mountedRef.current) return;
      
      console.error('Submission error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      toast({
        title: 'Submission Failed',
        description: errorMessage,
        variant: 'error'
      });
      
      // Call error handler
      onSubmissionError?.(error instanceof Error ? error : new Error(errorMessage));
      
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false);
      }
      submissionInProgressRef.current = false;
    }
  }, [
    config,
    isSubmitting,
    hasSubmitted,
    validateSubmission,
    onSubmissionStart,
    onSubmissionComplete,
    onSubmissionError,
    submitActivityMutation,
    triggerAchievementsMutation,
    updateAnalyticsMutation,
    toast,
    autoReset,
    showTryAgain,
    resetDelay
  ]);

  /**
   * Reset submission state for try again
   */
  const handleReset = useCallback(() => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current);
    }
    
    if (mountedRef.current) {
      setIsSubmitting(false);
      setHasSubmitted(false);
      setSubmissionResult(null);
      setLastSubmissionTime(null);
    }
    submissionInProgressRef.current = false;
  }, []);

  /**
   * Determine button content and state
   */
  const getButtonContent = () => {
    if (isSubmitting) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {submittingText}
        </>
      );
    }
    
    if (hasSubmitted && submissionResult?.success) {
      return (
        <>
          <CheckCircle className="mr-2 h-4 w-4" />
          {successText}
        </>
      );
    }
    
    if (hasSubmitted && !submissionResult?.success) {
      return (
        <>
          <AlertCircle className="mr-2 h-4 w-4" />
          Submission Failed
        </>
      );
    }
    
    return children || submitText;
  };

  /**
   * Determine if button should be disabled
   */
  const isButtonDisabled = disabled || isSubmitting || (hasSubmitted && !showTryAgain);

  // Enhanced rendering with animations and achievements
  return (
    <div className={cn('relative flex flex-col items-center gap-2', className)}>
      {/* Achievement celebration overlay */}
      <AnimatePresence>
        {showCelebration && achievementsToShow.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            className="absolute -top-16 left-1/2 transform -translate-x-1/2 z-10"
          >
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span className="text-sm font-medium">
                +{pointsEarned} points earned!
              </span>
              <Plus className="h-4 w-4" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main submit button with enhanced animations */}
      <motion.div
        whileHover={{ scale: isButtonDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isButtonDisabled ? 1 : 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {hasSubmitted && showTryAgain && submissionResult?.success ? (
          <Button
            variant="outline"
            size={size}
            onClick={handleReset}
            className="min-w-[140px] relative overflow-hidden"
            aria-label="Reset and try activity again"
          >
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {tryAgainText}
            </motion.div>
          </Button>
        ) : (
          <Button
            variant={variant}
            size={size}
            onClick={handleSubmit}
            disabled={isButtonDisabled}
            className={cn(
              'min-w-[140px] relative overflow-hidden transition-all duration-300',
              hasSubmitted && submissionResult?.success && 'bg-green-600 hover:bg-green-700',
              isSubmitting && 'animate-pulse',
              className
            )}
            aria-label={isSubmitting ? submittingText : submitText}
            aria-describedby={hasSubmitted ? 'submission-status' : undefined}
          >
            {/* Button content with enhanced animations */}
            <motion.div
              key={isSubmitting ? 'submitting' : hasSubmitted ? 'submitted' : 'ready'}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center"
            >
              {getButtonContent()}
            </motion.div>

            {/* Success ripple effect */}
            {hasSubmitted && submissionResult?.success && showPointsAnimation && (
              <motion.div
                initial={{ scale: 0, opacity: 0.5 }}
                animate={{ scale: 4, opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 bg-green-400 rounded-md"
              />
            )}
          </Button>
        )}
      </motion.div>

      {/* Achievement badges */}
      <AnimatePresence>
        {showAchievements && achievementsToShow.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex flex-wrap gap-1 justify-center max-w-xs"
          >
            {achievementsToShow.slice(0, 3).map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.1, type: "spring" }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1"
              >
                <Zap className="h-3 w-3" />
                <span>{achievement.name}</span>
              </motion.div>
            ))}
            {achievementsToShow.length > 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full"
              >
                +{achievementsToShow.length - 3} more
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submission timestamp */}
      {lastSubmissionTime && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-muted-foreground"
        >
          Last submitted: {lastSubmissionTime.toLocaleTimeString()}
        </motion.p>
      )}
    </div>
  );
}
