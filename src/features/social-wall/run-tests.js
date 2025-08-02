#!/usr/bin/env node

/**
 * Social Wall Test Runner
 * Runs all Social Wall tests and reports results
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running Social Wall Tests...\n');

const testFiles = [
  'src/features/social-wall/__tests__/social-wall.service.test.ts',
  'src/features/social-wall/__tests__/PostCard.test.tsx',
  'src/features/social-wall/__tests__/social-wall.integration.test.ts'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

for (const testFile of testFiles) {
  console.log(`\n📋 Running: ${testFile}`);
  console.log('='.repeat(60));
  
  try {
    // Run Jest for this specific test file
    const result = execSync(`npx jest "${testFile}" --verbose --no-coverage`, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    console.log(result);
    
    // Parse results (basic parsing)
    const lines = result.split('\n');
    const testResults = lines.filter(line => 
      line.includes('✓') || line.includes('✗') || line.includes('PASS') || line.includes('FAIL')
    );
    
    const passed = (result.match(/✓/g) || []).length;
    const failed = (result.match(/✗/g) || []).length;
    
    totalTests += passed + failed;
    passedTests += passed;
    failedTests += failed;
    
    console.log(`✅ ${testFile}: ${passed} passed, ${failed} failed`);
    
  } catch (error) {
    console.error(`❌ Error running ${testFile}:`);
    console.error(error.stdout || error.message);
    failedTests++;
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 SOCIAL WALL TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);

if (failedTests === 0) {
  console.log('\n🎉 All Social Wall tests passed!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please review the output above.');
  process.exit(1);
}
