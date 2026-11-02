import { PrismaClient } from '@prisma/client'
import { getPathsForCategory } from '../src/common/career-path-mapping'

const prisma = new PrismaClient()

async function main() {
  const courses = await prisma.course.findMany({
    select: {
      id: true,
      titleAr: true,
      titleEn: true,
      category: { select: { slug: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  console.log(`Rebuilding career paths for ${courses.length} courses...`)

  // Step 1 — clear every tag first so no stale/fuzzy value survives.
  await prisma.course.updateMany({ data: { careerPaths: [] } })

  // Step 2 — fill strictly from the stored category slug (never the title).
  const unmatched: Array<{ title: string; category: string | null }> = []
  let tagged = 0

  for (const course of courses) {
    const category = course.category?.slug ?? null
    const slugs = category ? getPathsForCategory(category) : []

    await prisma.course.update({
      where: { id: course.id },
      data: { careerPaths: slugs },
    })

    const title = course.titleAr || course.titleEn || course.id
    console.log(
      `  ${slugs.length > 0 ? '[OK]' : '[--]'} ${title} | category=${category ?? '(none)'} | paths=[${slugs.join(', ')}]`,
    )

    if (slugs.length > 0) tagged++
    else unmatched.push({ title, category })
  }

  console.log(`\nDone. Total: ${courses.length}, tagged: ${tagged}, unmatched: ${unmatched.length}`)

  if (unmatched.length > 0) {
    console.log('\nUnmatched courses (need manual career-path tagging):')
    for (const course of unmatched) {
      console.log(`  - ${course.title} | category=${course.category ?? '(none)'}`)
    }
  }

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
