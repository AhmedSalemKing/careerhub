import {
  Injectable,
  Logger,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { sendNotification } from '../../common/utils/notify.util';

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

  // ═══════════════════════════════════════════════════════════════════
  // 🎯 CREATE COURSE (ADMIN FULL VERSION) - With Sections & Instructor
  // ═══════════════════════════════════════════════════════════════════
  
  async createCourseAdminFull(courseData: any, adminId?: string) {
    this.logger.log(`[Admin] Creating course FULL: ${courseData.titleEn}`);

    try {
      // 1. Generate unique slug
      const baseSlug = (courseData.titleEn || courseData.title || 'course')
        .toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const slug = `${baseSlug}-${Date.now()}`;

      // 2. Determine & validate instructor
      let instructorId: string | undefined;
      if (courseData.isInstructor === true || courseData.isInstructor === 'true') {
        instructorId = adminId;
      } else if (courseData.instructorId) {
        instructorId = courseData.instructorId;
      } else {
        instructorId = adminId;
      }

      // Verify instructor exists, fallback to any admin
      if (instructorId) {
        const exists = await this.prisma.user.findUnique({ where: { id: instructorId }, select: { id: true } }).catch(() => null);
        if (!exists) {
          this.logger.warn(`[Admin] Instructor ${instructorId} not found, looking for fallback admin`);
          const fallback = await this.prisma.user.findFirst({ where: { accountType: 'ADMIN' }, select: { id: true } }).catch(() => null);
          instructorId = fallback?.id || undefined;
        }
      }

      this.logger.log(`[Admin] Course instructor: ${instructorId}`);

      // 3. Validate status against CourseStatus enum
      const validStatuses = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
      let status = courseData.status === 'APPROVED' ? 'PUBLISHED' : (courseData.status || 'DRAFT');
      if (!validStatuses.includes(status)) status = 'PUBLISHED';

      // 4. Create the course
      const sanitizeId = (val: any): string | null => {
        if (!val) return null;
        if (val === 'null' || val === 'undefined' || val === '') return null;
        if (typeof val === 'string' && val.length > 5) return val;
        return null;
      };

      const course = await this.prisma.course.create({
        data: {
          slug,
          titleEn: courseData.titleEn || 'Untitled Course',
          titleAr: courseData.titleAr || courseData.titleEn || '',
          descriptionEn: courseData.descriptionEn || '',
          descriptionAr: courseData.descriptionAr || courseData.descriptionEn || '',
          price: parseFloat(String(courseData.price || 0)),
          currency: courseData.currency || 'SAR',
          duration: parseInt(String(courseData.duration || 0)) || undefined,
          level: courseData.level || 'BEGINNER',
          status: status as any,
          thumbnail: courseData.thumbnail || null,
          previewVideo: courseData.previewVideo || null,
          instructorId: sanitizeId(instructorId),
          careerPathId: sanitizeId(courseData.careerPathId),
          categoryId: sanitizeId(courseData.categoryId),
        },
      });

      this.logger.log(`[Admin] Course created with ID: ${course.id}`);

      // 5. Create Sections if provided
      if (courseData.sections && Array.isArray(courseData.sections) && courseData.sections.length > 0) {
        const validSections = courseData.sections.filter((s: any) => s.title && s.title.trim());

        if (validSections.length > 0) {
          this.logger.log(`[Admin] Creating ${validSections.length} sections...`);

          try {
            await this.prisma.courseModule.create({
              data: { courseId: course.id, titleEn: courseData.titleEn || 'Course Content', titleAr: courseData.titleAr || 'محتوى الكورس', sortOrder: 1, isPublished: true },
            });
          } catch (e) {
            this.logger.warn(`Could not create module: ${e}`);
          }

          for (let i = 0; i < validSections.length; i++) {
            try {
              await this.prisma.section.create({
                data: { courseId: course.id, title: validSections[i].title, order: i + 1 },
              });
            } catch (e) {
              this.logger.warn(`Failed to create section "${validSections[i].title}": ${e}`);
            }
          }
        }
      }

      // 6. Notify instructor (if not the admin)
      if (instructorId && instructorId !== adminId) {
        try {
          await this.notificationsService.createNotification({
            userId: instructorId,
            type: 'SYSTEM_ANNOUNCEMENT',
            titleEn: 'New Course Assigned to You',
            titleAr: 'تم تعيين كورس جديد لك',
            contentEn: `An admin has created a course "${courseData.titleEn}" and assigned it to you.`,
            contentAr: `قام الأدمن بإنشاء كورس "${courseData.titleAr || courseData.titleEn}" وتعيينه لك.`,
            data: { type: 'course_assigned', courseId: course.id },
          }).catch(() => {});
        } catch (e) {
          this.logger.warn(`Failed to create notification: ${e}`);
        }
      }

      // 7. Audit log
      await this.log('CREATE_COURSE', 'Course', course.id, adminId, {
        title: courseData.titleEn, instructorId, status,
      });

      // 8. Return full course with relations
      let fullCourse: any;
      try {
        fullCourse = await this.prisma.course.findUnique({
          where: { id: course.id },
          include: {
            instructor: { select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } },
            careerPath: true,
            category: true,
            sections: { orderBy: { order: 'asc' }, include: { _count: { select: { lessons: true } } } },
            _count: { select: { enrollments: true, sections: true } },
          },
        });
      } catch (e) {
        this.logger.warn(`Could not fetch full course: ${e}`);
        fullCourse = course;
      }

      this.logger.log(`[Admin] Course created successfully: ${course.id}`);
      return fullCourse;
    } catch (e: any) {
      this.logger.error(`[createCourseAdminFull] Prisma error: ${e.code} ${e.message}`, e.meta || e.stack);
      throw e;
    }
  }

  // ── Create Course WITH Uploads (Thumbnail + Videos) ──
  async createCourseWithUploads(courseData: any, files: Express.Multer.File[], adminId?: string) {
    const baseSlug = (courseData.titleEn || courseData.title || 'course')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now()}`;
    
    // Determine instructor: Admin themselves OR selected instructor
    const instructorId = courseData.isInstructor 
      ? adminId  // Admin is the instructor!
      : (courseData.instructorId || adminId || undefined);

    // Separate images from videos
    const imageFiles = files.filter(f => f.mimetype.startsWith('image/'));
    const videoFiles = files.filter(f => f.mimetype.startsWith('video/'));

    // Get thumbnail URL (first image or null)
    let thumbnailUrl: string | null = null;
    if (imageFiles.length > 0) {
      thumbnailUrl = `/uploads/admin/${imageFiles[0].filename}`;
    } else if (courseData.thumbnail) {
      thumbnailUrl = courseData.thumbnail;
    }

    // Create the course first ✅ مصحح
    const sanitizeId = (val: any): string | null => {
      if (!val) return null;
      if (val === 'null' || val === 'undefined' || val === '') return null;
      if (typeof val === 'string' && val.length > 5) return val;
      return null;
    };

    const course = await this.prisma.course.create({
      data: {
        slug,
        titleEn: courseData.titleEn || courseData.title || 'Untitled',
        titleAr: courseData.titleAr,
        descriptionEn: courseData.descriptionEn || courseData.description,
        descriptionAr: courseData.descriptionAr,
        price: parseFloat(courseData.price) || 0,
        currency: courseData.currency || 'USD',
        duration: courseData.duration ? parseInt(courseData.duration) : undefined,
        level: courseData.level || 'BEGINNER',
        status: (courseData.status === 'APPROVED' ? 'PUBLISHED' : courseData.status || 'PUBLISHED') as any,
        thumbnail: thumbnailUrl,
        instructorId: sanitizeId(instructorId),
        careerPathId: sanitizeId(courseData.careerPathId),
        categoryId: sanitizeId(courseData.categoryId),
      },
    });

    // If there are videos, create lessons for them
    if (videoFiles.length > 0 && course) {
      // Create a default section for the course ✅ مصحح
      let section: any;
      try {
        section = await this.prisma.section.create({
          data: {
            title: courseData.titleEn || 'Main Content',
            order: 1,
            courseId: course.id,
          },
        });
      } catch (e) {
        this.logger.warn(`Could not create section: ${e}`);
      }

      // Create a module for the course (optional)
      try {
        await this.prisma.courseModule.create({
          data: {
            courseId: course.id,
            titleEn: courseData.titleEn || 'Course Content',
            titleAr: courseData.titleAr || 'محتوى الكورس',
            sortOrder: 1,
            isPublished: true,
          },
        });
      } catch (e) {
        // Module may not exist in schema
        this.logger.warn(`Could not create module: ${e}`);
      }

      // Create lessons from videos
      const videoTitles = courseData.videoTitles || [];
      for (let i = 0; i < videoFiles.length; i++) {
        const videoFile = videoFiles[i];
        const lessonTitle = videoTitles[i] || `Lesson ${i + 1}`;
        
        try {
          // Create lesson ✅ مصحح - بدون sectionId إذا لم يكن موجوداً
          const lessonData: any = {
            title: lessonTitle,
            titleAr: lessonTitle,
            type: 'VIDEO',
            videoUrl: `/uploads/admin/${videoFile.filename}`,
            fileName: videoFile.originalname,
            fileSize: videoFile.size,
            isPublished: true,
            order: i + 1,
          };

          // Add moduleId and sectionId only if they exist
          if (section) {
            lessonData.sectionId = section.id;
          }

          const lesson = await this.prisma.lesson.create({
            data: lessonData,
          });

          // Create VideoContent record (if exists)
          try {
            await this.prisma.videoContent.create({
              data: {
                lessonId: lesson.id,
                streamId: `admin-upload-${Date.now()}-${i}`,
                playbackUrl: `/uploads/admin/${videoFile.filename}`,
                thumbnail: thumbnailUrl || null,
                duration: 0, // Will be processed later
                status: 'READY',
              },
            });
          } catch (e) {
            this.logger.warn(`Could not create videoContent: ${e}`);
          }
        } catch (e) {
          this.logger.warn(`Failed to create lesson ${i}: ${e}`);
        }
      }
    }

    return course;
  }

  // ── Create Session WITH Image ──
  async createSessionWithImage(data: any, image?: Express.Multer.File) {
    const sessionData: any = {
      studentId: data.studentId,
      consultantId: data.consultantId,
      scheduledAt: new Date(data.scheduledAt),
      topic: data.topic || '',
      meetingType: data.meetingMethod || data.meetingType || 'ONLINE',
      price: Number(data.price) || 0,
      duration: data.duration || 60,
      status: 'CONFIRMED',
      paymentStatus: 'UNPAID',
    };

    // Add image URL if provided
    if (image) {
      sessionData.imageUrl = `/uploads/admin/${image.filename}`;
    }

    return this.prisma.consultingSession.create({
      data: sessionData,
    });
  }

  // ── Get ONLY Confirmed Payments (for Revenue) ──
  async getAllConfirmedPayments() {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: { in: ['SUCCESS', 'COMPLETED'] },  // ✅ Only confirmed payments!
      },
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
    
    // Calculate total from confirmed payments ONLY
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    
    return { success: true, data: payments, total };
  }

  // ─────────────────────────────────────────────────────────────────────
  // 📊 DASHBOARD & STATISTICS
  // ─────────────────────────────────────────────────────────────────────
  
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

    // Total revenue (all time) - ONLY confirmed
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

  // ─────────────────────────────────────────────────────────────────────
  // 👥 USER MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────

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

  async deleteUser(userId: string) {
    try {
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "notifications" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "lesson_progress" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "enrollments" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "certificates" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "payments" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "consulting_sessions" WHERE "studentId" = '${userId}' OR "consultantId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "coaching_sessions" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "sessions" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "cart_items" WHERE "cartId" IN (SELECT id FROM "carts" WHERE "userId" = '${userId}');
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "carts" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "chat_messages" WHERE "senderId" = '${userId}' OR "receiverId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "coach_reviews" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "quiz_attempts" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "user_activities" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "analytics_events" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "device_tokens" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "file_shares" WHERE "uploadedById" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "uploaded_files" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "audit_logs" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "admin_logs" WHERE "adminId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "ai_messages" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "career_assessments" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "assessment_sessions" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "user_career_paths" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        UPDATE "Course" SET "instructorId" = NULL WHERE "instructorId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "user_profiles" WHERE "userId" = '${userId}';
      `).catch(() => {})
      await this.prisma.$executeRawUnsafe(`
        DELETE FROM "users" WHERE "id" = '${userId}';
      `)
      
      return { success: true, message: 'User deleted successfully' }
    } catch(e: any) {
      console.error('[DeleteUser]', e.message)
      throw new Error('Failed to delete user: ' + e.message)
    }
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

  // ─────────────────────────────────────────────────────────────────────
  // 🎓 COURSE MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────

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

  // ── Create Course (Simple/Base Version - for backward compatibility) ✅ مصحح
  async createCourse(courseData: any, adminId?: string) {
    const baseSlug = (courseData.titleEn || courseData.title || 'course')
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now()}`;
    const instructorId = courseData.instructorId || adminId || undefined;

    const sanitizeId = (val: any): string | null => {
      if (!val) return null;
      if (val === 'null' || val === 'undefined' || val === '') return null;
      if (typeof val === 'string' && val.length > 5) return val;
      return null;
    };

    return await this.prisma.course.create({
      data: {
        slug,
        titleEn: courseData.titleEn || courseData.title || 'Untitled',
        titleAr: courseData.titleAr,
        descriptionEn: courseData.descriptionEn || courseData.description,
        descriptionAr: courseData.descriptionAr,
        price: parseFloat(courseData.price) || 0,
        currency: courseData.currency || 'USD',
        duration: courseData.duration ? parseInt(String(courseData.duration)) : undefined,
        level: courseData.level || 'BEGINNER',
        status: (courseData.status === 'APPROVED' ? 'PUBLISHED' : courseData.status || 'DRAFT') as any,
        thumbnail: courseData.thumbnail || null,
        previewVideo: courseData.previewVideo || null,
        instructorId: sanitizeId(instructorId),
        careerPathId: sanitizeId(courseData.careerPathId),
        categoryId: sanitizeId(courseData.categoryId),
      },
    });
  }

  async getPendingCourses() {
    try {
      const courses = await this.prisma.course.findMany({
        where: { status: 'PENDING_REVIEW' },
        include: {
          instructor: {
            select: {
              id: true,
              email: true,
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
    } catch (e: any) {
      console.error('[AdminService] getPendingCourses error:', {
        message: e.message,
        code: e.code,
        meta: e.meta,
        stack: e.stack?.split('\n').slice(0, 3).join(' | '),
      });
      return { success: true, data: [] };
    }
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

  // ─────────────────────────────────────────────────────────────────────
  // 📝 CONTENT MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────
  // 📊 REPORTS & MODERATION
  // ─────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────
  // 📈 ANALYTICS
  // ─────────────────────────────────────────────────────────────────────

  async getRevenueAnalytics(startDate?: Date, endDate?: Date) {
    return this.analyticsService.getRevenueAnalytics();
  }

  async getEngagementAnalytics(startDate?: Date, endDate?: Date) {
    return this.analyticsService.getEngagementMetrics();
  }

  async getCourseAnalyticsAll() {
    return this.analyticsService.getCourseAnalytics("all");
  }

  // ─────────────────────────────────────────────────────────────────────
  // ⚙️ SYSTEM MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────
  // 🔔 NOTIFICATIONS
  // ─────────────────────────────────────────────────────────────────────

  async broadcastNotification(notificationData: any) {
    return await this.notificationsService.broadcastNotification(notificationData);
  }

  async getNotificationTemplates() {
    return this.notificationsService.getNotificationTemplates();
  }

  // ─────────────────────────────────────────────────────────────────────
  // 📤 EXPORT & IMPORT
  // ─────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────
  // 🔒 SECURITY & AUDIT
  // ─────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────
  // 📋 AUDIT LOG (Private Methods)
  // ─────────────────────────────────────────────────────────────────────

  private async log(
    action: string,
    entityType: string,
    entityId: string,
    adminId?: string,
    details?: any,
  ) {
    try {
      await (this.prisma).auditLog.create({
        data: { action, entityType, entityId, adminId: adminId ?? null, details: details ?? null },
      });
    } catch (e) {
      this.logger.warn(`AuditLog write failed: ${e}`);
    }
  }

  async getAuditLogs(limit = 50) {
    return (this.prisma).auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // ✅ APPROVAL SYSTEM
  // ─────────────────────────────────────────────────────────────────────

  async getPendingApprovals() {
    try {
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
    } catch (e: any) {
      console.error('[AdminService] getPendingApprovals error:', {
        message: e.message,
        code: e.code,
        meta: e.meta,
        stack: e.stack?.split('\n').slice(0, 3).join(' | '),
      });
      return [];
    }
  }

  async getDashboardStats() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const results = await Promise.allSettled([
        this.prisma.user.count({ where: { accountType: { notIn: ['ADMIN', 'SUPER_ADMIN'] } } }),
        this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.user.count({ where: { status: 'PENDING' } }),
        this.prisma.payment.findMany({ where: { status: 'SUCCESS' }, select: { amount: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
        this.prisma.consultingSession.findMany({ where: { paymentStatus: 'PAID' }, select: { createdAt: true }, orderBy: { createdAt: 'desc' } }),
        this.prisma.user.findMany({
          where: { accountType: { notIn: ['ADMIN', 'SUPER_ADMIN'] } },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, email: true, accountType: true, status: true, createdAt: true, profile: { select: { firstName: true, lastName: true, avatar: true } } },
        }),
      ]);

      const val = <T>(r: PromiseSettledResult<T>, fallback: T): T => {
        if (r.status === 'fulfilled') return r.value;
        this.logger.error(`[getDashboardStats] Query failed: ${(r as PromiseRejectedResult).reason?.message}`);
        return fallback;
      };

      const totalUsers = val(results[0], 0);
      const totalCourses = val(results[1], 0);
      const pendingUsers = val(results[2], 0);
      const allPayments = val(results[3], [] as { amount: number; createdAt: Date }[]);
      const allPaidSessions = val(results[4], [] as { createdAt: Date }[]);
      const recentUsers = val(results[5], []);

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
          .filter(p => { const pd = new Date(p.createdAt); return pd >= d && pd < end; })
          .map(p => Number(p.amount) || 0).reduce((a, b) => a + b, 0);
        monthlyChart.push({
          month: d.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }),
          revenue: rev,
        });
      }

      return { totalUsers, totalCourses, pendingUsers, totalRevenue, monthlyRevenue, todayRevenue, recentUsers, monthlyChart };
    } catch (e: any) {
      console.error('[AdminService] getDashboardStats error:', {
        message: e.message,
        code: e.code,
        meta: e.meta,
        stack: e.stack?.split('\n').slice(0, 3).join(' | '),
      });
      return { totalUsers: 0, totalCourses: 0, pendingUsers: 0, totalRevenue: 0, monthlyRevenue: 0, todayRevenue: 0, recentUsers: [], monthlyChart: [] };
    }
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

  // ─────────────────────────────────────────────────────────────────────
  // 👤 USER APPROVAL & MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────

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
    await sendNotification(
      this.prisma,
      userId,
      'تم تعليق حسابك',
      'تم تعليق حسابك من منصة DeveWay. تواصل مع الدعم لمزيد من المعلومات.',
      'USER_BANNED'
    );
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

  // ─────────────────────────────────────────────────────────────────────
  // ⚙️ SITE SETTINGS
  // ─────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────
  // 💼 SESSIONS MANAGEMENT
  // ─────────────────────────────────────────────────────────────────────

  async getAllSessions() {
    const sessions = await this.prisma.consultingSession.findMany({
      include: {
        user: {
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
  async changeUserRole(id: string, accountType: string, adminId?: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { accountType: accountType as any },
      select: { id: true, email: true, accountType: true },
    });
    const roleNames: Record<string, string> = {
      STUDENT: 'طالب',
      INSTRUCTOR: 'محاضر',
      CONSULTANT: 'مستشار',
      ADMIN: 'مدير'
    };
    await sendNotification(
      this.prisma,
      user.id,
      `تم تغيير دورك إلى ${roleNames[accountType] || accountType}`,
      `تم تحديث دورك في المنصة إلى ${roleNames[accountType] || accountType}. ستجد خيارات جديدة في لوحة التحكم.`,
      'ROLE_CHANGED'
    );
    return user;
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
        meetingType: data.meetingMethod || data.meetingType || 'ONLINE',
        price: Number(data.price) || 0,
        duration: data.duration || 60,
        description: data.notes || '',
        ...(data.imageUrl && { imageUrl: data.imageUrl }),
        status: data.status || 'SCHEDULED',
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

  // ── Filtered activity with pagination ──
  async getFilteredActivity(opts: {
    type?: string; from?: string; to?: string; userId?: string;
    role?: string; search?: string; page: number; limit: number;
  }) {
    try {
      const where: any = {};
      if (opts.type) {
        const actions = opts.type.split(',').map((s: string) => s.trim()).filter(Boolean);
        if (actions.length === 1) where.action = actions[0];
        else where.action = { in: actions };
      }
      if (opts.userId) where.userId = opts.userId;
      if (opts.from || opts.to) {
        where.createdAt = {};
        if (opts.from) {
          const d = new Date(opts.from);
          where.createdAt.gte = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0));
        }
        if (opts.to) {
          const d = new Date(opts.to);
          where.createdAt.lte = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59));
        }
      }
      if (opts.search) {
        where.user = {
          OR: [
            { email: { contains: opts.search, mode: 'insensitive' } },
            { profile: { firstName: { contains: opts.search, mode: 'insensitive' } } },
            { profile: { lastName: { contains: opts.search, mode: 'insensitive' } } },
          ],
        };
      }
      if (opts.role) {
        where.user = { ...where.user, accountType: opts.role };
      }

      const [items, total] = await Promise.all([
        this.prisma.userActivity.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (opts.page - 1) * opts.limit,
          take: opts.limit,
          include: {
            user: {
              select: {
                id: true, email: true, accountType: true,
                profile: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
        }),
        this.prisma.userActivity.count({ where }),
      ]);

      return { items, total, page: opts.page, limit: opts.limit, totalPages: Math.ceil(total / opts.limit) };
    } catch { return { items: [], total: 0, page: opts.page, limit: opts.limit, totalPages: 0 }; }
  }

  // ── User activity timeline ──
  async getUserActivity(userId: string, filter: string = 'all') {
    try {
      const where: any = { userId }
      
      if (filter === '24h') {
        where.createdAt = { gte: new Date(Date.now() - 86400000) }
      } else if (filter === '7d') {
        where.createdAt = { gte: new Date(Date.now() - 604800000) }
      } else if (filter === '30d') {
        where.createdAt = { gte: new Date(Date.now() - 2592000000) }
      }

      return await this.prisma.userActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } catch (e: any) {
      console.error('[getUserActivity] Error:', e.message)
      return []
    }
  }

  // ── User financials ──
  async getUserFinancials(userId: string) {
    try {
      const [user, enrollments, payments] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          include: { profile: true }
        }),
        this.prisma.enrollment.findMany({
          where: { userId },
          include: { course: { select: { id: true, titleAr: true, titleEn: true, thumbnail: true, price: true } } },
          take: 20,
        }),
        this.prisma.payment.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        }),
      ])
      
      const totalSpent = (payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0)
      
      let totalEarnings = 0
      if (user?.accountType === 'INSTRUCTOR') {
        const courses = await this.prisma.course.findMany({
          where: { instructorId: userId },
          select: { id: true }
        }).catch(() => [])
        
        if (courses.length > 0) {
          const earnings = await this.prisma.payment.aggregate({
            where: { courseId: { in: courses.map(c => c.id) } },
            _sum: { amount: true }
          }).catch(() => ({ _sum: { amount: 0 } }))
          totalEarnings = Number(earnings._sum?.amount) || 0
        }
      }
      
      const walletTx = await this.prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }).catch(() => [])
      
      return {
        success: true,
        data: {
          user,
          totalSpent,
          totalEarnings,
          paymentsCount: (payments || []).length,
          enrollmentsCount: (enrollments || []).length,
          enrollments: enrollments || [],
          walletBalance: user?.walletBalance || 0,
          recentPayments: (payments || []).slice(0, 5),
          walletTransactions: walletTx,
        }
      }
    } catch(e) {
      console.error('[getUserFinancials]', e.message)
      return { success: true, data: {} }
    }
  }

  // ── User detail with full history ──
  async getUserDetail(id: string) {
    const [user, activities, payments, enrollments] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id },
        include: { profile: true, _count: { select: { enrollments: true } } },
      }),
      this.getUserActivity(id, 'all'),
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

  // ── Activity stats ──
  async getActivityStats() {
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    const [activeUsers, loginsToday, enrollmentsToday, sessionsToday] = await Promise.all([
      this.prisma.userActivity.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
        _count: { userId: true },
      }).then(r => r.length).catch(() => 0),
      this.prisma.userActivity.count({
        where: { action: 'LOGIN', createdAt: { gte: todayStart, lte: todayEnd } },
      }).catch(() => 0),
      this.prisma.enrollment.count({
        where: { enrolledAt: { gte: todayStart, lte: todayEnd } },
      }).catch(() => 0),
      this.prisma.consultingSession.count({
        where: { createdAt: { gte: todayStart, lte: todayEnd } },
      }).catch(() => 0),
    ]);

    const [todayActivity, totalActivities] = await Promise.all([
      this.prisma.userActivity.count({ where: { createdAt: { gte: todayStart } } }).catch(() => 0),
      this.prisma.userActivity.count().catch(() => 0),
    ]);

    return {
      onlineUsers: activeUsers,
      todayActivity,
      totalActivities,
      todayEnrollments: enrollmentsToday,
      todaySessions: sessionsToday,
    };
  }
}