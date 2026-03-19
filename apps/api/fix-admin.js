const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    const hash = await bcrypt.hash('Admin@CareerHub2026!', 12);
    const user = await prisma.user.upsert({
      where: { email: 'admin@careerhub.com' },
      update: { 
        password: hash, 
        isActive: true, 
        role: 'ADMIN' 
      },
      create: { 
        email: 'admin@careerhub.com', 
        password: hash, 
        role: 'ADMIN', 
        isActive: true 
      }
    });
    console.log('✅ Admin password reset:', user.email);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
