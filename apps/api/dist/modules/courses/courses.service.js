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
var CoursesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const prisma_service_1 = require("../../prisma/prisma.service");
let CoursesService = CoursesService_1 = class CoursesService {
    constructor(prisma, certificateQueue) {
        this.prisma = prisma;
        this.certificateQueue = certificateQueue;
        this.logger = new common_1.Logger(CoursesService_1.name);
        this.cacheTtlMs = 30000;
        this.cache = new Map();
    }
    async getCourses(options) {
        const { page, limit, careerPath, level, search, language } = options;
        const effectiveLimit = limit || 12;
        const safePage = page || 1;
        const skip = (safePage - 1) * effectiveLimit;
        const cacheKey = `courses:${safePage}:${effectiveLimit}:${careerPath || ''}:${level || ''}:${search || ''}:${language}`;
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }
        const where = {
            status: 'PUBLISHED',
        };
        if (careerPath) {
            where.careerPath = {
                slug: careerPath,
            };
        }
        if (level) {
            where.level = level.toUpperCase();
        }
        if (search) {
            where.OR = [
                {
                    titleEn: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    titleAr: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    descriptionEn: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    descriptionAr: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                select: {
                    id: true,
                    titleEn: true,
                    titleAr: true,
                    thumbnail: true,
                    price: true,
                    level: true,
                },
                orderBy: [
                    { isFeatured: 'desc' },
                    { createdAt: 'desc' },
                ],
                skip,
                take: effectiveLimit,
            }),
            this.prisma.course.count({ where }),
        ]);
        const transformedCourses = courses.map(course => ({
            id: course.id,
            title: language === 'ar' ? course.titleAr : course.titleEn,
            thumbnail: course.thumbnail,
            price: course.price,
            level: course.level,
        }));
        const data = {
            courses: transformedCourses,
            meta: {
                total,
                page: safePage,
                limit: effectiveLimit,
                totalPages: Math.ceil(total / effectiveLimit),
                hasNext: safePage < Math.ceil(total / effectiveLimit),
                hasPrev: safePage > 1,
            },
        };
        this.cache.set(cacheKey, {
            expiresAt: Date.now() + this.cacheTtlMs,
            data,
        });
        return data;
    }
    async getFeaturedCourses(limit, language = 'en') {
        const courses = await this.prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
                isFeatured: true,
            },
            include: {
                careerPath: true,
                modules: {
                    include: {
                        _count: {
                            select: {
                                lessons: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                        certificates: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
        });
        return courses.map(course => ({
            id: course.id,
            slug: course.slug,
            title: language === 'ar' ? course.titleAr : course.titleEn,
            description: language === 'ar' ? course.descriptionAr : course.descriptionEn,
            thumbnail: course.thumbnail,
            price: course.price,
            currency: course.currency,
            duration: course.duration,
            level: course.level,
            careerPath: {
                id: course.careerPath.id,
                slug: course.careerPath.slug,
                title: language === 'ar' ? course.careerPath.titleAr : course.careerPath.titleEn,
                color: course.careerPath.color,
            },
            stats: {
                modulesCount: course.modules.length,
                lessonsCount: course.modules.reduce((sum, module) => sum + module._count.lessons, 0),
                enrollments: course._count.enrollments,
                rating: this.calculateMockRating(course._count.certificates, course._count.enrollments),
            },
        }));
    }
    async getMyCourses(userId, options) {
        const { page, limit, status } = options;
        const skip = (page - 1) * limit;
        const where = {
            userId,
        };
        if (status) {
            where.status = status.toUpperCase();
        }
        const [enrollments, total] = await Promise.all([
            this.prisma.enrollment.findMany({
                where,
                include: {
                    course: {
                        include: {
                            careerPath: true,
                            modules: {
                                include: {
                                    _count: {
                                        select: {
                                            lessons: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                orderBy: { enrolledAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.enrollment.count({ where }),
        ]);
        const transformedEnrollments = enrollments.map(enrollment => ({
            id: enrollment.id,
            progress: enrollment.progress,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt,
            completedAt: enrollment.completedAt,
            course: {
                id: enrollment.course.id,
                slug: enrollment.course.slug,
                title: enrollment.course.titleEn,
                description: enrollment.course.descriptionEn,
                thumbnail: enrollment.course.thumbnail,
                duration: enrollment.course.duration,
                level: enrollment.course.level,
                careerPath: {
                    id: enrollment.course.careerPath.id,
                    slug: enrollment.course.careerPath.slug,
                    title: enrollment.course.careerPath.titleEn,
                    color: enrollment.course.careerPath.color,
                },
                stats: {
                    modulesCount: enrollment.course.modules.length,
                    lessonsCount: enrollment.course.modules.reduce((sum, module) => sum + module._count.lessons, 0),
                },
            },
        }));
        return {
            enrollments: transformedEnrollments,
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
    async getCourseById(id) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                instructor: {
                    select: {
                        id: true,
                        profile: {
                            select: { firstName: true, lastName: true, avatar: true },
                        },
                    },
                },
                category: true,
                careerPath: true,
                sections: {
                    include: {
                        lessons: {
                            orderBy: { order: 'asc' },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
                _count: {
                    select: { enrollments: true },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        return course;
    }
    async getCourseBySlug(slug, language = 'en') {
        const course = await this.prisma.course.findUnique({
            where: { slug },
            include: {
                careerPath: true,
                modules: {
                    include: {
                        lessons: {
                            orderBy: { order: 'asc' },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: {
                        enrollments: true,
                        certificates: true,
                    },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        const transformedModules = course.modules.map(module => ({
            id: module.id,
            title: language === 'ar' ? module.titleAr : module.titleEn,
            description: language === 'ar' ? module.descriptionAr : module.descriptionEn,
            sortOrder: module.sortOrder,
            isPublished: module.isPublished,
            lessons: module.lessons.map(lesson => ({
                id: lesson.id,
                title: language === 'ar' ? lesson.titleAr : lesson.titleEn,
                description: language === 'ar' ? lesson.descriptionAr : lesson.descriptionEn,
                videoDuration: lesson.videoDuration,
                sortOrder: lesson.order,
                isPublished: lesson.isPublished,
                hasQuiz: false,
            })),
            quizzes: [],
        }));
        return {
            id: course.id,
            slug: course.slug,
            title: language === 'ar' ? course.titleAr : course.titleEn,
            description: language === 'ar' ? course.descriptionAr : course.descriptionEn,
            thumbnail: course.thumbnail,
            price: course.price,
            currency: course.currency,
            duration: course.duration,
            level: course.level,
            isFeatured: course.isFeatured,
            status: course.status,
            careerPath: course.careerPath ? {
                id: course.careerPath.id,
                slug: course.careerPath.slug,
                title: language === 'ar' ? course.careerPath.titleAr : course.careerPath.titleEn,
                description: language === 'ar' ? course.careerPath.descriptionAr : course.careerPath.descriptionEn,
                color: course.careerPath.color,
                icon: course.careerPath.icon,
            } : null,
            modules: transformedModules,
            stats: {
                modulesCount: course.modules.length,
                lessonsCount: course.modules.reduce((sum, module) => sum + module.lessons.length, 0),
                quizzesCount: 0,
                enrollments: course._count.enrollments,
                certificates: course._count.certificates,
                rating: this.calculateMockRating(course._count.certificates, course._count.enrollments),
            },
            createdAt: course.createdAt,
            updatedAt: course.updatedAt,
        };
    }
    async getCourseLessons(courseId, language = 'en') {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    include: {
                        lessons: {
                            orderBy: { order: 'asc' },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        return course.modules.map(module => ({
            id: module.id,
            title: language === 'ar' ? module.titleAr : module.titleEn,
            description: language === 'ar' ? module.descriptionAr : module.descriptionEn,
            sortOrder: module.sortOrder,
            lessons: module.lessons.map(lesson => ({
                id: lesson.id,
                title: language === 'ar' ? lesson.titleAr : lesson.titleEn,
                description: language === 'ar' ? lesson.descriptionAr : lesson.descriptionEn,
                content: language === 'ar' ? lesson.contentAr : lesson.contentEn,
                videoUrl: lesson.videoUrl,
                videoDuration: lesson.videoDuration,
                sortOrder: lesson.sortOrder,
                isPublished: lesson.isPublished,
            })),
        }));
    }
    async getCourseStats(courseId, userId) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                modules: {
                    include: {
                        lessons: true,
                    },
                },
                enrollments: {
                    where: userId ? { userId } : undefined,
                    include: {},
                },
                _count: {
                    select: {
                        enrollments: true,
                        certificates: true,
                    },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
        const averageProgress = course.enrollments.length > 0
            ? course.enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / course.enrollments.length
            : 0;
        const userStats = userId && course.enrollments.length > 0 ? {
            enrolled: true,
            progress: course.enrollments[0].progress,
            completedLessons: course.enrollments[0].lessonProgress.filter(progress => progress.status === 'COMPLETED').length,
            timeSpent: course.enrollments[0].lessonProgress.reduce((sum, progress) => sum + progress.timeSpent, 0),
            lastAccessed: course.enrollments[0].updatedAt,
        } : { enrolled: false };
        return {
            totalLessons,
            totalEnrollments: course._count.enrollments,
            totalCertificates: course._count.certificates,
            averageProgress: Math.round(averageProgress),
            completionRate: course._count.enrollments > 0
                ? Math.round((course._count.certificates / course._count.enrollments) * 100)
                : 0,
            userStats,
        };
    }
    async getCategories(language = 'en') {
        const careerPaths = await this.prisma.careerPath.findMany({
            where: { isActive: true },
            include: {
                _count: {
                    select: {
                        courses: {
                            where: { status: 'PUBLISHED' },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        return careerPaths.map(path => ({
            id: path.id,
            slug: path.slug,
            name: language === 'ar' ? path.titleAr : path.titleEn,
            description: language === 'ar' ? path.descriptionAr : path.descriptionEn,
            icon: path.icon,
            color: path.color,
            coursesCount: path._count.courses,
        }));
    }
    async getLevels() {
        return [
            { value: 'BEGINNER', label: 'Beginner' },
            { value: 'INTERMEDIATE', label: 'Intermediate' },
            { value: 'ADVANCED', label: 'Advanced' },
        ];
    }
    async getRecommendations(userId) {
        const [enrollments, assessments] = await Promise.all([
            this.prisma.enrollment.findMany({
                where: { userId },
                include: {
                    course: {
                        include: { careerPath: true },
                    },
                },
            }),
            this.prisma.careerAssessment.findMany({
                where: { userId, status: 'COMPLETED' },
                include: { careerPath: true },
            }),
        ]);
        const interestedPaths = assessments.map(assessment => assessment.careerPathId);
        const recommendedCourses = await this.prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
                careerPathId: { in: interestedPaths },
                id: { notIn: enrollments.map(e => e.courseId) },
            },
            include: {
                careerPath: true,
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
            orderBy: [
                { isFeatured: 'desc' },
                { enrollments: { _count: 'desc' } },
            ],
            take: 6,
        });
        return recommendedCourses.map(course => ({
            id: course.id,
            slug: course.slug,
            title: course.titleEn,
            description: course.descriptionEn,
            thumbnail: course.thumbnail,
            price: course.price,
            currency: course.currency,
            duration: course.duration,
            level: course.level,
            careerPath: {
                id: course.careerPath.id,
                slug: course.careerPath.slug,
                title: course.careerPath.titleEn,
                color: course.careerPath.color,
            },
            enrollments: course._count.enrollments,
            reason: this.getRecommendationReason(course, enrollments, assessments),
        }));
    }
    async getSearchSuggestions(query) {
        const courses = await this.prisma.course.findMany({
            where: {
                status: 'PUBLISHED',
                OR: [
                    {
                        titleEn: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                    {
                        titleAr: {
                            contains: query,
                            mode: 'insensitive',
                        },
                    },
                ],
            },
            select: {
                id: true,
                titleEn: true,
                titleAr: true,
                slug: true,
            },
            take: 10,
        });
        return courses.map(course => ({
            id: course.id,
            title: course.titleEn,
            slug: course.slug,
        }));
    }
    async createCourse(createCourseDto) {
        this.logger.log(`[CreateCourse] DTO keys: ${Object.keys(createCourseDto).join(', ')}`);
        const rawSlug = this.generateSlug(createCourseDto.titleEn || createCourseDto.title || '');
        const slug = rawSlug ? `${rawSlug}-${Date.now()}` : `course-${Date.now()}`;
        const courseData = {
            slug,
            titleEn: createCourseDto.titleEn || createCourseDto.title || 'Untitled',
            titleAr: createCourseDto.titleAr,
            descriptionEn: createCourseDto.descriptionEn || createCourseDto.description,
            descriptionAr: createCourseDto.descriptionAr,
            price: parseFloat(createCourseDto.price) || 0,
            level: createCourseDto.level || 'BEGINNER',
            status: createCourseDto.status || 'DRAFT',
            thumbnail: createCourseDto.thumbnail || null,
            previewVideo: createCourseDto.previewVideo || null,
        };
        if (createCourseDto.instructorId)
            courseData.instructorId = createCourseDto.instructorId;
        if (createCourseDto.careerPathId)
            courseData.careerPathId = createCourseDto.careerPathId;
        if (createCourseDto.categoryId && createCourseDto.categoryId !== '')
            courseData.categoryId = createCourseDto.categoryId;
        if (Array.isArray(createCourseDto.sections) && createCourseDto.sections.length > 0) {
            courseData.sections = {
                create: createCourseDto.sections.map((s, i) => ({
                    title: s.title,
                    order: i,
                })),
            };
        }
        const course = await this.prisma.course.create({
            data: courseData,
            include: { sections: true, category: true },
        });
        this.logger.log(`[CreateCourse] Created: ${course.id} (${course.titleEn})`);
        return course;
    }
    async updateCourse(id, updateCourseDto) {
        const course = await this.prisma.course.update({
            where: { id },
            data: {
                ...updateCourseDto,
                ...(updateCourseDto.titleEn && {
                    slug: this.generateSlug(updateCourseDto.titleEn),
                }),
            },
        });
        this.logger.log(`Course updated: ${course.titleEn}`);
        return course;
    }
    async deleteCourse(id) {
        await this.prisma.course.delete({
            where: { id },
        });
        this.logger.log(`Course deleted: ${id}`);
    }
    async publishCourse(id) {
        const course = await this.prisma.course.update({
            where: { id },
            data: { status: 'PUBLISHED' },
        });
        this.logger.log(`Course published: ${course.titleEn}`);
        return course;
    }
    async unpublishCourse(id) {
        const course = await this.prisma.course.update({
            where: { id },
            data: { status: 'DRAFT' },
        });
        this.logger.log(`Course unpublished: ${course.titleEn}`);
        return course;
    }
    async getAdminCourses(options) {
        const { page, limit, status, search } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status.toUpperCase();
        }
        if (search) {
            where.OR = [
                {
                    titleEn: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
                {
                    titleAr: {
                        contains: search,
                        mode: 'insensitive',
                    },
                },
            ];
        }
        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                include: {
                    careerPath: true,
                    _count: {
                        select: {
                            enrollments: true,
                            certificates: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.course.count({ where }),
        ]);
        return {
            courses,
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
    async getCourseAnalytics(courseId) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                enrollments: {
                    include: {},
                },
                modules: {
                    include: {
                        lessons: {
                            include: {},
                        },
                    },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        const totalEnrollments = course.enrollments.length;
        const completedCourses = course.enrollments.filter(e => e.status === 'COMPLETED').length;
        const averageProgress = totalEnrollments > 0
            ? course.enrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrollments
            : 0;
        const lessonAnalytics = course.modules.flatMap(module => module.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.titleEn,
            totalViews: lesson.lessonProgress.length,
            completedViews: lesson.lessonProgress.filter(p => p.status === 'COMPLETED').length,
            averageTimeSpent: lesson.lessonProgress.length > 0
                ? lesson.lessonProgress.reduce((sum, p) => sum + p.timeSpent, 0) / lesson.lessonProgress.length
                : 0,
        })));
        return {
            totalEnrollments,
            completedCourses,
            averageProgress: Math.round(averageProgress),
            completionRate: totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0,
            lessonAnalytics,
            revenue: totalEnrollments * course.price,
        };
    }
    async getInstructorCourses(instructorId) {
        const courses = await this.prisma.course.findMany({
            where: { instructorId },
            include: {
                _count: { select: { enrollments: true, sections: true } },
                sections: {
                    include: { _count: { select: { lessons: true } } },
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
        return { success: true, data: courses };
    }
    async createInstructorCourse(instructorId, dto) {
        var _a;
        this.logger.log(`[Courses] Creating course for instructor: ${instructorId}`);
        this.logger.log(`[Courses] DTO: ${JSON.stringify({ ...dto, thumbnail: dto.thumbnail ? '(set)' : null, previewVideo: dto.previewVideo ? '(set)' : null })}`);
        try {
            const rawSlug = this.generateSlug(dto.title || '');
            const slug = rawSlug ? `${rawSlug}-${Date.now()}` : `course-${Date.now()}`;
            let courseStatus = dto.status || 'DRAFT';
            if (courseStatus === 'PUBLISHED' || courseStatus === 'PENDING_REVIEW') {
                courseStatus = 'PENDING_REVIEW';
            }
            const courseData = {
                slug,
                titleEn: dto.title || dto.titleAr || 'بدون عنوان',
                titleAr: dto.titleAr || dto.title,
                descriptionEn: dto.description,
                descriptionAr: dto.descriptionAr,
                price: parseFloat(dto.price) || 0,
                level: dto.level || 'BEGINNER',
                status: courseStatus,
                thumbnail: dto.thumbnail || null,
                previewVideo: dto.previewVideo || null,
                instructorId,
            };
            if (dto.careerPathId && dto.careerPathId !== '') {
                courseData.careerPathId = dto.careerPathId;
            }
            if ((_a = dto.sections) === null || _a === void 0 ? void 0 : _a.length) {
                courseData.sections = {
                    create: dto.sections.map((s, i) => ({
                        title: s.title,
                        order: i,
                    })),
                };
            }
            const course = await this.prisma.course.create({
                data: courseData,
                include: { sections: true, category: true },
            });
            this.logger.log(`[Courses] Course created: ${course.id} (${course.titleEn}) status: ${course.status}`);
            if (courseStatus === 'PENDING_REVIEW') {
                await this.prisma.notification.create({
                    data: {
                        userId: instructorId,
                        type: 'SYSTEM_ANNOUNCEMENT',
                        titleEn: 'Course Submission Received',
                        titleAr: 'تم استلام طلب نشر الكورس',
                        contentEn: `Your course "${course.titleEn}" has been received and will be reviewed by the DeveWay team within 24-48 hours.`,
                        contentAr: `تم استلام كورسك "${course.titleEn}" وسيتم مراجعته من قبل فريق DeveWay. سنخبرك بالنتيجة خلال 24-48 ساعة.`,
                        isRead: false,
                    }
                }).catch(e => this.logger.warn(`[Courses] Notification skip: ${e.message}`));
            }
            return { success: true, data: course };
        }
        catch (error) {
            this.logger.error(`[Courses] Create error: ${error.message}`);
            this.logger.error(`[Courses] Stack: ${error.stack}`);
            throw error;
        }
    }
    async updateInstructorCourse(id, instructorId, dto) {
        const course = await this.prisma.course.findFirst({ where: { id, instructorId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found or not yours');
        const updated = await this.prisma.course.update({
            where: { id },
            data: {
                ...(dto.title && { titleEn: dto.title }),
                ...(dto.titleAr !== undefined && { titleAr: dto.titleAr }),
                ...(dto.description !== undefined && { descriptionEn: dto.description }),
                ...(dto.descriptionAr !== undefined && { descriptionAr: dto.descriptionAr }),
                ...(dto.price !== undefined && { price: dto.price }),
                ...(dto.level && { level: dto.level }),
                ...(dto.status && { status: dto.status }),
                ...(dto.thumbnail !== undefined && { thumbnail: dto.thumbnail }),
                ...(dto.previewVideo !== undefined && { previewVideo: dto.previewVideo }),
            },
        });
        return { success: true, data: updated };
    }
    async addSection(courseId, instructorId, title) {
        const course = await this.prisma.course.findFirst({ where: { id: courseId, instructorId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const count = await this.prisma.section.count({ where: { courseId } });
        const section = await this.prisma.section.create({
            data: { title, courseId, order: count },
        });
        return { success: true, data: section };
    }
    async addLesson(sectionId, dto) {
        var _a;
        const count = await this.prisma.lesson.count({ where: { sectionId } });
        const lesson = await this.prisma.lesson.create({
            data: {
                title: dto.title,
                description: dto.description,
                type: dto.type || 'VIDEO',
                videoUrl: dto.videoUrl,
                videoDuration: dto.duration,
                fileUrl: dto.fileUrl,
                fileName: dto.fileName,
                fileSize: dto.fileSize,
                isFree: dto.isFree || false,
                order: (_a = dto.order) !== null && _a !== void 0 ? _a : count,
                sectionId,
            },
        });
        return { success: true, data: lesson };
    }
    async completeCheck(userId, courseId) {
        var _a;
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        }).catch(() => null);
        if (!enrollment)
            return { completed: false };
        if (enrollment.progress >= 100) {
            const cert = await this.prisma.certificate.findUnique({
                where: { userId_courseId: { userId, courseId } },
            }).catch(() => null);
            return { completed: true, certificateUrl: (_a = cert === null || cert === void 0 ? void 0 : cert.certificateUrl) !== null && _a !== void 0 ? _a : null };
        }
        return { completed: false, progress: enrollment.progress };
    }
    async globalSearch(q) {
        if (!q || q.length < 2)
            return { courses: [], consultants: [] };
        const [courses, consultants] = await Promise.all([
            this.prisma.course.findMany({
                where: {
                    status: 'PUBLISHED',
                    OR: [
                        { titleEn: { contains: q, mode: 'insensitive' } },
                        { titleAr: { contains: q, mode: 'insensitive' } },
                        { descriptionEn: { contains: q, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, titleEn: true, titleAr: true, thumbnail: true, price: true },
                take: 5,
            }),
            this.prisma.user.findMany({
                where: {
                    accountType: 'CONSULTANT',
                    status: 'ACTIVE',
                    OR: [
                        { speciality: { contains: q, mode: 'insensitive' } },
                        { profile: { firstName: { contains: q, mode: 'insensitive' } } },
                        { profile: { lastName: { contains: q, mode: 'insensitive' } } },
                    ],
                },
                select: { id: true, speciality: true, profile: { select: { firstName: true, lastName: true } } },
                take: 5,
            }),
        ]);
        return { courses: courses.map(c => ({ ...c, title: c.titleEn })), consultants };
    }
    async getInstructorCourseDetails(id, instructorId) {
        const course = await this.prisma.course.findFirst({
            where: { id, instructorId },
            include: {
                sections: {
                    include: { lessons: { orderBy: { order: 'asc' } } },
                    orderBy: { order: 'asc' },
                },
                enrollments: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                email: true,
                                profile: { select: { firstName: true, lastName: true, avatar: true } },
                            },
                        },
                    },
                },
                _count: { select: { enrollments: true } },
            },
        });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        return { success: true, data: course };
    }
    async getInstructorStats(instructorId) {
        const [totalCourses, totalStudents] = await Promise.all([
            this.prisma.course.count({ where: { instructorId } }),
            this.prisma.enrollment.count({ where: { course: { instructorId } } }),
        ]);
        return { success: true, data: { totalCourses, totalStudents, revenue: 0 } };
    }
    async updateSection(sectionId, instructorId, title) {
        const section = await this.prisma.section.findFirst({
            where: { id: sectionId, course: { instructorId } },
        });
        if (!section)
            throw new common_1.NotFoundException('Section not found');
        const updated = await this.prisma.section.update({
            where: { id: sectionId },
            data: { title },
        });
        return { success: true, data: updated };
    }
    async markLessonComplete(userId, courseId, lessonId) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (!enrollment) {
            throw new common_1.ForbiddenException('You must be enrolled in this course to complete lessons.');
        }
        const lessonProgress = await this.prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            create: {
                userId,
                lessonId,
                status: 'COMPLETED',
                completedAt: new Date(),
            },
            update: {
                status: 'COMPLETED',
                completedAt: new Date(),
            },
        });
        const [completedCount, totalCount] = await Promise.all([
            this.prisma.lessonProgress.count({
                where: {
                    userId,
                    status: 'COMPLETED',
                    lesson: { section: { courseId } },
                },
            }),
            this.prisma.lesson.count({
                where: {
                    isPublished: true,
                    section: { courseId },
                },
            }),
        ]);
        const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
        const isCompleted = progress === 100;
        const updatedEnrollment = await this.prisma.enrollment.update({
            where: { userId_courseId: { userId, courseId } },
            data: {
                progress,
                ...(isCompleted ? { status: 'COMPLETED', completedAt: new Date() } : {}),
            },
        });
        if (isCompleted) {
            await this.certificateQueue.add('generate', { userId, courseId }).catch((err) => this.logger.error('Failed to queue certificate generation', { userId, courseId, reason: err.message }));
        }
        return {
            lessonProgress: {
                lessonId,
                status: lessonProgress.status,
                completedAt: lessonProgress.completedAt,
            },
            enrollmentProgress: {
                courseId,
                progress,
                status: updatedEnrollment.status,
                completedLessons: completedCount,
                totalLessons: totalCount,
                ...(isCompleted ? { certificateQueued: true } : {}),
            },
        };
    }
    async heartbeat(userId, courseId, lessonId, seconds) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (!enrollment) {
            return { timeSpent: 0 };
        }
        const existing = await this.prisma.lessonProgress.findUnique({
            where: { userId_lessonId: { userId, lessonId } },
        });
        const lessonProgress = await this.prisma.lessonProgress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            create: {
                userId,
                lessonId,
                status: 'IN_PROGRESS',
                timeSpent: seconds,
            },
            update: {
                timeSpent: { increment: seconds },
                ...((existing === null || existing === void 0 ? void 0 : existing.status) !== 'COMPLETED' ? { status: 'IN_PROGRESS' } : {}),
            },
        });
        return { timeSpent: lessonProgress.timeSpent };
    }
    async deleteLesson(lessonId, instructorId) {
        const lesson = await this.prisma.lesson.findFirst({
            where: { id: lessonId, section: { course: { instructorId } } },
        });
        if (!lesson)
            throw new common_1.NotFoundException('Lesson not found');
        await this.prisma.lesson.delete({ where: { id: lessonId } });
        return { success: true };
    }
    calculateMockRating(certificates, enrollments) {
        if (enrollments === 0)
            return 0;
        const completionRate = certificates / enrollments;
        return Math.min(5, 3 + completionRate * 2);
    }
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    getRecommendationReason(course, enrollments, assessments) {
        const userCareerPaths = assessments.map(a => a.careerPathId);
        if (userCareerPaths.includes(course.careerPathId)) {
            return 'Based on your career assessment results';
        }
        if (course.isFeatured) {
            return 'Popular and highly recommended';
        }
        if (course.level === 'BEGINNER' && enrollments.length === 0) {
            return 'Great starting point for your learning journey';
        }
        return 'Recommended based on your interests';
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = CoursesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, bull_1.InjectQueue)('certificates')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, Object])
], CoursesService);
//# sourceMappingURL=courses.service.js.map