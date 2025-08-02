#!/usr/bin/env node
/**
 * Supabase Storage Setup Script (JavaScript version)
 * Creates and configures storage buckets with proper settings
 */

require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Storage configuration
const storageConfig = {
  buckets: {
    socialWall: 'social-wall',
    avatars: 'avatars',
    documents: 'documents',
    assessments: 'assessments',
  },
  bucketConfigs: {
    'social-wall': {
      public: true,
      allowedMimeTypes: ['image/*', 'video/*'],
      fileSizeLimit: '10MB',
    },
    'avatars': {
      public: true,
      allowedMimeTypes: ['image/*'],
      fileSizeLimit: '5MB',
    },
    'documents': {
      public: false,
      allowedMimeTypes: ['application/*', 'text/*'],
      fileSizeLimit: '50MB',
    },
    'assessments': {
      public: false,
      allowedMimeTypes: ['application/*', 'text/*', 'image/*'],
      fileSizeLimit: '25MB',
    },
  },
};

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Create a storage bucket with proper configuration
 */
async function createBucket(bucketName) {
  const result = {
    name: bucketName,
    created: false,
    configured: false,
    error: null,
  };

  try {
    console.log(`\n📁 Setting up bucket: ${bucketName}`);

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      result.error = `Failed to list buckets: ${listError.message}`;
      return result;
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);

    if (!bucketExists) {
      // Get bucket configuration
      const config = storageConfig.bucketConfigs[bucketName];
      
      if (!config) {
        result.error = `No configuration found for bucket: ${bucketName}`;
        return result;
      }

      console.log(`  Creating bucket with config:`, {
        public: config.public,
        allowedMimeTypes: config.allowedMimeTypes,
        fileSizeLimit: config.fileSizeLimit,
      });

      // Create the bucket
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: config.public,
        allowedMimeTypes: config.allowedMimeTypes,
        fileSizeLimit: config.fileSizeLimit,
      });

      if (createError) {
        result.error = `Failed to create bucket: ${createError.message}`;
        return result;
      }

      result.created = true;
      console.log(`  ✅ Created storage bucket: ${bucketName}`);
    } else {
      console.log(`  ℹ️  Storage bucket already exists: ${bucketName}`);
    }

    result.configured = true;
    return result;

  } catch (error) {
    result.error = error.message || 'Unknown error';
    console.error(`  ❌ Error setting up bucket ${bucketName}:`, error.message);
    return result;
  }
}

/**
 * Verify bucket setup by testing upload/delete permissions
 */
async function verifyBucketSetup(bucketName) {
  try {
    console.log(`  🔍 Verifying bucket ${bucketName}...`);

    // Test upload permission
    const testFile = new TextEncoder().encode('test');
    const testPath = `test/verification-${Date.now()}.txt`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(testPath, testFile, {
        contentType: 'text/plain',
      });

    if (uploadError) {
      console.log(`  ⚠️  Upload test failed for bucket ${bucketName}:`, uploadError.message);
      return false;
    }

    // Test delete permission
    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([testPath]);

    if (deleteError) {
      console.log(`  ⚠️  Delete test failed for bucket ${bucketName}:`, deleteError.message);
      return false;
    }

    console.log(`  ✅ Bucket ${bucketName} verification successful`);
    return true;

  } catch (error) {
    console.log(`  ❌ Verification failed for bucket ${bucketName}:`, error.message);
    return false;
  }
}

/**
 * Main setup function
 */
async function setupSupabaseStorage() {
  console.log('🚀 Starting Supabase Storage setup...');

  const summary = {
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

    console.log(`Setting up ${bucketNames.length} storage buckets...`);

    // Create each bucket
    for (const bucketName of bucketNames) {
      const result = await createBucket(bucketName);
      summary.results.push(result);

      if (result.error) {
        summary.failed++;
        console.log(`❌ Failed to setup bucket ${bucketName}: ${result.error}`);
      } else {
        if (result.created) summary.created++;
        if (result.configured) summary.configured++;
        console.log(`✅ Successfully setup bucket: ${bucketName}`);

        // Verify bucket setup
        const verified = await verifyBucketSetup(bucketName);
        if (!verified) {
          console.log(`⚠️  Bucket ${bucketName} setup verification failed`);
        }
      }
    }

    return summary;

  } catch (error) {
    console.error('Storage setup failed:', error);
    throw error;
  }
}

/**
 * Print setup summary
 */
function printSummary(summary) {
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

// Run the setup
setupSupabaseStorage()
  .then(summary => {
    printSummary(summary);
    process.exit(summary.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
