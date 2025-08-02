/**
 * Moderation Error Component
 * Displays content moderation errors with highlighted banned words
 */

'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModerationErrorProps {
  message: string;
  blockedWords: string[];
  originalText?: string;
  className?: string;
}

export function ModerationError({ 
  message, 
  blockedWords, 
  originalText, 
  className 
}: ModerationErrorProps) {
  // Function to highlight banned words in text
  const highlightBannedWords = (text: string, bannedWords: string[]) => {
    if (!text || bannedWords.length === 0) return text;

    let highlightedText = text;
    
    // Sort banned words by length (longest first) to avoid partial replacements
    const sortedWords = [...bannedWords].sort((a, b) => b.length - a.length);
    
    sortedWords.forEach((word) => {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        `<mark class="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-1 rounded font-medium">${word}</mark>`
      );
    });

    return highlightedText;
  };

  // Remove duplicate words from the blocked words array
  const uniqueBlockedWords = [...new Set(blockedWords)];

  return (
    <Alert variant="destructive" className={cn("border-red-500 bg-red-50 dark:border-red-600 dark:bg-red-950/50 shadow-md", className)}>
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
      <AlertDescription className="text-red-900 dark:text-red-100">
        <div className="space-y-3">
          <p className="font-semibold text-red-800 dark:text-red-200">{message}</p>

          {originalText && (
            <div className="mt-2">
              <p className="text-xs text-red-700 dark:text-red-300 mb-1 font-medium">
                Problematic words highlighted below:
              </p>
              <div
                className="text-sm p-3 bg-red-100 dark:bg-red-900/70 rounded-md border border-red-300 dark:border-red-700"
                dangerouslySetInnerHTML={{
                  __html: highlightBannedWords(originalText, uniqueBlockedWords)
                }}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-red-700 dark:text-red-300 font-medium">Blocked words:</span>
            {uniqueBlockedWords.map((word, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-1 text-xs font-semibold bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100 rounded-full border border-red-300 dark:border-red-600 shadow-sm"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Inline Moderation Error - smaller version for inline display
 */
export function InlineModerationError({ 
  message, 
  blockedWords, 
  className 
}: Omit<ModerationErrorProps, 'originalText'>) {
  return (
    <div className={cn("flex items-center space-x-2 text-sm text-red-600 dark:text-red-400", className)}>
      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      <span>{message}</span>
      {blockedWords.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {blockedWords.map((word, index) => (
            <span 
              key={index}
              className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded border border-red-200 dark:border-red-800"
            >
              {word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
