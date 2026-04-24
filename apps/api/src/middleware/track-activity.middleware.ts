import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

const ROUTE_ACTIONS: { pattern: RegExp; action: string; method?: string }[] = [
  { pattern: /\/api\/auth\/login$/, action: 'LOGIN', method: 'POST' },
  { pattern: /\/api\/auth\/register$/, action: 'REGISTER', method: 'POST' },
  { pattern: /\/api\/courses\/[^/]+\/enroll/, action: 'ENROLL_COURSE', method: 'POST' },
  { pattern: /\/api\/courses\/search/, action: 'SEARCH_COURSES', method: 'GET' },
  { pattern: /\/api\/courses$/, action: 'VIEW_COURSES', method: 'GET' },
  { pattern: /\/api\/courses\/[^/]+$/, action: 'VIEW_COURSE', method: 'GET' },
  { pattern: /\/api\/payment\/create/, action: 'PAYMENT', method: 'POST' },
  { pattern: /\/api\/wallet\/topup/, action: 'WALLET_TOPUP', method: 'POST' },
  { pattern: /\/api\/certificates/, action: 'VIEW_CERTIFICATE', method: 'GET' },
  { pattern: /\/api\/sessions\/book/, action: 'BOOK_SESSION', method: 'POST' },
  { pattern: /\/api\/ai\/chat/, action: 'AI_CHAT', method: 'POST' },
  { pattern: /\/api\/career\/assessment/, action: 'ASSESSMENT', method: 'POST' },
  { pattern: /\/api\/users\/track-activity/, action: 'TRACK_ACTIVITY', method: 'POST' },
  { pattern: /\/api\/lessons\/[^/]+\/complete/, action: 'COMPLETE_LESSON', method: 'POST' },
];

@Injectable()
export class TrackActivityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TrackActivityMiddleware.name);

  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const payload = jwt.decode(token) as any;
        const userId = payload?.sub || payload?.id;

        if (userId) {
          const path = req.path;
          const method = req.method;

          const tracked = ROUTE_ACTIONS.find(r => {
            const methodMatch = !r.method || r.method === method;
            return r.pattern.test(path) && methodMatch;
          });

          if (tracked) {
            const metadata: Record<string, any> = {};
            if ((req.params as any)?.id) metadata.resourceId = (req.params as any).id;
            if ((req.params as any)?.courseId) metadata.courseId = (req.params as any).courseId;
            if ((req.query as any)?.q) metadata.query = (req.query as any).q;
            if (req.body?.amount) metadata.amount = req.body.amount;

            try {
              await this.prisma.userActivity.create({
                data: {
                  userId,
                  action: tracked.action,
                  entity: this.mapEntity(path),
                  entityId: (req.params as any)?.id,
                  ipAddress: req.ip,
                  metadata: Object.keys(metadata).length ? metadata : undefined,
                },
              });
              this.logger.log(`[Activity] ${tracked.action} logged for user ${userId}`);
            } catch (e: any) {
              this.logger.error(`[Activity] Failed to log: ${e.message}`);
            }

            try {
              await this.prisma.user.update({
                where: { id: userId },
                data: { lastSeenAt: new Date() },
              });
            } catch {}
          }
        }
      } catch (e: any) {
        this.logger.warn(`[Activity] Middleware error: ${e.message}`);
      }
    }

    next();
  }

  private mapEntity(path: string): string | null {
    if (path.includes('/courses')) return 'Course';
    if (path.includes('/sessions')) return 'Session';
    if (path.includes('/payment')) return 'Payment';
    if (path.includes('/users')) return 'User';
    if (path.includes('/lessons')) return 'Lesson';
    if (path.includes('/certificates')) return 'Certificate';
    return null;
  }
}