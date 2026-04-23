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

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Check account status - block banned/rejected, but allow pending to access auth endpoints
    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Account is banned');
    }
    if (user.status === 'REJECTED') {
      throw new UnauthorizedException('Account was rejected');
    }
    // PENDING users can access auth endpoints but will be blocked by ApprovedGuard for dashboard

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