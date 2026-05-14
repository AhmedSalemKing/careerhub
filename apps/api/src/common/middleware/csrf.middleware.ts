import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  private readonly excludedPaths = ['/api/csrf/token', '/api/health', '/api/auth/google/callback'];

  use(req: Request, res: Response, next: NextFunction) {
    const path = req.path || req.originalUrl || '';
    if (this.excludedPaths.some(ex => path.startsWith(ex))) {
      return next();
    }

    if (SAFE_METHODS.includes(req.method)) {
      return next();
    }

    const tokenFromCookie = req.cookies?.[CSRF_COOKIE];
    const tokenFromHeader = req.headers[CSRF_HEADER] as string;

    if (!tokenFromCookie || !tokenFromHeader) {
      this.logger.warn(`CSRF check failed: missing token on ${req.method} ${path}`);
      res.status(403).json({
        success: false,
        message: 'CSRF token missing',
        messageAr: 'رمز CSRF مفقود',
      });
      return;
    }

    if (tokenFromCookie !== tokenFromHeader) {
      this.logger.warn(`CSRF check failed: token mismatch on ${req.method} ${path}`);
      res.status(403).json({
        success: false,
        message: 'CSRF token invalid',
        messageAr: 'رمز CSRF غير صالح',
      });
      return;
    }

    next();
  }

  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
