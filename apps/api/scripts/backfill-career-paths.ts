import { PrismaClient } from '@prisma/client'
import { getPathsForCategory } from '../src/common/career-path-mapping'

const prisma = new PrismaClient()

async function main() {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      titleAr: true,
      titleEn: true,
      careerPaths: true,
      category: { select: { nameEn: true, nameAr: true } },
    },
  })

  console.log(`Backfilling ${courses.length} courses...`)

  let updated = 0
  let skipped = 0

  for (const course of courses) {
    const catText = [
      course.category?.nameEn || '',
      course.category?.nameAr || '',
    ].filter(Boolean).join(' ').trim()

    const slugs = getPathsForCategory(catText)

    if (slugs.length > 0) {
      await prisma.course.update({
        where: { id: course.id },
        data: { careerPaths: slugs },
      })
      console.log(`  [OK] ${course.titleAr || course.titleEn}: [${slugs.join(', ')}]`)
      updated++
    } else {
      console.log(`  [--] ${course.titleAr || course.titleEn}: no match (category="${catText}")`)
      skipped++
    }
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`)
  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
