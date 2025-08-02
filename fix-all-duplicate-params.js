const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Finding and fixing ALL duplicate params declarations...');

// Find all page.tsx files
const pageFiles = glob.sync('src/app/**/page.tsx', { 
  ignore: ['node_modules/**', '.next/**'] 
});

console.log(`Checking ${pageFiles.length} page.tsx files for duplicate params issues...`);

let fixedCount = 0;

function fixDuplicateParams(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;
    
    // Only process client components
    if (!content.includes("'use client'") && !content.includes('"use client"')) {
      return false;
    }
    
    // Check for duplicate params declarations
    const hasParamsParameter = content.match(/export default function [a-zA-Z]+\(\{\s*params\s*\}[^)]*\)/);
    const hasTypedParamsParameter = content.match(/export default function [a-zA-Z]+\(\{\s*params\s*\}:\s*\{[^}]*params:[^}]*\}\)/);
    const hasUseParamsCall = content.includes('const params = useParams()');
    
    if ((hasParamsParameter || hasTypedParamsParameter) && hasUseParamsCall) {
      console.log(`Processing: ${filePath}`);
      console.log('  🔄 Removing duplicate params parameter');
      
      // Remove params from function signature (untyped)
      newContent = newContent.replace(
        /export default function ([a-zA-Z]+)\(\{\s*params\s*\}[^)]*\)/,
        'export default function $1()'
      );
      
      // Remove typed params from function signature
      newContent = newContent.replace(
        /export default function ([a-zA-Z]+)\(\{\s*params\s*\}:\s*\{[^}]*params:[^}]*\}\)/,
        'export default function $1()'
      );
      
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('  ✅ Fixed successfully');
      fixedCount++;
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
pageFiles.forEach(fixDuplicateParams);

console.log(`\n📊 Summary: Fixed ${fixedCount} files`);

if (fixedCount > 0) {
  console.log('\n🎉 All duplicate params issues fixed! You can now run the build again.');
} else {
  console.log('\n✨ All files were already compatible!');
}
