-- Add category field to Assessment table
ALTER TABLE "assessments" ADD COLUMN "category" "AssessmentCategory";

-- Update existing assessments to have a default category based on templateId or set to ASSIGNMENT
UPDATE "assessments" 
SET "category" = CASE 
  WHEN "templateId" IS NOT NULL THEN (
    SELECT "category" FROM "assessment_templates" WHERE "id" = "assessments"."templateId"
  )
  ELSE 'ASSIGNMENT'
END
WHERE "category" IS NULL;
