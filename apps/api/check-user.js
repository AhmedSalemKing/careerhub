const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'admin@careerhub.com' },
    select: { email: true, isActive: true, role: true }
  });
  console.log('User status:', user);
  process.exit(0);
}
check();
