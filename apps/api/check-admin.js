require('dotenv').config()
const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcrypt")
const p = new PrismaClient()
async function main() {
  const user = await p.user.findFirst({ where: { email: "admin@deveway.com" } })
  if (!user) return console.log("NO USER FOUND")
  console.log("User:", JSON.stringify({
    id: user.id,
    email: user.email,
    accountType: user.accountType,
    role: user.role,
    isActive: user.isActive,
    status: user.status,
    passwordLength: user.password?.length,
    passwordStart: user.password?.substring(0, 10)
  }, null, 2))
  const match = await bcrypt.compare("Admin123!", user.password)
  console.log("Password match:", match)
}
main().catch(e => console.error("ERR:", e.message)).finally(() => p.$disconnect())
