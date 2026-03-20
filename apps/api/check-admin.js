const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@careerhub.com' } });
  console.log('User found:', !!user);
  console.log('Role:', user?.role);
  console.log('IsActive:', user?.isActive);
  console.log('Password hash starts with:', user?.password?.substring(0, 10));
  
  const valid = await bcrypt.compare('Admin@CareerHub2026!', user?.password || '');
  console.log('Password valid:', valid);
  await prisma.$disconnect();
}

check().catch(console.error);
