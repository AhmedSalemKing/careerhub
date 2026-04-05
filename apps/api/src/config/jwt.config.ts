import { ConfigService } from '@nestjs/config';

export const getJwtConfig = (configService: ConfigService) => ({
  secret: configService.get<string>('JWT_SECRET') || 'dev-secret',
  expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '15m',
  issuer: 'deveway.com',
  audience: 'deveway-users',
});

export const getJwtRefreshConfig = (configService: ConfigService) => ({
  secret: configService.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
  expiresIn: configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
  issuer: 'deveway.com',
  audience: 'deveway-users',
});

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};
