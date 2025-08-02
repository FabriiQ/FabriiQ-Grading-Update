const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Finding remaining Next.js 15 params issues...');

// Find all page.tsx files
const pageFiles = glob.sync('src/app/**/page.tsx', { 
  ignore: ['node_modules/**', '.next/**'] 
});

console.log(`Checking ${pageFiles.length} page.tsx files for params issues...`);

let issuesFound = 0;

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip client components
    if (content.includes("'use client'") || content.includes('"use client"')) {
      return;
    }
    
    // Check for params interface without Promise
    const hasParamsInterface = content.match(/params:\s*\{\s*[^}]*\}/);
    const hasPromiseParams = content.includes('params: Promise<');
    
    if (hasParamsInterface && !hasPromiseParams) {
      console.log(`❌ ${filePath}: Found params interface without Promise`);
      issuesFound++;
      
      // Show the problematic line
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.match(/params:\s*\{/) && !line.includes('Promise<')) {
          console.log(`   Line ${index + 1}: ${line.trim()}`);
        }
      });
    }
    
    // Check for searchParams interface without Promise
    const hasSearchParamsInterface = content.match(/searchParams:\s*\{\s*\[key:\s*string\]/);
    const hasPromiseSearchParams = content.includes('searchParams: Promise<');
    
    if (hasSearchParamsInterface && !hasPromiseSearchParams) {
      console.log(`❌ ${filePath}: Found searchParams interface without Promise`);
      issuesFound++;
      
      // Show the problematic line
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.match(/searchParams:\s*\{/) && !line.includes('Promise<')) {
          console.log(`   Line ${index + 1}: ${line.trim()}`);
        }
      });
    }
    
    // Check for function using await params but not async
    const hasAwaitParams = content.includes('await params');
    const isAsyncFunction = content.includes('export default async function');
    
    if (hasAwaitParams && !isAsyncFunction) {
      console.log(`❌ ${filePath}: Function uses await params but is not async`);
      issuesFound++;
    }
    
  } catch (error) {
    console.error(`Error checking ${filePath}:`, error.message);
  }
}

// Check all files
pageFiles.forEach(checkFile);

console.log(`\n📊 Summary: ${issuesFound} issues found`);

if (issuesFound === 0) {
  console.log('✅ All files appear to be compatible with Next.js 15!');
} else {
  console.log('❌ Issues found that need to be fixed before build will succeed.');
}
