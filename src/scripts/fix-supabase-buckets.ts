/**
 * Script to fix Supabase bucket configuration
 * Ensures buckets are public and properly configured
 */

import { createSupabaseServiceClient, storageConfig } from '@/lib/supabase/config';

async function fixSupabaseBuckets() {
  const supabase = createSupabaseServiceClient();
  
  console.log('🔧 Fixing Supabase bucket configuration...');
  
  try {
    // List all buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return;
    }
    
    console.log('📋 Current buckets:', buckets?.map(b => b.name));
    
    // Ensure required buckets exist and are public
    const requiredBuckets = Object.values(storageConfig.buckets);
    
    for (const bucketName of requiredBuckets) {
      console.log(`\n🔍 Checking bucket: ${bucketName}`);
      
      // Check if bucket exists
      const bucketExists = buckets?.some(b => b.name === bucketName);
      
      if (!bucketExists) {
        console.log(`📦 Creating bucket: ${bucketName}`);
        
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*', 'video/*', 'application/*', 'text/*'],
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (createError) {
          console.error(`❌ Error creating bucket ${bucketName}:`, createError);
          continue;
        }
        
        console.log(`✅ Created bucket: ${bucketName}`);
      } else {
        console.log(`✅ Bucket exists: ${bucketName}`);
        
        // Update bucket to ensure it's public
        const { error: updateError } = await supabase.storage.updateBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*', 'video/*', 'application/*', 'text/*'],
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (updateError) {
          console.log(`⚠️  Could not update bucket ${bucketName} (might already be configured):`, updateError.message);
        } else {
          console.log(`✅ Updated bucket to public: ${bucketName}`);
        }
      }
      
      // Test upload and public URL
      console.log(`🧪 Testing bucket: ${bucketName}`);
      
      const testFileName = `test-${Date.now()}.txt`;
      const testContent = 'This is a test file';
      
      // Upload test file
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(testFileName, testContent, {
          contentType: 'text/plain',
        });
      
      if (uploadError) {
        console.error(`❌ Test upload failed for ${bucketName}:`, uploadError);
        continue;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(testFileName);
      
      console.log(`🔗 Test file URL: ${urlData.publicUrl}`);
      
      // Test if URL is accessible
      try {
        const response = await fetch(urlData.publicUrl);
        if (response.ok) {
          console.log(`✅ Public URL is accessible for bucket: ${bucketName}`);
        } else {
          console.error(`❌ Public URL not accessible (${response.status}): ${bucketName}`);
        }
      } catch (fetchError) {
        console.error(`❌ Error testing public URL for ${bucketName}:`, fetchError);
      }
      
      // Clean up test file
      await supabase.storage.from(bucketName).remove([testFileName]);
    }
    
    console.log('\n🎉 Bucket configuration check complete!');
    
  } catch (error) {
    console.error('❌ Error fixing buckets:', error);
  }
}

// Run the script
if (require.main === module) {
  fixSupabaseBuckets()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { fixSupabaseBuckets };
