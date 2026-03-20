const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  // Check what the API sees
  const testBody = '{"email":"admin@careerhub.com","password":"Admin@CareerHub2026!"}';
  const parsed = JSON.parse(testBody);
  console.log('Parsed email:', parsed.email);
  console.log('Parsed password:', parsed.password);
  console.log('Parsed password length:', parsed.password.length);
  
  // Get user from DB
  const user = await prisma.user.findUnique({ where: { email: parsed.email } });
  console.log('DB user:', user?.email);
  console.log('DB hash:', user?.password);
  
  // Compare
  const match = await bcrypt.compare(parsed.password, user.password);
  console.log('Match:', match);
  
  process.exit(0);
}

debug();
