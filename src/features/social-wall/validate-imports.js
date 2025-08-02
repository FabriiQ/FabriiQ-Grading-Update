#!/usr/bin/env node

/**
 * Social Wall Import Validation
 * Validates that all components can be imported correctly
 */

console.log('🔍 Validating Social Wall Component Imports...\n');
console.log('Current directory:', __dirname);

const validationTests = [
  {
    name: 'PostCard Component',
    test: () => {
      try {
        // This would normally require transpilation, so we'll just check file existence
        const fs = require('fs');
        const path = require('path');
        
        const postCardPath = path.join(__dirname, 'components', 'PostCard.tsx');
        const reactionBarPath = path.join(__dirname, 'components', 'ReactionBar.tsx');
        const commentSectionPath = path.join(__dirname, 'components', 'CommentSection.tsx');
        
        if (!fs.existsSync(postCardPath)) throw new Error('PostCard.tsx not found');
        if (!fs.existsSync(reactionBarPath)) throw new Error('ReactionBar.tsx not found');
        if (!fs.existsSync(commentSectionPath)) throw new Error('CommentSection.tsx not found');
        
        // Check import statements
        const postCardContent = fs.readFileSync(postCardPath, 'utf8');
        if (!postCardContent.includes("import { ReactionBar }")) {
          throw new Error('ReactionBar import not found in PostCard');
        }
        if (!postCardContent.includes("import { CommentSection }")) {
          throw new Error('CommentSection import not found in PostCard');
        }
        
        return { success: true, message: 'All imports valid' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  },
  {
    name: 'PostFeed Component',
    test: () => {
      try {
        const fs = require('fs');
        const path = require('path');
        
        const postFeedPath = path.join(__dirname, 'components', 'PostFeed.tsx');
        const postSkeletonPath = path.join(__dirname, 'components', 'PostSkeleton.tsx');
        
        if (!fs.existsSync(postFeedPath)) throw new Error('PostFeed.tsx not found');
        if (!fs.existsSync(postSkeletonPath)) throw new Error('PostSkeleton.tsx not found');
        
        // Check import statements
        const postFeedContent = fs.readFileSync(postFeedPath, 'utf8');
        if (!postFeedContent.includes("import { PostCard }")) {
          throw new Error('PostCard import not found in PostFeed');
        }
        if (!postFeedContent.includes("import { PostSkeleton }")) {
          throw new Error('PostSkeleton import not found in PostFeed');
        }
        
        return { success: true, message: 'All imports valid' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  },
  {
    name: 'Component Exports',
    test: () => {
      try {
        const fs = require('fs');
        const path = require('path');
        
        const components = [
          'PostCard.tsx',
          'PostFeed.tsx', 
          'PostSkeleton.tsx',
          'ReactionBar.tsx',
          'CommentSection.tsx'
        ];
        
        for (const component of components) {
          const componentPath = path.join(__dirname, 'components', component);
          const content = fs.readFileSync(componentPath, 'utf8');
          
          // Check for named export
          const componentName = component.replace('.tsx', '');
          if (!content.includes(`export function ${componentName}`)) {
            throw new Error(`Named export not found in ${component}`);
          }
          
          // Check for default export
          if (!content.includes(`export default ${componentName}`)) {
            throw new Error(`Default export not found in ${component}`);
          }
        }
        
        return { success: true, message: 'All exports valid' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  },
  {
    name: 'Index File',
    test: () => {
      try {
        const fs = require('fs');
        const path = require('path');
        
        const indexPath = path.join(__dirname, 'components', 'index.ts');
        const content = fs.readFileSync(indexPath, 'utf8');
        
        const requiredExports = [
          'export { PostCard }',
          'export { PostFeed }',
          'export { PostSkeleton }',
          'export { ReactionBar }',
          'export { CommentSection }'
        ];
        
        for (const exportStatement of requiredExports) {
          if (!content.includes(exportStatement)) {
            throw new Error(`Missing export: ${exportStatement}`);
          }
        }
        
        return { success: true, message: 'Index exports valid' };
      } catch (error) {
        return { success: false, message: error.message };
      }
    }
  }
];

let totalTests = validationTests.length;
let passedTests = 0;
let failedTests = 0;

for (const test of validationTests) {
  console.log(`Testing: ${test.name}`);
  
  const result = test.test();
  
  if (result.success) {
    console.log(`✅ ${test.name}: ${result.message}`);
    passedTests++;
  } else {
    console.log(`❌ ${test.name}: ${result.message}`);
    failedTests++;
  }
}

console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));
console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (failedTests === 0) {
  console.log('\n🎉 All validations passed! Components are properly configured.');
} else {
  console.log('\n⚠️  Some validations failed. Please check the component structure.');
}
