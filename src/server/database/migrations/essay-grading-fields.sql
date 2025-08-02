-- Essay Grading Database Schema Extensions
-- This migration adds essay-specific fields to the ActivityGrade model
-- to support AI grading, manual override, and comprehensive essay analytics

-- Add essay-specific columns to activity_grades table
ALTER TABLE "activity_grades" 
ADD COLUMN IF NOT EXISTS "wordCount" INTEGER,
ADD COLUMN IF NOT EXISTS "aiScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "aiFeedback" TEXT,
ADD COLUMN IF NOT EXISTS "aiAnalysis" JSONB,
ADD COLUMN IF NOT EXISTS "aiConfidence" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "aiBloomsLevel" TEXT,
ADD COLUMN IF NOT EXISTS "manualOverride" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "finalScore" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "gradingMethod" TEXT,
ADD COLUMN IF NOT EXISTS "reviewRequired" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "reviewNotes" TEXT;

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS "activity_grades_aiScore_idx" ON "activity_grades"("aiScore");
CREATE INDEX IF NOT EXISTS "activity_grades_aiConfidence_idx" ON "activity_grades"("aiConfidence");
CREATE INDEX IF NOT EXISTS "activity_grades_manualOverride_idx" ON "activity_grades"("manualOverride");
CREATE INDEX IF NOT EXISTS "activity_grades_gradingMethod_idx" ON "activity_grades"("gradingMethod");
CREATE INDEX IF NOT EXISTS "activity_grades_reviewRequired_idx" ON "activity_grades"("reviewRequired");
CREATE INDEX IF NOT EXISTS "activity_grades_aiBloomsLevel_idx" ON "activity_grades"("aiBloomsLevel");
CREATE INDEX IF NOT EXISTS "activity_grades_wordCount_idx" ON "activity_grades"("wordCount");

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS "activity_grades_grading_workflow_idx" 
ON "activity_grades"("gradingMethod", "reviewRequired", "manualOverride");

CREATE INDEX IF NOT EXISTS "activity_grades_ai_quality_idx" 
ON "activity_grades"("aiScore", "aiConfidence") 
WHERE "aiScore" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "activity_grades_essay_analytics_idx" 
ON "activity_grades"("wordCount", "aiBloomsLevel", "gradingMethod") 
WHERE "wordCount" IS NOT NULL;

-- Add constraints for data integrity
ALTER TABLE "activity_grades" 
ADD CONSTRAINT "activity_grades_aiScore_range" 
CHECK ("aiScore" IS NULL OR ("aiScore" >= 0 AND "aiScore" <= 100));

ALTER TABLE "activity_grades" 
ADD CONSTRAINT "activity_grades_aiConfidence_range" 
CHECK ("aiConfidence" IS NULL OR ("aiConfidence" >= 0 AND "aiConfidence" <= 1));

ALTER TABLE "activity_grades" 
ADD CONSTRAINT "activity_grades_finalScore_range" 
CHECK ("finalScore" IS NULL OR ("finalScore" >= 0 AND "finalScore" <= 100));

ALTER TABLE "activity_grades" 
ADD CONSTRAINT "activity_grades_wordCount_positive" 
CHECK ("wordCount" IS NULL OR "wordCount" >= 0);

-- Add check constraint for valid grading methods
ALTER TABLE "activity_grades" 
ADD CONSTRAINT "activity_grades_gradingMethod_valid" 
CHECK ("gradingMethod" IS NULL OR "gradingMethod" IN ('AI', 'MANUAL', 'HYBRID'));

-- Add check constraint for valid Bloom's levels
ALTER TABLE "activity_grades" 
ADD CONSTRAINT "activity_grades_aiBloomsLevel_valid" 
CHECK ("aiBloomsLevel" IS NULL OR "aiBloomsLevel" IN (
  'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'
));

-- Create partial indexes for performance optimization
CREATE INDEX IF NOT EXISTS "activity_grades_pending_review_idx" 
ON "activity_grades"("activityId", "studentId", "submittedAt") 
WHERE "reviewRequired" = true AND "gradedAt" IS NULL;

CREATE INDEX IF NOT EXISTS "activity_grades_ai_graded_idx" 
ON "activity_grades"("aiScore", "aiConfidence", "gradedAt") 
WHERE "gradingMethod" = 'AI' AND "aiScore" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "activity_grades_manual_override_idx" 
ON "activity_grades"("finalScore", "gradedAt", "gradedById") 
WHERE "manualOverride" = true;

-- Add comments for documentation
COMMENT ON COLUMN "activity_grades"."wordCount" IS 'Word count for essay submissions';
COMMENT ON COLUMN "activity_grades"."aiScore" IS 'AI-generated score (0-100)';
COMMENT ON COLUMN "activity_grades"."aiFeedback" IS 'AI-generated feedback text';
COMMENT ON COLUMN "activity_grades"."aiAnalysis" IS 'Detailed AI analysis (grammar, structure, content, etc.)';
COMMENT ON COLUMN "activity_grades"."aiConfidence" IS 'AI confidence score (0-1)';
COMMENT ON COLUMN "activity_grades"."aiBloomsLevel" IS 'AI-detected Blooms taxonomy level';
COMMENT ON COLUMN "activity_grades"."manualOverride" IS 'Whether teacher manually overrode AI grade';
COMMENT ON COLUMN "activity_grades"."finalScore" IS 'Final score after manual review (if any)';
COMMENT ON COLUMN "activity_grades"."gradingMethod" IS 'Grading method: AI, MANUAL, or HYBRID';
COMMENT ON COLUMN "activity_grades"."reviewRequired" IS 'Whether manual review is required';
COMMENT ON COLUMN "activity_grades"."reviewNotes" IS 'Teacher notes during manual review';
