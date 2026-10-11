import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name)

  constructor(private prisma: PrismaService) {}

  async track(data: {
    userId: string
    action: string
    entity?: string
    entityType?: string
    entityId?: string
    metadata?: Record<string, any>
  }) {
    const entity = data.entity ?? data.entityType ?? null
    console.log('[ActivityService.track]', {
      userId: data.userId,
      action: data.action,
      entityType: entity,
      entityId: data.entityId,
    })
    try {
      await this.prisma.userActivity.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity,
          entityId: data.entityId,
          metadata: data.metadata || {},
        },
      })
    } catch (e: any) {
      this.logger.error(`[Activity] Failed to track ${data.action}: ${e.message}`)
    }
  }
}
