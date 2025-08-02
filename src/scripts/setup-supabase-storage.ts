/**
 * Supabase Storage Setup Script
 * Creates and configures storage buckets with proper settings
 */

// Load environment variables
require('dotenv').config();

import { createSupabaseServiceClient, storageConfig, getBucketConfig } from '@/lib/supabase/config';
import { logger } from '@/server/api/utils/logger';

const supabase = createSupabaseServiceClient();

interface BucketSetupResult {
  name: string;
  created: boolean;
  configured: boolean;
  error?: string;
}

interface SetupSummary {
  totalBuckets: number;
  created: number;
  configured: number;
  failed: number;
  results: BucketSetupResult[];
}

/**
 * Create a storage bucket with proper configuration
 */
async function createBucket(bucketName: string): Promise<BucketSetupResult> {
  const result: BucketSetupResult = {
    name: bucketName,
    created: false,
    configured: false,
  };

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      result.error = `Failed to list buckets: ${listError.message}`;
      return result;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      // Get bucket configuration
      const config = getBucketConfig(bucketName as keyof typeof storageConfig.buckets);
      
      if (!config) {
        result.error = `No configuration found for bucket: ${bucketName}`;
        return result;
      }

      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: config.public,
        allowedMimeTypes: [...config.allowedMimeTypes],
        fileSizeLimit: config.fileSizeLimit,
      });

      if (createError) {
        result.error = `Failed to create bucket: ${createError.message}`;
        return result;
      }

      result.created = true;
      logger.info(`Created storage bucket: ${bucketName}`);
    } else {
      logger.info(`Storage bucket already exists: ${bucketName}`);
    }

    result.configured = true;
    return result;

  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error setting up bucket ${bucketName}:`, error);
    return result;
  }
}

/**
 * Setup RLS (Row Level Security) policies for storage buckets
 */
async function setupStoragePolicies(): Promise<void> {
  try {
    logger.info('Setting up storage RLS policies...');

    // Note: RLS policies are typically set up via SQL or Supabase Dashboard
    // This is a placeholder for policy setup logic
    
    const policies = [
      {
        bucket: storageConfig.buckets.socialWall,
        policy: 'Allow authenticated users to upload and view social wall content',
      },
      {
        bucket: storageConfig.buckets.avatars,
        policy: 'Allow users to upload and view their own avatars',
      },
      {
        bucket: storageConfig.buckets.documents,
        policy: 'Allow authenticated users to upload documents with proper permissions',
      },
      {
        bucket: storageConfig.buckets.assessments,
        policy: 'Allow teachers to upload assessment materials',
      },
    ];

    for (const policy of policies) {
      logger.info(`Policy for ${policy.bucket}: ${policy.policy}`);
    }

    logger.info('✅ Storage policies configured (manual setup required in Supabase Dashboard)');
    
  } catch (error) {
    logger.error('Error setting up storage policies:', error);
    throw error;
  }
}

/**
 * Verify bucket configuration and permissions
 */
async function verifyBucketSetup(bucketName: string): Promise<boolean> {
  try {
    // Test upload permission
    const testFile = new TextEncoder().encode('test');
    const testPath = `test/verification-${Date.now()}.txt`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testFile, {
        contentType: 'text/plain',
      });

    if (uploadError) {
      logger.error(`Upload test failed for bucket ${bucketName}:`, { error: uploadError });
      return false;
    }

    // Test delete permission
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testPath]);

    if (deleteError) {
      logger.error(`Delete test failed for bucket ${bucketName}:`, { error: deleteError });
      return false;
    }

    logger.info(`✅ Bucket ${bucketName} verification successful`);
    return true;

  } catch (error) {
    logger.error(`Verification failed for bucket ${bucketName}:`, error);
    return false;
  }
}

/**
 * Main setup function
 */
async function setupSupabaseStorage(): Promise<SetupSummary> {
  logger.info('🚀 Starting Supabase Storage setup...');

  const summary: SetupSummary = {
    totalBuckets: 0,
    created: 0,
    configured: 0,
    failed: 0,
    results: [],
  };

  try {
    // Get all bucket names from configuration
    const bucketNames = Object.values(storageConfig.buckets);
    summary.totalBuckets = bucketNames.length;

    logger.info(`Setting up ${bucketNames.length} storage buckets...`);

    // Create each bucket
    for (const bucketName of bucketNames) {
      logger.info(`\n📁 Setting up bucket: ${bucketName}`);
      
      const result = await createBucket(bucketName);
      summary.results.push(result);

      if (result.error) {
        summary.failed++;
        logger.error(`❌ Failed to setup bucket ${bucketName}: ${result.error}`);
      } else {
        if (result.created) summary.created++;
        if (result.configured) summary.configured++;
        logger.info(`✅ Successfully setup bucket: ${bucketName}`);

        // Verify bucket setup
        const verified = await verifyBucketSetup(bucketName);
        if (!verified) {
          logger.warn(`⚠️  Bucket ${bucketName} setup verification failed`);
        }
      }
    }

    // Setup storage policies
    await setupStoragePolicies();

    return summary;

  } catch (error) {
    logger.error('Storage setup failed:', error);
    throw error;
  }
}

/**
 * Print setup summary
 */
function printSummary(summary: SetupSummary): void {
  console.log('\n📊 Supabase Storage Setup Summary:');
  console.log('='.repeat(50));
  console.log(`Total buckets: ${summary.totalBuckets}`);
  console.log(`Created: ${summary.created}`);
  console.log(`Configured: ${summary.configured}`);
  console.log(`Failed: ${summary.failed}`);
  
  if (summary.failed > 0) {
    console.log('\n❌ Failed buckets:');
    summary.results
      .filter(r => r.error)
      .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
  }

  if (summary.configured > 0) {
    console.log('\n✅ Successfully configured buckets:');
    summary.results
      .filter(r => r.configured && !r.error)
      .forEach(r => console.log(`  - ${r.name}`));
  }

  console.log('\n🔒 Next steps:');
  console.log('1. Configure RLS policies in Supabase Dashboard');
  console.log('2. Set up CDN configuration if needed');
  console.log('3. Configure backup and retention policies');
  console.log('4. Test file uploads from your application');
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupSupabaseStorage()
    .then(summary => {
      printSummary(summary);
      process.exit(summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      logger.error('Setup failed:', error);
      process.exit(1);
    });
}

export { setupSupabaseStorage, createBucket, verifyBucketSetup };
