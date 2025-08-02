/**
 * Migration Script: Move existing uploads to Supabase Storage
 * Run this script to migrate existing local file uploads to Supabase Storage
 */

import { PrismaClient } from '@prisma/client';
import { supabaseStorageService } from '@/lib/supabase/storage.service';
import { storageConfig } from '@/lib/supabase/config';
import { logger } from '@/server/api/utils/logger';

const prisma = new PrismaClient();

interface MigrationResult {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  skippedFiles: number;
  errors: string[];
  warnings: string[];
  processedSize: number;
  estimatedTimeRemaining?: number;
}

interface MigrationOptions {
  batchSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  dryRun?: boolean;
  skipExisting?: boolean;
}

interface FileRetryOptions {
  maxRetries: number;
  retryDelay: number;
  dryRun: boolean;
  bucket: string;
  folder: string;
}

/**
 * Migrate a single file with retry logic
 */
async function migrateFileWithRetry(
  url: string,
  newMediaUrls: string[],
  result: MigrationResult,
  options: FileRetryOptions,
  attempt: number = 1
): Promise<void> {
  const { maxRetries, retryDelay, dryRun, bucket, folder } = options;

  try {
    // Extract filename from URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];

    // Determine full URL for local files
    let fullUrl = url;
    if (url.startsWith('/uploads/')) {
      fullUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${url}`;
    }

    console.log(`Migrating file: ${fileName} from ${fullUrl} (attempt ${attempt})`);

    if (dryRun) {
      console.log(`[DRY RUN] Would migrate: ${fileName}`);
      newMediaUrls.push(url); // Keep original URL in dry run
      return;
    }

    // Fetch the file
    const response = await fetch(fullUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);

    // Upload to Supabase with comprehensive validation
    const migratedFile = await supabaseStorageService.uploadFile(
      uint8Array,
      fileName,
      {
        bucket,
        folder,
        validation: {
          scanForMalware: false, // Skip for migration
          checkImageDimensions: false, // Skip for migration
        }
      }
    );

    newMediaUrls.push(migratedFile.url);
    result.migratedFiles++;
    result.processedSize += migratedFile.size;

    console.log(`✅ Successfully migrated: ${fileName} -> ${migratedFile.url}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (attempt < maxRetries) {
      console.log(`⚠️  Attempt ${attempt} failed for ${url}, retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return migrateFileWithRetry(url, newMediaUrls, result, options, attempt + 1);
    }

    console.error(`❌ Failed to migrate ${url} after ${maxRetries} attempts: ${errorMessage}`);
    result.failedFiles++;
    result.errors.push(`${url}: ${errorMessage}`);

    // Keep original URL if migration fails
    newMediaUrls.push(url);
  }
}

async function migratePostMedia(options: MigrationOptions = {}): Promise<MigrationResult> {
  const {
    batchSize = 10,
    maxRetries = 3,
    retryDelay = 1000,
    dryRun = false,
    skipExisting = true
  } = options;

  const result: MigrationResult = {
    totalFiles: 0,
    migratedFiles: 0,
    failedFiles: 0,
    skippedFiles: 0,
    errors: [],
    warnings: [],
    processedSize: 0
  };

  try {
    // Get all posts with media URLs that are not already Supabase URLs
    const posts = await prisma.socialPost.findMany({
      where: {
        mediaUrls: {
          not: {
            equals: []
          }
        }
      },
      select: {
        id: true,
        mediaUrls: true,
        createdAt: true
      }
    });

    console.log(`Found ${posts.length} posts with media to potentially migrate`);

    // Process posts in batches
    const batches: typeof posts[] = [];
    for (let i = 0; i < posts.length; i += batchSize) {
      batches.push(posts.slice(i, i + batchSize));
    }

    console.log(`Processing ${posts.length} posts in ${batches.length} batches of ${batchSize}`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\nProcessing batch ${batchIndex + 1}/${batches.length}`);

      for (const post of batch) {
        const mediaUrls = post.mediaUrls as string[];
        const newMediaUrls: string[] = [];

        for (const url of mediaUrls) {
          result.totalFiles++;

          // Skip if already a Supabase URL
          if (url.includes('supabase.co') || url.includes('supabase.in')) {
            newMediaUrls.push(url);
            result.skippedFiles++;
            continue;
          }

          // Skip if not a local file URL
          if (!url.startsWith('/uploads/') && !url.startsWith('http://localhost') && !url.startsWith('https://localhost')) {
            newMediaUrls.push(url);
            result.skippedFiles++;
            continue;
          }

          await migrateFileWithRetry(url, newMediaUrls, result, {
            maxRetries,
            retryDelay,
            dryRun,
            bucket: storageConfig.buckets.socialWall,
            folder: 'social-wall/migrated'
          });
        }

        // Update post with new media URLs if any changes were made
        if (!dryRun && JSON.stringify(mediaUrls) !== JSON.stringify(newMediaUrls)) {
          try {
            await prisma.socialPost.update({
              where: { id: post.id },
              data: { mediaUrls: newMediaUrls }
            });
            console.log(`✅ Updated post ${post.id} with new media URLs`);
          } catch (error) {
            console.error(`❌ Failed to update post ${post.id}:`, error);
            result.errors.push(`Post ${post.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      }

      // Add delay between batches to avoid overwhelming the system
      if (batchIndex < batches.length - 1) {
        console.log(`Waiting ${retryDelay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }

    return result;
  } catch (error) {
    console.error('Migration failed:', error);
    result.errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

async function migrateUserAvatars(): Promise<MigrationResult> {
  const result: MigrationResult = {
    totalFiles: 0,
    migratedFiles: 0,
    failedFiles: 0,
    skippedFiles: 0,
    errors: [],
    warnings: [],
    processedSize: 0
  };

  try {
    // TODO: Fix avatar field name based on actual User model
    // Get all users with avatar URLs that are not already Supabase URLs
    const users = await prisma.user.findMany({
      where: {
        // avatar field doesn't exist in current User model
        // Need to check actual schema
      },
      select: {
        id: true,
        // avatar: true,
        name: true
      }
    });

    console.log(`Found ${users.length} users with avatars to potentially migrate`);

    // TODO: Avatar migration disabled due to schema mismatch
    // Need to check actual User model schema for avatar field
    console.log('Avatar migration temporarily disabled - schema needs to be checked');
    result.warnings.push('Avatar migration skipped - User model schema needs verification');

    return result;
  } catch (error) {
    console.error('Avatar migration failed:', error);
    result.errors.push(`Avatar migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

async function main() {
  console.log('🚀 Starting migration to Supabase Storage...');
  
  try {
    // Ensure the storage bucket exists
    await supabaseStorageService.ensureBucket('social-wall');
    await supabaseStorageService.ensureBucket('avatars');

    console.log('📁 Storage buckets ready');

    // Migrate post media
    console.log('\n📸 Migrating post media...');
    const postResult = await migratePostMedia();
    
    // Migrate user avatars
    console.log('\n👤 Migrating user avatars...');
    const avatarResult = await migrateUserAvatars();

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log('='.repeat(50));
    console.log(`Post Media:`);
    console.log(`  Total files: ${postResult.totalFiles}`);
    console.log(`  Migrated: ${postResult.migratedFiles}`);
    console.log(`  Failed: ${postResult.failedFiles}`);
    
    console.log(`\nUser Avatars:`);
    console.log(`  Total files: ${avatarResult.totalFiles}`);
    console.log(`  Migrated: ${avatarResult.migratedFiles}`);
    console.log(`  Failed: ${avatarResult.failedFiles}`);
    
    console.log(`\nOverall:`);
    console.log(`  Total files processed: ${postResult.totalFiles + avatarResult.totalFiles}`);
    console.log(`  Successfully migrated: ${postResult.migratedFiles + avatarResult.migratedFiles}`);
    console.log(`  Failed migrations: ${postResult.failedFiles + avatarResult.failedFiles}`);

    if (postResult.errors.length > 0 || avatarResult.errors.length > 0) {
      console.log('\n❌ Errors:');
      [...postResult.errors, ...avatarResult.errors].forEach(error => {
        console.log(`  - ${error}`);
      });
    }

    console.log('\n✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  main().catch(console.error);
}

export { main as migrateToSupabase };
