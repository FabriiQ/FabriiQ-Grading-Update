# Unified Performance System Documentation

## Overview

The Unified Performance System provides a comprehensive, production-ready solution for tracking, analyzing, and reporting student performance across all activity types. This system eliminates data silos, ensures consistency, and enables real-time analytics with efficient database operations.

## Architecture

### Core Components

1. **Unified Data Models** (`src/server/api/models/unified-performance-models.ts`)
   - Standardized interfaces for all performance data
   - Type-safe schemas with Zod validation
   - Consistent metrics across all activity types

2. **Efficient Query Service** (`src/server/api/services/unified-performance-queries.ts`)
   - Optimized database queries with proper indexing
   - Query result caching for improved performance
   - Batch operations for bulk data processing

3. **Event-Driven Analytics** (`src/server/api/services/event-driven-analytics.ts`)
   - Real-time event processing system
   - Performance threshold detection
   - Automatic dashboard updates

4. **API Endpoints** (`src/server/api/routers/analytics.ts`)
   - RESTful API with proper authentication
   - Comprehensive error handling
   - Role-based access control

## Data Models

### BasePerformanceMetrics

The foundation interface that applies to all activity types:

```typescript
interface BasePerformanceMetrics {
  id: string;                    // Unique identifier
  studentId: string;             // Student who performed the activity
  activityId: string;            // Activity that was performed
  classId: string;               // Class context
  subjectId: string;             // Subject context
  topicId?: string;              // Optional topic context
  
  // Performance Data
  score: number;                 // Raw score achieved
  maxScore: number;              // Maximum possible score
  percentage: number;            // Calculated percentage (score/maxScore * 100)
  timeSpent: number;             // Time spent in seconds
  attemptCount: number;          // Number of attempts made
  engagementScore: number;       // Calculated engagement score (0-100)
  
  // Metadata
  gradingType: 'AUTO' | 'MANUAL' | 'AI' | 'HYBRID';
  activityType: string;          // Type of activity performed
  
  // Timestamps
  submittedAt: Date;             // When submitted
  startedAt: Date;               // When started
  completedAt: Date;             // When completed
  gradedAt: Date;                // When graded
  createdAt: Date;               // Record creation
  updatedAt: Date;               // Last update
}
```

### BloomsPerformanceData

Tracks cognitive level progression and mastery:

```typescript
interface BloomsPerformanceData {
  bloomsLevel?: BloomsTaxonomyLevel;           // Target Bloom's level
  demonstratedLevel?: BloomsTaxonomyLevel;     // Demonstrated level
  bloomsLevelScores?: Record<BloomsTaxonomyLevel, number>; // Detailed scores
  levelMastered: boolean;                      // Whether target level was mastered
  levelProgression: number;                    // Progression from previous attempts
}
```

### UnifiedPerformanceRecord

Complete performance record with all data:

```typescript
interface UnifiedPerformanceRecord extends BasePerformanceMetrics {
  bloomsData: BloomsPerformanceData;           // Bloom's taxonomy data
  metadata: Record<string, any>;              // Activity-specific metadata
  flags: {                                     // Performance flags for quick filtering
    isExceptional: boolean;                    // Score > 95%
    isStruggling: boolean;                     // Score < 60%
    isImproving: boolean;                      // Significant improvement trend
    needsAttention: boolean;                   // Teacher intervention recommended
    isFirstAttempt: boolean;                   // First attempt at this activity
    isRetake: boolean;                         // Retaking after previous attempt
  };
}
```

## Database Schema

### Performance Analytics Table

```sql
CREATE TABLE "performance_analytics" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL UNIQUE,
    "studentId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "topicId" TEXT,
    
    -- Performance metrics
    "score" DOUBLE PRECISION NOT NULL,
    "maxScore" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "attemptCount" INTEGER NOT NULL,
    "engagementScore" DOUBLE PRECISION NOT NULL,
    
    -- Bloom's taxonomy data
    "bloomsLevel" TEXT,
    "demonstratedLevel" TEXT,
    "bloomsLevelScores" JSONB,
    
    -- Metadata
    "gradingType" TEXT NOT NULL,
    "activityType" TEXT NOT NULL,
    "gradedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "performance_analytics_pkey" PRIMARY KEY ("id")
);

-- Optimized indexes for common queries
CREATE INDEX "performance_analytics_studentId_idx" ON "performance_analytics"("studentId");
CREATE INDEX "performance_analytics_activityId_idx" ON "performance_analytics"("activityId");
CREATE INDEX "performance_analytics_classId_idx" ON "performance_analytics"("classId");
CREATE INDEX "performance_analytics_subjectId_idx" ON "performance_analytics"("subjectId");
CREATE INDEX "performance_analytics_gradedAt_idx" ON "performance_analytics"("gradedAt");
CREATE INDEX "performance_analytics_percentage_idx" ON "performance_analytics"("percentage");
```

### Aggregated Performance Tables

For efficient dashboard queries:

```sql
-- Student performance summary by subject
CREATE TABLE "student_performance_metrics" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    
    -- Aggregate metrics
    "totalScore" DOUBLE PRECISION NOT NULL,
    "totalMaxScore" DOUBLE PRECISION NOT NULL,
    "activityCount" INTEGER NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL,
    "averagePercentage" DOUBLE PRECISION NOT NULL,
    "lastActivityDate" TIMESTAMP(3) NOT NULL,
    "totalTimeSpent" INTEGER NOT NULL,
    "averageEngagement" DOUBLE PRECISION NOT NULL,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_performance_metrics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "student_performance_metrics_studentId_subjectId_key" UNIQUE ("studentId", "subjectId")
);

-- Class activity performance summary
CREATE TABLE "class_activity_metrics" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    
    -- Aggregate metrics
    "submissionCount" INTEGER NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "averageScore" DOUBLE PRECISION NOT NULL,
    "averagePercentage" DOUBLE PRECISION NOT NULL,
    "lastSubmissionDate" TIMESTAMP(3) NOT NULL,
    "averageTimeSpent" DOUBLE PRECISION NOT NULL,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "class_activity_metrics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "class_activity_metrics_classId_activityId_key" UNIQUE ("classId", "activityId")
);
```

## API Usage

### Get Performance Records

```typescript
// Get performance records with filtering and pagination
const { data, pagination, insights } = await api.analytics.getPerformanceRecords.query({
  classIds: ['class123'],
  dateRange: { 
    from: new Date('2024-01-01'), 
    to: new Date() 
  },
  scoreRange: { min: 0, max: 100 },
  flags: { isStruggling: true },
  pagination: { page: 1, limit: 20 },
  sort: { field: 'gradedAt', direction: 'desc' },
  include: { 
    student: true, 
    activity: true,
    class: true 
  }
});
```

### Get Student Summary

```typescript
// Get comprehensive student performance summary
const summaries = await api.analytics.getStudentSummary.query({
  studentId: 'student123',
  subjectId: 'math101' // optional
});

// Access performance metrics
summaries.forEach(summary => {
  console.log(`Subject: ${summary.subject.name}`);
  console.log(`Average: ${summary.metrics.averagePercentage}%`);
  console.log(`Bloom's Level: ${summary.bloomsProgression.currentLevel}`);
  console.log(`Trend: ${summary.trends.scoresTrend}`);
});
```

### Get Real-Time Analytics

```typescript
// Get real-time analytics for dashboard
const analytics = await api.analytics.getRealTime.query({
  entityType: 'class',
  entityId: 'class123',
  timeWindow: 7 // last 7 days
});

// Access real-time data
console.log(`Total Students: ${analytics.totalStudents}`);
console.log(`Average Score: ${analytics.averageScore}%`);
console.log(`Recent Activity: ${analytics.recentActivity.length} items`);
console.log(`Alerts: ${analytics.performanceAlerts.length} unread`);
```

## Performance Optimizations

### Database Query Optimizations

1. **Proper Indexing**
   - Composite indexes for common query patterns
   - Partial indexes for filtered queries
   - JSONB indexes for Bloom's level queries

2. **Query Caching**
   - 5-minute cache for performance records
   - 30-second cache for real-time analytics
   - Automatic cache invalidation on data updates

3. **Batch Operations**
   - Bulk inserts for performance records
   - Parallel aggregation queries
   - Efficient pagination with cursor-based navigation

### Application Optimizations

1. **Efficient Data Structures**
   - Standardized interfaces reduce memory overhead
   - Lazy loading of related data
   - Optimized JSON serialization

2. **Real-Time Updates**
   - Event-driven architecture prevents polling
   - WebSocket-ready for live updates
   - Efficient delta updates for dashboards

## Event-Driven Architecture

### Grade Event Processing

When a student activity is graded:

1. **Event Triggered**: Grade event is emitted with performance data
2. **Analytics Updated**: Real-time analytics are recalculated
3. **Thresholds Checked**: Performance alerts are generated if needed
4. **Dashboards Notified**: Real-time dashboard updates are triggered
5. **Cache Invalidated**: Relevant cached data is cleared

### Performance Alerts

Automatic detection of:
- **Struggling Students**: Average < 60% over last 5 activities
- **Exceptional Performance**: Average > 95% over last 5 activities
- **Significant Improvement**: 15+ percentage point improvement
- **Engagement Issues**: Low engagement scores or excessive time

## Integration Guide

### Adding New Activity Types

1. **Register Activity Type**: Add to activity registry
2. **Implement Grading**: Use standardized grading interface
3. **Emit Events**: Trigger performance events after grading
4. **Test Analytics**: Verify analytics integration works correctly

### Custom Analytics

1. **Extend Models**: Add custom fields to metadata
2. **Create Queries**: Use UnifiedPerformanceQueryService
3. **Add Endpoints**: Extend analytics router
4. **Update UI**: Create dashboard components

## Monitoring and Maintenance

### Performance Monitoring

- Query execution times logged
- Cache hit rates tracked
- Event processing latency monitored
- Database connection pool usage

### Data Integrity

- Automated data validation
- Consistency checks between aggregated and raw data
- Regular cleanup of expired cache entries
- Performance alert accuracy verification

## Migration Guide

### From Legacy Systems

1. **Data Mapping**: Map existing data to unified models
2. **Batch Migration**: Use efficient batch operations
3. **Validation**: Verify data integrity after migration
4. **Gradual Rollout**: Phase migration by class or subject

### Database Migrations

```sql
-- Run the unified analytics migration
\i prisma/migrations/001_unified_analytics_system.sql

-- Verify indexes are created
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename LIKE '%performance%';

-- Check data integrity
SELECT COUNT(*) FROM performance_analytics;
SELECT COUNT(*) FROM student_performance_metrics;
```

This unified performance system provides a solid foundation for comprehensive learning analytics while maintaining high performance and data integrity.
