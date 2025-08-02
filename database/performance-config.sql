-- PostgreSQL Performance Optimization Configuration
-- Run as superuser or database administrator
-- This script optimizes PostgreSQL for the FabriQ platform

-- ============================================================================
-- CONNECTION AND MEMORY SETTINGS
-- ============================================================================

-- Increase max connections for better concurrency
ALTER SYSTEM SET max_connections = 200;

-- Shared buffers - should be 25% of total RAM (adjust based on your server)
ALTER SYSTEM SET shared_buffers = '256MB';

-- Effective cache size - should be 75% of total RAM (adjust based on your server)
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Work memory for sorting and hash operations
ALTER SYSTEM SET work_mem = '16MB';

-- Maintenance work memory for VACUUM, CREATE INDEX, etc.
ALTER SYSTEM SET maintenance_work_mem = '128MB';

-- ============================================================================
-- QUERY PERFORMANCE SETTINGS
-- ============================================================================

-- Random page cost (lower for SSD storage)
ALTER SYSTEM SET random_page_cost = 1.1;

-- Effective I/O concurrency (higher for SSD)
ALTER SYSTEM SET effective_io_concurrency = 200;

-- Statistics target for query planner
ALTER SYSTEM SET default_statistics_target = 100;

-- ============================================================================
-- LOGGING SETTINGS (DISABLE IN PRODUCTION FOR PERFORMANCE)
-- ============================================================================

-- Disable statement logging in production
ALTER SYSTEM SET log_statement = 'none';

-- Only log slow queries (queries taking more than 1 second)
ALTER SYSTEM SET log_min_duration_statement = 1000;

-- Log checkpoints for monitoring
ALTER SYSTEM SET log_checkpoints = on;

-- Log connections and disconnections
ALTER SYSTEM SET log_connections = off;
ALTER SYSTEM SET log_disconnections = off;

-- ============================================================================
-- CONNECTION POOLING AND PREPARED STATEMENTS
-- ============================================================================

-- Disable prepared transactions (not needed for most applications)
ALTER SYSTEM SET max_prepared_transactions = 0;

-- ============================================================================
-- AUTOVACUUM OPTIMIZATION
-- ============================================================================

-- More aggressive autovacuum for better performance
ALTER SYSTEM SET autovacuum_naptime = '30s';
ALTER SYSTEM SET autovacuum_vacuum_scale_factor = 0.1;
ALTER SYSTEM SET autovacuum_analyze_scale_factor = 0.05;

-- Increase autovacuum workers
ALTER SYSTEM SET autovacuum_max_workers = 4;

-- ============================================================================
-- CHECKPOINT AND WAL SETTINGS
-- ============================================================================

-- Checkpoint completion target
ALTER SYSTEM SET checkpoint_completion_target = 0.9;

-- WAL buffers
ALTER SYSTEM SET wal_buffers = '16MB';

-- WAL writer delay
ALTER SYSTEM SET wal_writer_delay = '200ms';

-- ============================================================================
-- RELOAD CONFIGURATION
-- ============================================================================

-- Reload the configuration (requires superuser privileges)
SELECT pg_reload_conf();

-- ============================================================================
-- CREATE ESSENTIAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_institution_status 
ON users(institution_id, status) WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username_status 
ON users(username, status) WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_status 
ON users(email, status) WHERE status = 'ACTIVE';

-- Session table indexes for NextAuth
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_user_expires 
ON "Session"(user_id, expires) WHERE expires > now();

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_session_token 
ON "Session"(session_token);

-- User permissions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permissions_active 
ON user_permissions(user_id, status) WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_permissions_permission 
ON user_permissions(permission_id, status) WHERE status = 'ACTIVE';

-- Campus access indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_campus_access_active 
ON user_campus_access(user_id, status) WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_campus_access_campus 
ON user_campus_access(campus_id, status) WHERE status = 'ACTIVE';

-- Student enrollments indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_enrollments_active 
ON student_enrollments(student_id, status) WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_student_enrollments_class 
ON student_enrollments(class_id, status) WHERE status = 'ACTIVE';

-- Teacher assignments indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teacher_assignments_active 
ON teacher_assignments(teacher_id, status) WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_teacher_assignments_class 
ON teacher_assignments(class_id, status) WHERE status = 'ACTIVE';

-- Activities indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_class_status 
ON activities(class_id, status) WHERE status = 'ACTIVE';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_activities_subject_status 
ON activities(subject_id, status) WHERE status = 'ACTIVE';

-- Assessment results indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_results_student 
ON assessment_results(student_id, created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assessment_results_activity 
ON assessment_results(activity_id, created_at);

-- Attendance indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_student_date 
ON attendance(student_id, date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_class_date 
ON attendance(class_id, date);

-- Analytics events indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_user_timestamp 
ON analytics_events(user_id, timestamp);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analytics_events_type_timestamp 
ON analytics_events(event_type, timestamp);

-- ============================================================================
-- VACUUM AND ANALYZE TABLES FOR IMMEDIATE PERFORMANCE IMPROVEMENT
-- ============================================================================

-- Analyze all tables to update statistics
ANALYZE;

-- ============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================================

-- View to monitor slow queries (use this to identify performance issues)
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE mean_time > 100  -- queries taking more than 100ms on average
ORDER BY mean_time DESC;

-- View to monitor database connections
CREATE OR REPLACE VIEW connection_stats AS
SELECT 
    state,
    count(*) as connections,
    max(now() - state_change) as max_duration
FROM pg_stat_activity 
WHERE state IS NOT NULL
GROUP BY state
ORDER BY connections DESC;

-- ============================================================================
-- MAINTENANCE RECOMMENDATIONS
-- ============================================================================

-- Run these commands periodically for maintenance:
-- 1. VACUUM ANALYZE; (weekly)
-- 2. REINDEX DATABASE your_database_name; (monthly)
-- 3. SELECT * FROM slow_queries; (daily monitoring)
-- 4. SELECT * FROM connection_stats; (daily monitoring)

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. Adjust memory settings based on your server's RAM
-- 2. Monitor the slow_queries view regularly
-- 3. Consider connection pooling (PgBouncer) for high-traffic applications
-- 4. Test these settings in a staging environment first
-- 5. Restart PostgreSQL after making system-level changes for full effect
