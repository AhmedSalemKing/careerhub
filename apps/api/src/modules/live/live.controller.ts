import { Controller, Get, Post, Patch, Param, Body, Request, UseGuards, Query, UploadedFile, UseInterceptors, BadRequestException, Logger, ForbiddenException, NotFoundException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { LiveService } from './live.service'
import { AgoraCloudRecordingService } from './agora-cloud-recording.service'
import { PrismaService } from '../../prisma/prisma.service'

@Controller('live')
export class LiveController {
  private readonly logger = new Logger(LiveController.name);

  constructor(
    private liveService: LiveService,
    private readonly agoraService: AgoraCloudRecordingService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('token/:courseId')
  @UseGuards(JwtAuthGuard)
  async getToken(@Param('courseId') courseId: string, @Request() req: any) {
    return this.liveService.getAgoraToken(courseId, req.user.id)
  }

  @Post('start/:courseId')
  @UseGuards(JwtAuthGuard)
  async startLive(@Param('courseId') courseId: string, @Request() req: any) {
    return this.liveService.startLive(courseId, req.user.id)
  }

  @Post('end/:courseId')
  @UseGuards(JwtAuthGuard)
  async endLive(@Param('courseId') courseId: string, @Request() req: any) {
    return this.liveService.endLive(courseId, req.user.id)
  }

  /**
   * Stores the recording the instructor's browser captured with MediaRecorder.
   *
   * The file is uploaded to Bunny.net Stream (the same service the regular
   * video upload uses) and a Lesson is created so the students can watch it
   * from the course page. Only the owner of the course (or an admin) may
   * upload a recording.
   */
  @Post('save-recording')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      // The browser's MediaRecorder writes WebM (Chrome/Firefox) or MP4
      // (Safari) and puts the codec list inside the mime type
      // ("video/webm;codecs=vp9,opus"), so the family — not the exact
      // string — is what identifies a recording.
      //
      // An audio-only session (instructor with no camera) is recorded as
      // audio/webm, which Bunny Stream accepts just like video/webm, so both
      // media families are allowed here.
      const mime = file.mimetype || '';
      if (
        mime.startsWith('video/') ||
        mime.startsWith('audio/') ||
        mime === 'application/octet-stream'
      ) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only video or audio recordings are allowed'), false);
      }
    },
  }))
  async saveRecording(
    @UploadedFile() file: Express.Multer.File,
    @Body('courseId') courseId: string,
    @Body('title') title: string,
    @Request() req: any,
    @Body('append') append?: string,
  ) {
    return this.liveService.saveRecording(
      req.user.id,
      courseId,
      file,
      title,
      req.user.accountType,
      append === 'true',
    )
  }

  @Get('courses')
  async getLiveCourses(@Query('status') status?: string) {
    return this.liveService.getLiveCourses(status)
  }

  @Patch('viewers/:courseId')
  @UseGuards(JwtAuthGuard)
  async updateViewers(@Param('courseId') courseId: string, @Body() body: { delta: number }) {
    return this.liveService.updateViewerCount(courseId, body.delta)
  }

  @Get('lesson-token/:lessonId')
  @UseGuards(JwtAuthGuard)
  async getLessonToken(@Param('lessonId') lessonId: string, @Request() req: any) {
    return this.liveService.getLessonAgoraToken(lessonId, req.user.id)
  }

  @Post('lesson-start/:lessonId')
  @UseGuards(JwtAuthGuard)
  async startLessonLive(@Param('lessonId') lessonId: string, @Request() req: any) {
    return this.liveService.startLessonLive(lessonId, req.user.id)
  }

  @Post('lesson-end/:lessonId')
  @UseGuards(JwtAuthGuard)
  async endLessonLive(@Param('lessonId') lessonId: string, @Request() req: any) {
    return this.liveService.endLessonLive(lessonId, req.user.id)
  }

  @Get('token')
  @UseGuards(JwtAuthGuard)
  async getCloudToken(
    @Query('channelName') channelName: string,
    @Query('role') role: 'publisher' | 'subscriber' = 'subscriber',
  ) {
    if (!channelName) throw new BadRequestException('channelName required');
    const uid = Math.floor(Math.random() * 90000) + 10000;
    const token = this.agoraService.generateRtcToken(channelName, uid, role);
    return { token, uid, channelName, expiresIn: 3600 };
  }

  @Post(':courseId/recording/start')
  @UseGuards(JwtAuthGuard)
  async startCloudRecording(
    @Param('courseId') courseId: string,
    @Body() body: { channelName?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || 'unknown';
    const requestedChannel = typeof body?.channelName === 'string' ? body.channelName.trim() : '';

    this.logger.log(`[Recording] START request for course: ${courseId}`);
    this.logger.log(`[Recording] User: ${userId}, requested channel: ${requestedChannel || '(resolve from course)'}`);

    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { id: true, instructorId: true, agoraChannelName: true },
      });
      if (!course) throw new NotFoundException('Course not found');

      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.accountType)
        || ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role);
      if (course.instructorId !== userId && !isAdmin) {
        throw new ForbiddenException('Not authorized to record this course');
      }

      // The channel must be the one the instructor actually joined. The course
      // stores it when /live/start runs; the client can also pass it explicitly
      // (lesson live sessions are not stored on the course).
      const channelName = requestedChannel || course.agoraChannelName || `deveway_${courseId}`;
      this.logger.log(`[Recording] Resolved channel: ${channelName}`);

      let session = await this.prisma.liveSession.findFirst({
        where: { courseId, channelName },
        include: { recording: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!session) {
        session = await this.prisma.liveSession.create({
          data: {
            courseId,
            channelName,
            instructorId: userId,
            status: 'LIVE',
            startedAt: new Date(),
          },
          include: { recording: true },
        });
        this.logger.log(`[Recording] Created live session ${session.id} for channel ${channelName}`);
      }

      const existing = (session as any).recording;
      if (existing?.status === 'RECORDING') {
        this.logger.log(`[Recording] Already recording for session ${session.id} (sid ${existing.sid})`);
        return { started: true, recordingId: existing.id, sid: existing.sid, existing: true };
      }

      const recordingUid = '666';
      const token = this.agoraService.generateRtcToken(
        session.channelName, parseInt(recordingUid), 'publisher',
      );

      const resourceId = await this.agoraService.acquireResource(session.channelName, recordingUid);
      this.logger.log(`[Recording] Acquired Agora resource: ${resourceId}`);

      const sid = await this.agoraService.startRecording(resourceId, session.channelName, recordingUid, token);
      this.logger.log(`[Recording] Agora accepted recording start, sid: ${sid}`);

      const recording = await this.prisma.liveRecording.upsert({
        where: { liveSessionId: session.id },
        create: { liveSessionId: session.id, resourceId, sid, status: 'RECORDING' },
        update: { resourceId, sid, status: 'RECORDING', retryCount: 0, lastError: null },
      });

      this.logger.log(`[Recording] START complete, recordingId: ${recording.id}`);
      return { started: true, recordingId: recording.id, sid, channelName };
    } catch (error) {
      this.logger.error(`[Recording] FAILED: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post(':courseId/recording/stop')
  @UseGuards(JwtAuthGuard)
  async stopCloudRecording(
    @Param('courseId') courseId: string,
    @Body() body: { channelName?: string },
    @Request() req: any,
  ) {
    const userId = req.user?.id || req.user?.sub || 'unknown';
    const requestedChannel = typeof body?.channelName === 'string' ? body.channelName.trim() : '';

    this.logger.log(`[Recording] STOP request for course: ${courseId}`);
    this.logger.log(`[Recording] User: ${userId}, requested channel: ${requestedChannel || '(latest session)'}`);

    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
      });
      if (!course) throw new NotFoundException('Course not found');

      const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.accountType)
        || ['ADMIN', 'SUPER_ADMIN'].includes(req.user?.role);
      if (course.instructorId !== userId && !isAdmin) {
        throw new ForbiddenException('Not authorized to record this course');
      }

      const session = await this.prisma.liveSession.findFirst({
        where: {
          courseId,
          ...(requestedChannel ? { channelName: requestedChannel } : {}),
        },
        include: { recording: true },
        orderBy: { createdAt: 'desc' },
      });

      if (!(session as any)?.recording?.sid) {
        this.logger.warn(`[Recording] No active recording for course ${courseId}`);
        return { stopped: true, message: 'No active recording found' };
      }

      const rec = (session as any).recording;
      this.logger.log(`[Recording] Stopping sid ${rec.sid} (resource ${rec.resourceId}) on channel ${session.channelName}`);

      await this.agoraService.stopRecording(
        rec.resourceId,
        rec.sid,
        session.channelName,
        '666',
      );

      await this.prisma.liveRecording.update({
        where: { id: rec.id },
        data: { status: 'STOPPING' },
      });

      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: { status: 'ENDED', endedAt: new Date() },
      });

      this.logger.log(`[Recording] STOP complete for sid ${rec.sid}`);
      return { stopped: true, sid: rec.sid };
    } catch (error) {
      this.logger.error(`[Recording] STOP FAILED: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get(':courseId/recording/status')
  @UseGuards(JwtAuthGuard)
  async getRecordingStatus(@Param('courseId') courseId: string) {
    const session = await this.prisma.liveSession.findFirst({
      where: { courseId },
      include: { recording: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!(session as any)?.recording) return { status: 'NONE' };

    const rec = (session as any).recording;
    return {
      status: rec.status,
      bunnyVideoId: rec.bunnyVideoId,
      error: rec.lastError,
    };
  }
}
