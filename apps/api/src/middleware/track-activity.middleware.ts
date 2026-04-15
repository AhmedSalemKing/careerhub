import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class TrackActivityMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const payload = jwt.decode(token) as any;
        const userId = payload?.sub || payload?.id;
        if (userId) {
          const action = this.mapAction(req.method, req.path);
          if (action) {
            this.prisma.userActivity.create({
              data: {
                userId,
                action,
                entity: this.mapEntity(req.path),
                entityId: (req.params as any)?.id,
                ipAddress: req.ip,
                metadata: { method: req.method, path: req.path },
              },
            }).catch(() => {});

            this.prisma.user.update({
              where: { id: userId },
              data: { lastSeenAt: new Date() },
            }).catch(() => {});
          }
        }
      }
    } catch {}
    next();
  }

  private mapAction(method: string, path: string): string | null {
    if (path.includes('/auth/login')) return 'LOGIN';
    if (path.includes('/auth/register')) return 'REGISTER';
    if (path.includes('/courses') && method === 'POST') return 'CREATE_COURSE';
    if (path.includes('/courses') && method === 'GET') return 'VIEW_COURSES';
    if (path.includes('/payment')) return 'PAYMENT';
    if (path.includes('/upload')) return 'UPLOAD';
    if (path.includes('/sessions') && method === 'POST') return 'BOOK_SESSION';
    if (path.includes('/certificates')) return 'VIEW_CERTIFICATE';
    if (path.includes('/ai/chat')) return 'AI_CHAT';
    if (path.includes('/career/assessment')) return 'ASSESSMENT';
    if (path.includes('/admin') && method !== 'GET') return 'ADMIN_ACTION';
    return null;
  }

  private mapEntity(path: string): string | null {
    if (path.includes('/courses')) return 'Course';
    if (path.includes('/sessions')) return 'Session';
    if (path.includes('/payment')) return 'Payment';
    if (path.includes('/users')) return 'User';
    return null;
  }
}
