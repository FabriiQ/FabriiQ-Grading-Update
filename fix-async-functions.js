const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing async function issues in all page.tsx files...');

// Find all page.tsx files
const pageFiles = glob.sync('src/app/**/page.tsx', { 
  ignore: ['node_modules/**', '.next/**'] 
});

console.log(`Found ${pageFiles.length} page.tsx files`);

let fixedCount = 0;
let skippedCount = 0;

function fixAsyncFunction(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;
    
    console.log(`Processing: ${filePath}`);
    
    // Skip client components
    if (content.includes("'use client'") || content.includes('"use client"')) {
      console.log('  ⏭️  Skipping client component');
      skippedCount++;
      return false;
    }
    
    // Check if function uses await but is not async
    const hasAwaitParams = content.includes('await params');
    const hasAwaitSearchParams = content.includes('await searchParams');
    const isNotAsync = !content.includes('export default async function');
    
    if ((hasAwaitParams || hasAwaitSearchParams) && isNotAsync) {
      // Make function async
      newContent = newContent.replace(
        /export default function ([a-zA-Z]+)\(/g, 
        'export default async function $1('
      );
      
      modified = true;
      console.log('  🔄 Made function async to support await');
    }
    
    // Fix inline await usage patterns
    if (content.includes('(await params)')) {
      // Replace (await params).property with destructured await
      const awaitParamsPattern = /\(await params\)\.([a-zA-Z]+)/g;
      const matches = [...content.matchAll(awaitParamsPattern)];
      
      if (matches.length > 0) {
        // Extract all property names
        const properties = [...new Set(matches.map(match => match[1]))];
        
        // Add destructuring at the beginning of function
        const functionBodyPattern = /export default async function [a-zA-Z]+\([^)]+\) \{/;
        const functionMatch = newContent.match(functionBodyPattern);
        
        if (functionMatch) {
          const destructuring = `  const { ${properties.join(', ')} } = await params;\n`;
          newContent = newContent.replace(
            functionBodyPattern,
            functionMatch[0] + '\n' + destructuring
          );
          
          // Replace all (await params).property with just property
          properties.forEach(prop => {
            const regex = new RegExp(`\\(await params\\)\\.${prop}`, 'g');
            newContent = newContent.replace(regex, prop);
          });
          
          modified = true;
          console.log('  🔄 Fixed inline await params usage');
        }
      }
    }
    
    // Fix searchParams inline usage
    if (content.includes('(await searchParams)')) {
      // Similar pattern for searchParams
      newContent = newContent.replace(
        /\(await searchParams\)/g,
        'searchParams'
      );
      
      // Add searchParams destructuring if needed
      if (!newContent.includes('await searchParams')) {
        const functionBodyPattern = /export default async function [a-zA-Z]+\([^)]+\) \{/;
        const functionMatch = newContent.match(functionBodyPattern);
        
        if (functionMatch) {
          const destructuring = `  const searchParamsData = await searchParams;\n`;
          newContent = newContent.replace(
            functionBodyPattern,
            functionMatch[0] + '\n' + destructuring
          );
          
          newContent = newContent.replace(/searchParams/g, 'searchParamsData');
          
          modified = true;
          console.log('  🔄 Fixed inline await searchParams usage');
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('  ✅ Fixed successfully');
      fixedCount++;
      return true;
    } else {
      console.log('  ⏭️  No changes needed');
      skippedCount++;
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Process all files
pageFiles.forEach(fixAsyncFunction);

console.log('\n📊 Summary:');
console.log(`  Fixed: ${fixedCount} files`);
console.log(`  Skipped: ${skippedCount} files`);

if (fixedCount > 0) {
  console.log('\n🎉 Async function fixes completed! You can now run the build again.');
} else {
  console.log('\n✨ All files were already compatible!');
}
