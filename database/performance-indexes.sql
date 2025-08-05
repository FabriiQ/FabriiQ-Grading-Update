-- Performance Optimization Indexes for FabriQ Platform
-- Run this script to add critical indexes that will improve query performance
-- These indexes target the slow queries identified in the terminal logs

-- ============================================================================
-- CRITICAL INDEXES FOR TEACHER ROUTER PERFORMANCE
-- ============================================================================

-- Index for teacher_assignments table (used in getClassById - 9790ms)
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_teacher
ON "teacher_assignments"("classId", "teacherId");

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_status
ON "teacher_assignments"("teacherId", "status");

-- Index for student_enrollments table (used in class metrics - 9647ms)
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_active
ON "student_enrollments"("classId", "status");

CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_class
ON "student_enrollments"("studentId", "classId", "status");

-- Index for activities table (used in getRecentClassActivities - 9651ms)
CREATE INDEX IF NOT EXISTS idx_activities_class_status_created
ON "activities"("classId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_activities_class_status
ON "activities"("classId", "status");

-- Index for activity_grades table (used in class metrics)
CREATE INDEX IF NOT EXISTS idx_activity_grades_activity_status
ON "activity_grades"("activityId", "status");

CREATE INDEX IF NOT EXISTS idx_activity_grades_student_activity
ON "activity_grades"("studentId", "activityId", "status");

-- Index for assessments table (used in getUpcomingClassAssessments - 8362ms)
CREATE INDEX IF NOT EXISTS idx_assessments_class_status_due
ON "assessments"("classId", "status", "dueDate" ASC);

CREATE INDEX IF NOT EXISTS idx_assessments_class_due_date
ON "assessments"("classId", "dueDate" ASC) WHERE "status" = 'ACTIVE';

-- Index for assessment_submissions table
CREATE INDEX IF NOT EXISTS idx_assessment_submissions_assessment
ON "assessment_submissions"("assessmentId", "status");

CREATE INDEX IF NOT EXISTS idx_assessment_submissions_student
ON "assessment_submissions"("studentId", "assessmentId", "status");

-- Index for attendance table (used in class metrics)
CREATE INDEX IF NOT EXISTS idx_attendance_class_date
ON "attendance"("classId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_student_class_date
ON "attendance"("studentId", "classId", "createdAt" DESC);

-- ============================================================================
-- INDEXES FOR USER AND SESSION PERFORMANCE
-- ============================================================================

-- Index for users table lookups
CREATE INDEX IF NOT EXISTS idx_users_email_type
ON "users"("email", "userType");

CREATE INDEX IF NOT EXISTS idx_users_type_status
ON "users"("userType", "status");

-- Index for teacher_profiles table
CREATE INDEX IF NOT EXISTS idx_teacher_profiles_user
ON "teacher_profiles"("userId");

-- Index for student_profiles table
CREATE INDEX IF NOT EXISTS idx_student_profiles_user
ON "student_profiles"("userId");

-- ============================================================================
-- INDEXES FOR NOTIFICATION PERFORMANCE
-- ============================================================================

-- Index for notifications table (already optimized but ensuring coverage)
CREATE INDEX IF NOT EXISTS idx_notifications_user_status_created
ON "notifications"("userId", "status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_type_created
ON "notifications"("userId", "type", "createdAt" DESC);

-- ============================================================================
-- INDEXES FOR CLASS AND SUBJECT PERFORMANCE
-- ============================================================================

-- Index for classes table
CREATE INDEX IF NOT EXISTS idx_classes_status_created
ON "classes"("status", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_classes_teacher_status
ON "classes"("classTeacherId", "status");

-- Index for subjects table
CREATE INDEX IF NOT EXISTS idx_subjects_status
ON "subjects"("status");

-- Index for classes by campus and term
CREATE INDEX IF NOT EXISTS idx_classes_campus_term
ON "classes"("campusId", "termId") WHERE "status" = 'ACTIVE';

-- ============================================================================
-- INDEXES FOR ANALYTICS AND REPORTING
-- ============================================================================

-- Index for teacher_performance_metrics table
CREATE INDEX IF NOT EXISTS idx_teacher_performance_metrics_teacher_timeframe
ON "teacher_performance_metrics"("teacherId", "timeframe", "createdAt" DESC);

-- Index for student_performance_metrics table
CREATE INDEX IF NOT EXISTS idx_student_performance_metrics_student_timeframe
ON "student_performance_metrics"("studentId", "timeframe", "createdAt" DESC);

-- ============================================================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ============================================================================

-- Composite index for class activities with grades
CREATE INDEX IF NOT EXISTS idx_activities_class_status_created_with_grades
ON "activities"("classId", "status", "createdAt" DESC)
INCLUDE ("title", "maxScore");

-- Composite index for assessments with submissions
CREATE INDEX IF NOT EXISTS idx_assessments_class_due_with_submissions
ON "assessments"("classId", "dueDate" ASC, "status")
INCLUDE ("title", "maxScore");

-- Composite index for student enrollment with user data
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_status_with_user
ON "student_enrollments"("classId", "status")
INCLUDE ("studentId", "createdAt");

-- ============================================================================
-- PARTIAL INDEXES FOR ACTIVE RECORDS ONLY
-- ============================================================================

-- Partial indexes for active records only (more efficient)
CREATE INDEX IF NOT EXISTS idx_active_activities_class_created
ON "activities"("classId", "createdAt" DESC)
WHERE "status" = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_active_assessments_class_due
ON "assessments"("classId", "dueDate" ASC)
WHERE "status" = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_active_student_enrollments_class
ON "student_enrollments"("classId")
WHERE "status" = 'ACTIVE';

-- ============================================================================
-- MAINTENANCE COMMANDS
-- ============================================================================

-- Update table statistics for better query planning
ANALYZE "users";
ANALYZE "teacher_profiles";
ANALYZE "student_profiles";
ANALYZE "classes";
ANALYZE "activities";
ANALYZE "assessments";
ANALYZE "student_enrollments";
ANALYZE "teacher_assignments";
ANALYZE "activity_grades";
ANALYZE "assessment_submissions";
ANALYZE "attendance";
ANALYZE "notifications";

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if indexes were created successfully
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check table sizes and index usage
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
    AND tablename IN ('users', 'classes', 'activities', 'assessments', 'student_enrollments')
ORDER BY tablename, attname;
