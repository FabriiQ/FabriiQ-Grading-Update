#!/usr/bin/env node

/**
 * Test script to verify all unified component workflows
 * This script runs comprehensive tests for the activities grading and assessment system
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Unified Components Workflow Tests...\n');

// Test configuration
const testConfig = {
  timeout: 60000, // 60 seconds
  verbose: true,
  coverage: true,
};

// Test suites to run
const testSuites = [
  {
    name: 'Unified Components Integration',
    path: 'src/features/activties/tests/unified-components-integration.test.tsx',
    description: 'Tests unified activity and assessment components',
  },
  {
    name: 'Enhanced Assessment Tests',
    path: 'src/features/assessments/tests/enhanced-assessment.test.ts',
    description: 'Tests enhanced assessment functionality',
  },
  {
    name: 'Activity Performance Tests',
    path: 'src/tests/activity-performance.test.ts',
    description: 'Tests activity system performance',
  },
  {
    name: 'Auto-grading Tests',
    path: 'src/features/assessments/utils/__tests__/auto-grading.test.ts',
    description: 'Tests automatic grading functionality',
  },
];

// Workflow tests to verify
const workflowTests = [
  {
    name: 'Activity Creation Workflow',
    description: 'Verify activity creation from start to finish',
    steps: [
      'Load UnifiedActivityCreator',
      'Fill required fields',
      'Configure grading settings',
      'Submit activity',
      'Verify creation success',
    ],
  },
  {
    name: 'Assessment Creation Workflow',
    description: 'Verify assessment creation workflow',
    steps: [
      'Load UnifiedAssessmentCreator',
      'Configure assessment type',
      'Add questions',
      'Set grading criteria',
      'Publish assessment',
    ],
  },
  {
    name: 'Activity Configuration Display',
    description: 'Verify StandardizedActivityConfig displays correctly',
    steps: [
      'Load activity configuration',
      'Display in view mode',
      'Switch to edit mode',
      'Update configuration',
      'Save changes',
    ],
  },
  {
    name: 'Grading and Analytics Workflow',
    description: 'Verify grading and analytics integration',
    steps: [
      'Submit activity response',
      'Process auto-grading',
      'Generate analytics',
      'Display results',
      'Update leaderboards',
    ],
  },
];

function runCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    const output = execSync(command, { 
      encoding: 'utf8',
      stdio: testConfig.verbose ? 'inherit' : 'pipe',
      timeout: testConfig.timeout,
    });
    console.log(`✅ ${description} - PASSED\n`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} - FAILED`);
    console.log(`Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

function checkFileExists(filePath) {
  const fullPath = path.resolve(filePath);
  return fs.existsSync(fullPath);
}

async function runTests() {
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    details: [],
  };

  console.log('🔍 Checking test files...\n');

  // Check if test files exist
  for (const suite of testSuites) {
    if (!checkFileExists(suite.path)) {
      console.log(`⚠️  Test file not found: ${suite.path}`);
      results.skipped++;
      results.details.push({
        name: suite.name,
        status: 'skipped',
        reason: 'Test file not found',
      });
      continue;
    }

    console.log(`✅ Found: ${suite.name}`);
  }

  console.log('\n🧪 Running test suites...\n');

  // Run each test suite
  for (const suite of testSuites) {
    if (!checkFileExists(suite.path)) {
      continue; // Skip if file doesn't exist
    }

    const testCommand = `npm test -- "${suite.path}" --passWithNoTests`;
    const result = runCommand(testCommand, `Running ${suite.name}`);

    if (result.success) {
      results.passed++;
      results.details.push({
        name: suite.name,
        status: 'passed',
        description: suite.description,
      });
    } else {
      results.failed++;
      results.details.push({
        name: suite.name,
        status: 'failed',
        description: suite.description,
        error: result.error,
      });
    }
  }

  // Run build test to ensure no compilation errors
  console.log('🏗️  Testing build compilation...\n');
  const buildResult = runCommand('npm run build', 'Build compilation test');
  
  if (buildResult.success) {
    results.passed++;
    results.details.push({
      name: 'Build Compilation',
      status: 'passed',
      description: 'Verify all components compile correctly',
    });
  } else {
    results.failed++;
    results.details.push({
      name: 'Build Compilation',
      status: 'failed',
      description: 'Build compilation failed',
      error: buildResult.error,
    });
  }

  // Run type checking
  console.log('🔍 Running TypeScript type checking...\n');
  const typeCheckResult = runCommand('npx tsc --noEmit', 'TypeScript type checking');
  
  if (typeCheckResult.success) {
    results.passed++;
    results.details.push({
      name: 'TypeScript Type Checking',
      status: 'passed',
      description: 'Verify all types are correct',
    });
  } else {
    results.failed++;
    results.details.push({
      name: 'TypeScript Type Checking',
      status: 'failed',
      description: 'Type checking failed',
      error: typeCheckResult.error,
    });
  }

  return results;
}

function printWorkflowChecklist() {
  console.log('📋 Workflow Verification Checklist:\n');
  
  workflowTests.forEach((workflow, index) => {
    console.log(`${index + 1}. ${workflow.name}`);
    console.log(`   Description: ${workflow.description}`);
    console.log(`   Steps:`);
    workflow.steps.forEach((step, stepIndex) => {
      console.log(`     ${stepIndex + 1}. ${step}`);
    });
    console.log('');
  });
}

function printResults(results) {
  console.log('📊 Test Results Summary:\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Skipped: ${results.skipped}`);
  console.log(`📈 Total: ${results.passed + results.failed + results.skipped}\n`);

  if (results.details.length > 0) {
    console.log('📋 Detailed Results:\n');
    results.details.forEach((detail, index) => {
      const statusIcon = detail.status === 'passed' ? '✅' : 
                        detail.status === 'failed' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${statusIcon} ${detail.name}`);
      console.log(`   Status: ${detail.status.toUpperCase()}`);
      if (detail.description) {
        console.log(`   Description: ${detail.description}`);
      }
      if (detail.error) {
        console.log(`   Error: ${detail.error}`);
      }
      if (detail.reason) {
        console.log(`   Reason: ${detail.reason}`);
      }
      console.log('');
    });
  }

  // Print recommendations
  console.log('💡 Recommendations:\n');
  
  if (results.failed > 0) {
    console.log('❌ Some tests failed. Please review the errors above and fix the issues.');
    console.log('   - Check component imports and exports');
    console.log('   - Verify all required props are provided');
    console.log('   - Ensure mock data matches expected interfaces');
  }
  
  if (results.skipped > 0) {
    console.log('⚠️  Some tests were skipped due to missing files.');
    console.log('   - Create missing test files');
    console.log('   - Ensure all components have corresponding tests');
  }
  
  if (results.passed === results.details.length && results.failed === 0) {
    console.log('🎉 All tests passed! The unified components integration is working correctly.');
    console.log('   - Activity creation workflow is functional');
    console.log('   - Assessment creation workflow is functional');
    console.log('   - Configuration displays are working');
    console.log('   - Build compilation is successful');
  }
}

// Main execution
async function main() {
  try {
    printWorkflowChecklist();
    const results = await runTests();
    printResults(results);
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runTests, printWorkflowChecklist, printResults };
