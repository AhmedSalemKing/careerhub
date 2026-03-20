"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
const bcrypt = __importStar(require("bcrypt"));
const uuid_1 = require("uuid");
const notifications_service_1 = require("../notifications/notifications.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, configService, notificationsService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(registerDto) {
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
    async login(loginDto) {
        const { email, password } = loginDto;
        // Find user with profile
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        // Verify password
        console.log('=== LOGIN DEBUG ===');
        console.log('Email:', email);
        console.log('Password received:', password);
        console.log('User found:', user?.email);
        console.log('DB hash:', user?.password?.substring(0, 30));
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);
        if (!isPasswordValid) {
            console.log('❌ Password validation failed - throwing Invalid credentials');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        console.log('✅ Password validation passed - generating tokens...');
        // Generate tokens
        console.log('🔑 About to generate tokens...');
        const { accessToken, refreshToken } = await this.generateTokens(user);
        console.log('✅ Tokens generated successfully');
        // Store refresh token
        console.log('💾 About to store refresh token...');
        await this.storeRefreshToken(user.id, refreshToken);
        console.log('✅ Refresh token stored');
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
    async refreshTokens(userId) {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        // Generate new tokens
        const { accessToken, refreshToken } = await this.generateTokens(user);
        // Store new refresh token and invalidate old ones
        await this.storeRefreshToken(user.id, refreshToken);
        return { accessToken, refreshToken };
    }
    async logout(userId) {
        // Remove all refresh tokens for user
        await this.prisma.session.deleteMany({
            where: { userId },
        });
        this.logger.log(`User logged out: ${userId}`);
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            // Don't reveal that user doesn't exist
            return;
        }
        // Generate reset token
        const resetToken = (0, uuid_1.v4)();
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
    async resetPassword(resetPasswordDto) {
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
            throw new common_1.BadRequestException('Invalid or expired token');
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
    async verifyEmail(token) {
        // Find verification token
        const session = await this.prisma.session.findFirst({
            where: {
                refreshToken: `verify:${token}`,
                expiresAt: { gt: new Date() },
            },
            include: { user: true },
        });
        if (!session) {
            throw new common_1.BadRequestException('Invalid or expired token');
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
    async changePassword(userId, currentPassword, newPassword) {
        // Find user
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
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
    async adminLogin(loginDto) {
        const { email, password } = loginDto;
        // Find admin user
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });
        if (!user || !user.isActive || user.role !== 'ADMIN') {
            throw new common_1.UnauthorizedException('Invalid credentials or insufficient permissions');
        }
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials or insufficient permissions');
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
    async generateTokens(user) {
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
    async storeRefreshToken(userId, refreshToken) {
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
    sanitizeUser(user) {
        const { password, ...sanitizedUser } = user;
        return sanitizedUser;
    }
    getTimezoneFromCountry(country) {
        const timezoneMap = {
            'Egypt': 'Africa/Cairo',
            'Saudi Arabia': 'Asia/Riyadh',
            'UAE': 'Asia/Dubai',
            'Jordan': 'Asia/Amman',
            'Morocco': 'Africa/Casablanca',
        };
        return timezoneMap[country || ''] || 'UTC';
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        notifications_service_1.NotificationsService])
], AuthService);
