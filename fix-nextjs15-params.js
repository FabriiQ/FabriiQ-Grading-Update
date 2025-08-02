#!/usr/bin/env node

/**
 * Node.js script to fix Next.js 15 async params in all page.tsx files
 * This script updates page components to handle the new async params requirement
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Next.js 15 async params in all page.tsx files...');

function findPageFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      // Only process directories that contain dynamic routes (brackets)
      if (item.includes('[') && item.includes(']')) {
        findPageFiles(fullPath, files);
      } else {
        // Also check subdirectories for dynamic routes
        findPageFiles(fullPath, files);
      }
    } else if (item === 'page.tsx') {
      // Only include files in dynamic route directories
      if (fullPath.includes('[') && fullPath.includes(']')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

function fixPageFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let newContent = content;

    console.log(`Processing: ${filePath}`);

    // Skip files that already use Promise<> in params types (more flexible check)
    const hasPromiseParams = content.includes('params: Promise<') ||
                            content.match(/params:\s*Promise</) ||
                            content.match(/params:\s*{\s*\[key:\s*string\]:\s*string\s*\|\s*string\[\]\s*\|\s*undefined;\s*}/);

    if (hasPromiseParams && !content.match(/params:\s*{\s*[^}]*id:\s*string[^}]*}/)) {
      console.log('  ✓ Already has Promise params or no params needed');
      return false;
    }

    // Skip client components
    if (content.includes("'use client'") || content.includes('"use client"')) {
      console.log('  ⏭️  Skipping client component');
      return false;
    }
    
    // Pattern 1: Interface definitions with params
    const interfacePattern = /interface\s+([a-zA-Z]+)\s*{\s*params:\s*{\s*([^}]+)\s*};\s*}/;
    const interfaceMatch = newContent.match(interfacePattern);

    if (interfaceMatch) {
      const interfaceName = interfaceMatch[1];
      const paramsType = interfaceMatch[2];

      // Update interface to use Promise
      const interfaceReplacement = `interface ${interfaceName} {\n  params: Promise<{\n    ${paramsType}\n  }>;\n}`;
      newContent = newContent.replace(interfacePattern, interfaceReplacement);
      modified = true;
      console.log('  🔄 Updated interface params type to Promise');
    }

    // Pattern 2: Function with params destructuring (inline type)
    const functionPattern = /export default (async )?function ([a-zA-Z]+)\(\{\s*params\s*\}:\s*\{\s*params:\s*\{([^}]+)\}\s*\}\)/;
    const match = newContent.match(functionPattern);

    if (match) {
      const isAsync = match[1] && match[1].trim() === 'async';
      const functionName = match[2];
      const paramsType = match[3];

      if (!isAsync) {
        // Make function async and update params type
        const replacement = `export default async function ${functionName}({ params }: { params: Promise<{${paramsType}}> })`;
        newContent = newContent.replace(functionPattern, replacement);
        modified = true;
        console.log('  🔄 Made function async and updated params type');
      } else {
        // Just update params type
        const replacement = `export default async function ${functionName}({ params }: { params: Promise<{${paramsType}}> })`;
        newContent = newContent.replace(functionPattern, replacement);
        modified = true;
        console.log('  🔄 Updated params type to Promise');
      }
    }

    // Pattern 3: Function with searchParams (inline type)
    const searchParamsPattern = /searchParams:\s*\{\s*\[key:\s*string\]:\s*string\s*\|\s*string\[\]\s*\|\s*undefined;\s*\}/;
    if (newContent.match(searchParamsPattern) && !newContent.includes('searchParams: Promise<')) {
      newContent = newContent.replace(searchParamsPattern, 'searchParams: Promise<{ [key: string]: string | string[] | undefined }>');
      modified = true;
      console.log('  🔄 Updated searchParams type to Promise');
    }

    // Pattern 4: Interface with searchParams
    const searchParamsInterfacePattern = /interface\s+([a-zA-Z]+)\s*{[^}]*searchParams:\s*\{\s*\[key:\s*string\]:\s*string\s*\|\s*string\[\]\s*\|\s*undefined;\s*\}[^}]*}/;
    if (newContent.match(searchParamsInterfacePattern) && !newContent.includes('searchParams: Promise<')) {
      newContent = newContent.replace(/searchParams:\s*\{\s*\[key:\s*string\]:\s*string\s*\|\s*string\[\]\s*\|\s*undefined;\s*\}/, 'searchParams: Promise<{ [key: string]: string | string[] | undefined }>');
      modified = true;
      console.log('  🔄 Updated interface searchParams type to Promise');
    }
    
    // Pattern 3: Direct params access that needs await
    if (modified) {
      // Look for direct params usage and add await
      // Replace const { ... } = params; with const { ... } = await params;
      newContent = newContent.replace(/const\s*\{\s*([^}]+)\}\s*=\s*params;/g, 'const { $1 } = await params;');

      // Replace const x = params.y; with const x = (await params).y;
      newContent = newContent.replace(/const\s+([a-zA-Z]+)\s*=\s*params\.([a-zA-Z]+);/g, 'const $1 = (await params).$2;');

      // Replace other params.property usage with (await params).property
      // But avoid replacing if it's already wrapped with await
      newContent = newContent.replace(/(?<!await\s+)params\.([a-zA-Z]+)/g, (match, prop) => {
        // Check if this is already inside an await expression
        const beforeMatch = newContent.substring(0, newContent.indexOf(match));
        if (beforeMatch.endsWith('await ') || beforeMatch.includes('await params')) {
          return match; // Don't replace if already awaited
        }
        return `(await params).${prop}`;
      });

      console.log('  🔄 Added await to params access');
    }

    // Pattern 4: Fix searchParams usage
    if (newContent.includes('searchParams') && !newContent.includes('await searchParams')) {
      // Replace direct searchParams usage with await searchParams
      newContent = newContent.replace(/const\s+([a-zA-Z]+)\s*=\s*await\s+Promise\.resolve\(searchParams\);/g, 'const $1 = await searchParams;');
      newContent = newContent.replace(/const\s+([a-zA-Z]+)\s*=\s*searchParams;/g, 'const $1 = await searchParams;');

      if (newContent !== content) {
        modified = true;
        console.log('  🔄 Added await to searchParams access');
      }
    }

    // Pattern 5: Make functions async if they use await but aren't async
    if (newContent.includes('await params') || newContent.includes('await searchParams')) {
      // Check if function is not async but uses await
      const functionDefPattern = /export default function ([a-zA-Z]+)\(/;
      const functionMatch = newContent.match(functionDefPattern);

      if (functionMatch && !newContent.includes('export default async function')) {
        newContent = newContent.replace('export default function', 'export default async function');
        modified = true;
        console.log('  🔄 Made function async to support await');
      }
    }
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('  ✅ Fixed successfully');
      return true;
    } else {
      console.log('  ⏭️  No changes needed');
      return false;
    }
    
  } catch (error) {
    console.error(`  ❌ Error processing file: ${error.message}`);
    return false;
  }
}

// Main execution
const srcAppDir = path.join(process.cwd(), 'src', 'app');
const pageFiles = findPageFiles(srcAppDir);

console.log(`Found ${pageFiles.length} page.tsx files in dynamic routes`);

let fixedCount = 0;
let skippedCount = 0;

for (const file of pageFiles) {
  const wasFixed = fixPageFile(file);
  if (wasFixed) {
    fixedCount++;
  } else {
    skippedCount++;
  }
}

console.log('\n📊 Summary:');
console.log(`  Fixed: ${fixedCount} files`);
console.log(`  Skipped: ${skippedCount} files`);

if (fixedCount > 0) {
  console.log('\n🎉 Next.js 15 params fix completed! You can now run the build again.');
} else {
  console.log('\n✨ All files were already compatible with Next.js 15!');
}
