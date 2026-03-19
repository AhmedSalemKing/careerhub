const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testLogin() {
  try {
    // Find the admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@careerhub.com' }
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:', admin.email);

    // Test password comparison
    const isValid = await bcrypt.compare('Admin@CareerHub2026!', admin.password);
    
    if (isValid) {
      console.log('✅ Password verification successful');
    } else {
      console.log('❌ Password verification failed');
    }

    // Test with wrong password
    const isInvalid = await bcrypt.compare('wrongpassword', admin.password);
    
    if (!isInvalid) {
      console.log('✅ Wrong password correctly rejected');
    } else {
      console.log('❌ Wrong password incorrectly accepted');
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
