'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type LoadingStage = 
  | 'idle'
  | 'initializing'
  | 'loading-data'
  | 'processing'
  | 'rendering'
  | 'complete'
  | 'error';

export interface LoadingState {
  stage: LoadingStage;
  progress: number;
  message: string;
  isLoading: boolean;
  error: string | null;
  startTime: number | null;
  duration: number;
}

export interface LoadingOptions {
  minDuration?: number; // Minimum loading duration to prevent flashing
  stages?: Array<{
    stage: LoadingStage;
    message: string;
    duration?: number;
  }>;
  onStageChange?: (stage: LoadingStage) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * Advanced loading hook with staged loading, progress tracking, and smooth transitions
 */
export function useAdvancedLoading(options: LoadingOptions = {}) {
  const {
    minDuration = 500,
    stages = [
      { stage: 'initializing', message: 'Initializing...', duration: 200 },
      { stage: 'loading-data', message: 'Loading data...', duration: 300 },
      { stage: 'processing', message: 'Processing...', duration: 200 },
      { stage: 'rendering', message: 'Rendering...', duration: 100 },
    ],
    onStageChange,
    onComplete,
    onError,
  } = options;

  const [loadingState, setLoadingState] = useState<LoadingState>({
    stage: 'idle',
    progress: 0,
    message: '',
    isLoading: false,
    error: null,
    startTime: null,
    duration: 0,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const intervalRef = useRef<NodeJS.Timeout>();
  const stageIndexRef = useRef(0);

  // Calculate progress based on current stage
  const calculateProgress = useCallback((currentStage: LoadingStage): number => {
    const stageIndex = stages.findIndex(s => s.stage === currentStage);
    if (stageIndex === -1) return 0;
    
    return ((stageIndex + 1) / stages.length) * 100;
  }, [stages]);

  // Store callbacks in refs to avoid recreating them
  const onStageChangeRef = useRef(onStageChange);
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onStageChangeRef.current = onStageChange;
  }, [onStageChange]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Start loading with staged progression
  const startLoading = useCallback(async () => {
    const startTime = Date.now();
    stageIndexRef.current = 0;

    setLoadingState({
      stage: 'initializing',
      progress: 0,
      message: stages[0]?.message || 'Loading...',
      isLoading: true,
      error: null,
      startTime,
      duration: 0,
    });

    // Progress through stages
    const progressThroughStages = () => {
      const currentStageIndex = stageIndexRef.current;
      const currentStageConfig = stages[currentStageIndex];

      if (!currentStageConfig) {
        // All stages complete
        const totalDuration = Date.now() - startTime;
        const remainingTime = Math.max(0, minDuration - totalDuration);

        setTimeout(() => {
          setLoadingState(prev => ({
            ...prev,
            stage: 'complete',
            progress: 100,
            message: 'Complete',
            isLoading: false,
            duration: Date.now() - startTime,
          }));

          onCompleteRef.current?.();
        }, remainingTime);

        return;
      }

      // Update to current stage
      setLoadingState(prev => ({
        ...prev,
        stage: currentStageConfig.stage,
        progress: calculateProgress(currentStageConfig.stage),
        message: currentStageConfig.message,
        duration: Date.now() - startTime,
      }));

      onStageChangeRef.current?.(currentStageConfig.stage);

      // Move to next stage after duration
      timeoutRef.current = setTimeout(() => {
        stageIndexRef.current++;
        progressThroughStages();
      }, currentStageConfig.duration || 200);
    };

    progressThroughStages();
  }, [stages, minDuration, calculateProgress]);

  // Stop loading with error
  const stopWithError = useCallback((error: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    setLoadingState(prev => ({
      ...prev,
      stage: 'error',
      isLoading: false,
      error,
      duration: prev.startTime ? Date.now() - prev.startTime : 0,
    }));

    onErrorRef.current?.(error);
  }, []);

  // Force complete loading
  const forceComplete = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    setLoadingState(prev => ({
      ...prev,
      stage: 'complete',
      progress: 100,
      message: 'Complete',
      isLoading: false,
      duration: prev.startTime ? Date.now() - prev.startTime : 0,
    }));

    onCompleteRef.current?.();
  }, []);

  // Reset loading state
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    setLoadingState({
      stage: 'idle',
      progress: 0,
      message: '',
      isLoading: false,
      error: null,
      startTime: null,
      duration: 0,
    });

    stageIndexRef.current = 0;
  }, []);

  // Update stage manually
  const setStage = useCallback((stage: LoadingStage, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      stage,
      progress: calculateProgress(stage),
      message: message || prev.message,
      duration: prev.startTime ? Date.now() - prev.startTime : 0,
    }));

    onStageChangeRef.current?.(stage);
  }, [calculateProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      // Reset stage index
      stageIndexRef.current = 0;
    };
  }, []);

  return {
    ...loadingState,
    startLoading,
    stopWithError,
    forceComplete,
    reset,
    setStage,
  };
}

/**
 * Hook for managing multiple loading states
 */
export function useMultipleLoadingStates() {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map());

  const createLoader = useCallback((key: string, options?: LoadingOptions) => {
    const loader = useAdvancedLoading(options);
    
    // Update the map when loader state changes
    useEffect(() => {
      setLoadingStates(prev => new Map(prev.set(key, loader)));
    }, [loader]);

    return loader;
  }, []);

  const getLoadingState = useCallback((key: string): LoadingState | undefined => {
    return loadingStates.get(key);
  }, [loadingStates]);

  const isAnyLoading = useCallback((): boolean => {
    return Array.from(loadingStates.values()).some(state => state.isLoading);
  }, [loadingStates]);

  const getAllLoadingStates = useCallback((): LoadingState[] => {
    return Array.from(loadingStates.values());
  }, [loadingStates]);

  return {
    createLoader,
    getLoadingState,
    isAnyLoading,
    getAllLoadingStates,
    loadingStates: Object.fromEntries(loadingStates),
  };
}

/**
 * Hook for smooth loading transitions
 */
export function useSmoothLoading(duration: number = 300) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const show = useCallback(() => {
    setShouldRender(true);
    // Small delay to ensure DOM is ready
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const hide = useCallback(() => {
    setIsVisible(false);
    // Wait for transition to complete before removing from DOM
    setTimeout(() => setShouldRender(false), duration);
  }, [duration]);

  return {
    isVisible,
    shouldRender,
    show,
    hide,
    transitionStyle: {
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(-10px)',
      transition: `opacity ${duration}ms ease-in-out, transform ${duration}ms ease-in-out`,
    },
  };
}

/**
 * Hook for debounced loading states (prevents flashing for quick operations)
 */
export function useDebouncedLoading(delay: number = 200) {
  const [isLoading, setIsLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startLoading = useCallback(() => {
    setIsLoading(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setShowLoading(true);
    }, delay);
  }, [delay]);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setShowLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    showLoading,
    startLoading,
    stopLoading,
  };
}
