const { PrismaClient } = require("@prisma/client")
const p = new PrismaClient()
async function main() {
  const lessons = await p.lesson.findMany({
    where: { OR: [
      { videoUrl: { contains: '/uploads/' } },
      { fileUrl: { contains: '/uploads/' } },
    ]},
    select: { id: true, title: true, type: true, videoUrl: true, fileUrl: true },
    take: 20
  })
  console.log("Lessons with local URLs:", JSON.stringify(lessons, null, 2))
  
  const users = await p.user.findMany({
    where: { cvUrl: { contains: '/uploads/' } },
    select: { id: true, email: true, cvUrl: true },
    take: 10
  })
  console.log("Users with local CV URLs:", JSON.stringify(users, null, 2))
}
main().catch(console.error).finally(() => p.$disconnect())
