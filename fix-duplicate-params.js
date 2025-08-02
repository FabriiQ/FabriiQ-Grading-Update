const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing duplicate params declarations...');

const filesToFix = [
  'src/app/(dashboard)/student/assessments/[id]/confirmation/[submissionId]/page.tsx',
  'src/app/admin/system/academic-cycles/[id]/edit/page.tsx',
  'src/app/admin/system/academic-cycles/[id]/terms/[termId]/edit/page.tsx',
  'src/app/admin/system/academic-cycles/[id]/terms/[termId]/page.tsx',
  'src/app/admin/system/academic-cycles/[id]/terms/create/page.tsx',
  'src/app/admin/system/academic-cycles/[id]/terms/page.tsx'
];

let fixedCount = 0;

function fixDuplicateParams(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;
    
    console.log(`Processing: ${filePath}`);
    
    // Check for duplicate params declarations
    const hasParamsParameter = content.match(/export default function [a-zA-Z]+\(\{\s*params\s*\}[^)]*\)/);
    const hasUseParamsCall = content.includes('const params = useParams()');
    
    if (hasParamsParameter && hasUseParamsCall) {
      console.log('  🔄 Removing duplicate params parameter');
      
      // Remove params from function signature
      newContent = newContent.replace(
        /export default function ([a-zA-Z]+)\(\{\s*params\s*\}[^)]*\)/,
        'export default function $1()'
      );
      
      modified = true;
    }
    
    // Also check for other patterns like ({ params }: { params: ... })
    const hasTypedParamsParameter = content.match(/export default function [a-zA-Z]+\(\{\s*params\s*\}:\s*\{[^}]*params:[^}]*\}\)/);
    
    if (hasTypedParamsParameter && hasUseParamsCall) {
      console.log('  🔄 Removing typed params parameter');
      
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
filesToFix.forEach(fixDuplicateParams);

console.log(`\n📊 Summary: Fixed ${fixedCount} files`);

if (fixedCount > 0) {
  console.log('\n🎉 Duplicate params issues fixed! You can now run the build again.');
} else {
  console.log('\n✨ All files were already compatible!');
}
