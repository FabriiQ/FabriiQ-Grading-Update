const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all remaining searchParams issues...');

const filesToFix = [
  'src/app/admin/coordinator/teachers/page.tsx',
  'src/app/admin/system/campuses/[id]/classes/new/page.tsx',
  'src/app/admin/system/campuses/[id]/classes/page.tsx',
  'src/app/admin/system/campuses/[id]/students/page.tsx',
  'src/app/admin/system/campuses/[id]/teachers/page.tsx',
  'src/app/reset-password/page.tsx'
];

let fixedCount = 0;

function fixSearchParams(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;
    
    console.log(`Processing: ${filePath}`);
    
    // Skip client components
    if (content.includes("'use client'") || content.includes('"use client"')) {
      console.log('  ⏭️  Skipping client component');
      return false;
    }
    
    // Fix searchParams interface - simple pattern
    const simpleSearchParamsPattern = /searchParams:\s*\{\s*([^}]+)\s*\}/g;
    const matches = [...content.matchAll(simpleSearchParamsPattern)];
    
    for (const match of matches) {
      if (!match[0].includes('Promise<')) {
        const searchParamsContent = match[1];
        const replacement = `searchParams: Promise<{ ${searchParamsContent} }>`;
        newContent = newContent.replace(match[0], replacement);
        modified = true;
        console.log('  🔄 Fixed searchParams interface');
      }
    }
    
    // Add await to searchParams usage if modified
    if (modified) {
      // Look for function that uses searchParams and add await
      const functionPattern = /export default async function ([a-zA-Z]+)\(\{[^}]*searchParams[^}]*\}\s*:\s*\{[^}]*\}\s*\)\s*\{/;
      const functionMatch = newContent.match(functionPattern);
      
      if (functionMatch) {
        // Add await searchParams at the beginning of function
        const functionStart = newContent.indexOf(functionMatch[0]) + functionMatch[0].length;
        const awaitLine = '\n  // Await searchParams for Next.js 15 compatibility\n  const params = await searchParams;\n';
        newContent = newContent.slice(0, functionStart) + awaitLine + newContent.slice(functionStart);
        
        // Replace searchParams usage with params
        newContent = newContent.replace(/searchParams\./g, 'params.');
        
        console.log('  🔄 Added await to searchParams usage');
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('  ✅ Fixed successfully');
      fixedCount++;
      return true;
    } else {
      console.log('  ⏭️  No changes needed');
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
filesToFix.forEach(fixSearchParams);

console.log(`\n📊 Summary: Fixed ${fixedCount} files`);

if (fixedCount > 0) {
  console.log('\n🎉 All searchParams issues fixed! You can now run the build again.');
} else {
  console.log('\n✨ All files were already compatible!');
}
