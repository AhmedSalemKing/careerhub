const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testDBConnection() {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Find admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@careerhub.com' }
    });
    
    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('✅ Admin user found:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      hasPassword: !!admin.password
    });
    
    // Test password comparison
    const testPassword = 'Admin@CareerHub2026!';
    const isValid = await bcrypt.compare(testPassword, admin.password);
    
    console.log('🔐 Password test result:', {
      testPassword,
      isValid,
      passwordHashLength: admin.password.length
    });
    
    if (isValid) {
      console.log('✅ Login should work!');
    } else {
      console.log('❌ Login will fail - password mismatch');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDBConnection();
