/**
 * Activity Grading Services Index
 * 
 * This file exports all activity grading functions for easy import
 * throughout the application.
 */

// Export all grading functions
export { gradeBookActivity } from './book';
export { gradeDragAndDropActivity } from './drag-and-drop';
export { gradeDragTheWordsActivity } from './drag-the-words';
export { gradeEssayActivity, gradeEssayActivityWithAI } from './essay';
export { gradeFillInTheBlanksActivity } from './fill-in-the-blanks';
export { gradeFlashCardsActivity } from './flash-cards';
export { gradeManualGradingActivity } from './manual-grading';
export { gradeMatchingActivity } from './matching';
export { gradeMultipleChoiceActivity } from './multiple-choice';
export { gradeMultipleResponseActivity } from './multiple-response';
export { gradeNumericActivity } from './numeric';
export { gradeQuizActivity } from './quiz';
export { gradeSequenceActivity } from './sequence';
export { gradeTrueFalseActivity } from './true-false';

// Export types from essay grading
export type {
  EssayActivity,
  EssaySubmissionData,
  EssayGradingResult,
  EssayGradingCriteria,
  EssayRubricCriterion,
  EssayFeedback,
  EssayAnalysisResult
} from './essay';
