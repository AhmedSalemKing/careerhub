import { PrismaService } from '../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

export async function sendNotification(
  prisma: PrismaService,
  userId: string,
  title: string,
  message: string,
  type: NotificationType = 'SYSTEM_ANNOUNCEMENT',
  data?: Record<string, any>
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        titleEn: title,
        titleAr: title,
        contentEn: message,
        contentAr: message,
        type,
        data: data ? JSON.stringify(data) : undefined,
      }
    });
  } catch(e: any) {
    console.warn('[Notify] Failed:', e.message);
  }
}