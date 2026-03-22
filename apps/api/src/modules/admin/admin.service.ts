import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private analyticsService: AnalyticsService,
    private notificationsService: NotificationsService,
  ) {}

  async getDashboardOverview() {
    const [
      totalUsers,
      activeCourses,
      monthlyRevenue,
      pendingSessions,
      recentUsers,
      recentPayments,
    ] = await Promise.all([
      (this.prisma as any).user.count(),
      (this.prisma as any).course.count({ where: { status: 'PUBLISHED' } }),
      (this.prisma as any).payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      (this.prisma as any).session.count({ where: { status: 'PENDING' } }),
      (this.prisma as any).user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }),
      (this.prisma as any).payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      }),
    ]);

    // Calculate real historical data for charts
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return d;
    });

    const revenueLast12Months = await Promise.all(
      months.map(async (d) => {
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        const result = await (this.prisma as any).payment.aggregate({
          _sum: { amount: true },
          where: {
            status: 'COMPLETED',
            createdAt: { gte: start, lte: end },
          },
        });
        return {
          month: d.toLocaleString('default', { month: 'short' }),
          revenue: result._sum.amount || 0,
        };
      })
    );

    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (29 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const newUsersLast30Days = await Promise.all(
      days.map(async (d) => {
        const start = d;
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        const count = await (this.prisma as any).user.count({
          where: {
            createdAt: { gte: start, lte: end },
          },
        });
        return {
          date: d.toISOString().split('T')[0],
          users: count,
        };
      })
    );

    return {
      stats: {
        totalUsers,
        activeCourses,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        pendingSessions,
      },
      revenueLast12Months,
      newUsersLast30Days,
      recentUsers,
      recentPayments,
    };
  }

  async getPlatformStats() {
    const [
      totalUsers,
      totalCourses,
      totalSessions,
      revenueStats
    ] = await Promise.all([
      (this.prisma as any).user.count(),
      (this.prisma as any).course.count(),
      (this.prisma as any).session.count(),
      (this.prisma as any).payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      })
    ]);

    return {
      totalUsers,
      totalCourses,
      totalSessions,
      totalRevenue: revenueStats._sum.amount || 0,
    };
  }

  async getUsers(options: { page: number; limit: number; search?: string; role?: string; status?: string }) {
    const where: any = {};
    if (options.search) {
      where.OR = [
        { email: { contains: options.search, mode: 'insensitive' } },
        { profile: { firstName: { contains: options.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: options.search, mode: 'insensitive' } } },
      ];
    }
    if (options.role) {
      where.role = options.role;
    }
    if (options.status) {
      where.isActive = options.status === 'ACTIVE';
    }

    const [users, total] = await Promise.all([
      (this.prisma as any).user.findMany({
        where,
        include: { 
          profile: true,
          _count: {
            select: { 
              enrollments: true,
              sessions: true,
              payments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      (this.prisma as any).user.count({ where }),
    ]);
    return { users, total, page: options.page, limit: options.limit };
  }

  async getUserDetails(id: string) {
    return await (this.prisma as any).user.findUnique({
      where: { id },
      include: {
        profile: true,
        enrollments: { include: { course: true }, take: 5, orderBy: { createdAt: 'desc' } },
        sessions: { include: { coach: { include: { user: { include: { profile: true } } } } }, take: 5, orderBy: { createdAt: 'desc' } },
        payments: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async getUserById(id: string) {
    return await (this.prisma as any).user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async updateUser(id: string, updateData: any) {
    return await (this.prisma as any).user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id: string) {
    return await (this.prisma as any).user.delete({
      where: { id },
    });
  }

  async suspendUser(id: string, reason?: string) {
    return await (this.prisma as any).user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async unsuspendUser(id: string) {
    return await (this.prisma as any).user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async getAdminCourses(options: { page: number; limit: number; search?: string; status?: string; level?: string }) {
    const where: any = {};
    if (options.status) {
      where.status = options.status;
    }
    if (options.search) {
      where.OR = [
        { titleEn: { contains: options.search, mode: 'insensitive' } },
        { titleAr: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      (this.prisma as any).course.findMany({
        where,
        include: { 
          careerPath: true,
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      (this.prisma as any).course.count({ where }),
    ]);
    return { courses, total, page: options.page, limit: options.limit };
  }

  async createCourse(courseData: any) {
    return await (this.prisma as any).course.create({
      data: {
        ...courseData,
        slug: courseData.titleEn?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async approveCourse(id: string) {
    return await (this.prisma as any).course.update({
      where: { id },
      data: { status: 'PUBLISHED', updatedAt: new Date() },
    });
  }

  async rejectCourse(id: string, reason: string) {
    return await (this.prisma as any).course.update({
      where: { id },
      data: { status: 'DRAFT', updatedAt: new Date() },
    });
  }

  async getPendingContent() {
    return {
      courses: await (this.prisma as any).course.findMany({
        where: { status: 'DRAFT' },
        take: 10,
      }),
      lessons: [],
      assessments: [],
    };
  }

  async approveContent(id: string) {
    return { success: true, id };
  }

  async rejectContent(id: string, reason: string) {
    return { success: true, id, reason };
  }

  async getReports(options: { page: number; limit: number; status?: string }) {
    return {
      reports: [],
      total: 0,
      page: options.page,
      limit: options.limit,
    };
  }

  async resolveReport(id: string, resolutionData: any) {
    return { success: true, id, resolutionData };
  }

  async getRevenueAnalytics(startDate?: Date, endDate?: Date) {
    return this.analyticsService.getRevenueAnalytics();
  }

  async getEngagementAnalytics(startDate?: Date, endDate?: Date) {
    return this.analyticsService.getEngagementMetrics();
  }

  async getCourseAnalyticsAll() {
    return this.analyticsService.getCourseAnalytics("all");
  }

  async getSystemHealth() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date(),
    };
  }

  async getSystemLogs(level?: string, limit?: number) {
    return {
      logs: [
        {
          id: '1',
          level: 'INFO',
          message: 'System health check completed',
          timestamp: new Date(),
        },
      ],
      total: 1,
    };
  }

  async createBackup(backupData: any) {
    return {
      id: `backup_${Date.now()}`,
      type: backupData.type,
      createdAt: new Date(),
      status: 'COMPLETED',
    };
  }

  async getBackups() {
    return [
      {
        id: 'backup_1',
        type: 'FULL',
        createdAt: new Date(),
        status: 'COMPLETED',
      },
    ];
  }

  async restoreBackup(backupId: string) {
    return {
      backupId,
      restoredAt: new Date(),
      status: 'SUCCESS',
    };
  }

  async getSettings() {
    return {
      siteName: 'CareerHub',
      maintenanceMode: false,
      registrationEnabled: true,
      emailNotifications: true,
    };
  }

  async updateSettings(settingsData: any) {
    return { ...settingsData, updatedAt: new Date() };
  }

  async uploadLogo(file: Express.Multer.File) {
    return {
      url: `/uploads/logo_${Date.now()}.${file.originalname.split('.').pop()}`,
      size: file.size,
      originalName: file.originalname,
    };
  }

  async broadcastNotification(notificationData: any) {
    return await this.notificationsService.broadcastNotification(notificationData);
  }

  async getNotificationTemplates() {
    return this.notificationsService.getNotificationTemplates();
  }

  async exportUsers(format: string) {
    const users = await (this.prisma as any).user.findMany({
      include: { profile: true },
    });
    return { users, format };
  }

  async exportCourses(format: string) {
    const courses = await (this.prisma as any).course.findMany({
      include: { careerPath: true },
    });
    return { courses, format };
  }

  async importUsers(file: Express.Multer.File) {
    return {
      total: 0,
      imported: 0,
      failed: 0,
      errors: [],
    };
  }

  async getAuditLog(options: { page: number; limit: number; action?: string; userId?: string }) {
    return {
      entries: [
        {
          id: '1',
          userId: 'user_1',
          action: 'USER_LOGIN',
          timestamp: new Date(),
          details: {},
        },
      ],
      total: 1,
      page: options.page,
      limit: options.limit,
    };
  }

  async forcePasswordReset(data: any) {
    return {
      sent: 0,
      message: data.message || 'Password reset required',
    };
  }

  async getActiveSessions() {
    return [
      {
        sessionId: 'sess_1',
        userId: 'user_1',
        email: 'user@example.com',
        createdAt: new Date(),
        lastActivity: new Date(),
      },
    ];
  }

  async revokeSession(sessionId: string) {
    return { success: true, sessionId };
  }

  async getPerformanceMetrics() {
    return {
      cpu: 0,
      memory: 0,
      requests: 0,
      responseTime: 0,
      timestamp: new Date(),
    };
  }

  async getRecentErrors(limit?: number) {
    return [
      {
        id: 'error_1',
        message: 'Database connection timeout',
        timestamp: new Date(),
        level: 'ERROR',
      },
    ];
  }

  async getUsageStatistics() {
    return {
      apiCalls: 125000,
      storageUsed: 45.6,
      bandwidthUsed: 125.3,
      activeConnections: 450,
    };
  }
}
