/**
 * Utility script to update activity viewers with achievement configuration support
 * 
 * This file documents the changes needed for each activity viewer to support
 * the new achievement configuration system.
 */

export const ACTIVITY_VIEWERS_TO_UPDATE = [
  'TrueFalseViewer',
  'FillInTheBlanksViewer', 
  'MatchingViewer',
  'MultipleResponseViewer',
  'SequenceViewer',
  'DragAndDropViewer',
  'DragTheWordsViewer',
  'FlashCardsViewer',
  'NumericViewer',
  'ReadingViewer',
  'VideoViewer',
  'EssayViewer'
];

export const REQUIRED_IMPORTS = `
import { type AchievementConfig } from '../achievement/AchievementConfigEditor';
import { getAchievementConfig } from '../../utils/achievement-utils';
`;

export const INTERFACE_ADDITION = `
  achievementConfig?: AchievementConfig; // Achievement configuration for points and rewards
`;

export const COMPONENT_PARAMETER_ADDITION = `
  achievementConfig
`;

export const ACHIEVEMENT_CONFIG_LOGIC = `
  // Get achievement configuration (use provided config or extract from activity)
  const finalAchievementConfig = achievementConfig || getAchievementConfig(activity);
`;

export const UNIVERSAL_SUBMIT_PROP_ADDITION = `
            achievementConfig={finalAchievementConfig}
`;

/**
 * Instructions for updating each activity viewer:
 * 
 * 1. Add imports for AchievementConfig and getAchievementConfig
 * 2. Add achievementConfig prop to the component interface
 * 3. Add achievementConfig parameter to the component function
 * 4. Add achievement configuration logic after state declarations
 * 5. Add achievementConfig prop to UniversalActivitySubmit component
 */

export const UPDATE_INSTRUCTIONS = {
  step1: 'Add required imports after existing imports',
  step2: 'Add achievementConfig prop to component interface',
  step3: 'Add achievementConfig parameter to component function',
  step4: 'Add achievement configuration logic after state declarations',
  step5: 'Add achievementConfig prop to UniversalActivitySubmit component'
};

/**
 * Example of complete update for a viewer:
 */
export const EXAMPLE_UPDATE = `
// Step 1: Add imports
import { type AchievementConfig } from '../achievement/AchievementConfigEditor';
import { getAchievementConfig } from '../../utils/achievement-utils';

// Step 2: Update interface
export interface ViewerProps {
  activity: Activity;
  // ... other props
  achievementConfig?: AchievementConfig; // Achievement configuration for points and rewards
}

// Step 3: Update component function
export const Viewer: React.FC<ViewerProps> = ({
  activity,
  // ... other params
  achievementConfig
}) => {
  // ... existing state

  // Step 4: Add achievement configuration logic
  const finalAchievementConfig = achievementConfig || getAchievementConfig(activity);

  // ... rest of component

  // Step 5: Update UniversalActivitySubmit
  <UniversalActivitySubmit
    // ... existing props
    achievementConfig={finalAchievementConfig}
  >
    Submit
  </UniversalActivitySubmit>
};
`;

/**
 * Validation checklist for each updated viewer:
 */
export const VALIDATION_CHECKLIST = [
  'Imports added correctly',
  'Interface updated with achievementConfig prop',
  'Component function parameters updated',
  'Achievement configuration logic added',
  'UniversalActivitySubmit updated with achievementConfig prop',
  'No TypeScript errors',
  'Component still renders correctly'
];
