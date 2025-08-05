'use client';

import React, { useMemo, useCallback } from 'react';
import { 
  createDefaultMultipleChoiceActivity,
  MultipleChoiceActivity 
} from '../../models/multiple-choice';
import { 
  createDefaultTrueFalseActivity,
  TrueFalseActivity 
} from '../../models/true-false';
import { 
  createDefaultMultipleResponseActivity,
  MultipleResponseActivity 
} from '../../models/multiple-response';
import { 
  createDefaultFillInTheBlanksActivity,
  FillInTheBlanksActivity 
} from '../../models/fill-in-the-blanks';
import { 
  createDefaultMatchingActivity,
  MatchingActivity 
} from '../../models/matching';
import { 
  createDefaultDragAndDropActivity,
  DragAndDropActivity 
} from '../../models/drag-and-drop';
import { 
  createDefaultDragTheWordsActivity,
  DragTheWordsActivity 
} from '../../models/drag-the-words';
import { 
  createDefaultFlashCardsActivity,
  FlashCardsActivity 
} from '../../models/flash-cards';
import { 
  createDefaultNumericActivity,
  NumericActivity 
} from '../../models/numeric';
import { 
  createDefaultSequenceActivity,
  SequenceActivity 
} from '../../models/sequence';
import { 
  createDefaultReadingActivity,
  ReadingActivity 
} from '../../models/reading';
import { 
  createDefaultVideoActivity,
  VideoActivity 
} from '../../models/video';
import { 
  createDefaultBookActivity,
  BookActivity 
} from '../../models/book';
import { BaseActivity } from '../../models/base';

/**
 * Props expected by UnifiedActivityCreator for editor components
 */
interface UnifiedEditorProps {
  config: any;
  onChange: (config: any) => void;
  standalone?: boolean;
}

/**
 * Props expected by legacy activity editors
 */
interface LegacyEditorProps {
  activity: BaseActivity;
  onChange: (activity: BaseActivity) => void;
  onSave?: (activity: BaseActivity) => void;
  className?: string;
}

/**
 * Activity type to default creator function mapping
 */
const DEFAULT_ACTIVITY_CREATORS: Record<string, () => BaseActivity> = {
  'multiple-choice': createDefaultMultipleChoiceActivity,
  'true-false': createDefaultTrueFalseActivity,
  'multiple-response': createDefaultMultipleResponseActivity,
  'fill-in-the-blanks': createDefaultFillInTheBlanksActivity,
  'matching': createDefaultMatchingActivity,
  'drag-and-drop': createDefaultDragAndDropActivity,
  'drag-the-words': createDefaultDragTheWordsActivity,
  'flash-cards': createDefaultFlashCardsActivity,
  'numeric': createDefaultNumericActivity,
  'sequence': createDefaultSequenceActivity,
  'reading': createDefaultReadingActivity,
  'video': createDefaultVideoActivity,
  'book': createDefaultBookActivity,
};

/**
 * Higher-Order Component that adapts legacy activity editors to work with UnifiedActivityCreator
 *
 * This HOC:
 * 1. Converts config/onChange props to activity/onChange props
 * 2. Initializes activities with proper default values
 * 3. Handles the prop transformation seamlessly
 * 4. Maintains backward compatibility
 *
 * @param WrappedComponent - The legacy editor component to adapt
 * @param activityType - The activity type ID for default initialization
 */
export function withActivityEditorAdapter<T extends LegacyEditorProps>(
  WrappedComponent: React.ComponentType<T>,
  activityType: string
) {
  const AdaptedComponent = React.forwardRef<any, UnifiedEditorProps>((props, ref) => {
    const { config, onChange, standalone = false, ...otherProps } = props;
      
      // Get the default activity creator for this type
      const createDefaultActivity = DEFAULT_ACTIVITY_CREATORS[activityType];
      
      // Create or merge the activity from config
      const activity = useMemo(() => {
        if (!createDefaultActivity) {
          console.warn(`No default activity creator found for type: ${activityType}`);
          return config || {};
        }
        
        const defaultActivity = createDefaultActivity();
        
        // If config is provided, merge it with defaults
        if (config && typeof config === 'object') {
          return { ...defaultActivity, ...config };
        }
        
        return defaultActivity;
      }, [config, createDefaultActivity]);
      
      // Handle activity changes and convert back to config format
      const handleActivityChange = useCallback((updatedActivity: BaseActivity) => {
        if (onChange) {
          onChange(updatedActivity);
        }
      }, [onChange]);
      
      // Pass the adapted props to the wrapped component
      const adaptedProps = {
        ...otherProps,
        activity,
        onChange: handleActivityChange,
        className: '', // Default className
      };

      return <WrappedComponent ref={ref} {...(adaptedProps as T)} />;
    }
  );
  
  AdaptedComponent.displayName = `withActivityEditorAdapter(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return AdaptedComponent;
}

/**
 * Convenience function to create adapted editors for specific activity types
 */
export function createAdaptedEditor<T extends LegacyEditorProps>(
  EditorComponent: React.ComponentType<T>,
  activityType: string
) {
  return withActivityEditorAdapter(EditorComponent, activityType);
}

/**
 * Type guard to check if a component needs adaptation
 */
export function needsAdaptation(component: any): boolean {
  // Check if the component expects 'activity' prop instead of 'config'
  // This is a heuristic - in practice, you might want to use a more robust method
  return component && typeof component === 'function';
}

/**
 * Utility to automatically adapt an editor component if needed
 */
export function autoAdaptEditor(
  EditorComponent: React.ComponentType<any>,
  activityType: string
): React.ComponentType<UnifiedEditorProps> {
  // For now, always adapt since we know most editors need it
  // In the future, this could be more intelligent
  return createAdaptedEditor(EditorComponent, activityType) as React.ComponentType<UnifiedEditorProps>;
}
