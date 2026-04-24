const { PrismaClient } = require("@prisma/client")
const p = new PrismaClient()
async function main() {
  const count = await p.userActivity.count().catch(e => { console.log("Model error:", e.message); return -1 })
  console.log("Total activities:", count)
  
  if (count > 0) {
    const latest = await p.userActivity.findMany({ take: 5, orderBy: { createdAt: "desc" } })
    console.log("Latest:", JSON.stringify(latest, null, 2))
  }
  
  const users = await p.user.findMany({ select: { id: true, email: true }, take: 5 })
  console.log("Users:", users)
}
main().catch(console.error).finally(() => p.$disconnect())