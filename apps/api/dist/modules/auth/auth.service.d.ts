import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private configService;
    private notificationsService;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService, notificationsService: NotificationsService, emailService: EmailService);
    register(registerDto: {
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
    }): Promise<{
        user: {
            profile: {
                firstName: string;
                lastName: string;
                avatar: string;
                language: string;
            };
            id: string;
            createdAt: Date;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            accountType: string;
            status: string;
            cvUrl: string | null;
            bio: string | null;
            experience: number | null;
            speciality: string | null;
            linkedinUrl: string | null;
            hourlyRate: number | null;
            meetingMethod: string | null;
            stripeCustomerId: string | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            rejectedReason: string | null;
            lastSeenAt: Date | null;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        pendingReview: boolean;
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
            id: string;
            createdAt: Date;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            accountType: string;
            status: string;
            cvUrl: string | null;
            bio: string | null;
            experience: number | null;
            speciality: string | null;
            linkedinUrl: string | null;
            hourlyRate: number | null;
            meetingMethod: string | null;
            stripeCustomerId: string | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            rejectedReason: string | null;
            lastSeenAt: Date | null;
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
    forgotPassword(email: string, ipAddress?: string): Promise<void>;
    resetPassword(resetPasswordDto: {
        email: string;
        token: string;
        newPassword: string;
    }): Promise<void>;
    verifyEmail(token: string): Promise<void>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
    getMe(userId: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        status: string;
        bio: string;
        experience: number;
        speciality: string;
        profile: {
            bio: string;
            firstName: string;
            lastName: string;
            phone: string;
            avatar: string;
            timezone: string;
            language: string;
        };
    }>;
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        bio?: string;
        phone?: string;
        avatar?: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            bio: string | null;
            linkedinUrl: string | null;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            dateOfBirth: Date | null;
            gender: import(".prisma/client").$Enums.Gender | null;
            nationality: string | null;
            country: string | null;
            city: string | null;
            avatar: string | null;
            timezone: string;
            language: string;
        };
    }>;
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
            id: string;
            createdAt: Date;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            accountType: string;
            status: string;
            cvUrl: string | null;
            bio: string | null;
            experience: number | null;
            speciality: string | null;
            linkedinUrl: string | null;
            hourlyRate: number | null;
            meetingMethod: string | null;
            stripeCustomerId: string | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            rejectedReason: string | null;
            lastSeenAt: Date | null;
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
