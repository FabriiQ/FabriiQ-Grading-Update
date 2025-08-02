#!/usr/bin/env ts-node
/**
 * Test Environment Variables
 */

const { config } = require('dotenv');

// Load environment variables
config();

console.log('Testing environment variables...');

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY'
];

console.log('\nEnvironment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`${varName}: ${value ? '✅ Set' : '❌ Missing'}`);
});

console.log('\nAll environment variables:');
Object.keys(process.env)
  .filter(key => key.includes('SUPABASE'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key] ? '✅ Set' : '❌ Missing'}`);
  });
