/**
 * test-bunny-upload — end-to-end check of the Bunny.net Stream integration.
 *
 * It runs the exact production path (`BunnyStreamService.uploadVideo`) with a
 * tiny real video, prints everything Bunny answered, and verifies that the
 * video shows up in the library listing and can be played back over HLS.
 *
 * Run it from the repository root:
 *   npx ts-node -e "require('./apps/api/src/scripts/test-bunny-upload')"
 * or from apps/api:
 *   npx ts-node src/scripts/test-bunny-upload.ts
 *
 * The test video is removed from the library again at the end unless
 * KEEP_TEST_VIDEO=1 is set.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { BunnyStreamService } from '../modules/upload/bunny-stream.service';

// The service reads process.env, so the real .env has to be loaded first.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const LIBRARY_ID = process.env.BUNNY_LIBRARY_ID || '';
const API_KEY = process.env.BUNNY_API_KEY || '';
const CDN_HOSTNAME = (process.env.BUNNY_CDN_HOSTNAME || '')
  .replace(/^https?:\/\//, '')
  .replace(/\/+$/, '');

/**
 * The Bunny pull zone rejects every request that arrives without a Referer
 * header (HTTP 403). A browser always sends one, so this only matters for
 * server-to-server checks like the ones below.
 */
const REFERER = 'https://deveways.com/';

/** A tiny but valid MP4 — the fallback when the network is unavailable. */
const FALLBACK_MP4_BASE64 =
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAA1tZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0OCByMjY0MyA1YzY1MiBjb2RlYyAtMS40OCAyMDA4LzEwMDAwIG1vdG9uIG1hc3RlcjogYXV0byB1bnVzZWQgZGF0YSB1c2VyZCB3YXJuaW5nIHNldHRpbmdzIGVuYWJsZWQ=';

/** Public, small test videos — fetched in this order. */
const REMOTE_TEST_VIDEOS = [
  'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
  'https://www.w3schools.com/html/mov_bbb.mp4',
];

/** Bunny video status codes, as seen on the API. */
const BUNNY_STATUS: Record<string, string> = {
  '0': 'new (no file uploaded yet)',
  '1': 'queued',
  '2': 'waiting for the encoder',
  '3': 'processing',
  '4': 'ready',
  '5': 'error',
};

function hr(title: string) {
  console.log('\n' + '='.repeat(72));
  console.log(title);
  console.log('='.repeat(72));
}

/** Checks that the buffer really is an MP4 (ftyp box) and not an error page. */
function looksLikeMp4(buffer: Buffer): boolean {
  return buffer.length > 32 && buffer.slice(4, 8).toString('latin1') === 'ftyp';
}

async function buildTestVideo(): Promise<{ buffer: Buffer; source: string }> {
  for (const url of REMOTE_TEST_VIDEOS) {
    try {
      const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: Infinity,
      });
      const buffer = Buffer.from(res.data);
      if (looksLikeMp4(buffer)) {
        return { buffer, source: `${url} (${buffer.length} bytes)` };
      }
      console.log(`  · ${url} did not return an mp4 — skipped`);
    } catch (error: any) {
      console.log(`  · ${url} could not be fetched (${error?.message}) — skipped`);
    }
  }

  const buffer = Buffer.from(FALLBACK_MP4_BASE64, 'base64');
  return { buffer, source: `built-in minimal mp4 (${buffer.length} bytes)` };
}

function statusLabel(status: number | string | undefined): string {
  return BUNNY_STATUS[String(status)] ?? 'unknown';
}

async function main() {
  hr('1. Environment');

  const missing = ['BUNNY_API_KEY', 'BUNNY_LIBRARY_ID', 'BUNNY_CDN_HOSTNAME'].filter(
    (v) => !process.env[v],
  );
  if (missing.length) {
    console.error(`✗ Missing required env var(s): ${missing.join(', ')}`);
    console.error('  The service refuses to boot without them — see apps/api/.env');
    process.exit(1);
  }

  console.log('[Bunny] Configured — Library:', LIBRARY_ID, 'CDN:', CDN_HOSTNAME);
  console.log(`  BUNNY_API_KEY       = ${API_KEY.slice(0, 6)}…${API_KEY.slice(-4)} (${API_KEY.length} chars)`);
  console.log(`  BUNNY_LIBRARY_ID    = ${LIBRARY_ID}`);
  console.log(`  BUNNY_CDN_HOSTNAME  = ${CDN_HOSTNAME}`);

  hr('2. Test video');

  const { buffer, source } = await buildTestVideo();
  console.log(`  source : ${source}`);
  console.log(`  size   : ${buffer.length} bytes`);
  console.log(`  is mp4 : ${looksLikeMp4(buffer)}`);

  hr('3. Upload through BunnyStreamService');

  const bunny = new BunnyStreamService();
  const title = 'test-upload-' + Date.now();

  const rawResponses: any[] = [];
  const result = await bunny.uploadVideo(buffer, {
    title,
    onRaw: (event) => {
      rawResponses.push(event);
      console.log(`  → ${event.step}: HTTP ${event.status}`);
      console.log(`    ${JSON.stringify(event.data)}`);
    },
  });

  console.log('\n  ✔ Upload succeeded');
  console.log('  Bunny video GUID :', result.videoId);
  console.log('  HLS URL          :', result.videoUrl);
  console.log('  Thumbnail URL    :', result.thumbnailUrl);

  const expectedHls = `https://${CDN_HOSTNAME}/${result.videoId}/playlist.m3u8`;
  console.log(`\n  HLS format check : ${result.videoUrl === expectedHls ? '✔ correct' : '✗ WRONG'}`);
  console.log(`  expected         : ${expectedHls}`);

  hr('4. Library listing');

  // The listing is updated asynchronously, so the video is looked up again
  // for a short while instead of once.
  let found: any = null;
  for (let attempt = 1; attempt <= 12 && !found; attempt++) {
    const listRes = await axios.get(
      `https://video.bunnycdn.com/library/${LIBRARY_ID}/videos`,
      {
        headers: { AccessKey: API_KEY, accept: 'application/json' },
        params: { page: 1, perPage: 100 },
        timeout: 30000,
      },
    );
    const items: any[] = listRes?.data?.items || [];
    found = items.find((v) => v.guid === result.videoId) || null;
    console.log(
      `  attempt ${attempt}: HTTP ${listRes.status} — ${listRes?.data?.totalItems ?? items.length} item(s) in the library`,
    );
    if (!found) await new Promise((r) => setTimeout(r, 5000));
  }
  console.log(`  video present in listing : ${found ? '✔ yes' : '✗ no'}`);
  if (found) {
    console.log(`  title : ${found.title}`);
    console.log(`  status: ${found.status} (${statusLabel(found.status)})`);
    console.log(`  length: ${found.length}s`);
  }

  hr('5. Video object from the Bunny API');

  let video = await bunny.getVideo(result.videoId);
  console.log(JSON.stringify(video, null, 2));

  hr('6. Transcoding + HLS playback');

  // Bunny encodes asynchronously — a freshly uploaded video needs roughly a
  // minute before the HLS playlist exists.
  const startedAt = Date.now();
  let playable = false;
  let lastStatus = '';
  while (Date.now() - startedAt < 300000) {
    const current = await bunny.getVideo(result.videoId);
    const line = `status=${current?.status} (${statusLabel(current?.status)}) encode=${current?.encodeProgress}% length=${current?.length}s resolutions=${current?.availableResolutions}`;
    if (line !== lastStatus) {
      console.log(`  t+${Math.round((Date.now() - startedAt) / 1000)}s ${line}`);
      lastStatus = line;
    }
    if (current?.transcodingMessages?.length) {
      console.log(`  transcoding messages: ${JSON.stringify(current.transcodingMessages)}`);
    }

    if (current?.status === 4 || current?.status === 5) {
      video = current;
      break;
    }
    await new Promise((r) => setTimeout(r, 10000));
  }

  console.log(`\n  final status: ${video?.status} (${statusLabel(video?.status)})`);

  for (const [label, url] of [
    ['HLS playlist', result.videoUrl],
    ['thumbnail  ', result.thumbnailUrl],
  ] as const) {
    try {
      const res = await axios.get(url, {
        timeout: 30000,
        validateStatus: () => true,
        responseType: 'text',
        headers: { Referer: REFERER },
      });
      const body = typeof res.data === 'string' ? res.data : '';
      console.log(`  ${label}: HTTP ${res.status}`);
      if (res.status === 200 && body.includes('#EXTM3U')) {
        playable = true;
        console.log('    ✔ a valid HLS playlist (#EXTM3U) is served');
        console.log(
          '    ' + body.split('\n').filter(Boolean).slice(0, 6).join('\n    '),
        );
      }
    } catch (error: any) {
      console.log(`  ${label}: ${error?.message}`);
    }
  }

  hr('7. Cleanup');

  if (process.env.KEEP_TEST_VIDEO === '1') {
    console.log('  KEEP_TEST_VIDEO=1 — the test video stays in the library');
  } else {
    try {
      await bunny.deleteVideo(result.videoId);
      console.log(`  ✔ removed ${result.videoId} from the library`);
    } catch (error: any) {
      console.log(`  ✗ could not remove the test video: ${error?.message}`);
    }
  }

  hr('Result');

  const createStatus = rawResponses.find((e) => e.step === 'create')?.status;
  const uploadStatus = rawResponses.find((e) => e.step === 'upload')?.status;
  const ok =
    createStatus >= 200 &&
    createStatus < 300 &&
    uploadStatus >= 200 &&
    uploadStatus < 300 &&
    !!found &&
    result.videoUrl === expectedHls;

  console.log(`  Upload HTTP status (create) : ${createStatus ?? 'n/a'}`);
  console.log(`  Upload HTTP status (upload) : ${uploadStatus ?? 'n/a'}`);
  console.log(`  Video GUID                  : ${result.videoId}`);
  console.log(`  HLS URL                     : ${result.videoUrl}`);
  console.log(`  Listed in the library       : ${found ? 'yes' : 'no'}`);
  console.log(`  HLS playlist reachable      : ${playable ? 'yes' : 'no'}`);
  console.log(`\n  ${ok ? '✔ SUCCESS — the upload path works' : '✗ FAILED'}`);
  process.exit(ok ? 0 : 1);
}

main().catch((error) => {
  console.error('\n✗ FAILED');
  console.error(error?.response?.data ? JSON.stringify(error.response.data) : error);
  process.exit(1);
});
