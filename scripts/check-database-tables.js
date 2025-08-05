const { PrismaClient } = require('@prisma/client');

async function checkDatabaseTables() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database tables...');
    
    // Get all tables in the public schema
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log(`📋 Found ${tables.length} tables in the database:`);
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    
    // Check for specific tables we need for indexes
    const requiredTables = [
      'User', 'Class', 'Activity', 'Assessment', 'StudentEnrollment', 
      'ClassTeacher', 'ActivityGrade', 'AssessmentSubmission', 
      'Attendance', 'Notification', 'TeacherProfile', 'StudentProfile'
    ];
    
    console.log('\n🎯 Checking for required tables:');
    const existingTables = tables.map(t => t.table_name);
    
    requiredTables.forEach(tableName => {
      const exists = existingTables.includes(tableName);
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
    });
    
    // Check existing indexes
    console.log('\n🔍 Checking existing indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname;
    `;
    
    console.log(`📊 Found ${indexes.length} indexes in the database`);
    
    // Group by table
    const indexesByTable = {};
    indexes.forEach(index => {
      if (!indexesByTable[index.tablename]) {
        indexesByTable[index.tablename] = [];
      }
      indexesByTable[index.tablename].push(index.indexname);
    });
    
    Object.entries(indexesByTable).forEach(([table, tableIndexes]) => {
      console.log(`  ${table}: ${tableIndexes.length} indexes`);
    });
    
  } catch (error) {
    console.error('💥 Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseTables();
