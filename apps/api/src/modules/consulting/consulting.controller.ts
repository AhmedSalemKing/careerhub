import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards, Query } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { ConsultingService } from './consulting.service'

@Controller('consulting')
export class ConsultingController {
  constructor(private readonly consultingService: ConsultingService) {}

  @Get('consultants')
  async getConsultants(
    @Query('filter') filter?: string,
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: string,
  ) {
    return this.consultingService.getConsultants({ filter, search, sort, limit: parseInt(limit || '50') })
  }

  @Post('sessions/book')
  @UseGuards(JwtAuthGuard)
  async bookSession(@Request() req: any, @Body() body: any) {
    return this.consultingService.bookSession(req.user.id, body)
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@Request() req: any) {
    return this.consultingService.getSessions(req.user.id, req.user.accountType || req.user.role)
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async getSession(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.getSession(id, req.user.id)
  }

  @Patch('sessions/:id/request-reschedule')
  @UseGuards(JwtAuthGuard)
  async requestReschedule(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.consultingService.requestReschedule(id, req.user.id, body)
  }

  @Patch('sessions/:id/approve-reschedule')
  @UseGuards(JwtAuthGuard)
  async approveReschedule(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.approveReschedule(id, req.user.id)
  }

  @Patch('sessions/:id/reject-reschedule')
  @UseGuards(JwtAuthGuard)
  async rejectReschedule(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.rejectReschedule(id, req.user.id)
  }

  @Post('sessions/:id/pay')
  @UseGuards(JwtAuthGuard)
  async paySession(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.paySession(id, req.user.id)
  }

  @Patch('sessions/:id/meeting-link')
  @UseGuards(JwtAuthGuard)
  async addMeetingLink(@Param('id') id: string, @Request() req: any, @Body() body: { meetingLink: string }) {
    return this.consultingService.addMeetingLink(id, req.user.id, body)
  }

  @Patch('sessions/:id/complete')
  @UseGuards(JwtAuthGuard)
  async completeSession(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.completeSession(id, req.user.id)
  }

  @Patch('sessions/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSession(@Param('id') id: string, @Request() req: any, @Body() body: { reason?: string }) {
    return this.consultingService.cancelSession(id, req.user.id, body)
  }
}
