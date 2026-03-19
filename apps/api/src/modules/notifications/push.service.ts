
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  constructor(private prisma: PrismaService) { }
  async sendPushNotification(token: string, payload: any) {
    this.logger.log('Push: ' + token);
    return { success: true };
  }
  async sendToUser(userId: string, payload: any) {
    return { success: true };
  }
  async sendToRole(role: string, payload: any) {
    return { success: true };
  }
  async sendToAll(payload: any) {
    return { success: true };
  }
  async registerToken(userId: string, token: string, platform: string) {
    return { success: true };
  }
  async removeToken(token: string) {
    return { success: true };
  }
  async getStats() {
    return { total: 0 };
  }
}
