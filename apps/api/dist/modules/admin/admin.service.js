"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const analytics_service_1 = require("../analytics/analytics.service");
const notifications_service_1 = require("../notifications/notifications.service");
const email_service_1 = require("../email/email.service");
let AdminService = AdminService_1 = class AdminService {
    constructor(prisma, configService, analyticsService, notificationsService, emailService) {
        this.prisma = prisma;
        this.configService = configService;
        this.analyticsService = analyticsService;
        this.notificationsService = notificationsService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async createCourseAdminFull(courseData, adminId) {
        this.logger.log(`[Admin] Creating course FULL: ${courseData.titleEn}`);
        try {
            const baseSlug = (courseData.titleEn || courseData.title || 'course')
                .toLowerCase()
                .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
                .replace(/(^-|-$)/g, '');
            const slug = `${baseSlug}-${Date.now()}`;
            let instructorId;
            if (courseData.isInstructor === true || courseData.isInstructor === 'true') {
                instructorId = adminId;
            }
            else if (courseData.instructorId) {
                instructorId = courseData.instructorId;
            }
            else {
                instructorId = adminId;
            }
            if (instructorId) {
                const exists = await this.prisma.user.findUnique({ where: { id: instructorId }, select: { id: true } }).catch(() => null);
                if (!exists) {
                    this.logger.warn(`[Admin] Instructor ${instructorId} not found, looking for fallback admin`);
                    const fallback = await this.prisma.user.findFirst({ where: { accountType: 'ADMIN' }, select: { id: true } }).catch(() => null);
                    instructorId = (fallback === null || fallback === void 0 ? void 0 : fallback.id) || undefined;
                }
            }
            this.logger.log(`[Admin] Course instructor: ${instructorId}`);
            const validStatuses = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
            let status = courseData.status === 'APPROVED' ? 'PUBLISHED' : (courseData.status || 'DRAFT');
            if (!validStatuses.includes(status))
                status = 'PUBLISHED';
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
                    status: status,
                    thumbnail: courseData.thumbnail || null,
                    previewVideo: courseData.previewVideo || null,
                    ...(instructorId && { instructorId }),
                    ...(courseData.careerPathId && { careerPathId: courseData.careerPathId }),
                    ...(courseData.categoryId && { categoryId: courseData.categoryId }),
                },
            });
            this.logger.log(`[Admin] Course created with ID: ${course.id}`);
            if (courseData.sections && Array.isArray(courseData.sections) && courseData.sections.length > 0) {
                const validSections = courseData.sections.filter((s) => s.title && s.title.trim());
                if (validSections.length > 0) {
                    this.logger.log(`[Admin] Creating ${validSections.length} sections...`);
                    try {
                        await this.prisma.courseModule.create({
                            data: { courseId: course.id, titleEn: courseData.titleEn || 'Course Content', titleAr: courseData.titleAr || 'محتوى الكورس', sortOrder: 1, isPublished: true },
                        });
                    }
                    catch (e) {
                        this.logger.warn(`Could not create module: ${e}`);
                    }
                    for (let i = 0; i < validSections.length; i++) {
                        try {
                            await this.prisma.section.create({
                                data: { courseId: course.id, title: validSections[i].title, order: i + 1 },
                            });
                        }
                        catch (e) {
                            this.logger.warn(`Failed to create section "${validSections[i].title}": ${e}`);
                        }
                    }
                }
            }
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
                    }).catch(() => { });
                }
                catch (e) {
                    this.logger.warn(`Failed to create notification: ${e}`);
                }
            }
            await this.log('CREATE_COURSE', 'Course', course.id, adminId, {
                title: courseData.titleEn, instructorId, status,
            });
            let fullCourse;
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
            }
            catch (e) {
                this.logger.warn(`Could not fetch full course: ${e}`);
                fullCourse = course;
            }
            this.logger.log(`[Admin] Course created successfully: ${course.id}`);
            return fullCourse;
        }
        catch (e) {
            this.logger.error(`[createCourseAdminFull] Prisma error: ${e.code} ${e.message}`, e.meta || e.stack);
            throw e;
        }
    }
    async createCourseWithUploads(courseData, files, adminId) {
        const baseSlug = (courseData.titleEn || courseData.title || 'course')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const slug = `${baseSlug}-${Date.now()}`;
        const instructorId = courseData.isInstructor
            ? adminId
            : (courseData.instructorId || adminId || undefined);
        const imageFiles = files.filter(f => f.mimetype.startsWith('image/'));
        const videoFiles = files.filter(f => f.mimetype.startsWith('video/'));
        let thumbnailUrl = null;
        if (imageFiles.length > 0) {
            thumbnailUrl = `/uploads/admin/${imageFiles[0].filename}`;
        }
        else if (courseData.thumbnail) {
            thumbnailUrl = courseData.thumbnail;
        }
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
                status: (courseData.status === 'APPROVED' ? 'PUBLISHED' : courseData.status || 'PUBLISHED'),
                thumbnail: thumbnailUrl,
                ...(courseData.careerPathId && { careerPathId: courseData.careerPathId }),
                ...(instructorId && { instructorId }),
                ...(courseData.categoryId && { categoryId: courseData.categoryId }),
            },
        });
        if (videoFiles.length > 0 && course) {
            let section;
            try {
                section = await this.prisma.section.create({
                    data: {
                        title: courseData.titleEn || 'Main Content',
                        order: 1,
                        courseId: course.id,
                    },
                });
            }
            catch (e) {
                this.logger.warn(`Could not create section: ${e}`);
            }
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
            }
            catch (e) {
                this.logger.warn(`Could not create module: ${e}`);
            }
            const videoTitles = courseData.videoTitles || [];
            for (let i = 0; i < videoFiles.length; i++) {
                const videoFile = videoFiles[i];
                const lessonTitle = videoTitles[i] || `Lesson ${i + 1}`;
                try {
                    const lessonData = {
                        title: lessonTitle,
                        titleAr: lessonTitle,
                        type: 'VIDEO',
                        videoUrl: `/uploads/admin/${videoFile.filename}`,
                        fileName: videoFile.originalname,
                        fileSize: videoFile.size,
                        isPublished: true,
                        order: i + 1,
                    };
                    if (section) {
                        lessonData.sectionId = section.id;
                    }
                    const lesson = await this.prisma.lesson.create({
                        data: lessonData,
                    });
                    try {
                        await this.prisma.videoContent.create({
                            data: {
                                lessonId: lesson.id,
                                streamId: `admin-upload-${Date.now()}-${i}`,
                                playbackUrl: `/uploads/admin/${videoFile.filename}`,
                                thumbnail: thumbnailUrl || null,
                                duration: 0,
                                status: 'READY',
                            },
                        });
                    }
                    catch (e) {
                        this.logger.warn(`Could not create videoContent: ${e}`);
                    }
                }
                catch (e) {
                    this.logger.warn(`Failed to create lesson ${i}: ${e}`);
                }
            }
        }
        return course;
    }
    async createSessionWithImage(data, image) {
        const sessionData = {
            studentId: data.studentId,
            consultantId: data.consultantId,
            scheduledAt: new Date(data.scheduledAt),
            topic: data.topic || '',
            meetingMethod: data.meetingMethod || 'ONLINE',
            price: Number(data.price) || 0,
            duration: data.duration || 60,
            status: 'CONFIRMED',
            paymentStatus: 'UNPAID',
        };
        if (image) {
            sessionData.imageUrl = `/uploads/admin/${image.filename}`;
        }
        return this.prisma.consultingSession.create({
            data: sessionData,
        });
    }
    async getAllConfirmedPayments() {
        const payments = await this.prisma.payment.findMany({
            where: {
                status: { in: ['SUCCESS', 'COMPLETED'] },
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
        const total = payments.reduce((sum, p) => sum + p.amount, 0);
        return { success: true, data: payments, total };
    }
    async getDashboardOverview() {
        const [totalUsers, activeCourses, monthlyRevenue, pendingSessions, recentUsers, recentPayments,] = await Promise.all([
            this.prisma.user.count().catch(() => 0),
            this.prisma.course.count({ where: { status: 'PUBLISHED' } }).catch(() => 0),
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: { in: ['SUCCESS', 'COMPLETED'] },
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
        const now = new Date();
        const months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            return d;
        });
        const revenueLast12Months = await Promise.all(months.map(async (d) => {
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const result = await this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: { in: ['SUCCESS', 'COMPLETED'] },
                    createdAt: { gte: start, lte: end },
                },
            });
            return {
                month: d.toLocaleString('default', { month: 'short' }),
                revenue: result._sum.amount || 0,
            };
        }));
        const days = Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });
        const newUsersLast30Days = await Promise.all(days.map(async (d) => {
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
        }));
        const totalRevenueResult = await this.prisma.payment.aggregate({
            _sum: { amount: true },
            where: { status: { in: ['SUCCESS', 'COMPLETED'] } },
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
        const [totalUsers, totalCourses, totalSessions, revenueStats] = await Promise.all([
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
    async getUsers(options) {
        const where = {};
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
    async getUserDetails(id) {
        return await this.prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                enrollments: { include: { course: true }, take: 5, orderBy: { enrolledAt: 'desc' } },
                payments: { take: 5, orderBy: { createdAt: 'desc' } },
            },
        });
    }
    async getUserById(id) {
        return await this.prisma.user.findUnique({
            where: { id },
            include: { profile: true },
        });
    }
    async updateUser(id, updateData) {
        return await this.prisma.user.update({
            where: { id },
            data: updateData,
        });
    }
    async deleteUser(id) {
        return await this.prisma.user.delete({
            where: { id },
        });
    }
    async suspendUser(id, reason) {
        return await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async unsuspendUser(id) {
        return await this.prisma.user.update({
            where: { id },
            data: { isActive: true },
        });
    }
    async getAdminCourses(options) {
        const where = {};
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
    async createCourse(courseData, adminId) {
        const baseSlug = (courseData.titleEn || courseData.title || 'course')
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
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
                duration: courseData.duration ? parseInt(String(courseData.duration)) : undefined,
                level: courseData.level || 'BEGINNER',
                status: (courseData.status === 'APPROVED' ? 'PUBLISHED' : courseData.status || 'DRAFT'),
                thumbnail: courseData.thumbnail || null,
                previewVideo: courseData.previewVideo || null,
                ...(courseData.careerPathId && { careerPathId: courseData.careerPathId }),
                ...(instructorId && { instructorId }),
                ...(courseData.categoryId && { categoryId: courseData.categoryId }),
            },
        });
    }
    async getPendingCourses() {
        var _a;
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
        }
        catch (e) {
            console.error('[AdminService] getPendingCourses error:', {
                message: e.message,
                code: e.code,
                meta: e.meta,
                stack: (_a = e.stack) === null || _a === void 0 ? void 0 : _a.split('\n').slice(0, 3).join(' | '),
            });
            return { success: true, data: [] };
        }
    }
    async approveCourse(id) {
        var _a, _b;
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
            }).catch(() => { });
        }
        await this.log('APPROVE_COURSE', 'Course', id);
        if (course.instructorId) {
            const instructor = await this.prisma.user.findUnique({
                where: { id: course.instructorId },
                include: { profile: true },
            }).catch(() => null);
            if (instructor) {
                const name = `${((_a = instructor.profile) === null || _a === void 0 ? void 0 : _a.firstName) || ''} ${((_b = instructor.profile) === null || _b === void 0 ? void 0 : _b.lastName) || ''}`.trim() || instructor.email;
                this.emailService.sendCourseApproved(instructor.email, name, course.titleEn || course.titleAr).catch(() => { });
            }
        }
        return course;
    }
    async rejectCourse(id, reason) {
        const course = await this.prisma.course.update({
            where: { id },
            data: { status: 'REJECTED', updatedAt: new Date() },
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
            }).catch(() => { });
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
    async approveContent(id) {
        return { success: true, id };
    }
    async rejectContent(id, reason) {
        return { success: true, id, reason };
    }
    async getReports(options) {
        return {
            reports: [],
            total: 0,
            page: options.page,
            limit: options.limit,
        };
    }
    async resolveReport(id, resolutionData) {
        return { success: true, id, resolutionData };
    }
    async getRevenueAnalytics(startDate, endDate) {
        return this.analyticsService.getRevenueAnalytics();
    }
    async getEngagementAnalytics(startDate, endDate) {
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
    async getSystemLogs(level, limit) {
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
    async createBackup(backupData) {
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
    async restoreBackup(backupId) {
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
    async updateSettings(settingsData) {
        return { ...settingsData, updatedAt: new Date() };
    }
    async uploadLogo(file) {
        return {
            url: `/uploads/logo_${Date.now()}.${file.originalname.split('.').pop()}`,
            size: file.size,
            originalName: file.originalname,
        };
    }
    async broadcastNotification(notificationData) {
        return await this.notificationsService.broadcastNotification(notificationData);
    }
    async getNotificationTemplates() {
        return this.notificationsService.getNotificationTemplates();
    }
    async exportUsers(format) {
        const users = await this.prisma.user.findMany({
            include: { profile: true },
        });
        return { users, format };
    }
    async exportCourses(format) {
        const courses = await this.prisma.course.findMany({
            include: { careerPath: true },
        });
        return { courses, format };
    }
    async importUsers(file) {
        return {
            total: 0,
            imported: 0,
            failed: 0,
            errors: [],
        };
    }
    async getAuditLog(options) {
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
    async forcePasswordReset(data) {
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
    async revokeSession(sessionId) {
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
    async getRecentErrors(limit) {
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
    async log(action, entityType, entityId, adminId, details) {
        try {
            await this.prisma.auditLog.create({
                data: { action, entityType, entityId, adminId: adminId !== null && adminId !== void 0 ? adminId : null, details: details !== null && details !== void 0 ? details : null },
            });
        }
        catch (e) {
            this.logger.warn(`AuditLog write failed: ${e}`);
        }
    }
    async getAuditLogs(limit = 50) {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async getPendingApprovals() {
        var _a;
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
        }
        catch (e) {
            console.error('[AdminService] getPendingApprovals error:', {
                message: e.message,
                code: e.code,
                meta: e.meta,
                stack: (_a = e.stack) === null || _a === void 0 ? void 0 : _a.split('\n').slice(0, 3).join(' | '),
            });
            return [];
        }
    }
    async getDashboardStats() {
        var _a;
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const results = await Promise.allSettled([
                this.prisma.user.count({ where: { accountType: { notIn: ['ADMIN', 'SUPER_ADMIN'] } } }),
                this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
                this.prisma.user.count({ where: { status: 'PENDING' } }),
                this.prisma.payment.findMany({ where: { status: 'SUCCESS' }, select: { amount: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
                this.prisma.consultingSession.findMany({ where: { paymentStatus: 'PAID' }, select: { price: true, createdAt: true }, orderBy: { createdAt: 'desc' } }),
                this.prisma.user.findMany({
                    where: { accountType: { notIn: ['ADMIN', 'SUPER_ADMIN'] } },
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                    select: { id: true, email: true, accountType: true, status: true, createdAt: true, profile: { select: { firstName: true, lastName: true, avatar: true } } },
                }),
            ]);
            const val = (r, fallback) => {
                var _a;
                if (r.status === 'fulfilled')
                    return r.value;
                this.logger.error(`[getDashboardStats] Query failed: ${(_a = r.reason) === null || _a === void 0 ? void 0 : _a.message}`);
                return fallback;
            };
            const totalUsers = val(results[0], 0);
            const totalCourses = val(results[1], 0);
            const pendingUsers = val(results[2], 0);
            const allPayments = val(results[3], []);
            const allPaidSessions = val(results[4], []);
            const recentUsers = val(results[5], []);
            const toNum = (payments) => payments.map(p => Number(p.amount) || 0).reduce((a, b) => a + b, 0);
            const toNumS = (sessions) => sessions.map(s => Number(s.price) || 0).reduce((a, b) => a + b, 0);
            const totalRevenue = toNum(allPayments) + toNumS(allPaidSessions);
            const monthlyRevenue = toNum(allPayments.filter(p => new Date(p.createdAt) >= startOfMonth))
                + toNumS(allPaidSessions.filter(s => new Date(s.createdAt) >= startOfMonth));
            const todayRevenue = toNum(allPayments.filter(p => new Date(p.createdAt) >= startOfDay))
                + toNumS(allPaidSessions.filter(s => new Date(s.createdAt) >= startOfDay));
            const monthlyChart = [];
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
                const rev = allPayments
                    .filter(p => { const pd = new Date(p.createdAt); return pd >= d && pd < end; })
                    .map(p => Number(p.amount) || 0).reduce((a, b) => a + b, 0)
                    + allPaidSessions
                        .filter(s => { const sd = new Date(s.createdAt); return sd >= d && sd < end; })
                        .map(s => Number(s.price) || 0).reduce((a, b) => a + b, 0);
                monthlyChart.push({
                    month: d.toLocaleDateString('ar-SA', { month: 'short', year: '2-digit' }),
                    revenue: rev,
                });
            }
            return { totalUsers, totalCourses, pendingUsers, totalRevenue, monthlyRevenue, todayRevenue, recentUsers, monthlyChart };
        }
        catch (e) {
            console.error('[AdminService] getDashboardStats error:', {
                message: e.message,
                code: e.code,
                meta: e.meta,
                stack: (_a = e.stack) === null || _a === void 0 ? void 0 : _a.split('\n').slice(0, 3).join(' | '),
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
    async approveUser(userId, adminId) {
        var _a, _b, _c, _d;
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE', isActive: true, approvedAt: new Date() },
            include: { profile: true },
        });
        await this.notificationsService.createNotification({
            userId,
            type: 'SYSTEM_ANNOUNCEMENT',
            titleEn: 'Application Approved!',
            titleAr: 'تم قبول طلبك! 🎉',
            contentEn: `Congratulations ${((_a = user.profile) === null || _a === void 0 ? void 0 : _a.firstName) || ''}! Your account has been approved as ${user.accountType === 'INSTRUCTOR' ? 'an Instructor' : 'a Consultant'}. You can now log in and start using the platform.`,
            contentAr: `تهانينا ${((_b = user.profile) === null || _b === void 0 ? void 0 : _b.firstName) || ''}! تم قبول طلبك كـ${user.accountType === 'INSTRUCTOR' ? 'محاضر' : 'مستشار'}. يمكنك الآن تسجيل الدخول والبدء في استخدام المنصة.`,
            data: { type: 'approved' },
        });
        await this.log('APPROVE_USER', 'User', userId, adminId, { email: user.email, accountType: user.accountType });
        const name = `${((_c = user.profile) === null || _c === void 0 ? void 0 : _c.firstName) || ''} ${((_d = user.profile) === null || _d === void 0 ? void 0 : _d.lastName) || ''}`.trim() || user.email;
        this.emailService.sendApproval(user.email, name, user.accountType).catch(() => { });
        return user;
    }
    async rejectUser(userId, reason, adminId) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                status: 'REJECTED',
                isActive: false,
                rejectedAt: new Date(),
                rejectedReason: reason || null,
            },
            include: { profile: true },
        });
        await this.prisma.session.deleteMany({ where: { userId } }).catch(() => { });
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
    async banUser(userId, adminId) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'BANNED', isActive: false },
        });
        await this.prisma.session.deleteMany({ where: { userId } }).catch(() => { });
        await this.log('BAN_USER', 'User', userId, adminId);
        return user;
    }
    async unbanUser(userId, adminId) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { status: 'ACTIVE', isActive: true },
        });
        await this.log('UNBAN_USER', 'User', userId, adminId);
        return user;
    }
    async getSiteSettings() {
        let settings = await this.prisma.siteSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.siteSettings.create({
                data: {
                    siteName: 'DeveWay',
                    primaryColor: '#5120c8',
                    backgroundColor: '#0d0d0d',
                    buttonColor: '#5120c8',
                },
            });
        }
        return settings;
    }
    async updateSiteSettings(data) {
        const existing = await this.prisma.siteSettings.findFirst();
        if (existing) {
            return this.prisma.siteSettings.update({
                where: { id: existing.id },
                data,
            });
        }
        return this.prisma.siteSettings.create({ data: data });
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
    async createUser(data) {
        const exists = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (exists)
            throw new common_1.ConflictException('Email already exists');
        const hashed = await bcrypt.hash(data.password, 10);
        return this.prisma.user.create({
            data: {
                email: data.email,
                password: hashed,
                accountType: data.accountType,
                status: 'ACTIVE',
                profile: { create: { firstName: data.firstName, lastName: data.lastName } },
            },
            select: {
                id: true, email: true, accountType: true, status: true, createdAt: true,
                profile: { select: { firstName: true, lastName: true } },
            },
        });
    }
    async changeUserRole(userId, newRole, adminId) {
        const validRoles = ['STUDENT', 'INSTRUCTOR', 'CONSULTANT', 'ADMIN'];
        if (!validRoles.includes(newRole)) {
            throw new common_1.BadRequestException('دور غير صالح');
        }
        if (userId === adminId) {
            throw new common_1.BadRequestException('لا يمكنك تغيير دورك الخاص');
        }
        const roleNames = {
            STUDENT: 'طالب',
            INSTRUCTOR: 'محاضر',
            CONSULTANT: 'مستشار',
            ADMIN: 'مدير',
        };
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { accountType: newRole },
            include: { profile: true }
        });
        try {
            await this.notificationsService.createNotification({
                userId,
                type: 'SYSTEM_ANNOUNCEMENT',
                titleEn: 'Your Role Has Been Updated',
                titleAr: 'تم تغيير دورك',
                contentEn: `Congratulations! You have been promoted to ${roleNames[newRole] || newRole}. New options are now available in your dashboard.`,
                contentAr: `تهانينا! تم ترقيتك إلى ${roleNames[newRole] || newRole}. ستجد خيارات جديدة في لوحة التحكم.`,
                data: { type: 'role_change', newRole, oldRole: user.accountType },
            });
        }
        catch (e) {
            this.logger.warn(`[Admin] Failed to create notification: ${e.message}`);
        }
        this.logger.log(`[Admin] Changed role of ${user.email} to ${newRole}`);
        return { success: true, data: user };
    }
    async changeUserStatus(id, status) {
        return this.prisma.user.update({
            where: { id },
            data: { status: status },
            select: { id: true, email: true, status: true },
        });
    }
    async createSession(data) {
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
        }
        catch {
            return [];
        }
    }
    async getUserActivity(userId, limit = 30) {
        try {
            return await this.prisma.userActivity.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
            });
        }
        catch {
            return [];
        }
    }
    async getUserDetail(id) {
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
        const totalSpent = payments.reduce((s, p) => s + p.amount, 0);
        return { user, activities, payments, enrollments, totalSpent };
    }
    async getActivityStats() {
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
        const [onlineUsers, todayActivity, totalActivities] = await Promise.all([
            this.prisma.user.count({ where: { lastSeenAt: { gte: fiveMinAgo } } }).catch(() => 0),
            this.prisma.userActivity.count({ where: { createdAt: { gte: todayStart } } }).catch(() => 0),
            this.prisma.userActivity.count().catch(() => 0),
        ]);
        return { onlineUsers, todayActivity, totalActivities };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        analytics_service_1.AnalyticsService,
        notifications_service_1.NotificationsService,
        email_service_1.EmailService])
], AdminService);
//# sourceMappingURL=admin.service.js.map