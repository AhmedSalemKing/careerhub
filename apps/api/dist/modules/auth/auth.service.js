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
const crypto = __importStar(require("crypto"));
const notifications_service_1 = require("../notifications/notifications.service");
const email_service_1 = require("../email/email.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService, configService, notificationsService, emailService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.notificationsService = notificationsService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async register(registerDto) {
        var _a, _b;
        const { email, password, firstName, lastName, phone, country, city, language, accountType, cvUrl, bio, experience, speciality, linkedinUrl, hourlyRate, meetingMethod, } = registerDto;
        const resolvedAccountType = accountType || 'STUDENT';
        const isPendingAccount = resolvedAccountType === 'INSTRUCTOR' || resolvedAccountType === 'CONSULTANT';
        const existing = await this.prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            throw new common_1.BadRequestException('Email already exists');
        }
        if (isPendingAccount && !cvUrl) {
            throw new common_1.BadRequestException('CV is required for instructors and consultants');
        }
        const hashedPassword = await bcrypt.hash(password, 12);
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
                    experience: experience !== null && experience !== void 0 ? experience : null,
                    speciality: speciality || null,
                    linkedinUrl: linkedinUrl || null,
                    hourlyRate: hourlyRate !== null && hourlyRate !== void 0 ? hourlyRate : null,
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
                },
            });
            return { user, profile };
        });
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
        (_b = (_a = this.notificationsService).queueEmail) === null || _b === void 0 ? void 0 : _b.call(_a, {
            to: email,
            template: 'welcome',
            context: { firstName: result.profile.firstName },
        }).catch((err) => this.logger.error('Failed to queue welcome email', { reason: err.message }));
        if (isPendingAccount) {
            return {
                user: this.sanitizeUser(result.user),
                pendingReview: true,
                accessToken: null,
                refreshToken: null,
            };
        }
        const { accessToken, refreshToken } = await this.generateTokens(result.user);
        await this.storeRefreshToken(result.user.id, refreshToken);
        return {
            user: this.sanitizeUser(result.user),
            pendingReview: false,
            accessToken,
            refreshToken,
        };
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        console.log('[Auth Login] attempt:', email);
        const user = await this.prisma.user.findUnique({
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
        console.log('[Auth Login] user:', user ? { id: user.id, accountType: user.accountType, isActive: user.isActive, status: user.status } : 'NOT FOUND');
        if (!user || user.isActive === false) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('[Auth Login] passwordMatch:', isPasswordValid);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status === 'BANNED') {
            throw new common_1.UnauthorizedException('Account is disabled');
        }
        if (user.status === 'PENDING') {
            throw new common_1.ForbiddenException('Account is under review. You will be notified within 48 hours.');
        }
        if (user.status === 'REJECTED') {
            throw new common_1.ForbiddenException('Your application was rejected. Please contact support.');
        }
        const { accessToken, refreshToken } = await this.generateTokens(user);
        await this.storeRefreshToken(user.id, refreshToken);
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
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('User not found or inactive');
        }
        const { accessToken, refreshToken } = await this.generateTokens(user);
        await this.storeRefreshToken(user.id, refreshToken);
        return { accessToken, refreshToken };
    }
    async logout(userId) {
        await this.prisma.session.deleteMany({
            where: { userId },
        });
        this.logger.log(`User logged out: ${userId}`);
    }
    async forgotPassword(email, ipAddress) {
        var _a, _b, _c, _d, _e;
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });
        if (!user) {
            return;
        }
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = await bcrypt.hash(rawToken, 10);
        const expiresAt = new Date(Date.now() + 3600000);
        await this.prisma.passwordResetToken.deleteMany({
            where: { userId: user.id },
        });
        await this.prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                tokenHash,
                expiresAt,
                ipAddress: ipAddress !== null && ipAddress !== void 0 ? ipAddress : null,
            },
        });
        const frontendUrl = (_a = this.configService.get('FRONTEND_URL')) !== null && _a !== void 0 ? _a : 'http://localhost:3000';
        const resetLink = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;
        const firstName = (_c = (_b = user.profile) === null || _b === void 0 ? void 0 : _b.firstName) !== null && _c !== void 0 ? _c : '';
        (_e = (_d = this.notificationsService).queueEmail) === null || _e === void 0 ? void 0 : _e.call(_d, {
            to: email,
            template: 'password-reset',
            context: { resetLink, firstName, expiresIn: '1 hour' },
        }).catch((err) => this.logger.error('Failed to queue password-reset email', { reason: err.message }));
        this.logger.log('Password reset requested', { userId: user.id });
    }
    async resetPassword(resetPasswordDto) {
        const { email, token, newPassword } = resetPasswordDto;
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new common_1.BadRequestException('Reset link has expired or already been used.');
        }
        const pendingTokens = await this.prisma.passwordResetToken.findMany({
            where: {
                userId: user.id,
                expiresAt: { gt: new Date() },
                usedAt: null,
            },
        });
        let matchedToken = null;
        for (const pt of pendingTokens) {
            const isMatch = await bcrypt.compare(token, pt.tokenHash);
            if (isMatch) {
                matchedToken = pt;
                break;
            }
        }
        if (!matchedToken) {
            throw new common_1.BadRequestException('Reset link has expired or already been used.');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        await this.prisma.passwordResetToken.update({
            where: { id: matchedToken.id },
            data: { usedAt: new Date() },
        });
        await this.prisma.session.deleteMany({ where: { userId: user.id } });
        this.logger.log('Password reset successful', { userId: user.id });
    }
    async verifyEmail(token) {
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
        await this.prisma.session.delete({
            where: { id: session.id },
        });
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
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('User not found');
        }
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });
        await this.prisma.session.deleteMany({
            where: { userId },
        });
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
    async getMe(userId) {
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
        return user;
    }
    async updateProfile(userId, data) {
        const profile = await this.prisma.userProfile.update({
            where: { userId },
            data: {
                ...(data.firstName !== undefined && { firstName: data.firstName }),
                ...(data.lastName !== undefined && { lastName: data.lastName }),
                ...(data.bio !== undefined && { bio: data.bio }),
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.avatar !== undefined && { avatar: data.avatar }),
            }
        });
        return { success: true, data: profile };
    }
    async adminLogin(loginDto) {
        const { email, password } = loginDto;
        const user = await this.prisma.user.findUnique({
            where: { email },
            include: { profile: true },
        });
        const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
        if (!user || !user.isActive || (!adminRoles.includes(user.role) && !adminRoles.includes(user.accountType))) {
            throw new common_1.UnauthorizedException('Invalid credentials or insufficient permissions');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials or insufficient permissions');
        }
        const { accessToken, refreshToken } = await this.generateTokens(user);
        await this.storeRefreshToken(user.id, refreshToken);
        await this.prisma.adminLog.create({
            data: {
                adminId: user.id,
                action: 'LOGIN',
                resource: 'Admin',
                ipAddress: '',
                userAgent: '',
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
            accountType: user.accountType,
        };
        const accessToken = this.jwtService.sign(payload);
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN'),
        });
        return { accessToken, refreshToken };
    }
    async storeRefreshToken(userId, refreshToken) {
        await this.prisma.session.deleteMany({
            where: { userId },
        });
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
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
        notifications_service_1.NotificationsService,
        email_service_1.EmailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map