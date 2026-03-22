import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, notificationsService: NotificationsService);
    register(registerDto: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phone?: string;
        country?: string;
        city?: string;
        language?: string;
    }): Promise<{
        user: {
            profile: {
                firstName: string;
                lastName: string;
                avatar: string;
                language: string;
            };
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            email: string;
            isActive: boolean;
            stripeCustomerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    login(loginDto: {
        email: string;
        password: string;
    }): Promise<{
        user: {
            profile: {
                firstName: string;
                lastName: string;
                avatar: string;
                language: string;
            };
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            email: string;
            isActive: boolean;
            stripeCustomerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    refreshTokens(userId: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(resetPasswordDto: {
        token: string;
        newPassword: string;
    }): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    adminLogin(loginDto: {
        email: string;
        password: string;
    }): Promise<{
        user: {
            profile: {
                firstName: string;
                lastName: string;
                avatar: string;
                language: string;
            };
            role: import(".prisma/client").$Enums.UserRole;
            id: string;
            email: string;
            isActive: boolean;
            stripeCustomerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        accessToken: string;
        refreshToken: string;
    }>;
    private generateTokens;
    private storeRefreshToken;
    private sanitizeUser;
    private getTimezoneFromCountry;
}
