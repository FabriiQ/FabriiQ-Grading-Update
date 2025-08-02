#!/usr/bin/env node

/**
 * Build test script to diagnose Next.js build issues
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔧 Testing Next.js build with diagnostics...');

// Set environment variables
process.env.NODE_OPTIONS = '--max-old-space-size=4096';
process.env.NODE_ENV = 'production';

// Run Next.js build with verbose output
const buildProcess = spawn('npx', ['next', 'build'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: '1',
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
});

buildProcess.on('error', (error) => {
  console.error('❌ Build process error:', error);
  process.exit(1);
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build completed successfully!');
  } else {
    console.error(`❌ Build failed with exit code ${code}`);
  }
  process.exit(code);
});

// Handle timeout
setTimeout(() => {
  console.log('⏰ Build is taking longer than expected...');
  console.log('This might indicate memory issues or infinite loops');
}, 60000); // 1 minute warning

setTimeout(() => {
  console.log('❌ Build timeout after 5 minutes');
  buildProcess.kill('SIGTERM');
  process.exit(1);
}, 300000); // 5 minute timeout
