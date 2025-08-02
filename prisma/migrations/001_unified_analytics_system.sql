-- Migration: Unified Analytics System
-- This migration creates the unified analytics tables and indexes for real-time analytics integration

-- Create PerformanceAnalytics table
CREATE TABLE "performance_analytics" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
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

-- Create StudentPerformanceMetrics table
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

    CONSTRAINT "student_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- Create ClassActivityMetrics table
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

    CONSTRAINT "class_activity_metrics_pkey" PRIMARY KEY ("id")
);

-- Create BloomsProgression table
CREATE TABLE "blooms_progression" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    
    -- Progression data
    "levelCounts" JSONB NOT NULL,
    "lastDemonstratedLevel" TEXT,
    "lastActivityDate" TIMESTAMP(3) NOT NULL,
    
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blooms_progression_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX "performance_analytics_submissionId_key" ON "performance_analytics"("submissionId");
CREATE UNIQUE INDEX "student_performance_metrics_studentId_subjectId_key" ON "student_performance_metrics"("studentId", "subjectId");
CREATE UNIQUE INDEX "class_activity_metrics_classId_activityId_key" ON "class_activity_metrics"("classId", "activityId");
CREATE UNIQUE INDEX "blooms_progression_studentId_subjectId_key" ON "blooms_progression"("studentId", "subjectId");

-- Create performance indexes
CREATE INDEX "performance_analytics_studentId_idx" ON "performance_analytics"("studentId");
CREATE INDEX "performance_analytics_activityId_idx" ON "performance_analytics"("activityId");
CREATE INDEX "performance_analytics_classId_idx" ON "performance_analytics"("classId");
CREATE INDEX "performance_analytics_subjectId_idx" ON "performance_analytics"("subjectId");
CREATE INDEX "performance_analytics_gradedAt_idx" ON "performance_analytics"("gradedAt");
CREATE INDEX "performance_analytics_percentage_idx" ON "performance_analytics"("percentage");
CREATE INDEX "performance_analytics_engagementScore_idx" ON "performance_analytics"("engagementScore");

CREATE INDEX "student_performance_metrics_studentId_idx" ON "student_performance_metrics"("studentId");
CREATE INDEX "student_performance_metrics_subjectId_idx" ON "student_performance_metrics"("subjectId");
CREATE INDEX "student_performance_metrics_classId_idx" ON "student_performance_metrics"("classId");
CREATE INDEX "student_performance_metrics_averagePercentage_idx" ON "student_performance_metrics"("averagePercentage");
CREATE INDEX "student_performance_metrics_lastActivityDate_idx" ON "student_performance_metrics"("lastActivityDate");

CREATE INDEX "class_activity_metrics_classId_idx" ON "class_activity_metrics"("classId");
CREATE INDEX "class_activity_metrics_activityId_idx" ON "class_activity_metrics"("activityId");
CREATE INDEX "class_activity_metrics_averagePercentage_idx" ON "class_activity_metrics"("averagePercentage");
CREATE INDEX "class_activity_metrics_lastSubmissionDate_idx" ON "class_activity_metrics"("lastSubmissionDate");

CREATE INDEX "blooms_progression_studentId_idx" ON "blooms_progression"("studentId");
CREATE INDEX "blooms_progression_subjectId_idx" ON "blooms_progression"("subjectId");
CREATE INDEX "blooms_progression_classId_idx" ON "blooms_progression"("classId");
CREATE INDEX "blooms_progression_lastDemonstratedLevel_idx" ON "blooms_progression"("lastDemonstratedLevel");
CREATE INDEX "blooms_progression_lastActivityDate_idx" ON "blooms_progression"("lastActivityDate");

-- Add foreign key constraints
ALTER TABLE "performance_analytics" ADD CONSTRAINT "performance_analytics_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "activity_grades"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "performance_analytics" ADD CONSTRAINT "performance_analytics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "performance_analytics" ADD CONSTRAINT "performance_analytics_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "performance_analytics" ADD CONSTRAINT "performance_analytics_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "performance_analytics" ADD CONSTRAINT "performance_analytics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "performance_analytics" ADD CONSTRAINT "performance_analytics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "subject_topics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "student_performance_metrics" ADD CONSTRAINT "student_performance_metrics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_performance_metrics" ADD CONSTRAINT "student_performance_metrics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "student_performance_metrics" ADD CONSTRAINT "student_performance_metrics_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "class_activity_metrics" ADD CONSTRAINT "class_activity_metrics_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "class_activity_metrics" ADD CONSTRAINT "class_activity_metrics_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blooms_progression" ADD CONSTRAINT "blooms_progression_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blooms_progression" ADD CONSTRAINT "blooms_progression_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blooms_progression" ADD CONSTRAINT "blooms_progression_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
