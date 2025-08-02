// Learning Patterns Feature Exports

// Main Dashboard Component
export { LearningPatternsDashboard } from './components/LearningPatternsDashboard';

// Class-based Components
export { ClassLearningPatternsView } from './components/ClassLearningPatternsView';

// Individual Components
export { StudentLearningProfile } from './components/StudentLearningProfile';
export { StudentLearningProfileDetailed } from './components/StudentLearningProfileDetailed';
export { ClassLearningInsights } from './components/ClassLearningInsights';
export { AdaptiveRecommendations } from './components/AdaptiveRecommendations';
export { EarlyWarningSystem } from './components/EarlyWarningSystem';

// Types (re-export from service)
export type {
  LearningPattern,
  StudentLearningProfile as StudentLearningProfileType,
  PerformancePrediction,
  LearningPathOptimization
} from '@/server/api/services/learning-pattern-recognition.service';
