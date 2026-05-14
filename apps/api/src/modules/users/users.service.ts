import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { User, UserProfile, Enrollment, Certificate, Notification, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as AWS from 'aws-sdk';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly s3: AWS.S3;
  private readonly cacheTtlMs = 30_000;
  private readonly cache = new Map<string, { expiresAt: number; data: any }>();

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // Initialize AWS S3
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get('AWS_REGION'),
    });
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        accountType: true,
        createdAt: true,
        isVerified: true,
        profile: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
            bio: true,
            speciality: true,
            country: true,
            linkedinUrl: true,
          },
        },
        instructorCourses: {
          where: { status: 'PUBLISHED' },
          select: {
            id: true,
            titleAr: true,
            titleEn: true,
            thumbnail: true,
            price: true,
            type: true,
            _count: { select: { enrollments: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
        _count: {
          select: { instructorCourses: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const courses = user.instructorCourses;
    const totalStudents = courses.reduce(
      (sum, c) => sum + (c._count?.enrollments || 0), 0
    );

    return {
      success: true,
      data: {
        id: user.id,
        accountType: user.accountType,
        joinedAt: user.createdAt,
        isVerified: user.isVerified,
        profile: user.profile,
        stats: {
          totalCourses: user._count.instructorCourses,
          publishedCourses: courses.length,
          totalStudents,
        },
        courses,
      },
    };
  }

  async getUsers(filters: { role?: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'; limit?: number; search?: string }) {
    const where: Prisma.UserWhereInput = {};

    if (filters.role) {
      where.accountType = filters.role;
    }

    if (filters.search) {
      where.OR = [
        { email: { contains: filters.search } },
        { profile: { firstName: { contains: filters.search } } },
      ];
    }

    const users = await this.prisma.user.findMany({
      where,
      include: { profile: true },
      take: filters.limit || 100,
      orderBy: { createdAt: 'desc' },
    });

    return users.map(({ password, ...user }) => user);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, role: true, isActive: true, accountType: true,
        status: true, createdAt: true, updatedAt: true, isVerified: true,
        cvUrl: true, bio: true, experience: true, speciality: true,
        linkedinUrl: true, hourlyRate: true, meetingMethod: true,
        stripeCustomerId: true, approvedAt: true,
        profile: true,
        _count: {
          select: {
            enrollments: true,
            certificates: true,
            coachingSessions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updatedProfile = await this.prisma.transaction(async (tx) => {
      // Update user profile
      const profile = await tx.userProfile.update({
        where: { userId },
        data: {
          firstName: updateProfileDto.firstName || user.profile?.firstName,
          lastName: updateProfileDto.lastName || user.profile?.lastName,
          phone: updateProfileDto.phone,
          dateOfBirth: updateProfileDto.dateOfBirth,
          gender: updateProfileDto.gender,
          nationality: updateProfileDto.nationality,
          country: updateProfileDto.country,
          city: updateProfileDto.city,
          bio: updateProfileDto.bio,
          linkedinUrl: updateProfileDto.linkedinUrl,
          language: updateProfileDto.language,
          timezone: updateProfileDto.timezone,
        },
      });

      return profile;
    });

    this.logger.log(`Profile updated for user: ${user.email}`);

    return updatedProfile;
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Upload to S3 with sanitized filename (prevent path traversal)
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `avatars/${userId}/${Date.now()}-${safeName}`;
    const uploadResult = await this.s3.upload({
      Bucket: this.configService.get('AWS_S3_BUCKET'),
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }).promise();

    // Update user profile with avatar URL
    await this.prisma.userProfile.update({
      where: { userId },
      data: { avatar: uploadResult.Location },
    });

    this.logger.log(`Avatar uploaded for user: ${user.email}`);

    return uploadResult.Location;
  }

  async getDashboard(userId: string) {
    return this.getUserDashboard(userId);
  }

  async getUserDashboard(userId: string) {
    const cacheKey = `dashboard:${userId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const [user, enrollments, certificates, notifications] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              avatar: true,
              language: true,
              country: true,
            }
          }
        }
      }),
      (this.prisma).enrollment.findMany({
        where: { userId },
        take: 5,
        orderBy: { enrolledAt: 'desc' },
        select: {
          id: true,
          courseId: true,
          progress: true,
          status: true,
          enrolledAt: true,
          completedAt: true,
        }
      }),
      (this.prisma).certificate.findMany({
        where: { userId },
        take: 3,
        orderBy: { issuedAt: 'desc' },
        select: {
          id: true,
          serialNumber: true,
          issuedAt: true,
          courseId: true,
        }
      }),
      (this.prisma).notification.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          titleEn: true,
          titleAr: true,
          isRead: true,
          createdAt: true,
        }
      }),
    ])

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const data = {
      success: true,
      data: {
        user,
        stats: {
          enrolledCourses: enrollments.length,
          certificates: certificates.length,
          unreadNotifications: notifications.filter((n: any) => !n.isRead).length,
        },
        recentEnrollments: enrollments,
        recentCertificates: certificates,
        notifications,
      }
    }

    this.cache.set(cacheKey, {
      expiresAt: Date.now() + this.cacheTtlMs,
      data,
    });

    return data;
  }

  async getEnrollments(userId: string, options: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(status && { status: status as any }),
    };

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        include: {
          course: {
            include: {
              careerPath: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      enrollments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getCertificates(userId: string, options: { page: number; limit: number }) {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const [certificates, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              careerPath: true,
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.certificate.count({ where: { userId } }),
    ]);

    return {
      certificates,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getProgress(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                lessons: true,
              },
            },
          },
        },
      },
    });

    const progress = enrollments.map(enrollment => {
      const totalLessons = enrollment.course.modules.reduce(
        (total, module) => total + module.lessons.length,
        0
      );

      return {
        courseId: enrollment.courseId,
        courseTitle: (enrollment.course as any).titleEn,
        progress: enrollment.progress,
        totalLessons,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        status: enrollment.status,
      };
    });

    return {
      overallProgress: this.calculateOverallProgress(enrollments),
      courses: progress,
    };
  }

  async getAchievements(userId: string) {
    // Mock achievements - in a real app, this would be based on actual user activity
    const achievements = [
      {
        id: 'first_course',
        title: 'First Course Completed',
        description: 'Completed your first course',
        icon: '🎓',
        earnedAt: new Date(),
      },
      {
        id: 'week_streak',
        title: '7-Day Streak',
        description: 'Learned for 7 consecutive days',
        icon: '🔥',
        earnedAt: new Date(),
      },
      {
        id: 'quiz_master',
        title: 'Quiz Master',
        description: 'Scored 100% on 5 quizzes',
        icon: '🏆',
        earnedAt: new Date(),
      },
    ];

    return achievements;
  }

  async getNotifications(userId: string, options: { page: number; limit: number; unread?: boolean }) {
    const { page, limit, unread } = options;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(unread && { isRead: false }),
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async markNotificationsRead(userId: string, notificationIds: string[]) {
    await this.prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId,
      },
      data: { isRead: true },
    });

    this.logger.log(`Marked ${notificationIds.length} notifications as read for user: ${userId}`);
  }

  async getSettings(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      language: user.profile?.language || 'en',
      timezone: user.profile?.timezone || 'UTC',
      emailNotifications: true, // Default values
      pushNotifications: true,
      theme: 'light',
    };
  }

  async updateSettings(userId: string, settings: {
    language?: string;
    timezone?: string;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  }) {
    await this.prisma.userProfile.update({
      where: { userId },
      data: {
        language: settings.language,
        timezone: settings.timezone,
      },
    });

    this.logger.log(`Settings updated for user: ${userId}`);

    return settings;
  }

  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    // Soft delete user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Account deleted for user: ${user.email}`);
  }

  async getStats(userId: string) {
    const [
      totalEnrollments,
      completedCourses,
      totalCertificates,
      totalLearningTime,
      upcomingSessions,
    ] = await Promise.all([
      this.prisma.enrollment.count({
        where: { userId },
      }),
      this.prisma.enrollment.count({
        where: { userId, status: 'COMPLETED' },
      }),
      this.prisma.certificate.count({
        where: { userId },
      }),
      this.prisma.lessonProgress.aggregate({
        where: { userId },
        _sum: { timeSpent: true },
      }),
      this.prisma.coachingSession.count({
        where: {
          userId,
          status: 'SCHEDULED',
          startTime: { gt: new Date() },
        },
      }),
    ]);

    return {
      totalEnrollments,
      completedCourses,
      totalCertificates,
      totalLearningTime: totalLearningTime._sum.timeSpent || 0,
      upcomingSessions,
      completionRate: totalEnrollments > 0 ? (completedCourses / totalEnrollments) * 100 : 0,
    };
  }

  private sanitizeUser(user: any) {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  private calculateOverallProgress(enrollments: Enrollment[]) {
    if (enrollments.length === 0) return 0;

    const totalProgress = enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0);
    return totalProgress / enrollments.length;
  }

  private async getUserStats(userId: string) {
    const [
      enrollmentsCount,
      certificatesCount,
      sessionsCount,
      assessmentsCount,
    ] = await Promise.all([
      this.prisma.enrollment.count({ where: { userId } }),
      this.prisma.certificate.count({ where: { userId } }),
      this.prisma.coachingSession.count({ where: { userId } }),
      this.prisma.careerAssessment.count({ where: { userId } }),
    ]);

    return {
      enrollments: enrollmentsCount,
      certificates: certificatesCount,
      sessions: sessionsCount,
      assessments: assessmentsCount,
    };
  }

  private async getRecentActivity(userId: string) {
    // Get recent activities across different entities
    const activities = [];

    // Recent enrollments
    const recentEnrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      select: {
        enrolledAt: true,
        course: {
          select: {
            titleEn: true,
            titleAr: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
      take: 3,
    });

    recentEnrollments.forEach(enrollment => {
      activities.push({
        type: 'enrollment',
        title: `Enrolled in ${enrollment.course.titleEn}`,
        timestamp: enrollment.enrolledAt,
      });
    });

    // Recent lesson completions
    const recentProgress = await this.prisma.lessonProgress.findMany({
      where: { userId, status: 'COMPLETED' },
      select: {
        completedAt: true,
        lesson: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
      take: 3,
    });

    recentProgress.forEach(progress => {
      activities.push({
        type: 'lesson_completion',
        title: `Completed: ${progress.lesson.title}`,
        timestamp: progress.completedAt,
      });
    });

    // Sort by timestamp
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);
  }

  private async getRecommendations(userId: string) {
    // Mock recommendations - in a real app, this would use AI/ML
    const recommendations = [
      {
        type: 'course',
        title: 'Advanced React Patterns',
        description: 'Take your React skills to the next level',
        imageUrl: 'https://example.com/course1.jpg',
        url: '/courses/advanced-react',
      },
      {
        type: 'career_path',
        title: 'Full Stack Development',
        description: 'Complete career path for becoming a full stack developer',
        imageUrl: 'https://example.com/career1.jpg',
        url: '/careers/full-stack',
      },
      {
        type: 'coaching',
        title: '1-on-1 Career Coaching',
        description: 'Get personalized guidance from industry experts',
        imageUrl: 'https://example.com/coaching1.jpg',
        url: '/coaching/book',
      },
    ];

    return recommendations;
  }
}
