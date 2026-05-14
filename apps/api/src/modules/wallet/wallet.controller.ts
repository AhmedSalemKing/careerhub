import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';
import { AuditService, SecurityEvent } from '../../common/services/audit.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(
    private walletService: WalletService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async getWallet(@Request() req: any) {
    const data = await this.walletService.getWallet(req.user.id);
    return { success: true, data };
  }

  @Get('coach-earnings')
  async getCoachEarnings(@Request() req: any) {
    return this.walletService.getCoachEarnings(req.user.id);
  }

  @Post('topup/create-intent')
  async createTopupIntent(@Request() req: any, @Body() body: { amount: number }) {
    const data = await this.walletService.createTopupIntent(req.user.id, body.amount);
    return { success: true, data };
  }

  @Post('topup/confirm')
  async confirmTopup(@Request() req: any, @Body() body: { paymentIntentId: string }) {
    const data = await this.walletService.confirmTopup(req.user.id, body.paymentIntentId);
    await this.audit.log({
      event: SecurityEvent.WALLET_TOPUP,
      userId: req.user.id,
      metadata: { method: 'stripe', newBalance: data?.balance },
    });
    return { success: true, data };
  }

  @Post('pay/:courseId')
  async payWithWallet(@Request() req: any, @Param('courseId') courseId: string) {
    const data = await this.walletService.payWithWallet(req.user.id, courseId);
    await this.audit.log({
      event: SecurityEvent.WALLET_PAYMENT,
      userId: req.user.id,
      metadata: { courseId },
    });
    return { success: true, data };
  }

  @Post('transfer-from-earnings')
  async transferFromEarnings(@Request() req: any, @Body() body: { amount: number }) {
    const data = await this.walletService.transferFromEarnings(req.user.id, body.amount);
    return { success: true, data };
  }
}