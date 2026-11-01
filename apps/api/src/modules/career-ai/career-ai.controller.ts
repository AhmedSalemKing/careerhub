import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CareerAiService } from './career-ai.service';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

@ApiTags('Career AI')
@Controller('career-ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CareerAiController {
  constructor(private readonly careerAiService: CareerAiService) {}

  @Post('session/start')
  @ApiOperation({ summary: 'Start a new AI career interview or general assistant session' })
  async startSession(@Request() req: any, @Body('mode') mode?: 'interview' | 'assistant') {
    const safeMode = mode === 'assistant' ? 'assistant' : 'interview';
    const result = await this.careerAiService.startSession(req.user.sub, safeMode);
    return { success: true, data: result };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'List user career interview sessions' })
  async getSessions(@Request() req: any) {
    const sessions = await this.careerAiService.getUserSessions(req.user.sub);
    return { success: true, data: { sessions } };
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get a career interview session' })
  async getSession(@Param('sessionId') sessionId: string, @Request() req: any) {
    const session = await this.careerAiService.getSession(req.user.sub, sessionId);
    return { success: true, data: { session } };
  }

  @Post('session/:sessionId/message')
  @ApiOperation({ summary: 'Send a message in a career interview session (SSE streaming)' })
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
    @Body('message') message: string,
    @Res() res: Response,
  ) {
    if (!message?.trim()) throw new BadRequestException('Message required');
    await this.careerAiService.sendMessage(req.user.sub, sessionId, message, res);
  }

  @Post('session/:sessionId/report')
  @ApiOperation({ summary: 'Generate career report from interview session' })
  async generateReport(@Param('sessionId') sessionId: string, @Request() req: any) {
    const result = await this.careerAiService.generateReport(req.user.sub, sessionId);
    return { success: true, data: result };
  }

  @Get('session/:sessionId/report')
  @ApiOperation({ summary: 'Get career report for a session' })
  async getReport(@Param('sessionId') sessionId: string, @Request() req: any) {
    const result = await this.careerAiService.getReport(req.user.sub, sessionId);
    return { success: true, data: result };
  }

  @Post('tts')
  @Throttle({ short: { limit: 5, ttl: 1000 }, medium: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Backend-proxied TTS via Gemini audio generation — API key never reaches browser' })
  async textToSpeech(
    @Request() req: any,
    @Body() body: { text: string; lang?: 'ar' | 'en'; gender?: 'male' | 'female' },
  ) {
    if (!body.text?.trim()) throw new BadRequestException('text required');
    const result = await this.careerAiService.generateTts(
      req.user.sub,
      body.text,
      body.lang ?? 'ar',
      body.gender ?? 'male',
    );
    return { success: true, data: result };
  }

  @Post('session/:sessionId/voice-token')
  @Throttle({ short: { limit: 2, ttl: 1000 }, medium: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Issue ephemeral Gemini Live token — browser connects directly without server key' })
  async getVoiceToken(@Param('sessionId') sessionId: string, @Request() req: any) {
    const result = await this.careerAiService.issueVoiceToken(req.user.sub, sessionId);
    return { success: true, data: result };
  }
}
