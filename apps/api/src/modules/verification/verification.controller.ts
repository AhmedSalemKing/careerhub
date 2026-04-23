import { Controller, Get, Post, Body, UseGuards, Param, Request } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller('verification')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getStatus(@Request() req: any) {
    return this.verificationService.getVerificationStatus(req.user.id);
  }

  @Post('submit')
  @UseGuards(JwtAuthGuard)
  async submit(
    @Request() req: any,
    @Body() body: { idFrontUrl: string; idBackUrl: string },
  ) {
    return this.verificationService.submitVerification(req.user.id, body);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getPending() {
    const data = await this.verificationService.getPendingVerifications();
    return { success: true, data };
  }

  @Post('approve/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async approve(@Param('userId') userId: string, @Request() req: any) {
    return this.verificationService.approveVerification(userId, req.user.id);
  }

  @Post('reject/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async reject(
    @Param('userId') userId: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    return this.verificationService.rejectVerification(
      userId,
      body.reason || '',
      req.user.id,
    );
  }
}