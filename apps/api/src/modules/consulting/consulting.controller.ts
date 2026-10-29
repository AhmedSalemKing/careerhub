import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards, Query, BadRequestException } from '@nestjs/common'
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

  @Get('consultants/:id')
  async getConsultant(@Param('id') id: string) {
    return this.consultingService.getConsultant(id)
  }

  @Get('consultants/:id/slots')
  async getAvailableSlots(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('duration') duration?: string,
  ) {
    if (!from || !to) throw new BadRequestException('from and to are required')
    return this.consultingService.getAvailableSlots(id, from, to, duration ? parseInt(duration) : undefined)
  }

  @Post('sessions/book')
  @UseGuards(JwtAuthGuard)
  async bookSession(@Request() req: any, @Body() body: any) {
    return this.consultingService.bookSession(req.user.id || req.user.sub, body)
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@Request() req: any) {
    return this.consultingService.getSessions(req.user.id || req.user.sub)
  }

  @Get('sessions/my')
  @UseGuards(JwtAuthGuard)
  async getMySessions(@Request() req: any) {
    return this.consultingService.getSessions(req.user.id || req.user.sub)
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  async getSession(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.getSession(id, req.user.id || req.user.sub)
  }

  @Patch('sessions/:id/approve')
  @UseGuards(JwtAuthGuard)
  async approveSession(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.approveSession(id, req.user.id || req.user.sub)
  }

  @Patch('sessions/:id/request-reschedule')
  @UseGuards(JwtAuthGuard)
  async requestReschedule(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    return this.consultingService.requestReschedule(id, req.user.id || req.user.sub, body)
  }

  @Patch('sessions/:id/approve-reschedule')
  @UseGuards(JwtAuthGuard)
  async approveReschedule(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.approveReschedule(id, req.user.id || req.user.sub)
  }

  @Patch('sessions/:id/reject-reschedule')
  @UseGuards(JwtAuthGuard)
  async rejectReschedule(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.rejectReschedule(id, req.user.id || req.user.sub)
  }

  @Post('sessions/:id/pay')
  @UseGuards(JwtAuthGuard)
  async paySession(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.paySession(id, req.user.id || req.user.sub)
  }

  @Post('sessions/:id/start-room')
  @UseGuards(JwtAuthGuard)
  async startRoom(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.startRoom(id, req.user.id || req.user.sub)
  }

  @Post('sessions/:id/join-room')
  @UseGuards(JwtAuthGuard)
  async joinRoom(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.joinRoom(id, req.user.id || req.user.sub)
  }

  @Patch('sessions/:id/complete')
  @UseGuards(JwtAuthGuard)
  async completeSession(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.completeSession(id, req.user.id || req.user.sub)
  }

  @Patch('sessions/:id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelSession(@Param('id') id: string, @Request() req: any, @Body() body: { reason?: string }) {
    return this.consultingService.cancelSession(id, req.user.id || req.user.sub, body)
  }

  @Post('sessions/:id/create-payment-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.createPaymentIntent(id, req.user.id || req.user.sub)
  }

  @Post('sessions/:id/confirm-payment')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { paymentIntentId?: string }
  ) {
    return this.consultingService.confirmPayment(id, req.user.id || req.user.sub, body.paymentIntentId)
  }

  @Patch('sessions/:id/confirm')
  @UseGuards(JwtAuthGuard)
  async confirmSession(@Param('id') id: string, @Request() req: any) {
    return this.consultingService.confirmSessionByConsultant(id, req.user.id || req.user.sub)
  }
}
