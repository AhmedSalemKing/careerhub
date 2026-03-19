const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkApiUser() {
  try {
    console.log('🔍 Checking what user API actually finds...');
    
    // Find ALL admin users to see if there are duplicates
    const adminUsers = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    console.log('📋 All admin users:', adminUsers.length);
    adminUsers.forEach((user, index) => {
      console.log(`  Admin ${index + 1}:`, {
        id: user.id,
        email: user.email,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    });
    
    // Check the specific admin user
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@careerhub.com' },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        password: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    
    console.log('🎯 Specific admin user check:', {
      found: !!admin,
      id: admin?.id,
      email: admin?.email,
      role: admin?.role,
      isActive: admin?.isActive,
      hasPassword: !!admin?.password,
      passwordLength: admin?.password?.length,
      createdAt: admin?.createdAt,
      updatedAt: admin?.updatedAt
    });
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiUser();
