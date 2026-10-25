import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { createReadStream, createWriteStream } from 'fs';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { pipeline } from 'stream/promises';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

@Injectable()
export class RecordingProcessorService {
  private readonly logger = new Logger(RecordingProcessorService.name);
  private readonly s3: S3Client;
  private readonly ffmpegPath: string;

  constructor(private readonly prisma: PrismaService) {
    this.s3 = new S3Client({
      region: this.resolveRegion(),
      endpoint: process.env.B2_ENDPOINT || process.env.BACKBLAZE_B2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID || process.env.BACKBLAZE_B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY || process.env.BACKBLAZE_B2_APPLICATION_KEY,
      },
      forcePathStyle: true,
    });
    this.ffmpegPath = this.resolveFfmpegPath();
  }

  private get bucket(): string | undefined {
    return process.env.B2_BUCKET || process.env.BACKBLAZE_B2_BUCKET;
  }

  /**
   * Render native instances provide ffmpeg, but not all of them. Prefer an
   * explicit FFMPEG_PATH, then the binary bundled by ffmpeg-static, then PATH.
   */
  private resolveFfmpegPath(): string {
    const override = process.env.FFMPEG_PATH?.trim();
    if (override) return override;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bundled = require('ffmpeg-static');
      if (typeof bundled === 'string' && bundled.length > 0) return bundled;
    } catch {
      // ffmpeg-static is optional; fall back to PATH.
    }

    return 'ffmpeg';
  }

  /**
   * The S3 client must be signed for the bucket's real region. Backblaze
   * encodes the region in the endpoint (s3.<region>.backblazeb2.com); signing
   * with a hardcoded region produces SignatureDoesNotMatch at download time.
   */
  private resolveRegion(): string {
    const explicit = process.env.B2_REGION?.trim();
    if (explicit) return explicit;
    const endpoint = process.env.B2_ENDPOINT || process.env.BACKBLAZE_B2_ENDPOINT || '';
    const match = endpoint.match(/s3[.-]([a-z0-9-]+)\.backblazeb2\.com/i);
    return match?.[1] || 'us-east-1';
  }

  async processRecordingComplete(webhookEventId: string, sid: string, fileList: any[]): Promise<void> {
    const recording = await this.prisma.liveRecording.findUnique({
      where: { sid },
      include: { liveSession: { select: { channelName: true, courseId: true } } },
    });
    if (!recording) { this.logger.warn(`No recording for sid: ${sid}`); return; }
    if (recording.status === 'READY') { this.logger.log(`Already processed: ${sid}`); return; }

    await this.prisma.liveRecording.update({ where: { sid }, data: { status: 'PROCESSING' } });
    this.logger.log(`Processing ${sid}: ${Array.isArray(fileList) ? fileList.length : 0} file(s) in payload`);

    try {
      // Agora eventType 31/32 ("uploaded"/"backuped") sends
      // details.fileList as an array of objects: { fileName, trackType, ... }.
      // Some payload variants and manual replays use plain path strings.
      // Normalize to strings first.
      const fileNames: string[] = (Array.isArray(fileList) ? fileList : [])
        .map((f: any) => (typeof f === 'string' ? f : f?.fileName))
        .filter((f: unknown): f is string => typeof f === 'string' && f.length > 0);

      const mp4File = fileNames.find((f: string) => f.endsWith('.mp4'));
      const m3u8File = fileNames.find((f: string) => f.endsWith('.m3u8'));
      const tsFile = fileNames.find((f: string) => f.endsWith('.ts'));

      // Prefer the complete recording: a single MP4, then the HLS playlist
      // (which references every segment), and only then one raw .ts fragment.
      // Choosing a .ts before the .m3u8 would upload only the first few
      // seconds of a short session.
      const chosenFile = mp4File ?? m3u8File ?? tsFile;

      if (!chosenFile) {
        this.logger.error(`No processable file in: ${JSON.stringify(fileList)}`);
        throw new Error('No processable file (mp4, m3u8, ts) found in recording file list');
      }

      const b2Key = await this.resolveB2Key(chosenFile, recording.liveSession?.channelName);
      const chosenType = chosenFile.endsWith('.mp4')
        ? 'mp4'
        : chosenFile.endsWith('.m3u8')
          ? 'm3u8'
          : 'ts';
      this.logger.log(`Selected B2 object ${b2Key} (${chosenType})`);
      await this.prisma.liveRecording.update({ where: { sid }, data: { b2Key } });

      let bunnyVideoId: string;
      if (chosenType === 'm3u8') {
        bunnyVideoId = await this.convertAndUploadHls(sid, recording.liveSessionId, b2Key);
      } else if (chosenType === 'ts') {
        // A lone .ts is only one fragment of the session and Bunny Stream does
        // not take MPEG-TS as an upload format, so remux it to MP4 first.
        bunnyVideoId = await this.convertSingleFileAndUpload(sid, recording.liveSessionId, b2Key);
      } else {
        bunnyVideoId = await this.uploadToBunny(recording.liveSessionId, b2Key);
      }

      await this.prisma.liveRecording.update({
        where: { sid },
        data: { bunnyVideoId, status: 'READY', updatedAt: new Date() },
      });

      const courseId = recording.liveSession?.courseId;
      if (courseId) {
        // The recording is already safe in Bunny at this point. Publishing it
        // to the curriculum is a second step: if it fails, the webhook must not
        // fail too, otherwise the retry would upload the video a second time.
        await this.publishRecordingToCourse(courseId, bunnyVideoId).catch((err) => {
          this.logger.error(
            `[Recording] ${sid} uploaded but publishing to course ${courseId} failed: ${err.message}`,
          );
        });
      } else {
        this.logger.warn(`[Recording] ${sid} has no course to publish to`);
      }

      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { processed: true, processedAt: new Date() },
      });

      this.logger.log(`Recording ${sid} uploaded to Bunny as ${bunnyVideoId}`);
    } catch (err) {
      const retryCount = (recording.retryCount || 0) + 1;
      await this.prisma.liveRecording.update({
        where: { sid },
        data: {
          lastError: err.message,
          retryCount,
          status: retryCount >= 3 ? 'NEEDS_ATTENTION' : 'FAILED',
        },
      });
      this.logger.error(`Failed ${sid}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Bunny Stream serves a video at https://{CDN}/{guid}/playlist.m3u8. The
   * cloud recording API only returns a guid, so the playable URL is derived
   * here — same shape BunnyStreamService.getHlsUrl() returns for uploads.
   */
  private bunnyPlaybackUrl(videoGuid: string): string {
    const host = (process.env.BUNNY_CDN_HOSTNAME || '')
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');
    if (!host) throw new Error('BUNNY_CDN_HOSTNAME is not configured');
    return `https://${host}/${videoGuid}/playlist.m3u8`;
  }

  /**
   * Attaches a finished cloud recording to the course curriculum so students
   * find it like any other lesson. Mirrors the MediaRecorder flow in
   * LiveService.saveRecording: reuse the first section (creating a "Live
   * Recording" one when the course has none), append the lesson, and point the
   * course at the recording.
   */
  private async publishRecordingToCourse(courseId: string, bunnyVideoId: string): Promise<void> {
    const videoUrl = this.bunnyPlaybackUrl(bunnyVideoId);

    // Idempotent: a replayed webhook must not create a second lesson.
    const alreadyPublished = await this.prisma.lesson.findFirst({
      where: { section: { courseId }, recordingUrl: videoUrl },
      select: { id: true },
    });
    if (alreadyPublished) {
      this.logger.log(`[Recording] ${bunnyVideoId} already published as lesson ${alreadyPublished.id}`);
      return;
    }

    let section = await this.prisma.section.findFirst({
      where: { courseId },
      orderBy: { order: 'asc' },
    });
    if (!section) {
      section = await this.prisma.section.create({
        data: { courseId, title: 'Live Recording', order: 0 },
      });
    }

    const last = await this.prisma.lesson.findFirst({
      where: { sectionId: section.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const lesson = await this.prisma.lesson.create({
      data: {
        sectionId: section.id,
        title: 'Live Session Recording',
        titleAr: 'تسجيل البث المباشر',
        type: 'VIDEO',
        videoUrl,
        recordingUrl: videoUrl,
        order: (last?.order ?? -1) + 1,
        isPublished: true,
      },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: { recordingUrl: videoUrl },
    });

    this.logger.log(
      `[Recording] Published ${bunnyVideoId} as lesson ${lesson.id} in course ${courseId}`,
    );
  }

  /**
   * Downloads the HLS playlist and every segment it references, converts them
   * to a single MP4, then uploads that file to Bunny. All temporary files live
   * in an isolated directory that is always removed afterwards.
   */
  private async convertAndUploadHls(sid: string, sessionId: string, playlistKey: string): Promise<string> {
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `deveway-rec-${sid.slice(0, 8)}-`));

    try {
      const { playlistPath, segmentCount } = await this.downloadHlsToDisk(playlistKey, workDir);

      if (segmentCount === 0) {
        throw new Error(`HLS playlist ${playlistKey} contains no segments`);
      }

      const outputPath = path.join(workDir, 'recording.mp4');
      await this.convertToMp4(playlistPath, outputPath);

      const stat = await fs.stat(outputPath).catch(() => null);
      if (!stat || stat.size === 0) {
        throw new Error('ffmpeg produced an empty MP4 file');
      }

      this.logger.log(`[Recording] Converted ${segmentCount} segment(s) to ${stat.size} bytes`);
      return await this.uploadFileToBunny(sessionId, outputPath, 'video/mp4');
    } finally {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Downloads a single recording file (MPEG-TS fallback), remuxes it to MP4 and
   * uploads the result. Used when the payload carries a .ts segment but no
   * .m3u8 playlist to stitch the full session together.
   */
  private async convertSingleFileAndUpload(sid: string, sessionId: string, b2Key: string): Promise<string> {
    const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `deveway-rec-ts-${sid.slice(0, 8)}-`));

    try {
      const inputPath = path.join(workDir, 'input.ts');
      await this.downloadObjectToFile(b2Key, inputPath);

      const outputPath = path.join(workDir, 'recording.mp4');
      await this.convertToMp4(inputPath, outputPath);

      const stat = await fs.stat(outputPath).catch(() => null);
      if (!stat || stat.size === 0) {
        throw new Error('ffmpeg produced an empty MP4 file');
      }

      return await this.uploadFileToBunny(sessionId, outputPath, 'video/mp4');
    } finally {
      await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    }
  }

  /**
   * Agora writes the playlist and its segments to the same B2 prefix. Download
   * both, rewrite the playlist to point at the local segment files, and return
   * the local playlist path for ffmpeg.
   */
  private async downloadHlsToDisk(
    playlistKey: string,
    workDir: string,
  ): Promise<{ playlistPath: string; segmentCount: number }> {
    const playlistPath = path.join(workDir, 'index.m3u8');
    await this.downloadObjectToFile(playlistKey, playlistPath);

    const playlist = await fs.readFile(playlistPath, 'utf8');
    const baseDir = playlistKey.includes('/')
      ? playlistKey.slice(0, playlistKey.lastIndexOf('/'))
      : '';

    const rewritten: string[] = [];
    let segmentCount = 0;

    for (const line of playlist.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        rewritten.push(line);
        continue;
      }

      // Segment URIs are normally bare filenames, but may carry a query string
      // or be absolute. Reduce them to the object name within the playlist dir.
      const withoutQuery = trimmed.split('?')[0];
      const segmentName = path.basename(withoutQuery);
      const segmentKey = baseDir ? `${baseDir}/${segmentName}` : segmentName;
      const segmentPath = path.join(workDir, segmentName);

      await this.downloadObjectToFile(segmentKey, segmentPath);
      rewritten.push(segmentName);
      segmentCount += 1;
    }

    await fs.writeFile(playlistPath, rewritten.join('\n'), 'utf8');
    return { playlistPath, segmentCount };
  }

  private async downloadObjectToFile(key: string, destination: string): Promise<void> {
    if (!this.bucket) throw new Error('B2 bucket is not configured');

    const { Body } = await this.s3.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    }));
    if (!Body) throw new Error(`Empty B2 object: ${key}`);

    await pipeline(Body as any, createWriteStream(destination));
  }

  private async convertToMp4(inputPath: string, outputPath: string): Promise<void> {
    const kind = inputPath.endsWith('.m3u8') ? 'm3u8' : path.extname(inputPath).replace('.', '') || 'file';
    this.logger.log(`[Recording] Converting ${kind} -> mp4: ${inputPath}`);

    const input = ['-y', '-hide_banner', '-loglevel', 'error', '-i', inputPath];
    const options = { timeout: 120_000, maxBuffer: 8 * 1024 * 1024 };

    try {
      // Stream copy is fast and lossless. Agora composite recordings are
      // H.264 + AAC, so this is the normal path.
      await execFileAsync(
        this.ffmpegPath,
        [...input, '-c', 'copy', '-movflags', '+faststart', outputPath],
        options,
      );
    } catch (copyError: any) {
      this.logger.warn(`[Recording] Stream copy failed, retrying with AAC audio: ${copyError?.message || copyError}`);

      await execFileAsync(
        this.ffmpegPath,
        [...input, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outputPath],
        options,
      );
    }

    this.logger.log(`[Recording] Conversion done -> ${outputPath}`);
  }

  /**
   * Agora reports the uploaded file as a bare name in some payloads and as the
   * full object key in others. The recorder was started with
   * fileNamePrefix ['recordings', channelName], so probe the likely keys
   * instead of downloading a guaranteed-missing object.
   */
  private async resolveB2Key(fileName: string, channelName?: string): Promise<string> {
    const clean = fileName.replace(/^\/+/, '');
    const base = clean.split('/').pop() || clean;
    const prefix = channelName ? `recordings/${channelName}` : null;

    const candidates = [clean];
    if (prefix) {
      candidates.push(`${prefix}/${base}`);
      if (!clean.startsWith('recordings/')) candidates.push(`${prefix}/${clean}`);
    }

    for (const key of Array.from(new Set(candidates))) {
      try {
        await this.s3.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
        return key;
      } catch (err: any) {
        this.logger.warn(`B2 key candidate not found: ${key} (${err?.name || err?.message})`);
      }
    }

    const fallback = prefix ? `${prefix}/${base}` : clean;
    this.logger.warn(`Could not verify ${fileName} in B2, falling back to ${fallback}`);
    return fallback;
  }

  private async createBunnyVideo(sessionId: string): Promise<string> {
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;
    if (!libraryId || !apiKey) {
      throw new Error('BUNNY_LIBRARY_ID or BUNNY_API_KEY is not configured');
    }

    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: { AccessKey: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Live - ${sessionId} - ${Date.now()}` }),
    });
    if (!res.ok) throw new Error(`Bunny create: ${await res.text()}`);

    const { guid } = await res.json();
    this.logger.log(`Created Bunny video ${guid} for session ${sessionId}`);
    return guid as string;
  }

  private async putBunnyVideo(
    guid: string,
    body: any,
    contentLength: number | undefined,
    contentType: string,
  ): Promise<void> {
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`, {
      method: 'PUT',
      headers: {
        AccessKey: apiKey as string,
        'Content-Type': contentType,
        ...(contentLength ? { 'Content-Length': String(contentLength) } : {}),
      },
      body,
      duplex: 'half',
    } as any);

    if (!res.ok) throw new Error(`Bunny upload: ${await res.text()}`);
    this.logger.log(`Bunny upload finished for video ${guid}`);
  }

  private async uploadToBunny(sessionId: string, b2Key: string): Promise<string> {
    const guid = await this.createBunnyVideo(sessionId);

    const { Body, ContentLength } = await this.s3.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: b2Key,
    }));
    if (!Body) throw new Error(`Empty B2 object: ${b2Key}`);
    this.logger.log(`Downloading ${b2Key} from B2 (${ContentLength ?? 'unknown'} bytes)`);

    await this.putBunnyVideo(guid, Body, ContentLength, 'video/mp4');

    return guid;
  }

  private async uploadFileToBunny(sessionId: string, filePath: string, contentType: string): Promise<string> {
    const guid = await this.createBunnyVideo(sessionId);
    const stat = await fs.stat(filePath);

    await this.putBunnyVideo(guid, createReadStream(filePath), stat.size, contentType);
    return guid;
  }
}
