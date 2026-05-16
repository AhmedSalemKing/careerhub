import {
  Controller,
  Post,
  Patch,
  Body,
  Get,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  HttpException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { Roles } from './decorators/roles.decorator';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '@prisma/client';
import { AuditService, SecurityEvent } from '../../common/services/audit.service';
import { sanitize } from '../../common/utils/sanitize.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly audit: AuditService,
  ) { }

  private getIp(req: Request): string {
    return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      || (req as any).ip
      || 'unknown'
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or weak password' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } })) registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request,
  ) {
    this.logger.log(`[Register] payload keys: ${Object.keys(registerDto).join(', ')}`);
    this.logger.log(`[Register] accountType=${registerDto.accountType}, hasCV=${!!registerDto.cvUrl}, hasAvatar=${!!registerDto.avatar}`);
    try {
      const result = await this.authService.register(registerDto);

      response.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      response.cookie('access_token', result.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });

      await this.audit.log({
        event: SecurityEvent.REGISTER,
        userId: result.user?.id,
        email: registerDto.email,
        ip: this.getIp(req),
        userAgent: req.headers['user-agent'],
        metadata: { accountType: registerDto.accountType },
      });

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      };
    } catch (error) {
      this.logger.error('Registration failed', sanitize({ operation: 'register', reason: error instanceof Error ? error.message : String(error) }));

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Registration failed');
    }
  }

  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } })) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request,
  ) {
    this.logger.log(`[AUTH CONTROLLER] login called for: ${loginDto.email}`);
    try {
      const ip = this.getIp(req)

      // Check brute force
      const recentFailures = await this.audit.getRecentFailedLogins(ip, 15)
      if (recentFailures >= 10) {
        await this.audit.log({
          event: SecurityEvent.LOGIN_BLOCKED,
          email: loginDto.email,
          ip,
          metadata: { recentFailures, reason: 'brute_force_protection' },
        })
        throw new HttpException(
          { message: 'Too many failed attempts. Please try again in 15 minutes.', messageAr: 'محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة.' },
          429,
        )
      }

      const result = await this.authService.login(loginDto);

      response.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      response.cookie('access_token', result.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });

      this.logger.log(`[AUTH CONTROLLER] login success for: ${loginDto.email}`);

      await this.audit.log({
        event: SecurityEvent.LOGIN_SUCCESS,
        userId: result.user?.id,
        email: loginDto.email,
        ip,
        userAgent: req.headers['user-agent'],
      });

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      };
    } catch (error) {
      const errDetail = error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(`[AUTH CTRL] login FAILED for ${loginDto.email}: ${errDetail}`);

      // Log failed login attempt
      if (!(error instanceof HttpException && (error.getStatus ? error.getStatus() === 429 : false))) {
        await this.audit.log({
          event: SecurityEvent.LOGIN_FAILED,
          email: loginDto.email,
          ip: this.getIp(req),
          userAgent: req.headers['user-agent'],
          metadata: { reason: 'invalid_credentials' },
        }).catch(() => {})
      }

      // Re-throw ForbiddenException as-is so frontend can show "under review" / "rejected" UI
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // TEMP DIAGNOSTIC: include real error for admin debugging
      if (loginDto.email === 'admin@deveway.com' || loginDto.email === 'supertest@deveway.com') {
        throw new UnauthorizedException(`Login failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @Post('refresh')
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      const result = await this.authService.refreshTokens(user.id);

      response.cookie('refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      response.cookie('access_token', result.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
        path: '/',
      });

      return {
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
    @Req() req: Request,
  ) {
    await this.authService.logout(user.id);

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    response.clearCookie('access_token', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });

    await this.audit.log({
      event: SecurityEvent.LOGOUT,
      userId: user.id,
      ip: this.getIp(req),
    });

    return {
      success: true,
      message: 'Logout successful',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: User) {
    const fullUser = await this.authService.getMe(user.id);
    return {
      success: true,
      data: fullUser,
    };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(@CurrentUser() user: User, @Body() body: { 
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
    return this.authService.updateProfile(user.id, body);
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'If this email is registered, a reset link has been sent.' })
  @ApiResponse({ status: 429, description: 'Too many requests. Please try again later.' })
  async forgotPassword(
    @Body(ValidationPipe) forgotPasswordDto: ForgotPasswordDto,
    @Req() req: Request,
  ) {
    // Check for excessive password resets
    const recentResets = await this.audit.getRecentPasswordResets(forgotPasswordDto.email, 1)
    if (recentResets >= 3) {
      await this.audit.log({
        event: SecurityEvent.SUSPICIOUS_ACTIVITY,
        email: forgotPasswordDto.email,
        ip: this.getIp(req),
        metadata: { reason: 'excessive_password_resets', count: recentResets },
      })
      return { success: true, message: 'If email exists, reset link was sent.' }
    }

    await this.audit.log({
      event: SecurityEvent.PASSWORD_RESET_REQUEST,
      email: forgotPasswordDto.email,
      ip: this.getIp(req),
      userAgent: req.headers['user-agent'],
    })

    await this.authService.forgotPassword(forgotPasswordDto.email);

    return {
      success: true,
      data: null,
      message: 'If this email is registered, a reset link has been sent.',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully. Please log in.' })
  @ApiResponse({ status: 400, description: 'Reset link has expired or already been used.' })
  async resetPassword(@Body(ValidationPipe) resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);

    return {
      success: true,
      data: { message: 'Password reset successfully. Please log in.' },
    };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body('token') token: string) {
    try {
      await this.authService.verifyEmail(token);

      return {
        success: true,
        message: 'Email verified successfully',
      };
    } catch (error) {
      throw new BadRequestException('Invalid or expired token');
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password is incorrect' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() body: { currentPassword?: string; oldPassword?: string; newPassword: string },
  ) {
    try {
      const currentPassword = body.currentPassword || body.oldPassword || '';
      const newPassword = body.newPassword;
      await this.authService.changePassword(user.id, currentPassword, newPassword);

      return {
        success: true,
        message: 'Password changed successfully',
      };
    } catch (error) {
      throw new BadRequestException('Current password is incorrect');
    }
  }

  @Get('check-auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check authentication status' })
  @ApiResponse({ status: 200, description: 'Authentication valid' })
  async checkAuth(@CurrentUser() user: User) {
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

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Admin login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or insufficient permissions' })
  async adminLogin(
    @Body(ValidationPipe) loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
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

      response.cookie('access_token', result.accessToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        maxAge: 15 * 60 * 1000,
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
    } catch (error) {
      this.logger.error(`[AUTH CTRL] adminLogin FAILED for ${loginDto.email}: ${error instanceof Error ? error.stack || error.message : String(error)}`);
      throw new UnauthorizedException('Invalid credentials or insufficient permissions');
    }
  }

  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Passport handles the redirect to Google
  }

  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    try {
      const user = req.user;
      if (!user) throw new Error('No user returned from Google');

      const frontendUrl = process.env.FRONTEND_URL || 'https://deveway-teal.vercel.app';

      // Check if user is banned or rejected BEFORE issuing token
      if (user.status === 'BANNED' || user.status === 'REJECTED') {
        return res.redirect(`${frontendUrl}/ar/login?error=account_rejected`);
      }

      // Check if pending approval (instructors/consultants)
      if (user.status === 'PENDING') {
        return res.redirect(`${frontendUrl}/ar/login?error=pending_approval`);
      }

      // Only issue token for ACTIVE users
      const tokens = await this.authService.generateTokens(user);

      const userData = encodeURIComponent(JSON.stringify({
        id: user.id,
        email: user.email,
        accountType: user.accountType,
        status: user.status,
        profile: user.profile,
        accessToken: tokens.accessToken,
        isNewUser: user.isNewUser || false,
      }));

      if (user.isNewUser) {
        // New user → pre-fill register page and jump to account type step
        const googleParam = encodeURIComponent(JSON.stringify({
          email: user.email,
          firstName: user.profile?.firstName || '',
          lastName: user.profile?.lastName || '',
          avatar: user.profile?.avatar || '',
          googleId: user.googleId,
          accessToken: tokens.accessToken,
          userId: user.id,
        }));
        res.redirect(`${frontendUrl}/ar/register?google=${googleParam}&step=2`);
      } else {
        res.redirect(`${frontendUrl}/ar/auth/google/success?data=${userData}`);
      }
    } catch (e) {
      this.logger.error(`[GOOGLE-CALLBACK] failed: ${e instanceof Error ? e.message : String(e)}`);
      const frontendUrl = process.env.FRONTEND_URL || 'https://deveway-teal.vercel.app';
      res.redirect(`${frontendUrl}/ar/login?error=google_failed`);
    }
  }

  @Patch('update-account-type')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateAccountType(
    @CurrentUser() user: User,
    @Body() body: { accountType: string },
  ) {
    const valid = ['STUDENT', 'INSTRUCTOR', 'CONSULTANT'];
    if (!valid.includes(body.accountType)) {
      throw new BadRequestException('Invalid account type');
    }
    return this.authService.updateAccountType(user.id, body.accountType);
  }

  @Patch('update-pro-fields')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProFields(
    @CurrentUser() user: User,
    @Body() body: {
      cvUrl?: string;
      speciality?: string;
      experience?: number;
      bio?: string;
      linkedinUrl?: string;
      hourlyRate?: number;
      meetingMethod?: string;
    },
  ) {
    return this.authService.updateProFields(user.id, body);
  }

  @Post('test-login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async testLogin(@Body() dto: { email: string; password: string }) {
    this.logger.log(`[TEST-LOGIN] attempt: ${dto.email}`);
    try {
      const result = await this.authService.login(dto);
      this.logger.log(`[TEST-LOGIN] success: ${dto.email}`);
      return { success: true, user: result.user, hasToken: !!result.accessToken };
    } catch (e: any) {
      this.logger.error(`[TEST-LOGIN] failed: ${e.message}`);
      return { success: false, error: e.message, status: e.status };
    }
  }
}
