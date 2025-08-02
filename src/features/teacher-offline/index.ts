/**
 * Teacher Offline Feature Export
 * 
 * Centralized exports for all teacher offline functionality
 */

// Services
export { TeacherOfflineDBService, teacherOfflineDB } from './services/teacher-offline-db.service';
export { TeacherSyncManagerService } from './services/teacher-sync-manager.service';
export { TeacherOfflineGradingService } from './services/teacher-offline-grading.service';
export { TeacherStudentManagementService } from './services/teacher-student-management.service';
export { TeacherAssessmentToolsService } from './services/teacher-assessment-tools.service';
export { TeacherClassManagementService } from './services/teacher-class-management.service';

// Components
export { TeacherOfflineManager, useTeacherOffline } from './components/TeacherOfflineManager';
export { TeacherOfflineStatusIndicator } from './components/TeacherOfflineStatusIndicator';

// Types
export type {
  OfflineStudent,
  OfflineClass,
  OfflineGrade,
  OfflineAssessment,
  OfflineAttendance,
  SyncQueueItem,
} from './services/teacher-offline-db.service';

export type {
  SyncStatus,
  SyncConflict,
  SyncResult,
} from './services/teacher-sync-manager.service';

export type {
  GradeEntry,
  GradebookData,
  BulkGradeEntry,
} from './services/teacher-offline-grading.service';

export type {
  AttendanceEntry,
  BulkAttendanceEntry,
  StudentPerformanceData,
  ClassRoster,
} from './services/teacher-student-management.service';

export type {
  AssessmentTemplate,
  QuestionTemplate,
  RubricTemplate,
  RubricCriterion,
  RubricLevel,
  AssessmentAnalytics,
  QuestionAnalytics,
} from './services/teacher-assessment-tools.service';

export type {
  LessonPlan,
  LessonActivity,
  ClassSchedule,
  ScheduleEntry,
  ClassResource,
  ClassAnnouncement,
  ClassStatistics,
} from './services/teacher-class-management.service';
