import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Query,
  Req,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get list of users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getUsers(
    @Query('role') role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN',
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const users = await this.usersService.getUsers({
      role,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
    });
    return {
      success: true,
      data: users,
    };
  }

  @Get('instructors')
  @ApiOperation({ summary: 'Get instructors list' })
  @ApiResponse({ status: 200, description: 'Instructors retrieved successfully' })
  async getInstructors(@Query('limit') limit?: string) {
    const users = await this.usersService.getUsers({
      role: 'INSTRUCTOR',
      limit: limit ? parseInt(limit, 10) : 100,
    });
    return {
      success: true,
      data: users,
    };
  }

  @Public()
  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get public user profile' })
  @ApiResponse({ status: 200, description: 'Public profile retrieved successfully' })
  async getPublicProfile(@Param('userId') userId: string) {
    return this.usersService.getPublicProfile(userId);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  async getProfile(@CurrentUser() user: User) {
    const profile = await this.usersService.getProfile(user.id);
    return {
      success: true,
      data: { profile },
    };
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const profile = await this.usersService.updateProfile(user.id, updateProfileDto);
    return {
      success: true,
      message: 'Profile updated successfully',
      data: { profile },
    };
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    const avatarUrl = await this.usersService.uploadAvatar(user.id, file);
    return {
      success: true,
      message: 'Avatar uploaded successfully',
      data: { avatarUrl },
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get user dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@CurrentUser() user: User) {
    const dashboard = await this.usersService.getDashboard(user.id);
    return {
      success: true,
      data: dashboard,
    };
  }

  @Get('enrollments')
  @ApiOperation({ summary: 'Get user enrollments' })
  @ApiResponse({ status: 200, description: 'Enrollments retrieved successfully' })
  async getEnrollments(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const enrollments = await this.usersService.getEnrollments(user.id, {
      page: page || 1,
      limit: limit || 10,
      status,
    });
    return {
      success: true,
      data: enrollments,
    };
  }

  @Get('certificates')
  @ApiOperation({ summary: 'Get user certificates' })
  @ApiResponse({ status: 200, description: 'Certificates retrieved successfully' })
  async getCertificates(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const certificates = await this.usersService.getCertificates(user.id, {
      page: page || 1,
      limit: limit || 10,
    });
    return {
      success: true,
      data: certificates,
    };
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get user learning progress' })
  @ApiResponse({ status: 200, description: 'Progress data retrieved successfully' })
  async getProgress(@CurrentUser() user: User) {
    const progress = await this.usersService.getProgress(user.id);
    return {
      success: true,
      data: progress,
    };
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Get user achievements' })
  @ApiResponse({ status: 200, description: 'Achievements retrieved successfully' })
  async getAchievements(@CurrentUser() user: User) {
    const achievements = await this.usersService.getAchievements(user.id);
    return {
      success: true,
      data: { achievements },
    };
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getNotifications(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unread') unread?: boolean,
  ) {
    const notifications = await this.usersService.getNotifications(user.id, {
      page: page || 1,
      limit: limit || 20,
      unread,
    });
    return {
      success: true,
      data: notifications,
    };
  }

  @Patch('notifications/read')
  @ApiOperation({ summary: 'Mark notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  async markNotificationsRead(
    @CurrentUser() user: User,
    @Body('notificationIds') notificationIds: string[],
  ) {
    await this.usersService.markNotificationsRead(user.id, notificationIds);
    return {
      success: true,
      message: 'Notifications marked as read',
    };
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings(@CurrentUser() user: User) {
    const settings = await this.usersService.getSettings(user.id);
    return {
      success: true,
      data: { settings },
    };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(
    @CurrentUser() user: User,
    @Body() settings: {
      language?: string;
      timezone?: string;
      emailNotifications?: boolean;
      pushNotifications?: boolean;
    },
  ) {
    const updatedSettings = await this.usersService.updateSettings(user.id, settings);
    return {
      success: true,
      message: 'Settings updated successfully',
      data: { settings: updatedSettings },
    };
  }

  @Delete('account')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  async deleteAccount(
    @CurrentUser() user: User,
    @Body('password') password: string,
  ) {
    await this.usersService.deleteAccount(user.id, password);
    return {
      success: true,
      message: 'Account deleted successfully',
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats(@CurrentUser() user: User) {
    const stats = await this.usersService.getStats(user.id);
    return {
      success: true,
      data: stats,
    };
  }

  @Post('track-activity')
  @ApiOperation({ summary: 'Track user activity from frontend' })
  async trackActivity(
    @CurrentUser() user: User,
    @Body() body: { action: string; page?: string; metadata?: Record<string, any> },
  ) {
    try {
      await this.prisma.userActivity.create({
        data: {
          userId: user.id,
          action: body.action || 'PAGE_VIEW',
          entity: body.page ? 'Page' : undefined,
          entityId: body.page,
          metadata: body.metadata,
        },
      });
    } catch {}
    return { success: true };
  }
}
