-- CreateEnum for QuestionSelectionMode
CREATE TYPE "QuestionSelectionMode" AS ENUM ('MANUAL', 'AUTO', 'HYBRID');

-- AlterTable Assessment - Add enhanced quiz fields
ALTER TABLE "Assessment" ADD COLUMN "content" JSONB;
ALTER TABLE "Assessment" ADD COLUMN "questionSelectionMode" "QuestionSelectionMode" DEFAULT 'MANUAL';
ALTER TABLE "Assessment" ADD COLUMN "autoSelectionConfig" JSONB;
ALTER TABLE "Assessment" ADD COLUMN "questionPoolConfig" JSONB;
ALTER TABLE "Assessment" ADD COLUMN "enhancedSettings" JSONB;
ALTER TABLE "Assessment" ADD COLUMN "questionBankRefs" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add indexes for better performance
CREATE INDEX "Assessment_questionSelectionMode_idx" ON "Assessment"("questionSelectionMode");
CREATE INDEX "Assessment_questionBankRefs_idx" ON "Assessment" USING GIN("questionBankRefs");
CREATE INDEX "Assessment_content_idx" ON "Assessment" USING GIN("content");

-- Add comments for documentation
COMMENT ON COLUMN "Assessment"."content" IS 'Dedicated content field for storing assessment questions and metadata (replaces storing questions in rubric field)';
COMMENT ON COLUMN "Assessment"."questionSelectionMode" IS 'Mode for question selection: MANUAL (traditional), AUTO (from question bank), or HYBRID (mix of both)';
COMMENT ON COLUMN "Assessment"."autoSelectionConfig" IS 'Configuration for automatic question selection including criteria, distribution, and preferences';
COMMENT ON COLUMN "Assessment"."questionPoolConfig" IS 'Settings for question pool management and randomization';
COMMENT ON COLUMN "Assessment"."enhancedSettings" IS 'Advanced quiz configuration options like timing, attempts, feedback settings';
COMMENT ON COLUMN "Assessment"."questionBankRefs" IS 'Array of question bank question IDs referenced by this assessment';
