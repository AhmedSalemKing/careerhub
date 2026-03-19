const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAdminLogin() {
  try {
    console.log('🔍 Debugging admin login process...');
    
    // Step 1: Find admin user exactly like the service does
    const user = await prisma.user.findUnique({
      where: { email: 'admin@careerhub.com' },
      include: { profile: true },
    });
    
    if (!user) {
      console.log('❌ Step 1 FAILED: Admin user not found');
      return;
    }
    
    console.log('✅ Step 1 SUCCESS: User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password,
      passwordLength: user.password?.length
    });
    
    // Step 2: Check isActive and role exactly like service
    if (!user.isActive) {
      console.log('❌ Step 2 FAILED: User is not active');
      return;
    }
    
    if (user.role !== 'ADMIN') {
      console.log('❌ Step 2 FAILED: User role is not ADMIN:', user.role);
      return;
    }
    
    console.log('✅ Step 2 SUCCESS: User is active and has ADMIN role');
    
    // Step 3: Test password comparison exactly like service
    const testPassword = 'Admin@CareerHub2026!';
    console.log('🔐 Step 3: Testing password comparison...');
    console.log('   Test password:', testPassword);
    console.log('   Stored hash (first 50 chars):', user.password.substring(0, 50));
    
    const isPasswordValid = await bcrypt.compare(testPassword, user.password);
    
    console.log('   Comparison result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Step 3 FAILED: Password comparison failed');
      return;
    }
    
    console.log('✅ Step 3 SUCCESS: Password comparison passed');
    console.log('🎉 ALL CHECKS PASSED - Admin login should work!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminLogin();
