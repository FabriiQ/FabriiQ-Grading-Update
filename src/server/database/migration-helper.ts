/**
 * Database Migration Helper
 * 
 * Utilities for managing database schema migrations,
 * particularly for essay grading extensions.
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export class MigrationHelper {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Check if essay grading fields exist in the database
   */
  async checkEssayGradingFields(): Promise<boolean> {
    try {
      // Try to query one of the new essay fields
      await this.prisma.$queryRaw`
        SELECT "aiScore" FROM "activity_grades" LIMIT 1
      `;
      return true;
    } catch (error) {
      // If the column doesn't exist, the query will fail
      return false;
    }
  }

  /**
   * Apply essay grading schema extensions
   */
  async applyEssayGradingMigration(): Promise<void> {
    const migrationPath = path.join(__dirname, 'migrations', 'essay-grading-fields.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error('Essay grading migration file not found');
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    try {
      // Execute the migration in a transaction
      await this.prisma.$transaction(async (tx) => {
        // Split the SQL into individual statements
        const statements = migrationSQL
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
          if (statement.trim()) {
            await tx.$executeRawUnsafe(statement);
          }
        }
      });

      console.log('Essay grading migration applied successfully');
    } catch (error) {
      console.error('Error applying essay grading migration:', error);
      throw error;
    }
  }

  /**
   * Validate essay grading schema
   */
  async validateEssayGradingSchema(): Promise<{
    isValid: boolean;
    missingFields: string[];
    errors: string[];
  }> {
    const requiredFields = [
      'wordCount',
      'aiScore',
      'aiFeedback',
      'aiAnalysis',
      'aiConfidence',
      'aiBloomsLevel',
      'manualOverride',
      'finalScore',
      'gradingMethod',
      'reviewRequired',
      'reviewNotes'
    ];

    const missingFields: string[] = [];
    const errors: string[] = [];

    try {
      // Check if each field exists by querying the information schema
      for (const field of requiredFields) {
        try {
          const result = await this.prisma.$queryRaw`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'activity_grades' 
            AND column_name = ${field}
          ` as any[];

          if (result.length === 0) {
            missingFields.push(field);
          }
        } catch (error) {
          errors.push(`Error checking field ${field}: ${error}`);
        }
      }

      // Check if indexes exist
      const expectedIndexes = [
        'activity_grades_aiScore_idx',
        'activity_grades_aiConfidence_idx',
        'activity_grades_manualOverride_idx',
        'activity_grades_gradingMethod_idx',
        'activity_grades_reviewRequired_idx'
      ];

      for (const indexName of expectedIndexes) {
        try {
          const result = await this.prisma.$queryRaw`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'activity_grades' 
            AND indexname = ${indexName}
          ` as any[];

          if (result.length === 0) {
            errors.push(`Missing index: ${indexName}`);
          }
        } catch (error) {
          errors.push(`Error checking index ${indexName}: ${error}`);
        }
      }

      return {
        isValid: missingFields.length === 0 && errors.length === 0,
        missingFields,
        errors
      };
    } catch (error) {
      return {
        isValid: false,
        missingFields,
        errors: [`Validation error: ${error}`]
      };
    }
  }

  /**
   * Initialize essay grading schema if needed
   */
  async initializeEssayGradingSchema(): Promise<void> {
    console.log('Checking essay grading schema...');

    const hasFields = await this.checkEssayGradingFields();
    
    if (!hasFields) {
      console.log('Essay grading fields not found. Applying migration...');
      await this.applyEssayGradingMigration();
    } else {
      console.log('Essay grading fields already exist.');
    }

    // Validate the schema
    const validation = await this.validateEssayGradingSchema();
    
    if (!validation.isValid) {
      console.warn('Essay grading schema validation issues:');
      if (validation.missingFields.length > 0) {
        console.warn('Missing fields:', validation.missingFields);
      }
      if (validation.errors.length > 0) {
        console.warn('Errors:', validation.errors);
      }
    } else {
      console.log('Essay grading schema validation passed.');
    }
  }

  /**
   * Create sample essay grading data for testing
   */
  async createSampleEssayData(): Promise<void> {
    try {
      // This would create sample data for testing
      // Implementation depends on existing data structure
      console.log('Sample essay data creation would be implemented here');
    } catch (error) {
      console.error('Error creating sample essay data:', error);
      throw error;
    }
  }

  /**
   * Clean up essay grading data (for development/testing)
   */
  async cleanupEssayGradingData(): Promise<void> {
    try {
      await this.prisma.$executeRaw`
        UPDATE "activity_grades" 
        SET 
          "wordCount" = NULL,
          "aiScore" = NULL,
          "aiFeedback" = NULL,
          "aiAnalysis" = NULL,
          "aiConfidence" = NULL,
          "aiBloomsLevel" = NULL,
          "manualOverride" = false,
          "finalScore" = NULL,
          "gradingMethod" = NULL,
          "reviewRequired" = false,
          "reviewNotes" = NULL
        WHERE "gradingMethod" IS NOT NULL
      `;

      console.log('Essay grading data cleaned up successfully');
    } catch (error) {
      console.error('Error cleaning up essay grading data:', error);
      throw error;
    }
  }
}

/**
 * Utility function to get migration helper instance
 */
export function createMigrationHelper(prisma: PrismaClient): MigrationHelper {
  return new MigrationHelper(prisma);
}

/**
 * Auto-initialize essay grading schema on import (for development)
 */
export async function autoInitializeEssaySchema(prisma: PrismaClient): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    const helper = new MigrationHelper(prisma);
    await helper.initializeEssayGradingSchema();
  }
}
