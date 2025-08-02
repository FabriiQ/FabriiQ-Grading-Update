const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCampusAdmin() {
  try {
    console.log('Checking Michael Smith campus admin assignment...\n');
    
    // Find Michael Smith user
    const user = await prisma.user.findUnique({
      where: { username: 'michael_smith' },
      include: {
        activeCampuses: {
          include: {
            campus: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ Michael Smith user not found');
      return;
    }

    console.log('✅ User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   User Type: ${user.userType}`);
    console.log(`   Primary Campus ID: ${user.primaryCampusId || 'NOT SET'}`);
    console.log(`   Access Scope: ${user.accessScope}`);
    console.log(`   Status: ${user.status}\n`);

    // Check campus access
    console.log('Campus Access Records:');
    if (user.activeCampuses.length === 0) {
      console.log('❌ No campus access records found');
    } else {
      user.activeCampuses.forEach((access, index) => {
        console.log(`   ${index + 1}. Campus: ${access.campus.name} (${access.campus.code})`);
        console.log(`      Campus ID: ${access.campusId}`);
        console.log(`      Role Type: ${access.roleType}`);
        console.log(`      Status: ${access.status}`);
        console.log(`      Start Date: ${access.startDate}`);
        console.log('');
      });
    }

    // Check if primary campus exists
    if (user.primaryCampusId) {
      const primaryCampus = await prisma.campus.findUnique({
        where: { id: user.primaryCampusId }
      });
      
      if (primaryCampus) {
        console.log('✅ Primary Campus Details:');
        console.log(`   Name: ${primaryCampus.name}`);
        console.log(`   Code: ${primaryCampus.code}`);
        console.log(`   Status: ${primaryCampus.status}`);
      } else {
        console.log('❌ Primary campus not found in database');
      }
    }

    // Check all campuses
    console.log('\nAll Available Campuses:');
    const allCampuses = await prisma.campus.findMany({
      where: { status: 'ACTIVE' }
    });
    
    allCampuses.forEach((campus, index) => {
      console.log(`   ${index + 1}. ${campus.name} (${campus.code}) - ID: ${campus.id}`);
    });

  } catch (error) {
    console.error('Error checking campus admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCampusAdmin();
