const { PrismaClient } = require('@prisma/client');

async function inspectTableSchemas() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Inspecting table schemas...');
    
    // Tables we need to check for performance indexes
    const tablesToCheck = [
      'users', 'classes', 'activities', 'assessments', 
      'student_enrollments', 'teacher_assignments', 'activity_grades', 
      'assessment_submissions', 'attendance', 'notifications',
      'teacher_profiles', 'student_profiles'
    ];
    
    for (const tableName of tablesToCheck) {
      try {
        console.log(`\n📋 Table: ${tableName}`);
        
        // Get column information
        const columns = await prisma.$queryRaw`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
            AND table_name = ${tableName}
          ORDER BY ordinal_position;
        `;
        
        if (columns.length === 0) {
          console.log(`  ❌ Table ${tableName} does not exist`);
          continue;
        }
        
        console.log(`  ✅ Found ${columns.length} columns:`);
        columns.forEach(col => {
          console.log(`    - ${col.column_name} (${col.data_type})`);
        });
        
        // Get existing indexes for this table
        const indexes = await prisma.$queryRaw`
          SELECT 
            indexname,
            indexdef
          FROM pg_indexes 
          WHERE schemaname = 'public' 
            AND tablename = ${tableName}
          ORDER BY indexname;
        `;
        
        console.log(`  📊 Existing indexes: ${indexes.length}`);
        indexes.forEach(idx => {
          console.log(`    - ${idx.indexname}`);
        });
        
      } catch (error) {
        console.error(`  ❌ Error inspecting ${tableName}:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectTableSchemas();
