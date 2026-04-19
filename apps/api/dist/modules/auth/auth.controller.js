"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const refresh_guard_1 = require("./guards/refresh.guard");
const public_decorator_1 = require("./decorators/public.decorator");
const current_user_decorator_1 = require("./decorators/current-user.decorator");
const sanitize_util_1 = require("../../common/utils/sanitize.util");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.logger = new common_1.Logger(AuthController_1.name);
    }
    async register(registerDto, response) {
        try {
            const result = await this.authService.register(registerDto);
            response.cookie('refresh_token', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            return {
                success: true,
                message: 'User registered successfully',
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                },
            };
        }
        catch (error) {
            this.logger.error('Registration failed', (0, sanitize_util_1.sanitize)({ operation: 'register', reason: error instanceof Error ? error.message : String(error) }));
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Registration failed');
        }
    }
    async login(loginDto, response) {
        this.logger.log(`[AUTH CONTROLLER] login called for: ${loginDto.email}`);
        try {
            const result = await this.authService.login(loginDto);
            response.cookie('refresh_token', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            this.logger.log(`[AUTH CONTROLLER] login success for: ${loginDto.email}`);
            return {
                success: true,
                message: 'Login successful',
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                },
            };
        }
        catch (error) {
            const errDetail = error instanceof Error ? error.stack || error.message : String(error);
            this.logger.error(`[AUTH CTRL] login FAILED for ${loginDto.email}: ${errDetail}`);
            if (error instanceof common_1.ForbiddenException) {
                throw error;
            }
            if (loginDto.email === 'admin@deveway.com' || loginDto.email === 'supertest@deveway.com') {
                throw new common_1.UnauthorizedException(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
            }
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
    }
    async refresh(user, response) {
        try {
            const result = await this.authService.refreshTokens(user.id);
            response.cookie('refresh_token', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            return {
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: result.accessToken,
                },
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async logout(user, response) {
        await this.authService.logout(user.id);
        response.clearCookie('refresh_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });
        return {
            success: true,
            message: 'Logout successful',
        };
    }
    async getProfile(user) {
        const fullUser = await this.authService.getMe(user.id);
        return {
            success: true,
            data: fullUser,
        };
    }
    async updateProfile(user, body) {
        return this.authService.updateProfile(user.id, body);
    }
    async forgotPassword(forgotPasswordDto) {
        await this.authService.forgotPassword(forgotPasswordDto.email);
        return {
            success: true,
            data: null,
            message: 'If this email is registered, a reset link has been sent.',
        };
    }
    async resetPassword(resetPasswordDto) {
        await this.authService.resetPassword(resetPasswordDto);
        return {
            success: true,
            data: { message: 'Password reset successfully. Please log in.' },
        };
    }
    async verifyEmail(token) {
        try {
            await this.authService.verifyEmail(token);
            return {
                success: true,
                message: 'Email verified successfully',
            };
        }
        catch (error) {
            throw new common_1.BadRequestException('Invalid or expired token');
        }
    }
    async changePassword(user, body) {
        try {
            const currentPassword = body.currentPassword || body.oldPassword || '';
            const newPassword = body.newPassword;
            await this.authService.changePassword(user.id, currentPassword, newPassword);
            return {
                success: true,
                message: 'Password changed successfully',
            };
        }
        catch (error) {
            throw new common_1.BadRequestException('Current password is incorrect');
        }
    }
    async checkAuth(user) {
        return {
            success: true,
            data: {
                authenticated: true,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            },
        };
    }
    async adminLogin(loginDto, response) {
        this.logger.log(`[AUTH CONTROLLER] adminLogin called for: ${loginDto.email}`);
        try {
            const result = await this.authService.adminLogin(loginDto);
            response.cookie('refresh_token', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
                path: '/',
            });
            this.logger.log(`[AUTH CONTROLLER] adminLogin success for: ${loginDto.email}`);
            return {
                success: true,
                message: 'Admin login successful',
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                },
            };
        }
        catch (error) {
            this.logger.error(`[AUTH CTRL] adminLogin FAILED for ${loginDto.email}: ${error instanceof Error ? error.stack || error.message : String(error)}`);
            throw new common_1.UnauthorizedException('Invalid credentials or insufficient permissions');
        }
    }
    async testLogin(dto) {
        this.logger.log(`[TEST-LOGIN] attempt: ${dto.email}`);
        try {
            const result = await this.authService.login(dto);
            this.logger.log(`[TEST-LOGIN] success: ${dto.email}`);
            return { success: true, user: result.user, hasToken: !!result.accessToken };
        }
        catch (e) {
            this.logger.error(`[TEST-LOGIN] failed: ${e.message}`);
            return { success: false, error: e.message, status: e.status };
        }
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60000 } }),
    (0, common_1.Post)('register'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User registered successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation error or weak password' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email already exists' }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials' }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    (0, common_1.UseGuards)(refresh_guard_1.RefreshGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token refreshed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid refresh token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Logout user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logout successful' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User profile retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, throttler_1.Throttle)({ default: { limit: 3, ttl: 60000 } }),
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request password reset' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'If this email is registered, a reset link has been sent.' }),
    (0, swagger_1.ApiResponse)({ status: 429, description: 'Too many requests. Please try again later.' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reset password using token from email' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset successfully. Please log in.' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Reset link has expired or already been used.' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('verify-email'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify email address' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Email verified successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid or expired token' }),
    __param(0, (0, common_1.Body)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Change password' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password changed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Current password is incorrect' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('check-auth'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check authentication status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Authentication valid' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkAuth", null);
__decorate([
    (0, common_1.Post)('admin/login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Admin login' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Admin login successful' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Invalid credentials or insufficient permissions' }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Post)('test-login'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "testLogin", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map