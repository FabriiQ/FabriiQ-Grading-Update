/**
 * Login Performance Test Script
 * 
 * This script tests the login performance improvements by simulating
 * login requests and measuring response times.
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test credentials
const TEST_USERS = [
  { username: 'robert_brown', password: 'Password123!' },
  { username: 'jennifer_davis', password: 'Password123!' },
  { username: 'james_anderson', password: 'Password123!' },
];

async function testLoginPerformance(username, password) {
  const startTime = Date.now();
  
  try {
    // First get CSRF token
    const csrfResponse = await fetch(`${BASE_URL}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();
    
    // Perform login
    const loginResponse = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password,
        csrfToken,
        callbackUrl: '/teacher/dashboard',
      }),
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const success = loginResponse.ok;
    
    console.log(`Login Test - ${username}:`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Success: ${success}`);
    console.log(`  Status: ${loginResponse.status}`);
    
    if (duration > 5000) {
      console.log(`  ⚠️  SLOW LOGIN DETECTED`);
    } else if (duration > 2000) {
      console.log(`  ⚠️  Moderate delay`);
    } else {
      console.log(`  ✅ Good performance`);
    }
    
    console.log('---');
    
    return { username, duration, success };
    
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`Login Test - ${username}:`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Success: false`);
    console.log(`  Error: ${error.message}`);
    console.log('---');
    
    return { username, duration, success: false, error: error.message };
  }
}

async function runPerformanceTests() {
  console.log('🚀 Starting Login Performance Tests...\n');
  
  const results = [];
  
  // Test each user sequentially
  for (const user of TEST_USERS) {
    const result = await testLoginPerformance(user.username, user.password);
    results.push(result);
    
    // Wait 2 seconds between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Calculate statistics
  const successfulLogins = results.filter(r => r.success);
  const durations = successfulLogins.map(r => r.duration);
  
  if (durations.length > 0) {
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);
    
    console.log('\n📊 Performance Summary:');
    console.log(`  Total Tests: ${results.length}`);
    console.log(`  Successful: ${successfulLogins.length}`);
    console.log(`  Average Duration: ${avgDuration.toFixed(2)}ms`);
    console.log(`  Max Duration: ${maxDuration}ms`);
    console.log(`  Min Duration: ${minDuration}ms`);
    
    if (avgDuration < 3000) {
      console.log(`  ✅ PERFORMANCE IMPROVED - Average under 3 seconds!`);
    } else if (avgDuration < 5000) {
      console.log(`  ⚠️  MODERATE PERFORMANCE - Still room for improvement`);
    } else {
      console.log(`  ❌ POOR PERFORMANCE - Further optimization needed`);
    }
  }
}

// Run the tests
runPerformanceTests().catch(console.error);
