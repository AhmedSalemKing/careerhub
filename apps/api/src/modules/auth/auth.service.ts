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

    // Check if email already exists (case-insensitive so legacy mixed-case rows are caught)
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existing) {
      // Check if banned - permanent block
      if (existing.status === 'BANNED') {
        throw new ForbiddenException('هذا البريد الإلكتروني محظور من المنصة');
      }
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

    // The frontend auto-login stores this user — include the profile we just created
    const registeredUser = this.sanitizeUser({ ...result.user, profile: result.profile });

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
        user: registeredUser,
        pendingReview: true,
        accessToken: null,
        refreshToken: null,
      };
    }

    // Generate tokens for active users
    const { accessToken, refreshToken } = await this.generateTokens(result.user);
    await this.storeRefreshToken(result.user.id, refreshToken);

    return {
      user: registeredUser,
      pendingReview: false,
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;

    this.logger.log(`[LOGIN] attempt: ${email}`);

    // Find user with profile (case-insensitive so legacy mixed-case emails still match)
    let user: any;
    try {
      user = await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        select: {
          id: true, email: true, password: true, role: true, isActive: true, deletedAt: true,
          provider: true,
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

    // OAuth accounts have no local password — never call bcrypt.compare with null/undefined
    if (!user.password) {
      this.logger.warn(`[LOGIN] rejected: user=${user.id} has no local password (provider=${user.provider ?? 'unknown'})`);
      throw new UnauthorizedException('Use Google login for this account');
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
    if (user.status === 'REJECTED') {
      throw new ForbiddenException('Your application was rejected. Please contact support.');
    }

    // PENDING users can login but get limited token for polling approval status
    const isPendingUser = user.status === 'PENDING';

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

    // Log login activity
    try {
      await this.prisma.userActivity.create({
        data: {
          userId: user.id,
          action: 'LOGIN',
          entity: 'User',
          entityId: user.id,
          metadata: { email: user.email, accountType: user.accountType },
        },
      });
    } catch (e) {
      this.logger.warn(`[LOGIN] Failed to log activity: ${e}`);
    }

    this.logger.log(`[LOGIN] success: ${email}, status: ${user.status}`);

    // If PENDING, return special response so frontend can redirect to pending page
    if (isPendingUser) {
      return {
        user: this.sanitizeUser(user as any),
        accessToken,
        refreshToken,
        pendingApproval: true,
      };
    }

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
    const user = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { profile: true },
    });

    // Silently succeed to prevent email enumeration
    if (!user) {
      return;
    }

    // Generate raw token and bcrypt hash
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 12);
    const expiresAt = new Date(Date.now() + 3_600_000); // 1 hour

    // Delete any existing reset tokens for this user
    await (this.prisma).passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Store only the hashed token
    await (this.prisma).passwordResetToken.create({
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
    const user = await this.prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });

    if (!user) {
      throw new BadRequestException('Reset link has expired or already been used.');
    }

    // Find all unexpired, unused tokens for this user
    const pendingTokens = await (this.prisma).passwordResetToken.findMany({
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
    await (this.prisma).passwordResetToken.update({
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
        hourlyRate: true,
        profile: {
          select: {
            firstName: true, lastName: true, avatar: true,
            bio: true, phone: true, language: true, timezone: true,
            sessionPrice: true,
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

  async updateProfile(userId: string, data: { 
    firstName?: string; 
    lastName?: string; 
    bio?: string; 
    phone?: string; 
    avatar?: string;
    country?: string;
    city?: string;
    linkedinUrl?: string;
    speciality?: string;
    experience?: number;
    hourlyRate?: number;
    sessionPrice?: number;
    meetingMethod?: string;
  }) {
    this.logger.debug(`Updating user profile: ${userId}`)
    const profileData: any = {}
    if (data.firstName !== undefined) profileData.firstName = data.firstName
    if (data.lastName !== undefined) profileData.lastName = data.lastName
    if (data.bio !== undefined) profileData.bio = data.bio
    if (data.phone !== undefined) profileData.phone = data.phone
    if (data.avatar !== undefined) profileData.avatar = data.avatar
    if (data.country !== undefined) profileData.country = data.country
    if (data.city !== undefined) profileData.city = data.city
    if (data.linkedinUrl !== undefined) profileData.linkedinUrl = data.linkedinUrl
    if (data.sessionPrice !== undefined) profileData.sessionPrice = data.sessionPrice
    
    
    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      create: { userId, ...profileData },
      update: profileData,
    })
    
    const userFields: Record<string, unknown> = {}
    if (data.speciality !== undefined) userFields.speciality = data.speciality
    if (data.experience !== undefined) userFields.experience = data.experience
    if (data.hourlyRate !== undefined) userFields.hourlyRate = data.hourlyRate
    if (data.meetingMethod !== undefined) userFields.meetingMethod = data.meetingMethod
    if (data.bio !== undefined) userFields.bio = data.bio
    
    if (Object.keys(userFields).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: userFields })
    }
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })
    
    return { success: true, data: user }
  }

  async adminLogin(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;

    this.logger.log(`[ADMIN-LOGIN] attempt: ${email}`);

    // Find admin user (case-insensitive email match)
    let user: any;
    try {
      user = await this.prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
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

  async generateTokens(user: User) {
    const payload = {
      id: user.id,
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

  async findOrCreateGoogleUser(googleUser: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
    provider: string;
  }) {
    // Check by googleId first
    let user: any = await this.prisma.user.findFirst({
      where: { googleId: googleUser.googleId },
      include: { profile: true },
    });

    if (user) {
      user.isNewUser = false;
      return user;
    }

    // Check by email (link existing local account)
    const existing = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { profile: true },
    });

    if (existing) {
      user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { googleId: googleUser.googleId, provider: 'google' },
        include: { profile: true },
      });
      user.isNewUser = false;
      return user;
    }

    // Create brand-new user
    const randomPassword = await bcrypt.hash(
      Math.random().toString(36) + Date.now(),
      10,
    );

    user = await this.prisma.user.create({
      data: {
        email: googleUser.email,
        password: randomPassword,
        accountType: 'STUDENT',
        isActive: true,
        status: 'ACTIVE',
        googleId: googleUser.googleId,
        provider: 'google',
        profile: {
          create: {
            firstName: googleUser.firstName || googleUser.email.split('@')[0],
            lastName: googleUser.lastName || '',
            avatar: googleUser.avatar || null,
          },
        },
      },
      include: { profile: true },
    });

    user.isNewUser = true;
    return user;
  }

  async updateAccountType(userId: string, accountType: string) {
    const status = accountType === 'STUDENT' ? 'ACTIVE' : 'PENDING';
    await this.prisma.user.update({
      where: { id: userId },
      data: { accountType, status },
    });
    return { success: true };
  }

  async updateProFields(userId: string, data: {
    cvUrl?: string;
    speciality?: string;
    experience?: number;
    bio?: string;
    linkedinUrl?: string;
    hourlyRate?: number;
    meetingMethod?: string;
  }) {
    const userFields: Record<string, unknown> = {};
    if (data.cvUrl !== undefined) userFields.cvUrl = data.cvUrl;
    if (data.speciality !== undefined) userFields.speciality = data.speciality;
    if (data.experience !== undefined) userFields.experience = data.experience;
    if (data.linkedinUrl !== undefined) userFields.linkedinUrl = data.linkedinUrl;
    if (data.hourlyRate !== undefined) userFields.hourlyRate = data.hourlyRate;
    if (data.meetingMethod !== undefined) userFields.meetingMethod = data.meetingMethod;

    if (Object.keys(userFields).length > 0) {
      await this.prisma.user.update({ where: { id: userId }, data: userFields });
    }
    if (data.bio !== undefined) {
      await this.prisma.userProfile.update({ where: { userId }, data: { bio: data.bio } });
    }
    return { success: true };
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
