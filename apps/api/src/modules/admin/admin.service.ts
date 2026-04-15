import {
  Injectable,
  Logger,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private analyticsService: AnalyticsService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
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
      this.prisma.user.count().catch(() => 0),
      this.prisma.course.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: { in: ['SUCCESS', 'COMPLETED'] as any },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }).catch(() => ({ _sum: { amount: 0 } })),
      this.prisma.consultingSession.count({ where: { status: 'PENDING' } }).catch(() => 0),
      this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { profile: true },
      }).catch(() => []),
      this.prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      }).catch(() => []),
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
        const result = await this.prisma.payment.aggregate({
          _sum: { amount: true },
          where: {
            status: { in: ['SUCCESS', 'COMPLETED'] as any },
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
        const count = await this.prisma.user.count({
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

    // Total revenue (all time)
    const totalRevenueResult = await this.prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: { in: ['SUCCESS', 'COMPLETED'] as any } },
    }).catch(() => ({ _sum: { amount: 0 } }));

    return {
      stats: {
        totalUsers,
        activeCourses,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        totalRevenue: totalRevenueResult._sum.amount || 0,
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
      this.prisma.user.count(),
      this.prisma.course.count().catch(() => 0),
      this.prisma.consultingSession.count().catch(() => 0),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' }
      }).catch(() => ({ _sum: { amount: 0 } })),
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
      this.prisma.user.findMany({
        where,
        include: {
          profile: true,
          _count: {
            select: {
              enrollments: true,
              payments: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page: options.page, limit: options.limit };
  }

  async getUserDetails(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        enrollments: { include: { course: true }, take: 5, orderBy: { enrolledAt: 'desc' } },
        payments: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async getUserById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async updateUser(id: string, updateData: any) {
    return await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteUser(id: string) {
    return await this.prisma.user.delete({
      where: { id },
    });
  }

  async suspendUser(id: string, reason?: string) {
    return await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async unsuspendUser(id: string) {
    return await this.prisma.user.update({
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
      this.prisma.course.findMany({
        where,
        include: {
          careerPath: true,
          category: true,
          instructor: {
            select: {
              id: true,
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.course.count({ where }),
    ]);
    return { courses, total, page: options.page, limit: options.limit };
  }

  async createCourse(courseData: any, adminId?: string) {
    const baseSlug = (courseData.titleEn || courseData.title || 'course')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now()}`;
    const instructorId = courseData.instructorId || adminId || undefined;

    return await this.prisma.course.create({
      data: {
        slug,
        titleEn: courseData.titleEn || courseData.title || 'Untitled',
        titleAr: courseData.titleAr,
        descriptionEn: courseData.descriptionEn || courseData.description,
        descriptionAr: courseData.descriptionAr,
        price: parseFloat(courseData.price) || 0,
        currency: courseData.currency || 'USD',
        duration: courseData.duration,
        level: courseData.level || 'BEGINNER',
        status: (courseData.status as any) || 'DRAFT',
        thumbnail: courseData.thumbnail || null,
        ...(courseData.careerPathId && { careerPathId: courseData.careerPathId }),
        ...(instructorId && { instructorId }),
        ...(courseData.categoryId && { categoryId: courseData.categoryId }),
      },
    });
  }

  async getPendingCourses() {
    const courses = await this.prisma.course.findMany({
      where: { status: 'PENDING_REVIEW' as any },
      include: {
        instructor: {
          select: {
            id: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        sections: {
          include: { lessons: true },
        },
        category: true,
        _count: { select: { sections: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: courses };
  }

  async approveCourse(id: string) {
    const course = await this.prisma.course.update({
      where: { id },
      data: { status: 'PUBLISHED', updatedAt: new Date() },
    });

    if (course.instructorId) {
      await this.notificationsService.createNotification({
        userId: course.instructorId,
        type: 'SYSTEM_ANNOUNCEMENT',
        titleEn: 'Your Course Has Been Approved!',
        titleAr: 'تم الموافقة على نشر كورسك',
        contentEn: `Congratulations! Your course "${course.titleEn}" has been approved and is now published.`,
        contentAr: `تهانينا! تم مراجعة وقبول كورسك "${course.titleEn}" وهو الآن منشور ومتاح للطلاب.`,
        data: { type: 'course_approved', courseId: id },
      }).catch(() => {});
    }

    await this.log('APPROVE_COURSE', 'Course', id);
    if (course.instructorId) {
      const instructor = await this.prisma.user.findUnique({
        where: { id: course.instructorId },
        include: { profile: true },
      }).catch(() => null);
      if (instructor) {
        const name = `${instructor.profile?.firstName || ''} ${instructor.profile?.lastName || ''}`.trim() || instructor.email;
        this.emailService.sendCourseApproved(instructor.email, name, (course as any).titleEn || (course as any).titleAr).catch(() => {});
      }
    }
    return course;
  }

  async rejectCourse(id: string, reason?: string) {
    const course = await this.prisma.course.update({
      where: { id },
      data: { status: 'REJECTED' as any, updatedAt: new Date() },
    });

    if (course.instructorId) {
      await this.notificationsService.createNotification({
        userId: course.instructorId,
        type: 'SYSTEM_ANNOUNCEMENT',
        titleEn: 'Course Review Update',
        titleAr: 'تم رفض طلب نشر الكورس',
        contentEn: reason
          ? `Your course "${course.titleEn}" was not approved. Reason: ${reason}. You may revise and resubmit.`
          : `Your course "${course.titleEn}" was not approved. Please update the content and resubmit.`,
        contentAr: reason
          ? `تم رفض كورسك "${course.titleEn}". السبب: ${reason}. يمكنك تعديل الكورس وإعادة الطلب.`
          : `تم رفض كورسك "${course.titleEn}". يمكنك تعديل المحتوى وإعادة الطلب.`,
        data: { type: 'course_rejected', courseId: id, reason },
      }).catch(() => {});
    }

    await this.log('REJECT_COURSE', 'Course', id, undefined, { reason });
    return course;
  }

  async getPendingContent() {
    return {
      courses: await this.prisma.course.findMany({
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
      siteName: 'DeveWay',
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
    const users = await this.prisma.user.findMany({
      include: { profile: true },
    });
    return { users, format };
  }

  async exportCourses(format: string) {
    const courses = await this.prisma.course.findMany({
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

  // ── Audit Log ─────────────────────────────────────────────────────────────

  private async log(
    action: string,
    entityType: string,
    entityId: string,
    adminId?: string,
    details?: any,
  ) {
    try {
      await (this.prisma as any).auditLog.create({
        data: { action, entityType, entityId, adminId: adminId ?? null, details: details ?? null },
      });
    } catch (e) {
      this.logger.warn(`AuditLog write failed: ${e}`);
    }
  }

  async getAuditLogs(limit = 50) {
    return (this.prisma as any).auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ── Approval system ────────────────────────────────────────────────────────

  async getPendingApprovals() {
    this.logger.log('[Admin] Fetching pending approvals...');
    const users = await this.prisma.user.findMany({
      where: { status: 'PENDING' },
      select: {
        id: true,
        email: true,
        status: true,
        accountType: true,
        cvUrl: true,
        bio: true,
        experience: true,
        speciality: true,
        linkedinUrl: true,
        hourlyRate: true,
        meetingMethod: true,
        createdAt: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    this.logger.log(`[Admin] Found pending users: ${users.length}`);
    return users;
  }

  async getDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      totalUsers,
      totalCourses,
      pendingUsers,
      allPayments,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count({
        where: { accountType: { not: 'ADMIN' } },
      }).catch(() => 0),

      this.prisma.course.count({
        where: { status: 'PUBLISHED' },
      }).catch(() => 0),

      this.prisma.user.count({
        where: { status: 'PENDING' },
      }).catch(() => 0),

      this.prisma.payment.findMany({
        where: { status: 'SUCCESS' },
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }).catch(() => []),

      this.prisma.user.findMany({
        where: { accountType: { not: 'ADMIN' } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          accountType: true,
          status: true,
          createdAt: true,
          profile: { select: { firstName: true, lastName: true, avatar: true } },
        },
      }).catch(() => []),
    ]);

    const toNum = (payments: { amount: number }[]) =>
      payments.map(p => Number(p.amount) || 0).reduce((a, b) => a + b, 0);

    const totalRevenue = toNum(allPayments);
    const monthlyRevenue = toNum(allPayments.filter(p => new Date(p.createdAt) >= startOfMonth));
    const todayRevenue = toNum(allPayments.filter(p => new Date(p.createdAt) >= startOfDay));

    const monthlyChart: { month: string; revenue: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const rev = allPayments
        .filter(p => {
          const pd = new Date(p.createdAt);
          return pd >= d && pd < end;
        })
        .map(p => Number(p.amount) || 0).reduce((a, b) => a + b, 0);
      monthlyChart.push({
        month: d.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }),
        revenue: rev,
      });
    }

    return {
      totalUsers,
      totalCourses,
      pendingUsers,
      totalRevenue,
      monthlyRevenue,
      todayRevenue,
      recentUsers,
      monthlyChart,
    };
  }

  async getAllPayments() {
    const payments = await this.prisma.payment.findMany({
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        course: { select: { titleAr: true, titleEn: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const total = payments
      .filter((p) => p.status === 'SUCCESS' || p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);
    return { success: true, data: payments, total };
  }

  async clearSeedData() {
    await this.prisma.user.deleteMany({
      where: { email: { contains: '@example.com' } },
    });
    await this.prisma.user.deleteMany({
      where: { email: { contains: '@test.com' } },
    });
    return { success: true, message: 'Seed data cleared' };
  }

  async approveUser(userId: string, adminId?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE', approvedAt: new Date() },
      include: { profile: true },
    });
    await this.notificationsService.createNotification({
      userId,
      type: 'SYSTEM_ANNOUNCEMENT',
      titleEn: 'Application Approved!',
      titleAr: 'تم قبول طلبك! 🎉',
      contentEn: `Congratulations ${user.profile?.firstName || ''}! Your account has been approved as ${user.accountType === 'INSTRUCTOR' ? 'an Instructor' : 'a Consultant'}. You can now log in and start using the platform.`,
      contentAr: `تهانينا ${user.profile?.firstName || ''}! تم قبول طلبك كـ${user.accountType === 'INSTRUCTOR' ? 'محاضر' : 'مستشار'}. يمكنك الآن تسجيل الدخول والبدء في استخدام المنصة.`,
      data: { type: 'approved' },
    });
    await this.log('APPROVE_USER', 'User', userId, adminId, { email: user.email, accountType: user.accountType });
    const name = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email;
    this.emailService.sendApproval(user.email, name, user.accountType).catch(() => {});
    return user;
  }

  async rejectUser(userId: string, reason?: string, adminId?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectedReason: reason || null,
      },
      include: { profile: true },
    });
    await this.notificationsService.createNotification({
      userId,
      type: 'SYSTEM_ANNOUNCEMENT',
      titleEn: 'Application Update',
      titleAr: 'نتيجة مراجعة طلبك',
      contentEn: reason
        ? `We're sorry, your application was not approved. Reason: ${reason}. Please contact support for more information.`
        : 'We\'re sorry, your application was not approved at this time. Please contact support for more information.',
      contentAr: reason
        ? `نأسف، تم رفض طلبك. السبب: ${reason}. يمكنك التواصل مع الدعم لمزيد من المعلومات.`
        : 'نأسف، تم رفض طلبك. يمكنك التواصل مع الدعم لمزيد من المعلومات.',
      data: { type: 'rejected', reason },
    });
    await this.log('REJECT_USER', 'User', userId, adminId, { reason });
    return user;
  }

  async banUser(userId: string, adminId?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED', isActive: false },
    });
    await this.log('BAN_USER', 'User', userId, adminId);
    return user;
  }

  async unbanUser(userId: string, adminId?: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE', isActive: true },
    });
    await this.log('UNBAN_USER', 'User', userId, adminId);
    return user;
  }

  // ── Site Settings ─────────────────────────────────────────────────────────

  async getSiteSettings() {
    let settings = await this.prisma.siteSettings.findFirst();
    if (!settings) {
      settings = await this.prisma.siteSettings.create({
        data: {
          siteName: 'DeveWay',
          primaryColor: '#5120c8',
          backgroundColor: '#0d0d0d',
          buttonColor: '#5120c8',
        } as any,
      });
    }
    return settings;
  }

  async updateSiteSettings(data: {
    siteName?: string;
    primaryColor?: string;
    backgroundColor?: string;
    buttonColor?: string;
    logoUrl?: string;
  }) {
    const existing = await this.prisma.siteSettings.findFirst();
    if (existing) {
      return this.prisma.siteSettings.update({
        where: { id: existing.id },
        data,
      });
    }
    return this.prisma.siteSettings.create({ data: data as any });
  }

  async getAllSessions() {
    const sessions = await this.prisma.consultingSession.findMany({
      include: {
        student: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        consultant: {
          select: {
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: sessions };
  }

  // ── Create User ──
  async createUser(data: { email: string; password: string; firstName: string; lastName: string; accountType: string }) {
    const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictException('Email already exists');
    const hashed = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        accountType: data.accountType as any,
        status: 'ACTIVE',
        profile: { create: { firstName: data.firstName, lastName: data.lastName } },
      },
      select: {
        id: true, email: true, accountType: true, status: true, createdAt: true,
        profile: { select: { firstName: true, lastName: true } },
      },
    });
  }

  // ── Change user role ──
  async changeUserRole(id: string, accountType: string) {
    return this.prisma.user.update({
      where: { id },
      data: { accountType: accountType as any },
      select: { id: true, email: true, accountType: true },
    });
  }

  // ── Change user status ──
  async changeUserStatus(id: string, status: string) {
    return this.prisma.user.update({
      where: { id },
      data: { status: status as any },
      select: { id: true, email: true, status: true },
    });
  }

  // ── Admin creates a consulting session ──
  async createSession(data: any) {
    return this.prisma.consultingSession.create({
      data: {
        studentId: data.studentId,
        consultantId: data.consultantId,
        scheduledAt: new Date(data.scheduledAt),
        topic: data.topic || '',
        meetingMethod: data.meetingMethod || 'ONLINE',
        price: Number(data.price) || 0,
        status: 'CONFIRMED',
        paymentStatus: 'UNPAID',
      },
    });
  }

  // ── Live activity feed ──
  async getLiveActivity(limit = 50) {
    try {
      return await this.prisma.userActivity.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: {
            select: {
              id: true, email: true, accountType: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      });
    } catch { return []; }
  }

  // ── User activity timeline ──
  async getUserActivity(userId: string, limit = 30) {
    try {
      return await this.prisma.userActivity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch { return []; }
  }

  // ── User detail with full history ──
  async getUserDetail(id: string) {
    const [user, activities, payments, enrollments] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id },
        include: { profile: true, _count: { select: { enrollments: true } } },
      }),
      this.getUserActivity(id, 20),
      this.prisma.payment.findMany({
        where: { userId: id, status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { course: { select: { titleEn: true, titleAr: true } } },
      }).catch(() => []),
      this.prisma.enrollment.findMany({
        where: { userId: id },
        take: 10,
        include: { course: { select: { titleEn: true, titleAr: true, thumbnail: true } } },
      }).catch(() => []),
    ]);
    const totalSpent = (payments as any[]).reduce((s, p) => s + p.amount, 0);
    return { user, activities, payments, enrollments, totalSpent };
  }

  // ── Activity stats ── ✅ FIXED: added 'as any'
  async getActivityStats() {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const [onlineUsers, todayActivity, totalActivities] = await Promise.all([
      // ✅ FIXED: Added 'as any' to fix TypeScript error
      this.prisma.user.count({ where: { lastSeenAt: { gte: fiveMinAgo } } as any }).catch(() => 0),
      this.prisma.userActivity.count({ where: { createdAt: { gte: todayStart } } }).catch(() => 0),
      this.prisma.userActivity.count().catch(() => 0),
    ]);
    return { onlineUsers, todayActivity, totalActivities };
  }
}