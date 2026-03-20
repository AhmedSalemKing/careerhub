const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({ where: { email: 'admin@careerhub.com' } });
  console.log('User found:', user ? user.email : 'NOT FOUND');
  console.log('DB hash:', user.password);
  
  const testPassword = 'Admin@CareerHub2026!';
  console.log('Testing password:', testPassword);
  
  const result = await bcrypt.compare(testPassword, user.password);
  console.log('bcrypt.compare result:', result);
  
  // Test with fresh hash
  const newHash = await bcrypt.hash(testPassword, 12);
  console.log('New hash:', newHash);
  
  const result2 = await bcrypt.compare(testPassword, newHash);
  console.log('New hash compare:', result2);
  
  // Compare with DB hash directly
  const result3 = await bcrypt.compare(testPassword, user.password);
  console.log('DB hash compare again:', result3);
  
  process.exit(0);
}

test().catch(e => { console.error('ERROR:', e); process.exit(1); });
