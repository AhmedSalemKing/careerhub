import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WalletService } from './wallet.service';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get()
  async getWallet(@Request() req: any) {
    const data = await this.walletService.getWallet(req.user.id);
    return { success: true, data };
  }

  @Post('topup/create-intent')
  async createTopupIntent(@Request() req: any, @Body() body: { amount: number }) {
    const data = await this.walletService.createTopupIntent(req.user.id, body.amount);
    return { success: true, data };
  }

  @Post('topup/confirm')
  async confirmTopup(@Request() req: any, @Body() body: { paymentIntentId: string }) {
    const data = await this.walletService.confirmTopup(req.user.id, body.paymentIntentId);
    return { success: true, data };
  }

  @Post('pay/:courseId')
  async payWithWallet(@Request() req: any, @Param('courseId') courseId: string) {
    const data = await this.walletService.payWithWallet(req.user.id, courseId);
    return { success: true, data };
  }
}