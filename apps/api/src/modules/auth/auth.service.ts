import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserProfile, Session } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
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
  }) {
    const { email, password, firstName, lastName, phone, country, city, language } = registerDto;

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
        },
      });

      return { user, profile };
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(result.user);

    // Store refresh token
    await this.storeRefreshToken(result.user.id, refreshToken);

    // Send welcome notification
    await this.notificationsService.createNotification({
      userId: result.user.id,
      type: 'SYSTEM_ANNOUNCEMENT',
      titleEn: 'Welcome to CareerHub!',
      titleAr: 'مرحباً بك في CareerHub!',
      contentEn: 'Your account has been created successfully. Start exploring career paths and courses.',
      contentAr: 'تم إنشاء حسابك بنجاح. ابدأ في استكشاف المسارات المهنية والدورات.',
      data: {
        type: 'welcome',
      },
    });

    this.logger.log(`User registered: ${email}`);

    return {
      user: this.sanitizeUser(result.user),
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;

    // Find user with profile
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    this.logger.log(`User logged in: ${email}`);

    return {
      user: this.sanitizeUser(user),
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

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal that user doesn't exist
      return;
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token (using session table for simplicity)
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: `reset:${resetToken}`,
        expiresAt,
      },
    });

    // Send password reset email
    // This would integrate with your email service
    await this.notificationsService.createNotification({
      userId: user.id,
      type: 'SYSTEM_ANNOUNCEMENT',
      titleEn: 'Password Reset Request',
      titleAr: 'طلب إعادة تعيين كلمة المرور',
      contentEn: 'A password reset link has been sent to your email.',
      contentAr: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.',
      data: {
        type: 'password_reset',
        token: resetToken,
      },
    });

    this.logger.log(`Password reset requested for: ${email}`);
  }

  async resetPassword(resetPasswordDto: { token: string; newPassword: string }) {
    const { token, newPassword } = resetPasswordDto;

    // Find reset token
    const session = await this.prisma.session.findFirst({
      where: {
        refreshToken: `reset:${token}`,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new BadRequestException('Invalid or expired token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await this.prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword },
    });

    // Remove reset token
    await this.prisma.session.delete({
      where: { id: session.id },
    });

    // Remove all other refresh tokens
    await this.prisma.session.deleteMany({
      where: {
        userId: session.userId,
        refreshToken: { not: `reset:${token}` },
      },
    });

    // Send notification
    await this.notificationsService.createNotification({
      userId: session.userId,
      type: 'SYSTEM_ANNOUNCEMENT',
      titleEn: 'Password Reset Successful',
      titleAr: 'تم إعادة تعيين كلمة المرور بنجاح',
      contentEn: 'Your password has been reset successfully.',
      contentAr: 'تم إعادة تعيين كلمة المرور بنجاح.',
      data: {
        type: 'password_reset_success',
      },
    });

    this.logger.log(`Password reset completed for user: ${session.user.email}`);
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

  async adminLogin(loginDto: { email: string; password: string }) {
    const { email, password } = loginDto;

    // Find admin user
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !user.isActive || user.role !== 'ADMIN') {
      throw new UnauthorizedException('Invalid credentials or insufficient permissions');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials or insufficient permissions');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    // Log admin login
    await this.prisma.adminLog.create({
      data: {
        adminId: user.id,
        action: 'LOGIN',
        resource: 'Admin',
        ipAddress: '', // Would be populated from request
        userAgent: '', // Would be populated from request
      },
    });

    this.logger.log(`Admin logged in: ${email}`);

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

  private sanitizeUser(user: User & { profile?: UserProfile }) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
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
