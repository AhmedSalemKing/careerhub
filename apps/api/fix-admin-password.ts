const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminPassword() {
  try {
    const hash = await bcrypt.hash('Admin@CareerHub2026!', 12);
    const user = await prisma.user.update({
      where: { email: 'admin@careerhub.com' },
      data: { password: hash }
    });
    console.log('Admin password reset:', user.email);
    console.log('Password hash updated successfully');
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminPassword();
