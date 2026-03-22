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
var CoursesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CoursesService = CoursesService_1 = class CoursesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CoursesService_1.name);
        this.cacheTtlMs = 30_000;
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
                sortOrder: lesson.sortOrder,
                isPublished: lesson.isPublished,
                hasQuiz: lesson._count.quizQuestions > 0,
            })),
            quizzes: module.quizzes.map(quiz => ({
                id: quiz.id,
                title: language === 'ar' ? quiz.titleAr : quiz.titleEn,
                description: language === 'ar' ? quiz.descriptionAr : quiz.descriptionEn,
                passingScore: quiz.passingScore,
                timeLimit: quiz.timeLimit,
                maxAttempts: quiz.maxAttempts,
                questionsCount: quiz._count.questions,
            })),
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
            careerPath: {
                id: course.careerPath.id,
                slug: course.careerPath.slug,
                title: language === 'ar' ? course.careerPath.titleAr : course.careerPath.titleEn,
                description: language === 'ar' ? course.careerPath.descriptionAr : course.careerPath.descriptionEn,
                color: course.careerPath.color,
                icon: course.careerPath.icon,
            },
            modules: transformedModules,
            stats: {
                modulesCount: course.modules.length,
                lessonsCount: course.modules.reduce((sum, module) => sum + module.lessons.length, 0),
                quizzesCount: course.modules.reduce((sum, module) => sum + module.quizzes.length, 0),
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
                    include: {
                    // lesson// progress: true,
                    },
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
        // Get user's enrollments and assessment results
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
        // Get user's career path interests from assessments
        const interestedPaths = assessments.map(assessment => assessment.careerPathId);
        // Get recommended courses
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
    // Admin methods
    async createCourse(createCourseDto) {
        const course = await this.prisma.course.create({
            data: {
                ...createCourseDto,
                slug: this.generateSlug(createCourseDto.titleEn),
                status: 'DRAFT',
            },
        });
        this.logger.log(`Course created: ${course.titleEn}`);
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
                    include: {
                    // lesson// progress: true,
                    },
                },
                modules: {
                    include: {
                        lessons: {
                            include: {
                            // lesson// progress: true,
                            },
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
    calculateMockRating(certificates, enrollments) {
        if (enrollments === 0)
            return 0;
        const completionRate = certificates / enrollments;
        return Math.min(5, 3 + completionRate * 2); // Rating between 3-5 based on completion rate
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CoursesService);
