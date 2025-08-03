'use client';

import { useState, useEffect } from 'react';
import { getRandomFact, EDUCATIONAL_FACTS } from '@/utils/query-config';

interface CustomFact {
  id: string;
  fact: string;
  category?: string;
  source?: string;
}

/**
 * Hook for displaying educational facts during loading states
 *
 * @param options Configuration options
 * @returns Object with current fact and functions to control facts
 */
export function useLoadingFacts(options: {
  isLoading?: boolean;
  interval?: number;
  category?: 'general' | 'math' | 'science' | 'language';
  autoRotate?: boolean;
  customFacts?: CustomFact[];
} = {}) {
  const {
    isLoading = false,
    interval = 5000,
    autoRotate = true,
    customFacts,
  } = options;

  // Use custom facts if provided, otherwise use default facts
  const factsArray = customFacts || EDUCATIONAL_FACTS.map(fact => ({ id: fact, fact, category: 'general' }));

  const [currentFact, setCurrentFact] = useState<CustomFact>(
    customFacts ? customFacts[0] : { id: getRandomFact(), fact: getRandomFact(), category: 'general' }
  );
  const [factIndex, setFactIndex] = useState<number>(0);

  // Update fact when loading state changes
  useEffect(() => {
    if (isLoading && factsArray.length > 0) {
      const randomIndex = Math.floor(Math.random() * factsArray.length);
      setCurrentFact(factsArray[randomIndex]);
      setFactIndex(randomIndex);
    }
  }, [isLoading, factsArray]);

  // Auto-rotate facts during extended loading
  useEffect(() => {
    if (!isLoading || !autoRotate || factsArray.length === 0) return;

    const timer = setInterval(() => {
      const newIndex = (factIndex + 1) % factsArray.length;
      setFactIndex(newIndex);
      setCurrentFact(factsArray[newIndex]);
    }, interval);

    return () => clearInterval(timer);
  }, [isLoading, interval, factIndex, autoRotate, factsArray]);

  // Function to manually get the next fact
  const nextFact = () => {
    if (factsArray.length === 0) return currentFact;
    const newIndex = (factIndex + 1) % factsArray.length;
    setFactIndex(newIndex);
    setCurrentFact(factsArray[newIndex]);
    return factsArray[newIndex];
  };

  // Function to manually get the previous fact
  const previousFact = () => {
    if (factsArray.length === 0) return currentFact;
    const newIndex = factIndex === 0 ? factsArray.length - 1 : factIndex - 1;
    setFactIndex(newIndex);
    setCurrentFact(factsArray[newIndex]);
    return factsArray[newIndex];
  };

  return {
    currentFact,
    nextFact,
    previousFact,
    factIndex,
  };
}
