const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdmin() {
  const hash = await bcrypt.hash('Admin@CareerHub2026!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@careerhub.com' },
    update: { password: hash, isActive: true, role: 'ADMIN' },
    create: { email: 'admin@careerhub.com', password: hash, role: 'ADMIN', isActive: true }
  });
  console.log('Done:', user.email);
  await prisma.$disconnect();
}

fixAdmin().catch(console.error);
