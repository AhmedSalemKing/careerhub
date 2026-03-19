import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies?.refresh_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET') || 'dev-refresh-secret',
      issuer: 'careerhub.com',
      audience: 'careerhub-users',
    });
  }

  async validate(payload: any) {
    // Verify that refresh token exists in database
    const session = await this.prisma.session.findFirst({
      where: {
        userId: payload.sub,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session || !session.user.isActive) {
      throw new Error('Invalid refresh token');
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    };
  }
}
