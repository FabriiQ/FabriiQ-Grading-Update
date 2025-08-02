const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all remaining Next.js 15 params issues...');

const filesToFix = [
  'src/app/admin/campus/students/[id]/edit/page.tsx',
  'src/app/admin/campus/students/[id]/enroll/page.tsx',
  'src/app/admin/campus/students/[id]/page.tsx',
  'src/app/admin/coordinator-legacy/classes/[id]/assessments/new/page.tsx',
  'src/app/admin/coordinator-legacy/classes/[id]/assessments/page.tsx',
  'src/app/admin/coordinator-legacy/lesson-plans/[id]/page.tsx',
  'src/app/admin/coordinator-legacy/teachers/[id]/page.tsx',
  'src/app/admin/coordinator/lesson-plans/[id]/page.tsx',
  'src/app/admin/lesson-plans/[id]/page.tsx',
  'src/app/admin/system/campuses/[id]/classes/new/page.tsx',
  'src/app/admin/system/campuses/[id]/classes/page.tsx',
  'src/app/admin/system/campuses/[id]/students/page.tsx',
  'src/app/admin/system/campuses/[id]/teachers/page.tsx',
  'src/app/student/activities/[id]/page.tsx',
  'src/app/student/grades/[id]/page.tsx',
  'src/app/teacher/classes/[classId]/activities-new/create/page.tsx',
  'src/app/teacher/classes/[classId]/activities-new/page.tsx',
  'src/app/teacher/classes/[classId]/activities/create/page.tsx',
  'src/app/teacher/classes/[classId]/activities/page.tsx',
  'src/app/teacher/classes/[classId]/assessments/page.tsx',
  'src/app/teacher/classes/[classId]/grades/page.tsx',
  'src/app/teacher/classes/[classId]/lesson-plans/[id]/edit/page.tsx',
  'src/app/teacher/classes/[classId]/lesson-plans/[id]/page.tsx',
  'src/app/teacher/classes/[classId]/lesson-plans/page.tsx',
  'src/app/teacher/classes/[classId]/students/page.tsx',
  'src/app/teacher/lesson-plans/[id]/edit/page.tsx',
  'src/app/teacher/lesson-plans/[id]/page.tsx'
];

let fixedCount = 0;

function fixFile(filePath) {
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
    
    // Fix params interface - single param
    const singleParamPattern = /params:\s*\{\s*([a-zA-Z]+):\s*string;\s*\}/g;
    newContent = newContent.replace(singleParamPattern, 'params: Promise<{ $1: string }>');
    if (newContent !== content) {
      modified = true;
      console.log('  🔄 Fixed single param interface');
    }
    
    // Fix params interface - multiple params
    const multiParamPattern = /params:\s*\{\s*([^}]+)\s*\}/g;
    const matches = [...content.matchAll(multiParamPattern)];
    
    for (const match of matches) {
      if (!match[0].includes('Promise<')) {
        const paramsContent = match[1];
        const replacement = `params: Promise<{ ${paramsContent} }>`;
        newContent = newContent.replace(match[0], replacement);
        modified = true;
        console.log('  🔄 Fixed multi param interface');
      }
    }
    
    // Fix searchParams interface
    const searchParamsPattern = /searchParams:\s*\{\s*\[key:\s*string\]:\s*string\s*\|\s*string\[\]\s*\|\s*undefined;\s*\}/g;
    newContent = newContent.replace(searchParamsPattern, 'searchParams: Promise<{ [key: string]: string | string[] | undefined }>');
    if (newContent !== content) {
      modified = true;
      console.log('  🔄 Fixed searchParams interface');
    }
    
    // Make function async if it uses await params
    if (newContent.includes('await params') && !newContent.includes('export default async function')) {
      newContent = newContent.replace('export default function', 'export default async function');
      modified = true;
      console.log('  🔄 Made function async');
    }
    
    // Fix params usage - add await if missing
    if (modified && !newContent.includes('await params')) {
      // Look for params destructuring and add await
      newContent = newContent.replace(/const\s*\{\s*([^}]+)\}\s*=\s*params;/g, 'const { $1 } = await params;');
      console.log('  🔄 Added await to params usage');
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
filesToFix.forEach(fixFile);

console.log(`\n📊 Summary: Fixed ${fixedCount} files`);

if (fixedCount > 0) {
  console.log('\n🎉 All remaining Next.js 15 params issues fixed! You can now run the build again.');
} else {
  console.log('\n✨ All files were already compatible!');
}
