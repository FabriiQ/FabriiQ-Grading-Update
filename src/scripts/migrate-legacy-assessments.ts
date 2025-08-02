/**
 * Migration Script for Legacy Assessments
 * 
 * This script migrates existing assessments from the legacy format
 * (questions stored in rubric field) to the enhanced format
 * (questions stored in content field).
 */

import { PrismaClient } from '@prisma/client';
import { EnhancedAssessmentService } from '../features/assessments/services/enhanced-assessment.service';

const prisma = new PrismaClient();

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ id: string; error: string }>;
}

async function migrateLegacyAssessments(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  try {
    console.log('🔍 Finding legacy assessments...');

    // Find assessments with rubric but no content (legacy assessments)
    const legacyAssessments = await prisma.assessment.findMany({
      where: {
        rubric: { not: null },
        content: null,
      },
      select: {
        id: true,
        title: true,
        rubric: true,
        category: true,
      },
    });

    stats.total = legacyAssessments.length;
    console.log(`📊 Found ${stats.total} legacy assessments to migrate`);

    if (stats.total === 0) {
      console.log('✅ No legacy assessments found. Migration complete!');
      return stats;
    }

    const enhancedService = new EnhancedAssessmentService(prisma);

    // Process each assessment
    for (const assessment of legacyAssessments) {
      try {
        console.log(`🔄 Migrating assessment: ${assessment.title} (${assessment.id})`);

        const rubricData = typeof assessment.rubric === 'string' 
          ? JSON.parse(assessment.rubric as string) 
          : assessment.rubric;

        // Check if rubric contains questions (indicating it's a legacy assessment)
        if (rubricData && rubricData.questions && Array.isArray(rubricData.questions)) {
          // Extract content from rubric
          const content = {
            assessmentType: assessment.category || 'QUIZ',
            description: rubricData.description,
            instructions: rubricData.instructions,
            questions: rubricData.questions,
            settings: {},
            metadata: {
              version: 'migrated_from_legacy',
              migrationDate: new Date().toISOString(),
              originalRubricKeys: Object.keys(rubricData),
            },
          };

          // Clean rubric (remove non-rubric data)
          const cleanRubric = { ...rubricData };
          delete cleanRubric.description;
          delete cleanRubric.instructions;
          delete cleanRubric.questions;

          // Update assessment with new structure
          await prisma.assessment.update({
            where: { id: assessment.id },
            data: {
              content: content,
              rubric: Object.keys(cleanRubric).length > 0 ? cleanRubric : null,
              questionSelectionMode: 'MANUAL', // Default to manual for migrated assessments
            },
          });

          stats.migrated++;
          console.log(`✅ Successfully migrated: ${assessment.title}`);
        } else {
          // Rubric doesn't contain questions, skip migration
          stats.skipped++;
          console.log(`⏭️  Skipped (no questions in rubric): ${assessment.title}`);
        }
      } catch (error) {
        stats.errors++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        stats.errorDetails.push({
          id: assessment.id,
          error: errorMessage,
        });
        console.error(`❌ Error migrating ${assessment.title} (${assessment.id}):`, errorMessage);
      }
    }

    // Print migration summary
    console.log('\n📈 Migration Summary:');
    console.log(`Total assessments found: ${stats.total}`);
    console.log(`Successfully migrated: ${stats.migrated}`);
    console.log(`Skipped (no questions): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (stats.errors > 0) {
      console.log('\n❌ Error Details:');
      stats.errorDetails.forEach(({ id, error }) => {
        console.log(`  - ${id}: ${error}`);
      });
    }

    return stats;
  } catch (error) {
    console.error('💥 Fatal error during migration:', error);
    throw error;
  }
}

async function validateMigration(): Promise<void> {
  console.log('\n🔍 Validating migration...');

  try {
    // Check for assessments that still have questions in rubric
    const remainingLegacy = await prisma.assessment.count({
      where: {
        rubric: {
          path: ['questions'],
          not: null,
        },
        content: null,
      },
    });

    // Check for assessments with enhanced content
    const enhancedCount = await prisma.assessment.count({
      where: {
        content: { not: null },
      },
    });

    console.log(`Remaining legacy assessments: ${remainingLegacy}`);
    console.log(`Enhanced assessments: ${enhancedCount}`);

    if (remainingLegacy === 0) {
      console.log('✅ Migration validation passed!');
    } else {
      console.log('⚠️  Some assessments may still need migration');
    }
  } catch (error) {
    console.error('❌ Error during validation:', error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting legacy assessment migration...\n');

    // Perform migration
    const stats = await migrateLegacyAssessments();

    // Validate migration
    await validateMigration();

    console.log('\n🎉 Migration completed successfully!');
    
    // Return stats for programmatic use
    return stats;
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { migrateLegacyAssessments, validateMigration, main as runMigration };
