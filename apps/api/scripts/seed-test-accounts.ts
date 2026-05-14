import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('Test123456!', 12)

  const accounts = [
    {
      email: 'test.student@deveway.com',
      accountType: 'STUDENT',
      role: 'USER',
      status: 'ACTIVE',
      firstName: 'Test',
      lastName: 'Student',
    },
    {
      email: 'test.instructor@deveway.com',
      accountType: 'INSTRUCTOR',
      role: 'USER',
      status: 'ACTIVE',
      firstName: 'Test',
      lastName: 'Instructor',
    },
    {
      email: 'test.consultant@deveway.com',
      accountType: 'CONSULTANT',
      role: 'USER',
      status: 'ACTIVE',
      firstName: 'Test',
      lastName: 'Consultant',
    },
  ]

  for (const acc of accounts) {
    const existing = await prisma.user.findUnique({ where: { email: acc.email } })
    if (existing) {
      console.log(`Already exists: ${acc.email}`)
      continue
    }

    const user = await prisma.user.create({
      data: {
        email: acc.email,
        password,
        accountType: acc.accountType,
        role: acc.role as any,
        status: acc.status,
        isActive: true,
        provider: 'local',
        walletBalance: 100,
        earningsBalance: 0,
        profile: {
          create: {
            firstName: acc.firstName,
            lastName: acc.lastName,
            timezone: 'Asia/Riyadh',
            language: 'ar',
          }
        }
      }
    })
    console.log(`Created: ${user.email}`)
  }

  console.log('Test accounts seeded successfully!')
  await prisma.$disconnect()
}

main().catch(console.error)
