import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies) {
    return (
      req.cookies['access_token'] ||
      req.cookies['auth_token'] ||
      req.cookies['token'] ||
      null
    );
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    this.logger.debug(`Validating JWT for user ${payload.sub}`);

    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException('Invalid JWT payload');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true },
    });

    // User deleted - completely block
    if (!user) {
      throw new UnauthorizedException({
        message: 'Account no longer exists',
        code: 'ACCOUNT_DELETED',
        statusCode: 401,
      });
    }

    // User banned - permanent block
    if (user.status === 'BANNED') {
      throw new UnauthorizedException({
        message: 'حسابك محظور بشكل دائم',
        code: 'ACCOUNT_BANNED',
        statusCode: 401,
      });
    }

    // User rejected - block
    if (user.status === 'REJECTED') {
      throw new UnauthorizedException({
        message: 'تم رفض حسابك',
        code: 'ACCOUNT_REJECTED',
        statusCode: 401,
      });
    }

    // Check isActive flag (soft delete)
    if (!user.isActive) {
      throw new UnauthorizedException({
        message: 'Account is not active',
        code: 'ACCOUNT_INACTIVE',
        statusCode: 401,
      });
    }

    this.logger.debug(`Validated user ${user.email} — status: ${user.status}`);

    return {
      id: user.id,
      sub: user.id,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      status: user.status,
      profile: user.profile,
    };
  }
}