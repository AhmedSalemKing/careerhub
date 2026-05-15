import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  private readonly excludedPaths = [
    '/api/csrf/token',
    '/api/health',
    '/api/health/live',
    '/api/health/ready',
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/refresh',
    '/api/auth/google',
    '/api/auth/google/callback',
    '/api/auth/logout',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // CSRF double-submit cookie disabled: cross-origin setup (Vercel → Render)
    // is incompatible with cookie-based CSRF. Protected by: SameSite cookies +
    // CORS whitelist + JWT bearer tokens.
    return next();
  }

  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
