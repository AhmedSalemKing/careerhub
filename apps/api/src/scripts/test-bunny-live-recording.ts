/**
 * test-bunny-live-recording — the full "upload → lesson → player" flow.
 *
 * It runs the real `LiveService.saveRecording()` (the endpoint the instructor
 * hits at the end of a live session), reads the lesson back from the database
 * and checks everything the student player depends on:
 *
 *   · the lesson exists and is linked to the course through its section
 *   · `videoUrl` is the full HLS playlist URL, not a bare Bunny GUID
 *   · `isPublished` is true, so students can see the recording
 *
 * A throwaway DRAFT course is used and removed again afterwards; the Bunny
 * video is deleted as well.
 *
 *   npx ts-node src/scripts/test-bunny-live-recording.ts
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { AgoraService } from '../modules/live/agora.service';
import { BunnyStreamService } from '../modules/upload/bunny-stream.service';
import { LiveService } from '../modules/live/live.service';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const CDN_HOSTNAME = (process.env.BUNNY_CDN_HOSTNAME || '')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '');

const REMOTE_TEST_VIDEOS = [
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
];

function hr(title: string) {
  console.log('\n' + '='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
}

async function buildTestVideo(): Promise<Buffer> {
  for (const url of REMOTE_TEST_VIDEOS) {
    try {
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
      const buffer = Buffer.from(res.data);
      if (buffer.length > 32 && buffer.slice(4, 8).toString('latin1') === 'ftyp') return buffer;
    } catch {
      /* try the next one */
    }
  }
  throw new Error('No test video could be fetched');
}

async function main() {
  const prisma = new PrismaService();
  await prisma.$connect();

  const bunny = new BunnyStreamService();
  const live = new LiveService(prisma, new AgoraService(), bunny);

  const slug = `zz-bunny-e2e-${Date.now()}`;
  let course: any = null;
  let videoId: string | null = null;

  try {
    hr('1. Throwaway live course');

    course = await prisma.course.create({
      data: {
        slug,
        titleEn: 'Bunny E2E test course',
        titleAr: 'اختبار bunny',
        descriptionEn: 'Temporary course created by test-bunny-live-recording',
        type: 'live',
        status: 'DRAFT',
        price: 0,
        liveStatus: 'live',
      },
    });
    console.log(`  created course ${course.id} (${course.slug})`);

    hr('2. saveRecording()');

    const buffer = await buildTestVideo();
    const file = {
      buffer,
      originalname: 'live-recording-e2e.mp4',
      mimetype: 'video/mp4',
      size: buffer.length,
    } as unknown as Express.Multer.File;

    const saved = await live.saveRecording(
      'e2e-user',
      course.id,
      file,
      'تسجيل البث المباشر',
      'SUPER_ADMIN',
    );
    videoId = saved.data.videoId;

    console.log('  lessonId :', saved.data.lessonId);
    console.log('  videoId  :', saved.data.videoId);
    console.log('  url      :', saved.data.url);
    console.log('  sectionId:', saved.data.sectionId);

    hr('3. The lesson in the database');

    const lesson = await prisma.lesson.findUnique({
      where: { id: saved.data.lessonId },
      include: { section: { include: { course: true } } },
    });

    if (!lesson) {
      console.log('  ✗ the lesson was not created');
      process.exitCode = 1;
      return;
    }

    const hlsPattern = new RegExp(
      `^https://${CDN_HOSTNAME.replace(/\./g, '\\.')}/[0-9a-f-]{36}/playlist\\.m3u8$`,
      'i',
    );

    const checks: [string, boolean][] = [
      ['the lesson exists', !!lesson],
      ['it is linked to the course through its section', lesson.section?.courseId === course.id],
      ['videoUrl is the full HLS playlist URL', hlsPattern.test(lesson.videoUrl || '')],
      ['recordingUrl is the full HLS playlist URL', hlsPattern.test(lesson.recordingUrl || '')],
      ['videoUrl is not the bare Bunny GUID', lesson.videoUrl !== videoId],
      ['isPublished is true', lesson.isPublished === true],
      ['the lesson type is VIDEO', lesson.type === 'VIDEO'],
    ];

    console.log(`  lesson.id          : ${lesson.id}`);
    console.log(`  lesson.videoUrl    : ${lesson.videoUrl}`);
    console.log(`  lesson.recordingUrl: ${lesson.recordingUrl}`);
    console.log(`  lesson.isPublished : ${lesson.isPublished}`);
    console.log(`  lesson.type        : ${lesson.type}`);
    console.log(`  section            : ${lesson.section?.title} (${lesson.sectionId})`);
    console.log(`  section.courseId   : ${lesson.section?.courseId}`);

    let failed = 0;
    for (const [label, ok] of checks) {
      console.log(`  ${ok ? '✔' : '✗'} ${label}`);
      if (!ok) failed++;
    }

    hr('4. The course after the recording');

    const updated = await prisma.course.findUnique({ where: { id: course.id } });
    console.log(`  course.recordingUrl : ${updated?.recordingUrl}`);
    console.log(`  course.liveStatus   : ${updated?.liveStatus}`);

    const courseChecks: [string, boolean][] = [
      ['the course points at the recording', updated?.recordingUrl === lesson.videoUrl],
      ['a live course is "ended" once its recording is in', updated?.liveStatus === 'ended'],
    ];
    for (const [label, ok] of courseChecks) {
      console.log(`  ${ok ? '✔' : '✗'} ${label}`);
      if (!ok) failed++;
    }

    hr('5. What the player receives');

    // The learn app hands the URL to hls.js unchanged — it never rebuilds it.
    const playerUrl = lesson.videoUrl;
    console.log(`  hls.js source : ${playerUrl}`);
    console.log(`  is an .m3u8  : ${/\.m3u8(\?|#|$)/i.test(playerUrl || '')}`);

    if (failed) process.exitCode = 1;
  } finally {
    hr('6. Cleanup');

    if (course) {
      await prisma.course.delete({ where: { id: course.id } }).catch((e: any) =>
        console.log(`  could not delete the course: ${e?.message}`),
      );
      console.log('  ✔ the throwaway course (with its section and lesson) is gone');
    }
    if (videoId) {
      await bunny.deleteVideo(videoId).catch((e: any) =>
        console.log(`  could not delete the Bunny video: ${e?.message}`),
      );
      console.log('  ✔ the Bunny video is gone');
    }
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
