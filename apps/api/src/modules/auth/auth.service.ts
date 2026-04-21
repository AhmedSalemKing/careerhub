import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserProfile, Session } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) { }

  async register(registerDto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
    city?: string;
    language?: string;
    accountType?: string;
    cvUrl?: string;
    bio?: string;
    experience?: number;
    speciality?: string;
    linkedinUrl?: string;
    hourlyRate?: number;
    meetingMethod?: string;
    avatar?: string;
  }) {
    const {
      email, password, firstName, lastName, phone, country, city, language,
      accountType, cvUrl, bio, experience, speciality, linkedinUrl, hourlyRate, meetingMethod,
      avatar,
    } = registerDto;

    const resolvedAccountType = accountType || 'STUDENT';
    const isPendingAccount = resolvedAccountType === 'INSTRUCTOR' || resolvedAccountType === 'CONSULTANT';

    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    // Require CV for instructors/consultants
    if (isPendingAccount && !cvUrl) {
      throw new BadRequestException('CV is required for instructors and consultants');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user and profile in a transaction
    const result = await this.prisma.transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'USER',
          isActive: true,
          accountType: resolvedAccountType,
          status: isPendingAccount ? 'PENDING' : 'ACTIVE',
          cvUrl: cvUrl || null,
          bio: bio || null,
          experience: experience ?? null,
          speciality: speciality || null,
          linkedinUrl: linkedinUrl || null,
          hourlyRate: hourlyRate ?? null,
          meetingMethod: meetingMethod || null,
        },
      });

      const profile = await tx.userProfile.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          phone,
          country,
          city,
          language: language || 'en',
          timezone: this.getTimezoneFromCountry(country),
          avatar: avatar || null,
        },
      });

      return { user, profile };
    });

    // Send notification
    await this.notificationsService.createNotification({
      userId: result.user.id,
      type: 'SYSTEM_ANNOUNCEMENT',
      titleEn: isPendingAccount ? 'Application Received!' : 'Welcome to DeveWay!',
      titleAr: isPendingAccount ? 'تم استلام طلبك!' : 'مرحباً بك في DeveWay!',
      contentEn: isPendingAccount
        ? 'Your application is under review. We will notify you within 48 hours.'
        : 'Your account has been created successfully. Start exploring career paths and courses.',
      contentAr: isPendingAccount
        ? 'طلبك قيد المراجعة. سنخطرك خلال 48 ساعة.'
        : 'تم إنشاء حسابك بنجاح. ابدأ في استكشاف المسارات المهنية والدورات.',
      data: { type: isPendingAccount ? 'pending_review' : 'welcome' },
    });

    this.logger.log(`User registered: ${email} (${resolvedAccountType})`);

    // Queue welcome email via Bull queue (fire-and-forget)
    this.notificationsService.queueEmail?.({
      to: email,
      template: 'welcome' as any,
      context: { firstName: result.profile.firstName },
    }).catch((err: Error) => this.logger.error('Failed to queue welcome email', { reason: err.message }));

    // Pending users don't get tokens — they must wait for approval
    if (isPendingAccount) {
      return {
        user: this.sanitizeUser(result.user),
        pendingReview: true,
        accessToken: null,
        refreshToken: null,
      };
    }

    // Generate tokens for active users
    const { accessToken, refreshToken } = await this.generateTokens(result.user);
    await this.storeRefreshToken(result.user.id, refreshToken);

    return {
      user: this.sanitizeUser(result.user),
      pendingReview: false,
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;

    this.logger.log(`[LOGIN] attempt: ${email}`);

    // Find user with profile
    let user: any;
    try {
      user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true, email: true, password: true, role: true, isActive: true, deletedAt: true,
          stripeCustomerId: true, createdAt: true, updatedAt: true,
          accountType: true, status: true, cvUrl: true, bio: true, experience: true,
          speciality: true, linkedinUrl: true, hourlyRate: true, meetingMethod: true,
          approvedAt: true, rejectedAt: true, rejectedReason: true, lastSeenAt: true,
          profile: { select: { firstName: true, lastName: true, avatar: true, language: true } }
        }
      });
    } catch (dbErr) {
      this.logger.error(`[LOGIN] DB query failed: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`);
      throw dbErr;
    }

    this.logger.log(`[LOGIN] user found: ${user ? 'YES' : 'NO'}, id=${user?.id}, accountType=${user?.accountType}, isActive=${user?.isActive}, status=${user?.status}`);

    if (!user || user.isActive === false) {
      this.logger.warn(`[LOGIN] rejected: user=${!!user}, isActive=${user?.isActive}`);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    this.logger.log(`[LOGIN] passwordMatch: ${isPasswordValid}, hashPrefix: ${user.password?.substring(0, 7)}`);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account status — only block explicitly blocked accounts
    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Account is disabled');
    }
    if (user.status === 'PENDING') {
      throw new ForbiddenException('Account is under review. You will be notified within 48 hours.');
    }
    if (user.status === 'REJECTED') {
      throw new ForbiddenException('Your application was rejected. Please contact support.');
    }

    // Auto-create profile if missing (e.g. admin users created without one)
    if (!user.profile) {
      const emailName = email.split('@')[0];
      const newProfile = await this.prisma.userProfile.create({
        data: { userId: user.id, firstName: emailName, lastName: '' },
      });
      user.profile = { firstName: newProfile.firstName, lastName: newProfile.lastName, avatar: newProfile.avatar, language: newProfile.language };
      this.logger.log(`[LOGIN] auto-created missing profile for ${email}`);
    }

    // Generate tokens
    let accessToken: string, refreshToken: string;
    try {
      ({ accessToken, refreshToken } = await this.generateTokens(user));
      this.logger.log(`[LOGIN] tokens generated OK`);
    } catch (tokenErr) {
      this.logger.error(`[LOGIN] token generation failed: ${tokenErr instanceof Error ? tokenErr.message : String(tokenErr)}`);
      throw tokenErr;
    }

    // Store refresh token
    try {
      await this.storeRefreshToken(user.id, refreshToken);
    } catch (sessionErr) {
      this.logger.error(`[LOGIN] storeRefreshToken failed: ${sessionErr instanceof Error ? sessionErr.message : String(sessionErr)}`);
      throw sessionErr;
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    this.logger.log(`[LOGIN] success: ${email}`);

    return {
      user: this.sanitizeUser(user as any),
      accessToken,
      refreshToken,
    };
  }

  async refreshTokens(userId: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Generate new tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Store new refresh token and invalidate old ones
    await this.storeRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async logout(userId: string) {
    // Remove all refresh tokens for user
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    this.logger.log(`User logged out: ${userId}`);
  }

  async forgotPassword(email: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    // Silently succeed to prevent email enumeration
    if (!user) {
      return;
    }

    // Generate raw token and bcrypt hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 3_600_000); // 1 hour

    // Delete any existing reset tokens for this user
    await (this.prisma as any).passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Store only the hashed token
    await (this.prisma as any).passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: ipAddress ?? null,
      },
    });

    // Queue password-reset email (wired via NotificationsService queueEmail in US6)
    const frontendUrl = this.configService.get('FRONTEND_URL') ?? 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
    const firstName = user.profile?.firstName ?? '';

    // Fire-and-forget: email delivery failure must not break the HTTP response
    this.notificationsService.queueEmail?.({
      to: email,
      template: 'password-reset' as any,
      context: { resetLink, firstName, expiresIn: '1 hour' },
    }).catch((err: Error) => this.logger.error('Failed to queue password-reset email', { reason: err.message }));

    this.logger.log('Password reset requested', { userId: user.id });
  }

  async resetPassword(resetPasswordDto: { email: string; token: string; newPassword: string }) {
    const { email, token, newPassword } = resetPasswordDto;

    // Look up user first
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('Reset link has expired or already been used.');
    }

    // Find all unexpired, unused tokens for this user
    const pendingTokens = await (this.prisma as any).passwordResetToken.findMany({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });

    // Find the matching token via bcrypt.compare
    let matchedToken: any = null;
    for (const pt of pendingTokens) {
      const isMatch = await bcrypt.compare(token, pt.tokenHash);
      if (isMatch) {
        matchedToken = pt;
        break;
      }
    }

    if (!matchedToken) {
      throw new BadRequestException('Reset link has expired or already been used.');
    }

    // Hash the new password and update user
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await (this.prisma as any).passwordResetToken.update({
      where: { id: matchedToken.id },
      data: { usedAt: new Date() },
    });

    // Invalidate all sessions (force re-login everywhere)
    await this.prisma.session.deleteMany({ where: { userId: user.id } });

    this.logger.log('Password reset successful', { userId: user.id });
  }

  async verifyEmail(token: string) {
    // Find verification token
    const session = await this.prisma.session.findFirst({
      where: {
        refreshToken: `verify:${token}`,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Mark user as verified (if you have an emailVerified field)
    // For now, we'll just remove the token
    await this.prisma.session.delete({
      where: { id: session.id },
    });

    // Send notification
    await this.notificationsService.createNotification({
      userId: session.userId,
      type: 'SYSTEM_ANNOUNCEMENT',
      titleEn: 'Email Verified',
      titleAr: 'تم التحقق من البريد الإلكتروني',
      contentEn: 'Your email address has been verified successfully.',
      contentAr: 'تم التحقق من عنوان بريدك الإلكتروني بنجاح.',
      data: {
        type: 'email_verified',
      },
    });

    this.logger.log(`Email verified for user: ${session.user.email}`);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Remove all refresh tokens (force re-login)
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Send notification
    await this.notificationsService.createNotification({
      userId,
      type: 'SYSTEM_ANNOUNCEMENT',
      titleEn: 'Password Changed',
      titleAr: 'تم تغيير كلمة المرور',
      contentEn: 'Your password has been changed successfully.',
      contentAr: 'تم تغيير كلمة المرور بنجاح.',
      data: {
        type: 'password_changed',
      },
    });

    this.logger.log(`Password changed for user: ${user.email}`);
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, role: true, isActive: true,
        accountType: true, status: true, createdAt: true,
        bio: true, experience: true, speciality: true,
        profile: {
          select: {
            firstName: true, lastName: true, avatar: true,
            bio: true, phone: true, language: true, timezone: true,
          }
        }
      }
    });

    // Auto-create profile if missing (e.g. admin users created without one)
    if (user && !user.profile) {
      const emailName = user.email.split('@')[0];
      const profile = await this.prisma.userProfile.create({
        data: {
          userId,
          firstName: emailName,
          lastName: '',
        },
      });
      return {
        ...user,
        profile: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatar: profile.avatar,
          bio: profile.bio,
          phone: profile.phone,
          language: profile.language,
          timezone: profile.timezone,
        },
      };
    }

    return user;
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; bio?: string; phone?: string; avatar?: string }) {
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
      create: {
        userId,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        bio: data.bio || null,
        phone: data.phone || null,
        avatar: data.avatar || null,
      },
    });
    return { success: true, data: profile };
  }

  async adminLogin(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;

    this.logger.log(`[ADMIN-LOGIN] attempt: ${email}`);

    // Find admin user
    let user: any;
    try {
      user = await this.prisma.user.findUnique({
        where: { email },
        include: { profile: true },
      });
    } catch (dbErr) {
      this.logger.error(`[ADMIN-LOGIN] DB query failed: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`);
      throw dbErr;
    }

    this.logger.log(`[ADMIN-LOGIN] user found: ${user ? 'YES' : 'NO'}, role=${user?.role}, accountType=${user?.accountType}, isActive=${user?.isActive}`);

    const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (!user || !user.isActive || (!adminRoles.includes(user.role) && !adminRoles.includes(user.accountType))) {
      this.logger.warn(`[ADMIN-LOGIN] rejected: user=${!!user}, isActive=${user?.isActive}, role=${user?.role}, accountType=${user?.accountType}`);
      throw new UnauthorizedException('Invalid credentials or insufficient permissions');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    this.logger.log(`[ADMIN-LOGIN] passwordMatch: ${isPasswordValid}, hashPrefix: ${user.password?.substring(0, 7)}`);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials or insufficient permissions');
    }

    // Generate tokens
    let accessToken: string, refreshToken: string;
    try {
      ({ accessToken, refreshToken } = await this.generateTokens(user));
      this.logger.log(`[ADMIN-LOGIN] tokens generated OK`);
    } catch (tokenErr) {
      this.logger.error(`[ADMIN-LOGIN] token generation failed: ${tokenErr instanceof Error ? tokenErr.message : String(tokenErr)}`);
      throw tokenErr;
    }

    // Store refresh token
    try {
      await this.storeRefreshToken(user.id, refreshToken);
    } catch (sessionErr) {
      this.logger.error(`[ADMIN-LOGIN] storeRefreshToken failed: ${sessionErr instanceof Error ? sessionErr.message : String(sessionErr)}`);
      throw sessionErr;
    }

    // Log admin login
    try {
      await this.prisma.adminLog.create({
        data: {
          adminId: user.id,
          action: 'LOGIN',
          resource: 'Admin',
          ipAddress: '',
          userAgent: '',
        },
      });
    } catch (logErr) {
      this.logger.error(`[ADMIN-LOGIN] adminLog.create failed: ${logErr instanceof Error ? logErr.message : String(logErr)}`);
      // Don't throw — login should still succeed even if logging fails
    }

    this.logger.log(`[ADMIN-LOGIN] success: ${email}`);

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string) {
    // Remove old refresh tokens
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.session.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    });
  }

  private sanitizeUser(user: User & { profile?: UserProfile | null }) {
    const { password, ...sanitizedUser } = user;
    return {
      ...sanitizedUser,
      profile: user.profile ? {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        avatar: user.profile.avatar,
        language: user.profile.language,
      } : null
    };
  }

  private getTimezoneFromCountry(country?: string): string {
    const timezoneMap: { [key: string]: string } = {
      'Egypt': 'Africa/Cairo',
      'Saudi Arabia': 'Asia/Riyadh',
      'UAE': 'Asia/Dubai',
      'Jordan': 'Asia/Amman',
      'Morocco': 'Africa/Casablanca',
    };

    return timezoneMap[country || ''] || 'UTC';
  }
}
