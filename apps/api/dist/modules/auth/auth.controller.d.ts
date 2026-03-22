import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User } from '@prisma/client';
export declare class AuthController {
    private readonly authService;
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
            user: {
                role: import(".prisma/client").$Enums.UserRole;
                id: string;
                email: string;
                password: string;
                isActive: boolean;
                stripeCustomerId: string | null;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
            };
        };
    }>;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        success: boolean;
        message: string;
    }>;
    changePassword(user: User, currentPassword: string, newPassword: string): Promise<{
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
        };
    }>;
}
