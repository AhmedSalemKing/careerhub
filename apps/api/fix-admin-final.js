const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('Admin@CareerHub2026!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'admin@careerhub.com' },
    update: { password: hash, isActive: true, role: 'ADMIN', deletedAt: null },
    create: { email: 'admin@careerhub.com', password: hash, role: 'ADMIN', isActive: true }
  });
  console.log('Admin fixed:', user.email, user.role);
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
