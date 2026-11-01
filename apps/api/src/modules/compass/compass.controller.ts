import {
  Controller, Post, Get, Body, Param, UseGuards, Request, HttpCode, HttpStatus,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CompassService } from './compass.service'
import { CreateSessionDto } from './dto/create-session.dto'
import { SubmitAnswersDto } from './dto/submit-answers.dto'

@Controller('career/compass')
@UseGuards(JwtAuthGuard)
export class CompassController {
  constructor(private readonly compassService: CompassService) {}

  /** POST /career/compass/sessions — create a new assessment session */
  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  createSession(@Body() dto: CreateSessionDto, @Request() req: { user: { id: string } }) {
    return this.compassService.createSession(req.user.id, dto)
  }

  /** GET /career/compass/sessions — list the user's sessions */
  @Get('sessions')
  listSessions(@Request() req: { user: { id: string } }) {
    return this.compassService.listSessions(req.user.id)
  }

  /** GET /career/compass/sessions/:id — get session state (for resume) */
  @Get('sessions/:id')
  getSession(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.compassService.getSession(id, req.user.id)
  }

  /** POST /career/compass/sessions/:id/answers — submit stage answers */
  @Post('sessions/:id/answers')
  @HttpCode(HttpStatus.OK)
  submitAnswers(
    @Param('id') id: string,
    @Body() dto: SubmitAnswersDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.compassService.submitAnswers(id, req.user.id, dto)
  }

  /** POST /career/compass/sessions/:id/complete — complete session and generate report */
  @Post('sessions/:id/complete')
  @HttpCode(HttpStatus.OK)
  completeSession(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.compassService.completeSession(id, req.user.id)
  }

  /** GET /career/compass/sessions/:id/report — fetch the discovery report */
  @Get('sessions/:id/report')
  getReport(@Param('id') id: string, @Request() req: { user: { id: string } }) {
    return this.compassService.getReport(id, req.user.id)
  }
}
