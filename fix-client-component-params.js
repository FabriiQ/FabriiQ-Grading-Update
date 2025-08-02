const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Fixing client component params issues...');

// Find all page.tsx files
const pageFiles = glob.sync('src/app/**/page.tsx', { 
  ignore: ['node_modules/**', '.next/**'] 
});

console.log(`Checking ${pageFiles.length} page.tsx files for client component params issues...`);

let fixedCount = 0;

function fixClientComponentParams(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let modified = false;
    
    // Only process client components
    if (!content.includes("'use client'") && !content.includes('"use client"')) {
      return false;
    }
    
    console.log(`Processing client component: ${filePath}`);
    
    // Check if it has params prop and doesn't use useParams
    const hasParamsProps = content.match(/\{\s*params[^}]*\}:\s*\{[^}]*params:/);
    const hasUseParams = content.includes('useParams');
    
    if (hasParamsProps && !hasUseParams) {
      console.log('  🔄 Converting server-side params to useParams hook');
      
      // Add useParams import if not present
      if (!content.includes('useParams')) {
        if (content.includes("from 'next/navigation'")) {
          newContent = newContent.replace(
            /import\s*\{([^}]+)\}\s*from\s*['"]next\/navigation['"]/,
            "import { $1, useParams } from 'next/navigation'"
          );
        } else {
          // Add new import
          const importIndex = content.indexOf('\n');
          newContent = newContent.slice(0, importIndex) + 
            "\nimport { useParams } from 'next/navigation';" + 
            newContent.slice(importIndex);
        }
        modified = true;
      }
      
      // Remove params from function signature and replace with useParams
      const functionPattern = /export default function ([a-zA-Z]+)\(\{\s*params[^}]*\}:\s*\{[^}]*params:[^}]*\}\s*\)/;
      const functionMatch = newContent.match(functionPattern);
      
      if (functionMatch) {
        const functionName = functionMatch[1];
        newContent = newContent.replace(functionPattern, `export default function ${functionName}()`);
        modified = true;
        
        // Find where params is destructured and replace with useParams
        const paramsDestructurePattern = /const\s*\{\s*([^}]+)\}\s*=\s*params;/;
        const destructureMatch = newContent.match(paramsDestructurePattern);
        
        if (destructureMatch) {
          const paramsVars = destructureMatch[1].split(',').map(v => v.trim());
          
          // Add useParams call
          const useParamsCode = `  const params = useParams();\n`;
          
          // Add individual variable assignments
          const assignments = paramsVars.map(varName => {
            const cleanVar = varName.split(':')[0].trim(); // Handle renaming like "id: assessmentId"
            if (varName.includes(':')) {
              const [param, alias] = varName.split(':').map(v => v.trim());
              return `  const ${alias} = params.${param} as string;`;
            } else {
              return `  const ${cleanVar} = params.${cleanVar} as string;`;
            }
          }).join('\n');
          
          newContent = newContent.replace(
            paramsDestructurePattern,
            useParamsCode + assignments
          );
          modified = true;
        }
      }
      
      // Handle direct params usage like params.id
      if (newContent.includes('params.')) {
        // Add useParams if not already added
        if (!newContent.includes('const params = useParams()')) {
          const functionBodyStart = newContent.indexOf(') {') + 3;
          newContent = newContent.slice(0, functionBodyStart) + 
            '\n  const params = useParams();' + 
            newContent.slice(functionBodyStart);
          modified = true;
        }
        
        // Replace params.property with (params.property as string)
        newContent = newContent.replace(/params\.([a-zA-Z]+)(?!\s*as\s+string)/g, '(params.$1 as string)');
        modified = true;
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
pageFiles.forEach(fixClientComponentParams);

console.log(`\n📊 Summary: Fixed ${fixedCount} client component files`);

if (fixedCount > 0) {
  console.log('\n🎉 Client component params issues fixed! You can now run the build again.');
} else {
  console.log('\n✨ All client components were already compatible!');
}
