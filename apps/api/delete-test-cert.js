const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const result = await prisma.certificate.deleteMany({
    where: { userId: 'cmniv4lan000084natgh4o5sp' }
  })
  console.log('Deleted:', result.count)
  await prisma.$disconnect()
}
main().catch(console.error).then(() => {})