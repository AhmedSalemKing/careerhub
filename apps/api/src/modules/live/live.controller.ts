import {
  Controller, Get, Post, Patch, Param, Body, Request,
  UseGuards, Query, UploadedFile, UseInterceptors, BadRequestException,
  Req, Res, Headers,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { Response } from 'express'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { StreamAuthGuard } from './guards/stream-auth.guard'
import { LiveService } from './live.service'

@Controller('live')
export class LiveController {
  constructor(private liveService: LiveService) {}

  @Post('start/:courseId')
  @UseGuards(JwtAuthGuard)
  async startLive(@Param('courseId') courseId: string, @Request() req: any) {
    const { roomUrl, token } = await this.liveService.startLive(courseId, req.user.id)
    return { success: true, data: { roomUrl, token } }
  }

  @Post('end/:courseId')
  @UseGuards(JwtAuthGuard)
  async endLive(@Param('courseId') courseId: string, @Request() req: any) {
    await this.liveService.endLive(courseId, req.user.id)
    return { success: true }
  }

  @Get('join/:courseId')
  @UseGuards(JwtAuthGuard)
  async joinLive(@Param('courseId') courseId: string, @Request() req: any) {
    return this.liveService.joinLive(courseId, req.user.id)
  }

  @Get('status/:courseId')
  @UseGuards(JwtAuthGuard)
  async getLiveStatus(@Param('courseId') courseId: string) {
    return this.liveService.getLiveStatus(courseId)
  }

  @Get('manage/:courseId')
  @UseGuards(JwtAuthGuard)
  async getLiveManage(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    return this.liveService.getLiveManageData(courseId, req.user.id)
  }

  @Get('stream/:courseId')
  @UseGuards(StreamAuthGuard)
  async streamRecording(
    @Param('courseId') courseId: string,
    @Req() req: Request,
    @Res() res: Response,
    @Headers('range') range: string,
  ) {
    return this.liveService.streamRecording(courseId, (req as any).user.id, range, res)
  }

  @Get('recording/public/:courseId')
  async getRecordingPublic(@Param('courseId') courseId: string) {
    return this.liveService.getRecordingUrlForCourse(courseId)
  }

  @Get('recording/:courseId')
  @UseGuards(JwtAuthGuard)
  async getRecording(@Param('courseId') courseId: string) {
    return this.liveService.getRecordingUrlForCourse(courseId)
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

  /**
   * Kept for backward compatibility: instructors who still have the old browser
   * MediaRecorder flow can upload a recording blob through this endpoint.
   */
  @Post('save-recording')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      const mime = file.mimetype || '';
      if (mime.startsWith('video/') || mime.startsWith('audio/') || mime === 'application/octet-stream') {
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
    return this.liveService.saveRecordingFromFile(
      req.user.id,
      courseId,
      file,
      title,
      req.user.accountType,
      append === 'true',
    )
  }
}
