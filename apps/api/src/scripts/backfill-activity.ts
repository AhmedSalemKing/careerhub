import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function backfill() {
  // 1. Backfill sessions → BOOK_SESSION
  const sessions = await prisma.consultingSession.findMany({
    include: {
      consultant: { include: { profile: true } },
    },
  })

  let sessionCount = 0
  for (const s of sessions) {
    if (!s.studentId) continue
    const exists = await prisma.userActivity.findFirst({
      where: { action: 'BOOK_SESSION', entityId: s.id },
    })
    if (!exists) {
      const consultantName = s.consultant?.profile
        ? `${s.consultant.profile.firstName || ''} ${s.consultant.profile.lastName || ''}`.trim()
        : 'مستشار'
      await prisma.userActivity.create({
        data: {
          userId: s.studentId,
          action: 'BOOK_SESSION',
          entity: 'Session',
          entityId: s.id,
          metadata: {
            consultantName,
            date: s.scheduledAt.toLocaleDateString('ar-SA'),
            sessionDate: s.scheduledAt,
            price: (s as any).price ?? 0,
            status: s.status,
          },
          createdAt: s.createdAt,
        },
      })
      sessionCount++
    }
  }
  console.log(`✓ Backfilled ${sessionCount} BOOK_SESSION records (of ${sessions.length} sessions)`)

  // 2. Backfill enrollments → ENROLL_COURSE (skip those already tracked)
  const enrollments = await prisma.enrollment.findMany({
    include: { course: { select: { titleAr: true, titleEn: true } } },
  })

  let enrollCount = 0
  for (const e of enrollments) {
    const exists = await prisma.userActivity.findFirst({
      where: { action: 'ENROLL_COURSE', entityId: e.courseId, userId: e.userId },
    })
    if (!exists) {
      await prisma.userActivity.create({
        data: {
          userId: e.userId,
          action: 'ENROLL_COURSE',
          entity: 'Course',
          entityId: e.courseId,
          metadata: {
            courseTitle: (e.course as any)?.titleAr || (e.course as any)?.titleEn || 'كورس',
          },
          createdAt: e.enrolledAt ?? new Date(),
        },
      })
      enrollCount++
    }
  }
  console.log(`✓ Backfilled ${enrollCount} ENROLL_COURSE records (of ${enrollments.length} enrollments)`)

  // 3. Backfill paid sessions → PAYMENT_SUCCESS
  const paidSessions = await prisma.consultingSession.findMany({
    where: { paymentStatus: 'PAID' },
    include: { consultant: { include: { profile: true } } },
  })

  let payCount = 0
  for (const s of paidSessions) {
    if (!s.studentId) continue
    const exists = await prisma.userActivity.findFirst({
      where: { action: 'PAYMENT_SUCCESS', entityId: s.id },
    })
    if (!exists) {
      const consultantName = s.consultant?.profile
        ? `${s.consultant.profile.firstName || ''} ${s.consultant.profile.lastName || ''}`.trim()
        : 'المستشار'
      await prisma.userActivity.create({
        data: {
          userId: s.studentId,
          action: 'PAYMENT_SUCCESS',
          entity: 'Session',
          entityId: s.id,
          metadata: {
            amount: (s as any).price ?? 0,
            consultantName,
            date: s.scheduledAt.toLocaleDateString('ar-SA'),
            method: 'backfill',
          },
          createdAt: s.updatedAt ?? s.createdAt,
        },
      })
      payCount++
    }
  }
  console.log(`✓ Backfilled ${payCount} PAYMENT_SUCCESS records (of ${paidSessions.length} paid sessions)`)

  await prisma.$disconnect()
  console.log('\nBackfill complete!')
}

backfill().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
