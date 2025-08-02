'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ReadingActivity, ReadingSection } from '../../models/reading';
import { ActivityButton } from '../ui/ActivityButton';
import { AnimatedSubmitButton } from '../ui/AnimatedSubmitButton';
import { ProgressIndicator } from '../ui/ProgressIndicator';
import { ThemeWrapper } from '../ui/ThemeWrapper';
import { useActivityAnalytics } from '../../hooks/useActivityAnalytics';
import { cn } from '@/lib/utils';

// Animation styles
const readingAnimationStyles = `
  /* Section transition animation */
  @keyframes section-fade-in {
    0% { opacity: 0; transform: translateY(10px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  .section-fade-in {
    animation: section-fade-in 0.5s ease-out;
  }

  /* Highlight animation */
  @keyframes highlight-pulse {
    0% { background-color: rgba(31, 80, 75, 0.2); }
    50% { background-color: rgba(31, 80, 75, 0.3); }
    100% { background-color: rgba(31, 80, 75, 0.2); }
  }

  .highlight-pulse {
    animation: highlight-pulse 2s infinite;
  }

  /* Note animation */
  @keyframes note-appear {
    0% { opacity: 0; transform: scale(0.9); }
    100% { opacity: 1; transform: scale(1); }
  }

  .note-appear {
    animation: note-appear 0.3s ease-out;
  }

  /* Dictionary mode styles */
  .reading-content.dictionary-enabled {
    cursor: help;
  }

  .reading-content.dictionary-enabled p,
  .reading-content.dictionary-enabled span,
  .reading-content.dictionary-enabled li {
    position: relative;
  }

  .reading-content.dictionary-enabled p:hover,
  .reading-content.dictionary-enabled span:hover,
  .reading-content.dictionary-enabled li:hover {
    background-color: rgba(31, 80, 75, 0.05);
    border-radius: 2px;
  }

  /* High contrast mode for color blind users */
  @media (prefers-contrast: more) {
    .reading-content {
      line-height: 1.8 !important;
    }

    .reading-content h1, .reading-content h2, .reading-content h3 {
      border-bottom: 2px solid #000 !important;
    }

    .reading-content a {
      text-decoration: underline !important;
      font-weight: bold !important;
    }

    .reading-content blockquote {
      border-left: 4px solid #000 !important;
    }

    .reading-highlight {
      background-image: linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1) 75%, transparent 75%, transparent) !important;
      background-size: 10px 10px !important;
    }
  }
`;

export interface ReadingViewerProps {
  activity: ReadingActivity;
  mode?: 'student' | 'teacher';
  onComplete?: (result: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  submitButton?: React.ReactNode; // Universal submit button from parent
}

/**
 * Reading Activity Viewer
 *
 * This component displays a reading activity with:
 * - Rich text content
 * - Table of contents
 * - Text-to-speech functionality
 * - Highlighting
 * - Notes
 * - Progress tracking
 * - Accessibility features for color-blind users
 */
export const ReadingViewer: React.FC<ReadingViewerProps> = ({
  activity,
  mode = 'student',
  onComplete,
  onProgress,
  className,
  submitButton
}) => {
  // State for tracking current section and completion
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [readSections, setReadSections] = useState<Record<string, boolean>>({});
  const [highlights, setHighlights] = useState<Record<string, string[]>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [fontSize, setFontSize] = useState<number>(16);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showTableOfContents, setShowTableOfContents] = useState(
    activity.settings?.showTableOfContents !== false
  );

  // State for highlight mode
  const [isHighlightMode, setIsHighlightMode] = useState(false);

  // State for dictionary functionality
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [dictionaryData, setDictionaryData] = useState<any>(null);
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(false);
  const [showDictionary, setShowDictionary] = useState(false);
  const [dictionaryPosition, setDictionaryPosition] = useState({ x: 0, y: 0 });
  const [isDictionaryEnabled, setIsDictionaryEnabled] = useState(true);

  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Initialize analytics
  const analytics = useActivityAnalytics(activity.id, activity.activityType);

  // Close dictionary when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDictionary) {
        const target = event.target as HTMLElement;
        if (!target.closest('.fixed.z-50')) {
          setShowDictionary(false);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showDictionary) {
        setShowDictionary(false);
      }
    };

    if (showDictionary) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showDictionary]);

  // Add animation styles to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleElement = document.createElement('style');
      styleElement.textContent = readingAnimationStyles;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  // Create default sections if needed
  const defaultSection: ReadingSection = {
    id: 'default-section',
    title: 'Reading Content',
    content: (activity as any).content?.text || 'No content available.',
    media: undefined
  };

  // Ensure activity.sections exists with a default if not provided
  const sections = activity.sections || [defaultSection];

  // Current section with fallback
  const currentSection = sections[currentSectionIndex] || sections[0] || defaultSection;

  // Track progress
  useEffect(() => {
    if (!sections.length) return;

    // Calculate progress based on read sections
    const readSectionsCount = Object.values(readSections).filter(Boolean).length;
    const totalSections = sections.length;
    const progress = totalSections > 0 ? (readSectionsCount / totalSections) * 100 : 0;

    if (onProgress) {
      onProgress(progress);
    }

    // Check if all sections have been read
    if (readSectionsCount === totalSections && !isCompleted) {
      setIsCompleted(true);

      // Track completion in analytics
      analytics?.trackEvent('reading_complete', {
        activityId: activity.id,
        activityType: activity.activityType,
        sectionsRead: readSectionsCount,
        totalSections
      });

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete({
          completed: true,
          sectionsRead: readSectionsCount,
          totalSections
        });
      }
    }
  }, [readSections, sections, isCompleted, onProgress, onComplete, analytics, activity.id, activity.activityType]);

  // Mark section as read when viewed
  useEffect(() => {
    if (!currentSection) return;

    // Mark current section as read after a delay
    const timer = setTimeout(() => {
      setReadSections(prev => ({
        ...prev,
        [currentSection.id]: true
      }));

      // Track the interaction in analytics
      analytics?.trackInteraction('section_read', {
        activityId: activity.id,
        sectionId: currentSection.id,
        sectionTitle: currentSection.title
      });
    }, 2000); // Assume section is read after 2 seconds of viewing

    return () => clearTimeout(timer);
  }, [currentSection, analytics, activity.id]);

  // Handle text-to-speech
  const handleTextToSpeech = () => {
    if (!activity.settings?.enableTextToSpeech || !currentSection) return;

    if (isSpeaking) {
      // Stop speaking
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    } else {
      // Start speaking
      if (window.speechSynthesis) {
        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance();

        // Extract text from HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = currentSection.content;
        utterance.text = tempDiv.textContent || '';

        // Set language
        utterance.lang = 'en-US';

        // Set event handlers
        utterance.onend = () => {
          setIsSpeaking(false);
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
        };

        // Save reference
        speechSynthRef.current = utterance;

        // Speak
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);

        // Track the interaction in analytics
        analytics?.trackInteraction('text_to_speech', {
          activityId: activity.id,
          sectionId: currentSection.id,
          sectionTitle: currentSection.title
        });
      }
    }
  };



  // Handle highlighting toggle
  const handleHighlightToggle = () => {
    if (!activity.settings?.enableHighlighting) return;

    setIsHighlightMode(!isHighlightMode);

    // Apply cursor style to content
    if (contentRef.current) {
      if (!isHighlightMode) {
        contentRef.current.style.cursor = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23FFCC00\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z\'/%3E%3C/svg%3E") 0 24, text';
      } else {
        contentRef.current.style.cursor = 'text';
      }
    }
  };

  // Handle highlighting
  const handleHighlight = () => {
    if (!activity.settings?.enableHighlighting || !currentSection || !isHighlightMode) return;

    // Get selected text
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString().trim();
    if (!selectedText) return;

    // Add to highlights
    setHighlights(prev => {
      const sectionHighlights = prev[currentSection.id] || [];
      return {
        ...prev,
        [currentSection.id]: [...sectionHighlights, selectedText]
      };
    });

    // Visual feedback for highlighting
    if (contentRef.current) {
      // Create a temporary span to show highlight animation
      const range = selection.getRangeAt(0);
      const highlightSpan = document.createElement('span');
      highlightSpan.className = 'bg-yellow-200 dark:bg-yellow-900/30 animate-pulse';

      try {
        // Try to surround the selection with the highlight span
        range.surroundContents(highlightSpan);

        // Remove the temporary highlight after animation
        setTimeout(() => {
          // Only remove if the element still exists in the DOM
          if (highlightSpan.parentNode) {
            const parent = highlightSpan.parentNode;
            while (highlightSpan.firstChild) {
              parent.insertBefore(highlightSpan.firstChild, highlightSpan);
            }
            parent.removeChild(highlightSpan);
          }
        }, 1000);
      } catch (e) {
        console.log('Could not highlight selection: ', e);
      }
    }

    // Track the interaction in analytics
    analytics?.trackInteraction('text_highlight', {
      activityId: activity.id,
      sectionId: currentSection.id,
      sectionTitle: currentSection.title,
      highlightedText: selectedText
    });
  };

  // Handle adding a note
  const handleAddNote = () => {
    if (!activity.settings?.enableNotes || !currentSection) return;

    // Prompt for note
    const noteText = prompt('Add a note for this section:');
    if (!noteText) return;

    // Add to notes
    setNotes(prev => ({
      ...prev,
      [currentSection.id]: noteText
    }));

    // Track the interaction in analytics
    analytics?.trackInteraction('note_added', {
      activityId: activity.id,
      sectionId: currentSection.id,
      sectionTitle: currentSection.title
    });
  };

  // Handle dictionary lookup
  const handleDictionaryLookup = async (word: string, event: MouseEvent) => {
    if (!word || word.length < 2) return;

    // Clean the word (remove punctuation)
    const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
    if (!cleanWord) return;

    setSelectedWord(cleanWord);
    setIsDictionaryLoading(true);
    setShowDictionary(true);

    // Set position near the clicked word
    setDictionaryPosition({
      x: event.clientX,
      y: event.clientY
    });

    try {
      // Use Free Dictionary API
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${cleanWord}`);

      if (response.ok) {
        const data = await response.json();
        setDictionaryData(data[0]); // Use first result
      } else {
        // Fallback for words not found
        setDictionaryData({
          word: cleanWord,
          meanings: [{
            partOfSpeech: 'unknown',
            definitions: [{
              definition: 'Definition not found. This word may be a proper noun, technical term, or not in our dictionary.'
            }]
          }],
          phonetics: []
        });
      }
    } catch (error) {
      console.error('Dictionary lookup failed:', error);
      setDictionaryData({
        word: cleanWord,
        meanings: [{
          partOfSpeech: 'unknown',
          definitions: [{
            definition: 'Unable to fetch definition. Please check your internet connection.'
          }]
        }],
        phonetics: []
      });
    } finally {
      setIsDictionaryLoading(false);
    }

    // Track the interaction in analytics
    analytics?.trackInteraction('dictionary_lookup', {
      activityId: activity.id,
      sectionId: currentSection?.id,
      word: cleanWord
    });
  };

  // Handle word pronunciation
  const handlePronunciation = (word: string) => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);

      // Track the interaction in analytics
      analytics?.trackInteraction('word_pronunciation', {
        activityId: activity.id,
        word: word
      });
    }
  };

  // Handle font size change
  const handleFontSizeChange = (delta: number) => {
    if (!activity.settings?.fontSizeAdjustable) return;

    setFontSize(prev => {
      const newSize = prev + delta;
      // Limit font size between 12 and 24
      return Math.min(Math.max(newSize, 12), 24);
    });

    // Track the interaction in analytics
    analytics?.trackInteraction('font_size_change', {
      activityId: activity.id,
      newFontSize: fontSize + delta
    });
  };

  // Handle next section
  const handleNextSection = () => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);

      // Stop speaking if active
      if (isSpeaking) {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
      }

      // Track the interaction in analytics
      analytics?.trackInteraction('next_section', {
        activityId: activity.id,
        fromSection: currentSection.id,
        toSection: sections[currentSectionIndex + 1]?.id || 'unknown'
      });
    }
  };

  // Handle previous section
  const handlePreviousSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);

      // Stop speaking if active
      if (isSpeaking) {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
      }

      // Track the interaction in analytics
      analytics?.trackInteraction('previous_section', {
        activityId: activity.id,
        fromSection: currentSection.id,
        toSection: sections[currentSectionIndex - 1]?.id || 'unknown'
      });
    }
  };

  // Handle section selection from table of contents
  const handleSectionSelect = (index: number) => {
    setCurrentSectionIndex(index);

    // Stop speaking if active
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }

    // Smooth scroll to content
    if (contentRef.current) {
      contentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }

    // Track the interaction in analytics
    analytics?.trackInteraction('section_select', {
      activityId: activity.id,
      fromSection: currentSection.id,
      toSection: sections[index]?.id || 'unknown'
    });
  };

  // Calculate reading time estimate
  const getReadingTimeEstimate = () => {
    if (activity.settings?.readingTimeEstimate) {
      return activity.settings.readingTimeEstimate;
    }

    // Calculate based on content length (rough estimate)
    let totalWords = 0;

    sections.forEach(section => {
      // Extract text from HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = section.content;
      const text = tempDiv.textContent || '';

      // Count words
      totalWords += text.split(/\s+/).length;
    });

    // Average reading speed: 200-250 words per minute
    return Math.ceil(totalWords / 225) || 1; // Minimum 1 minute
  };

  // Render media content
  const renderMedia = (media: ReadingSection['media']) => {
    if (!media) return null;

    if (media.type === 'image' && media.url) {
      return (
        <div className="mb-4 max-w-full">
          <img
            src={media.url}
            alt={media.alt || 'Section image'}
            className="max-w-full object-contain rounded"
          />
          {media.caption && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
              {media.caption}
            </p>
          )}
        </div>
      );
    } else if (media.type === 'text' && media.content) {
      return (
        <div className="mb-4 max-w-full">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
            <p className="text-gray-800 dark:text-gray-200">
              {media.content}
            </p>
          </div>
          {media.caption && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 text-center">
              {media.caption}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Render table of contents
  const renderTableOfContents = () => {
    return (
      <div className="mb-6 p-4 border border-medium-teal/30 dark:border-medium-teal/20 rounded-lg bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium text-primary-green dark:text-medium-teal flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Table of Contents
          </h2>

          <button
            onClick={() => setShowTableOfContents(false)}
            className="p-2 min-h-[36px] min-w-[36px] bg-light-mint/70 dark:bg-primary-green/20 hover:bg-light-mint dark:hover:bg-primary-green/30 text-primary-green dark:text-medium-teal rounded flex items-center justify-center"
            aria-label="Hide table of contents"
            title="Hide table of contents"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className="space-y-2">
          {sections.map((section, index) => (
            <li key={section.id}>
              <button
                onClick={() => handleSectionSelect(index)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded transition-colors flex items-center",
                  {
                    "bg-light-mint dark:bg-primary-green/20 font-medium text-primary-green dark:text-medium-teal": index === currentSectionIndex,
                    "text-primary-green dark:text-medium-teal": readSections[section.id],
                    "hover:bg-light-mint/50 dark:hover:bg-primary-green/10": index !== currentSectionIndex
                  }
                )}
              >
                <span className={cn(
                  "inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 text-sm",
                  {
                    "bg-primary-green text-white": index === currentSectionIndex,
                    "bg-light-mint/70 text-primary-green dark:bg-primary-green/30 dark:text-medium-teal": readSections[section.id] && index !== currentSectionIndex,
                    "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300": !readSections[section.id] && index !== currentSectionIndex
                  }
                )}>{index + 1}</span>
                <span className="flex-1">{section.title}</span>
                {readSections[section.id] && (
                  <span className="ml-2 text-green-600 dark:text-green-400">✓</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <ThemeWrapper className={cn("w-full", className)}>
      {/* Activity header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{activity.title}</h1>
        {activity.description && (
          <p className="text-gray-600 dark:text-gray-300 mb-2">{activity.description}</p>
        )}

        <div className="flex flex-col md:flex-row justify-between gap-4">
          {activity.instructions && (
            <div className="bg-light-mint dark:bg-primary-green/20 p-3 rounded border border-medium-teal/50 dark:border-medium-teal/30 flex-1">
              <strong className="text-primary-green dark:text-medium-teal">Instructions:</strong>
              <span className="text-gray-700 dark:text-gray-200"> {activity.instructions}</span>
            </div>
          )}

          <div className="text-gray-600 dark:text-gray-400 text-sm flex items-center justify-end mt-2 md:mt-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Estimated reading time: {getReadingTimeEstimate()} min
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      {activity.settings?.showProgressBar !== false && (
        <div className="mb-4">
          <ProgressIndicator
            current={Object.values(readSections).filter(Boolean).length}
            total={activity.sections.length}
          />
          <div className="flex justify-center mt-3 space-x-1">
            {activity.sections.map((section, index) => (
              <div
                key={section.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-all cursor-pointer",
                  {
                    "bg-primary-green": readSections[section.id],
                    "bg-medium-teal/70 animate-pulse": index === currentSectionIndex && !readSections[section.id],
                    "bg-gray-300 dark:bg-gray-600": index !== currentSectionIndex && !readSections[section.id]
                  }
                )}
                title={section.title}
                onClick={() => handleSectionSelect(index)}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
            {Object.values(readSections).filter(Boolean).length} of {activity.sections.length} sections read
          </p>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-col md:flex-row gap-6">
        {/* Table of contents (sidebar) */}
        {showTableOfContents && (
          <div className="md:w-1/4">
            {renderTableOfContents()}
          </div>
        )}

        {/* Reading content */}
        <div className={cn(
          "flex-1",
          {
            "md:w-3/4": showTableOfContents,
            "w-full": !showTableOfContents
          }
        )}>
          {/* Dictionary instruction */}
          {isDictionaryEnabled && !isHighlightMode && (
            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <strong>Dictionary enabled:</strong> Select or double-click any word to see its definition and pronunciation.
              </p>
            </div>
          )}

          {/* Reading controls */}
          <div className="mb-4 flex flex-wrap gap-2">
            {!showTableOfContents && (
              <button
                onClick={() => setShowTableOfContents(true)}
                className="p-2 min-h-[44px] min-w-[44px] bg-light-mint/70 dark:bg-primary-green/20 hover:bg-light-mint dark:hover:bg-primary-green/30 text-primary-green dark:text-medium-teal rounded flex items-center justify-center"
                aria-label="Show table of contents"
                title="Show table of contents"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </button>
            )}

            {activity.settings?.enableTextToSpeech && (
              <button
                onClick={handleTextToSpeech}
                className={cn(
                  "p-2 min-h-[44px] min-w-[44px] rounded flex items-center justify-center",
                  isSpeaking
                    ? "bg-red-200 dark:bg-red-900/30 hover:bg-red-300 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300"
                    : "bg-light-mint/70 dark:bg-primary-green/20 hover:bg-light-mint dark:hover:bg-primary-green/30 text-primary-green dark:text-medium-teal"
                )}
                aria-label={isSpeaking ? "Stop reading" : "Read aloud"}
                title={isSpeaking ? "Stop reading" : "Read aloud"}
              >
                {isSpeaking ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                )}
              </button>
            )}

            {activity.settings?.enableHighlighting && (
              <button
                onClick={handleHighlightToggle}
                className={cn(
                  "p-2 min-h-[44px] min-w-[44px] rounded flex items-center justify-center",
                  isHighlightMode
                    ? "bg-yellow-300 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300"
                    : "bg-yellow-200 dark:bg-yellow-900/30 hover:bg-yellow-300 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300"
                )}
                aria-label={isHighlightMode ? "Exit highlight mode" : "Enter highlight mode"}
                title={isHighlightMode ? "Exit highlight mode" : "Enter highlight mode"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}

            {activity.settings?.enableNotes && (
              <button
                onClick={handleAddNote}
                className="p-2 min-h-[44px] min-w-[44px] bg-green-200 dark:bg-green-900/30 hover:bg-green-300 dark:hover:bg-green-900/50 text-green-800 dark:text-green-300 rounded flex items-center justify-center"
                aria-label="Add note"
                title="Add note"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            )}

            {activity.settings?.fontSizeAdjustable && (
              <div className="flex items-center">
                <button
                  onClick={() => handleFontSizeChange(-1)}
                  className="p-2 min-h-[44px] min-w-[44px] bg-light-mint/70 dark:bg-primary-green/20 hover:bg-light-mint dark:hover:bg-primary-green/30 text-primary-green dark:text-medium-teal rounded-l flex items-center justify-center"
                  aria-label="Decrease font size"
                  title="Decrease font size"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleFontSizeChange(1)}
                  className="p-2 min-h-[44px] min-w-[44px] bg-light-mint/70 dark:bg-primary-green/20 hover:bg-light-mint dark:hover:bg-primary-green/30 text-primary-green dark:text-medium-teal rounded-r flex items-center justify-center"
                  aria-label="Increase font size"
                  title="Increase font size"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              </div>
            )}

            {/* Dictionary toggle button */}
            <button
              onClick={() => setIsDictionaryEnabled(!isDictionaryEnabled)}
              className={cn(
                "p-2 min-h-[44px] min-w-[44px] rounded flex items-center justify-center",
                isDictionaryEnabled
                  ? "bg-blue-200 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400"
              )}
              aria-label={isDictionaryEnabled ? "Disable dictionary" : "Enable dictionary"}
              title={isDictionaryEnabled ? "Disable dictionary lookup" : "Enable dictionary lookup"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>
          </div>

          {/* Section content */}
          <div className="mb-6 p-6 border border-medium-teal/30 dark:border-medium-teal/20 rounded-lg bg-white dark:bg-gray-800 section-fade-in">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              {currentSection?.title}
            </h2>

            {/* Section media */}
            {currentSection?.media && renderMedia(currentSection.media)}

            {/* Rich text content */}
            <div
              ref={contentRef}
              className={cn(
                "reading-content section-fade-in prose dark:prose-invert max-w-none",
                "prose-headings:text-gray-900 dark:prose-headings:text-white",
                "prose-p:text-gray-800 dark:prose-p:text-gray-200",
                "prose-a:text-primary-green dark:prose-a:text-medium-teal",
                "prose-strong:text-gray-900 dark:prose-strong:text-white",
                "prose-li:text-gray-800 dark:prose-li:text-gray-200",
                {
                  "highlight-mode": isHighlightMode,
                  "dictionary-enabled": isDictionaryEnabled && !isHighlightMode
                }
              )}
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: currentSection?.content || '' }}
              onMouseUp={(e) => {
                if (isHighlightMode) {
                  handleHighlight();
                } else if (isDictionaryEnabled) {
                  // Handle word selection for dictionary
                  const selection = window.getSelection();
                  if (selection && !selection.isCollapsed) {
                    const selectedText = selection.toString().trim();
                    // Only lookup single words
                    if (selectedText && selectedText.split(' ').length === 1) {
                      handleDictionaryLookup(selectedText, e.nativeEvent);
                    }
                  }
                }
              }}
              onDoubleClick={(e) => {
                // Handle double-click for word lookup
                if (!isHighlightMode && isDictionaryEnabled) {
                  const target = e.target as HTMLElement;
                  const selection = window.getSelection();

                  // If there's a selection, use it
                  if (selection && !selection.isCollapsed) {
                    const selectedText = selection.toString().trim();
                    if (selectedText && selectedText.split(' ').length === 1) {
                      handleDictionaryLookup(selectedText, e.nativeEvent);
                      return;
                    }
                  }

                  // Otherwise, try to select the word at the click position
                  if (target.nodeType === Node.TEXT_NODE || target.textContent) {
                    const textNode = target.nodeType === Node.TEXT_NODE ? target : target.firstChild;
                    if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                      const text = textNode.textContent || '';
                      const clickX = e.clientX;

                      // Simple word boundary detection
                      const words = text.split(/\s+/);
                      let currentPos = 0;

                      for (const word of words) {
                        const wordStartPos = text.indexOf(word, currentPos);
                        const wordEndPos = wordStartPos + word.length;

                        // Create a temporary range to check position
                        const tempRange = document.createRange();
                        tempRange.setStart(textNode, wordStartPos);
                        tempRange.setEnd(textNode, wordEndPos);
                        const rect = tempRange.getBoundingClientRect();

                        if (clickX >= rect.left && clickX <= rect.right) {
                          // Clean the word and lookup
                          const cleanWord = word.replace(/[^\w]/g, '');
                          if (cleanWord.length > 1) {
                            handleDictionaryLookup(cleanWord, e.nativeEvent);
                          }
                          break;
                        }

                        currentPos = wordEndPos;
                      }
                    }
                  }
                }
              }}
              onTouchStart={(e) => {
                touchStartXRef.current = e.touches[0].clientX;
              }}
              onTouchEnd={(e) => {
                if (touchStartXRef.current !== null) {
                  const touchEndX = e.changedTouches[0].clientX;
                  const diff = touchStartXRef.current - touchEndX;

                  // Swipe threshold of 50px
                  if (Math.abs(diff) > 50) {
                    if (diff > 0 && currentSectionIndex < activity.sections.length - 1) {
                      // Swipe left - next section
                      handleNextSection();
                    } else if (diff < 0 && currentSectionIndex > 0) {
                      // Swipe right - previous section
                      handlePreviousSection();
                    }
                  }

                  touchStartXRef.current = null;
                }

                // Handle highlighting on touch devices
                if (isHighlightMode) {
                  handleHighlight();
                }
              }}
            />

            {/* Notes for this section */}
            {notes[currentSection?.id] && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg note-appear">
                <h3 className="text-lg font-medium mb-2 text-yellow-700 dark:text-yellow-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Your Notes
                </h3>
                <p className="text-gray-800 dark:text-gray-200 p-2 bg-white/50 dark:bg-gray-800/50 rounded border border-yellow-100 dark:border-yellow-900/30">
                  {notes[currentSection.id]}
                </p>
              </div>
            )}

            {/* Highlights for this section */}
            {highlights[currentSection?.id] && highlights[currentSection.id].length > 0 && (
              <div className="mt-6 p-4 bg-light-mint dark:bg-primary-green/20 border border-medium-teal/50 dark:border-medium-teal/30 rounded-lg">
                <h3 className="text-lg font-medium mb-2 text-primary-green dark:text-medium-teal flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Your Highlights
                </h3>
                <ul className="space-y-2">
                  {highlights[currentSection.id].map((highlight, index) => (
                    <li
                      key={index}
                      className="p-3 bg-light-mint/50 dark:bg-primary-green/10 rounded reading-highlight border border-medium-teal/20 dark:border-medium-teal/10"
                    >
                      "{highlight}"
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Dictionary popup */}
          {showDictionary && (
            <div
              className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl p-4 max-w-sm"
              style={{
                left: `${Math.min(dictionaryPosition.x, window.innerWidth - 350)}px`,
                top: `${Math.min(dictionaryPosition.y + 20, window.innerHeight - 300)}px`,
                maxHeight: '300px',
                overflowY: 'auto'
              }}
              role="dialog"
              aria-labelledby="dictionary-title"
              aria-modal="true"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 id="dictionary-title" className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                  {selectedWord}
                </h3>
                <button
                  onClick={() => setShowDictionary(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  aria-label="Close dictionary"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isDictionaryLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-green"></div>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Looking up definition...</span>
                </div>
              ) : dictionaryData ? (
                <div className="space-y-3">
                  {/* Pronunciation */}
                  {(dictionaryData.phonetics && dictionaryData.phonetics.length > 0) || dictionaryData.phonetic ? (
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                        /{dictionaryData.phonetics?.[0]?.text || dictionaryData.phonetic || 'pronunciation not available'}/
                      </span>
                      <button
                        onClick={() => handlePronunciation(selectedWord || '')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        aria-label="Play pronunciation"
                        title="Play pronunciation"
                      >
                        <svg className="w-4 h-4 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.586 8.586A2 2 0 0011.414 5.414L15 9v6l-3.586 3.586A2 2 0 009 17.414V6.586z" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Pronunciation not available</span>
                      <button
                        onClick={() => handlePronunciation(selectedWord || '')}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                        aria-label="Play pronunciation using text-to-speech"
                        title="Play pronunciation using text-to-speech"
                      >
                        <svg className="w-4 h-4 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.586 8.586A2 2 0 0011.414 5.414L15 9v6l-3.586 3.586A2 2 0 009 17.414V6.586z" />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Meanings */}
                  {dictionaryData.meanings && dictionaryData.meanings.length > 0 ? (
                    dictionaryData.meanings.slice(0, 3).map((meaning: any, index: number) => (
                      <div key={index} className="border-l-2 border-primary-green pl-3">
                        <div className="text-sm font-medium text-primary-green dark:text-medium-teal mb-1 capitalize">
                          {meaning.partOfSpeech}
                        </div>
                        {meaning.definitions.slice(0, 2).map((def: any, defIndex: number) => (
                          <div key={defIndex} className="mb-2">
                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                              {def.definition}
                            </p>
                            {def.example && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 italic mt-1 pl-2 border-l border-gray-300 dark:border-gray-600">
                                Example: "{def.example}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      No definitions available for this word.
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    No definition found for this word.
                  </p>
                  <button
                    onClick={() => handlePronunciation(selectedWord || '')}
                    className="text-xs text-primary-green dark:text-medium-teal hover:underline"
                  >
                    Try pronunciation anyway
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
            <ActivityButton
              onClick={handlePreviousSection}
              disabled={currentSectionIndex === 0}
              variant="secondary"
              icon="arrow-left"
              className="min-h-[44px]"
            >
              Previous Section
            </ActivityButton>

            {currentSectionIndex === sections.length - 1 ? (
              submitButton ? (
                // Use the universal submit button if provided
                React.cloneElement(submitButton as React.ReactElement, {
                  onClick: () => {
                    // Mark all sections as read
                    const allSections = {};
                    sections.forEach(section => {
                      allSections[section.id] = true;
                    });
                    setReadSections(allSections);
                    setIsCompleted(true);

                    // Track completion in analytics
                    analytics?.trackEvent('reading_complete', {
                      activityId: activity.id,
                      activityType: activity.activityType,
                      sectionsRead: sections.length,
                      totalSections: sections.length
                    });

                    if (onComplete) {
                      onComplete({
                        completed: true,
                        sectionsRead: sections.length,
                        totalSections: sections.length
                      });
                    }
                  },
                  disabled: false,
                  loading: false,
                  submitted: false,
                  className: "min-h-[44px]",
                  children: 'Complete Reading'
                })
              ) : (
                // Use AnimatedSubmitButton with reward integration
                <AnimatedSubmitButton
                  onClick={() => {
                    // Mark all sections as read
                    const allSections = {};
                    sections.forEach(section => {
                      allSections[section.id] = true;
                    });
                    setReadSections(allSections);
                    setIsCompleted(true);

                    // Track completion in analytics
                    analytics?.trackEvent('reading_complete', {
                      activityId: activity.id,
                      activityType: activity.activityType,
                      sectionsRead: sections.length,
                      totalSections: sections.length
                    });

                    if (onComplete) {
                      onComplete({
                        completed: true,
                        sectionsRead: sections.length,
                        totalSections: sections.length
                      });
                    }
                  }}
                  className="min-h-[44px] px-6 py-3"
                >
                  Complete Reading
                </AnimatedSubmitButton>
              )
            ) : (
              <ActivityButton
                onClick={handleNextSection}
                disabled={currentSectionIndex === sections.length - 1}
                variant="secondary"
                icon="arrow-right"
                className="min-h-[44px]"
              >
                Next Section
              </ActivityButton>
            )}
          </div>
        </div>
      </div>
    </ThemeWrapper>
  );
};

export default ReadingViewer;
