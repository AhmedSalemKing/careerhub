import { Controller, Get, Post, Patch, Param, Body, Request, UseGuards, Query, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { LiveService } from './live.service'

@Controller('live')
export class LiveController {
  constructor(private liveService: LiveService) {}

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
}
