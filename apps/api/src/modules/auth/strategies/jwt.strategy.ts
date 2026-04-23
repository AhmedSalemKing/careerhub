import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    console.log('[JwtStrategy] Payload:', payload);

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

    console.log('[JwtStrategy] Validated user:', user.email, 'status:', user.status, 'accountType:', user.accountType);

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