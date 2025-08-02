'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/utils/api';
import { useToast } from '@/components/ui/feedback/toast';
import type { SubmissionConfig, SubmissionResult } from '../components/ui/UniversalActivitySubmit';

/**
 * Options for activity submission hook
 */
export interface UseActivitySubmissionOptions {
  onSubmissionStart?: () => void;
  onSubmissionComplete?: (result: SubmissionResult) => void;
  onSubmissionError?: (error: Error) => void;
  validateAnswers?: (answers: any) => boolean | string;
  enableAchievements?: boolean;
  enableAnalytics?: boolean;
}

/**
 * Return type for useActivitySubmission hook
 */
export interface UseActivitySubmissionReturn {
  // State
  isSubmitting: boolean;
  hasSubmitted: boolean;
  submissionResult: SubmissionResult | null;
  lastSubmissionTime: Date | null;
  
  // Actions
  submitActivity: (config: SubmissionConfig) => Promise<void>;
  resetSubmission: () => void;
  
  // Validation
  validateSubmission: (answers: any) => boolean | string;
}

/**
 * Custom hook for handling activity submissions
 * 
 * Provides a reusable interface for activity submission logic with:
 * - State management
 * - Error handling
 * - Achievement integration
 * - Analytics tracking
 * - Memory leak prevention
 */
export function useActivitySubmission(options: UseActivitySubmissionOptions = {}): UseActivitySubmissionReturn {
  const {
    onSubmissionStart,
    onSubmissionComplete,
    onSubmissionError,
    validateAnswers,
    enableAchievements = true,
    enableAnalytics = true,
  } = options;

  const { toast } = useToast();
  
  // Component state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [lastSubmissionTime, setLastSubmissionTime] = useState<Date | null>(null);
  
  // Refs for cleanup and preventing memory leaks
  const submissionInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  
  // API mutations
  const submitActivityMutation = api.activitySubmission.submit.useMutation();
  const triggerAchievementsMutation = api.achievements.triggerActivityCompletion.useMutation();
  const updateAnalyticsMutation = api.analytics.trackActivityCompletion.useMutation();

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      submissionInProgressRef.current = false;
    };
  }, []);

  /**
   * Validate submission data
   */
  const validateSubmission = useCallback((answers: any): boolean | string => {
    // Check if answers are provided
    if (!answers || (typeof answers === 'object' && Object.keys(answers).length === 0)) {
      return 'Please provide answers before submitting.';
    }
    
    // Custom validation if provided
    if (validateAnswers) {
      const validationResult = validateAnswers(answers);
      if (validationResult !== true) {
        return typeof validationResult === 'string' ? validationResult : 'Please complete all required fields.';
      }
    }
    
    return true;
  }, [validateAnswers]);

  /**
   * Submit activity with comprehensive error handling
   */
  const submitActivity = useCallback(async (config: SubmissionConfig) => {
    // Prevent duplicate submissions
    if (isSubmitting || hasSubmitted || submissionInProgressRef.current || !mountedRef.current) {
      return;
    }
    
    // Validate submission
    const validation = validateSubmission(config.answers);
    if (validation !== true) {
      toast({
        title: 'Validation Error',
        description: validation,
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
      
      // Prepare submission data with metadata
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
      
      // Process achievements and analytics in parallel (non-blocking)
      const promises: Promise<any>[] = [];
      
      if (enableAchievements) {
        promises.push(
          triggerAchievementsMutation.mutateAsync({
            activityId: config.activityId,
            studentId: config.studentId,
            submissionResult: result
          }).catch(error => {
            console.warn('Achievement processing failed:', error);
            return [];
          })
        );
      }
      
      if (enableAnalytics) {
        promises.push(
          updateAnalyticsMutation.mutateAsync({
            activityId: config.activityId,
            activityType: config.activityType,
            studentId: config.studentId,
            score: result.score,
            maxScore: result.maxScore,
            timeSpent: config.timeSpent,
            submissionData: config.answers
          }).catch(error => {
            console.warn('Analytics update failed:', error);
          })
        );
      }
      
      // Wait for achievements and analytics
      const results = await Promise.all(promises);
      const achievements = enableAchievements ? results[0] || [] : [];
      
      if (!mountedRef.current) return;
      
      // Create final result
      const finalResult: SubmissionResult = {
        ...result,
        achievements
      };
      
      // Update component state
      setSubmissionResult(finalResult);
      setHasSubmitted(true);
      setLastSubmissionTime(new Date());
      
      // Show success message
      toast({
        title: 'Activity Submitted',
        description: `Your submission has been recorded successfully. ${finalResult.score !== undefined ? `Score: ${finalResult.score}/${finalResult.maxScore}` : ''}`,
        variant: 'success'
      });
      
      // Call completion handler
      onSubmissionComplete?.(finalResult);
      
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
    isSubmitting,
    hasSubmitted,
    validateSubmission,
    onSubmissionStart,
    onSubmissionComplete,
    onSubmissionError,
    submitActivityMutation,
    triggerAchievementsMutation,
    updateAnalyticsMutation,
    enableAchievements,
    enableAnalytics,
    toast
  ]);

  /**
   * Reset submission state
   */
  const resetSubmission = useCallback(() => {
    if (mountedRef.current) {
      setIsSubmitting(false);
      setHasSubmitted(false);
      setSubmissionResult(null);
      setLastSubmissionTime(null);
    }
    submissionInProgressRef.current = false;
  }, []);

  return {
    // State
    isSubmitting,
    hasSubmitted,
    submissionResult,
    lastSubmissionTime,
    
    // Actions
    submitActivity,
    resetSubmission,
    
    // Validation
    validateSubmission,
  };
}

/**
 * Hook for optimized activity submission with caching
 */
export function useOptimizedActivitySubmission(
  options: UseActivitySubmissionOptions & {
    cacheKey?: string;
    staleTime?: number;
  } = {}
) {
  const baseHook = useActivitySubmission(options);
  
  // Add caching logic here if needed
  // For now, return the base hook
  return baseHook;
}
