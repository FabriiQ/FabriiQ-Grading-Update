/**
 * Content Moderation Hook
 * React hook for content moderation in forms and inputs
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { moderateText, type ModerationResult } from '@/lib/content-moderation';
import { toast } from 'sonner';

export interface UseContentModerationOptions {
  /** Whether to show warnings to the user */
  showWarnings?: boolean;
  /** Whether to prevent submission of blocked content */
  preventSubmission?: boolean;
  /** Whether to clean text automatically */
  autoClean?: boolean;
  /** Debounce delay for moderation checks (ms) */
  debounceDelay?: number;
  /** Custom warning messages */
  warningMessages?: {
    blocked?: string;
    warning?: string;
    review?: string;
  };
}

export interface UseContentModerationReturn {
  /** Current moderation result */
  moderationResult: ModerationResult | null;
  /** Whether the current text is allowed */
  isAllowed: boolean;
  /** Whether moderation is in progress */
  isChecking: boolean;
  /** Moderate text and return result */
  moderateText: (text: string) => ModerationResult;
  /** Check if text can be submitted */
  canSubmit: (text: string) => boolean;
  /** Get warning message for current moderation result */
  getWarningMessage: () => string | null;
  /** Get detailed error message with highlighted words */
  getDetailedErrorMessage: () => { message: string; blockedWords: string[] } | null;
  /** Clear current moderation result */
  clearResult: () => void;
}

export function useContentModeration(options: UseContentModerationOptions = {}): UseContentModerationReturn {
  const {
    showWarnings = true,
    preventSubmission = true,
    autoClean = false,
    debounceDelay = 300,
    warningMessages = {}
  } = options;

  const [moderationResult, setModerationResult] = useState<ModerationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const defaultWarningMessages = {
    blocked: 'This content contains inappropriate language and cannot be posted.',
    warning: 'Please review your content for appropriate language.',
    review: 'This content has been flagged for review.',
    ...warningMessages
  };

  const moderateTextCallback = useCallback((text: string): ModerationResult => {
    const result = moderateText(text);
    setModerationResult(result);

    // Show warnings if enabled
    if (showWarnings && !result.isAllowed) {
      const message = getWarningMessageForResult(result);
      if (message) {
        toast.warning(message);
      }
    }

    return result;
  }, [showWarnings]);

  const moderateTextDebounced = useCallback((text: string) => {
    setIsChecking(true);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      moderateTextCallback(text);
      setIsChecking(false);
    }, debounceDelay);

    setDebounceTimer(timer);
  }, [moderateTextCallback, debounceDelay, debounceTimer]);

  const canSubmit = useCallback((text: string): boolean => {
    if (!preventSubmission) return true;
    
    const result = moderateText(text);
    return result.suggestedAction === 'allow' || result.suggestedAction === 'warn';
  }, [preventSubmission]);

  const getWarningMessageForResult = (result: ModerationResult): string | null => {
    if (result.isAllowed) return null;

    switch (result.suggestedAction) {
      case 'block':
        return defaultWarningMessages.blocked;
      case 'review':
        return defaultWarningMessages.review;
      case 'warn':
        return defaultWarningMessages.warning;
      default:
        return null;
    }
  };

  const getWarningMessage = useCallback((): string | null => {
    if (!moderationResult) return null;
    return getWarningMessageForResult(moderationResult);
  }, [moderationResult]);

  const getDetailedErrorMessage = useCallback((): { message: string; blockedWords: string[] } | null => {
    if (!moderationResult || moderationResult.isAllowed) return null;

    // Remove duplicate words from the blocked words array
    const uniqueBlockedWords = [...new Set(moderationResult.blockedWords)];

    return {
      message: `Your message contains inappropriate words: ${uniqueBlockedWords.join(', ')}. Please remove these words to continue.`,
      blockedWords: uniqueBlockedWords
    };
  }, [moderationResult]);

  const clearResult = useCallback(() => {
    setModerationResult(null);
    setIsChecking(false);
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      setDebounceTimer(null);
    }
  }, [debounceTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    moderationResult,
    isAllowed: moderationResult?.isAllowed ?? true,
    isChecking,
    moderateText: moderateTextCallback,
    canSubmit,
    getWarningMessage,
    getDetailedErrorMessage,
    clearResult
  };
}

/**
 * Simple hook for basic text validation
 */
export function useTextValidation() {
  return useCallback((text: string): boolean => {
    const result = moderateText(text);
    return result.isAllowed;
  }, []);
}
