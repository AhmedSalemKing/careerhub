import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VideoService } from './video.service';

@ApiTags('video')
@ApiBearerAuth()
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get upload URL' })
  async getUploadUrl(@Body() body: any) {
    return this.videoService.getUploadUrl(body.lessonId);
  }

  @Get(':streamId/playback')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get signed playback URL' })
  async getPlaybackUrl(
    @Param('streamId') streamId: string,
    @Query('lessonId') lessonId: string,
    @Query('userId') userId: string,
  ) {
    return this.videoService.getSignedPlaybackUrl(
      streamId,
      userId,
      lessonId,
    );
  }

  @Get(':streamId/thumbnail')
  @ApiOperation({ summary: 'Get thumbnail' })
  async getThumbnail(@Param('streamId') streamId: string) {
    return this.videoService.getVideoThumbnail(streamId);
  }

  @Post(':streamId/process')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Process video' })
  async processVideo(
    @Param('streamId') streamId: string,
    @Body() options: any,
  ) {
    return this.videoService.processVideo(streamId, options);
  }

  @Get(':streamId/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get video status' })
  async getStatus(@Param('streamId') streamId: string) {
    return this.videoService.getVideoStatus(streamId);
  }

  @Delete(':streamId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete video' })
  async deleteVideo(@Param('streamId') streamId: string) {
    return this.videoService.deleteVideo(streamId);
  }

  @Post('webhook/cloudflare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cloudflare webhook' })
  async handleWebhook(@Body() data: any) {
    return this.videoService.handleWebhook(data);
  }

  @Get('lesson/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get video by lesson' })
  async getByLesson(@Param('lessonId') lessonId: string) {
    return this.videoService.getVideoByLesson(lessonId);
  }

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Video stats' })
  async getStats() {
    return this.videoService.getVideoStats();
  }
}