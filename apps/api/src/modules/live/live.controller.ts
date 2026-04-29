import { Controller, Get, Post, Patch, Param, Body, Request, UseGuards, Query } from '@nestjs/common'
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
