#!/usr/bin/env node
/**
 * Test Supabase Connection
 */

require('dotenv').config();

console.log('Testing Supabase connection...');

// Check environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('\nEnvironment Variables:');
let allVarsPresent = true;
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅ Set' : '❌ Missing';
  console.log(`${varName}: ${status}`);
  if (!value) allVarsPresent = false;
});

if (!allVarsPresent) {
  console.log('\n❌ Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Test Supabase connection
async function testSupabase() {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('\n🔗 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Connection successful!');
    console.log(`📁 Found ${data?.length || 0} existing buckets:`);
    
    if (data && data.length > 0) {
      data.forEach(bucket => {
        console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Error testing connection:', error.message);
    return false;
  }
}

// Run the test
testSupabase()
  .then(success => {
    if (success) {
      console.log('\n🎉 Supabase is ready for storage setup!');
      process.exit(0);
    } else {
      console.log('\n💥 Supabase connection failed. Please check your configuration.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.log('💥 Unexpected error:', error);
    process.exit(1);
  });
