const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔍 Finding remaining searchParams issues...');

// Find all page.tsx files
const pageFiles = glob.sync('src/app/**/page.tsx', { 
  ignore: ['node_modules/**', '.next/**'] 
});

console.log(`Checking ${pageFiles.length} page.tsx files for searchParams issues...`);

let issuesFound = 0;

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Skip client components
    if (content.includes("'use client'") || content.includes('"use client"')) {
      return;
    }
    
    // Check for searchParams interface without Promise
    const hasSearchParamsInterface = content.match(/searchParams:\s*\{\s*[^}]*\}/);
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
    
  } catch (error) {
    console.error(`Error checking ${filePath}:`, error.message);
  }
}

// Check all files
pageFiles.forEach(checkFile);

console.log(`\n📊 Summary: ${issuesFound} searchParams issues found`);

if (issuesFound === 0) {
  console.log('✅ All files appear to have correct searchParams types!');
} else {
  console.log('❌ SearchParams issues found that need to be fixed.');
}
