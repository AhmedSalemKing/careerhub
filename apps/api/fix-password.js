const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const hash = await bcrypt.hash('Admin@CareerHub2026!', 12);
  console.log('New hash:', hash);
  
  const user = await prisma.user.update({
    where: { email: 'admin@careerhub.com' },
    data: { password: hash }
  });
  
  console.log('Updated:', user.email);
  
  const verify = await prisma.user.findUnique({ where: { email: 'admin@careerhub.com' } });
  console.log('DB password starts with:', verify.password.substring(0, 10));
  
  await prisma['']();
}

fix().catch(e => { console.error('ERROR:', e); process.exit(1); });
