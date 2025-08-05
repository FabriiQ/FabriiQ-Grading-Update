const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function runPerformanceIndexes() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting performance indexes installation...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'database', 'performance-indexes.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the raw SQL
        await prisma.$executeRawUnsafe(statement);
        successCount++;
        
        // Log successful index creation
        if (statement.includes('CREATE INDEX')) {
          const indexMatch = statement.match(/CREATE INDEX.*?(\w+)/);
          const indexName = indexMatch ? indexMatch[1] : 'unknown';
          console.log(`✅ Created index: ${indexName}`);
        } else if (statement.includes('ANALYZE')) {
          const tableMatch = statement.match(/ANALYZE "(\w+)"/);
          const tableName = tableMatch ? tableMatch[1] : 'unknown';
          console.log(`📊 Analyzed table: ${tableName}`);
        } else {
          console.log(`✅ Executed statement successfully`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error executing statement ${i + 1}:`, error.message);
        
        // Continue with other statements even if one fails
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Index already exists, skipping...`);
          successCount++; // Count as success since index exists
          errorCount--; // Don't count as error
        }
      }
    }
    
    console.log('\n🎉 Performance indexes installation completed!');
    console.log(`✅ Successful operations: ${successCount}`);
    console.log(`❌ Failed operations: ${errorCount}`);
    
    // Run verification query
    console.log('\n🔍 Verifying created indexes...');
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public' 
        AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `;
    
    console.log(`📋 Found ${indexes.length} performance indexes in the database`);
    
    // Group indexes by table
    const indexesByTable = {};
    indexes.forEach(index => {
      if (!indexesByTable[index.tablename]) {
        indexesByTable[index.tablename] = [];
      }
      indexesByTable[index.tablename].push(index.indexname);
    });
    
    console.log('\n📊 Indexes by table:');
    Object.entries(indexesByTable).forEach(([table, tableIndexes]) => {
      console.log(`  ${table}: ${tableIndexes.length} indexes`);
      tableIndexes.forEach(indexName => {
        console.log(`    - ${indexName}`);
      });
    });
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
runPerformanceIndexes()
  .then(() => {
    console.log('\n🏁 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
