/**
 * verify-bunny-lessons — read-only check of the lessons that hold a Bunny
 * recording.
 *
 * It looks at the courses that already have a recording and reports whether
 * the lesson that carries it is stored the way the player expects:
 *
 *   · a section that belongs to the course
 *   · a full HLS playlist URL (not a bare Bunny GUID)
 *   · isPublished = true, so students can see it
 *
 * Nothing is written — the script only reads.
 *
 *   npx ts-node src/scripts/verify-bunny-lessons.ts
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

const CDN_HOSTNAME = (process.env.BUNNY_CDN_HOSTNAME || '')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '');

const HLS_RE = new RegExp(`^https://${CDN_HOSTNAME.replace(/\./g, '\\.')}/[0-9a-f-]{36}/playlist\\.m3u8$`, 'i');

function hr(title: string) {
  console.log('\n' + '='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
}

async function main() {
  hr('Bunny configuration');
  console.log('  CDN hostname :', CDN_HOSTNAME || '(not set)');
  console.log('  expected HLS : https://{cdn}/{guid}/playlist.m3u8');

  hr('Courses with a recording');

  const courses = await prisma.course.findMany({
    where: { recordingUrl: { not: null } },
    select: {
      id: true,
      titleEn: true,
      titleAr: true,
      type: true,
      liveStatus: true,
      recordingUrl: true,
      sections: {
        select: {
          id: true,
          title: true,
          courseId: true,
          lessons: {
            select: {
              id: true,
              title: true,
              type: true,
              videoUrl: true,
              recordingUrl: true,
              isPublished: true,
              sectionId: true,
            },
          },
        },
      },
    },
  });

  console.log(`  ${courses.length} course(s) with a recordingUrl`);

  let problems = 0;

  for (const course of courses) {
    console.log(`\n  ── ${course.titleEn || course.titleAr || course.id}`);
    console.log(`     id=${course.id} type=${course.type} liveStatus=${course.liveStatus}`);
    console.log(`     course.recordingUrl = ${course.recordingUrl}`);

    const recorded = course.sections.flatMap((s) => s.lessons).filter((l) => l.recordingUrl);

    if (!recorded.length) {
      console.log('     ✗ no lesson carries a recordingUrl');
      problems++;
      continue;
    }

    for (const lesson of recorded) {
      const section = course.sections.find((s) => s.id === lesson.sectionId);
      const checks: [string, boolean][] = [
        ['section belongs to the course', !!section && section.courseId === course.id],
        ['videoUrl is a full HLS playlist URL', !!lesson.videoUrl && HLS_RE.test(lesson.videoUrl)],
        ['recordingUrl is a full HLS playlist URL', !!lesson.recordingUrl && HLS_RE.test(lesson.recordingUrl)],
        ['isPublished is true', lesson.isPublished === true],
        ['lesson type is VIDEO', lesson.type === 'VIDEO'],
      ];

      console.log(`     lesson ${lesson.id} — ${lesson.title}`);
      console.log(`       videoUrl      = ${lesson.videoUrl}`);
      console.log(`       recordingUrl  = ${lesson.recordingUrl}`);
      console.log(`       section       = ${section ? `${section.title} (${section.id})` : 'none'}`);
      for (const [label, ok] of checks) {
        console.log(`       ${ok ? '✔' : '✗'} ${label}`);
        if (!ok) problems++;
      }
    }
  }

  hr('Result');
  console.log(problems === 0
    ? '  ✔ every recorded lesson is stored the way the player expects'
    : `  ✗ ${problems} problem(s) found`);
  await prisma.$disconnect();
  process.exit(problems === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
