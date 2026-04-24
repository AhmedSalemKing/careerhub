import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '@prisma/client';
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto, response: Response): Promise<{
        success: boolean;
        message: string;
        data: {
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
                googleId: string | null;
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
                provider: string;
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
                idVerificationStatus: string;
                idFrontUrl: string | null;
                idBackUrl: string | null;
                idVerifiedAt: Date | null;
                idRejectedReason: string | null;
                isVerified: boolean;
                walletBalance: number;
                updatedAt: Date;
                deletedAt: Date | null;
            };
            accessToken: string;
        };
    }>;
    login(loginDto: LoginDto, response: Response): Promise<{
        success: boolean;
        message: string;
        data: {
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
                googleId: string | null;
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
                provider: string;
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
                idVerificationStatus: string;
                idFrontUrl: string | null;
                idBackUrl: string | null;
                idVerifiedAt: Date | null;
                idRejectedReason: string | null;
                isVerified: boolean;
                walletBalance: number;
                updatedAt: Date;
                deletedAt: Date | null;
            };
            accessToken: string;
        };
    }>;
    refresh(user: User, response: Response): Promise<{
        success: boolean;
        message: string;
        data: {
            accessToken: string;
        };
    }>;
    logout(user: User, response: Response): Promise<{
        success: boolean;
        message: string;
    }>;
    getProfile(user: User): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    updateProfile(user: User, body: {
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
        meetingMethod?: string;
    }): Promise<{
        success: boolean;
        data: {
            profile: {
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
        } & {
            id: string;
            createdAt: Date;
            email: string;
            googleId: string | null;
            password: string;
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
            provider: string;
            stripeCustomerId: string | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            rejectedReason: string | null;
            lastSeenAt: Date | null;
            idVerificationStatus: string;
            idFrontUrl: string | null;
            idBackUrl: string | null;
            idVerifiedAt: Date | null;
            idRejectedReason: string | null;
            isVerified: boolean;
            walletBalance: number;
            updatedAt: Date;
            deletedAt: Date | null;
        };
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    changePassword(user: User, body: {
        currentPassword?: string;
        oldPassword?: string;
        newPassword: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    checkAuth(user: User): Promise<{
        success: boolean;
        data: {
            authenticated: boolean;
            user: {
                id: string;
                email: string;
                role: import(".prisma/client").$Enums.UserRole;
            };
        };
    }>;
    adminLogin(loginDto: LoginDto, response: Response): Promise<{
        success: boolean;
        message: string;
        data: {
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
                googleId: string | null;
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
                provider: string;
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
                idVerificationStatus: string;
                idFrontUrl: string | null;
                idBackUrl: string | null;
                idVerifiedAt: Date | null;
                idRejectedReason: string | null;
                isVerified: boolean;
                walletBalance: number;
                updatedAt: Date;
                deletedAt: Date | null;
            };
            accessToken: string;
        };
    }>;
    googleAuth(): Promise<void>;
    googleCallback(req: any, res: any): Promise<any>;
    updateAccountType(user: User, body: {
        accountType: string;
    }): Promise<{
        success: boolean;
    }>;
    updateProFields(user: User, body: {
        cvUrl?: string;
        speciality?: string;
        experience?: number;
        bio?: string;
        linkedinUrl?: string;
        hourlyRate?: number;
        meetingMethod?: string;
    }): Promise<{
        success: boolean;
    }>;
    testLogin(dto: {
        email: string;
        password: string;
    }): Promise<{
        success: boolean;
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
            googleId: string | null;
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
            provider: string;
            stripeCustomerId: string | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            rejectedReason: string | null;
            lastSeenAt: Date | null;
            idVerificationStatus: string;
            idFrontUrl: string | null;
            idBackUrl: string | null;
            idVerifiedAt: Date | null;
            idRejectedReason: string | null;
            isVerified: boolean;
            walletBalance: number;
            updatedAt: Date;
            deletedAt: Date | null;
        };
        hasToken: boolean;
        error?: undefined;
        status?: undefined;
    } | {
        success: boolean;
        error: any;
        status: any;
        user?: undefined;
        hasToken?: undefined;
    }>;
}
