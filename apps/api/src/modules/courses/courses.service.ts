import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Course, CourseStatus, User } from '@prisma/client';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(private prisma: PrismaService) { }

  async getCourses(options: {
    page: number;
    limit: number;
    careerPath?: string;
    level?: string;
    search?: string;
    language: string;
  }) {
    const { page, limit, careerPath, level, search, language } = options;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'PUBLISHED',
    };

    if (careerPath) {
      (where as any).careerPath = {
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
          },  // ← Add comma here
          _count: {
            select: {
              enrollments: true,
              certificates: true,
            },
          },
        },
        orderBy: [
          { isFeatured: 'desc' },
          { sortOrder: 'asc' } as any,
          { createdAt: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    const transformedCourses = courses.map(course => ({
      id: course.id,
      slug: course.slug,
      title: language === 'ar' ? course.titleAr : course.titleEn,
      description: language === 'ar' ? course.descriptionAr : course.descriptionEn,
      thumbnail: course.thumbnail,
      price: course.price,
      currency: course.currency,
      duration: (course as any).duration,
      level: course.level,
      isFeatured: course.isFeatured,
      careerPath: {
        id: (course as any).careerPath.id,
        slug: (course as any).careerPath.slug,
        title: language === 'ar' ? (course as any).careerPath.titleAr : (course as any).careerPath.titleEn,
        color: (course as any).careerPath.color,
        icon: (course as any).careerPath.icon,
      },
      stats: {
        modulesCount: (course as any).modules.length,
        lessonsCount: (course as any).modules.reduce((sum, module) => sum + (module as any)._count.lessons, 0),
        enrollments: (course as any)._count.enrollments,
        certificates: (course as any)._count.certificates,
        rating: this.calculateMockRating((course as any)._count.certificates, (course as any)._count.enrollments),
      },
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));

    return {
      courses: transformedCourses,
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

  async getFeaturedCourses(limit: number, language: string = 'en') {
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
      duration: (course as any).duration,
      level: course.level,
      careerPath: {
        id: (course as any).careerPath.id,
        slug: (course as any).careerPath.slug,
        title: language === 'ar' ? (course as any).careerPath.titleAr : (course as any).careerPath.titleEn,
        color: (course as any).careerPath.color,
      },
      stats: {
        modulesCount: (course as any).modules.length,
        lessonsCount: (course as any).modules.reduce((sum, module) => sum + (module as any)._count.lessons, 0),
        enrollments: (course as any)._count.enrollments,
        rating: this.calculateMockRating((course as any)._count.certificates, (course as any)._count.enrollments),
      },
    }));
  }

  async getMyCourses(userId: string, options: { page: number; limit: number; status?: string }) {
    const { page, limit, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {
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
        duration: (enrollment as any).course.duration,
        level: enrollment.course.level,
        careerPath: {
          id: (enrollment as any).course.careerPath.id,
          slug: (enrollment as any).course.careerPath.slug,
          title: (enrollment as any).course.careerPath.titleEn,
          color: (enrollment as any).course.careerPath.color,
        },
        stats: {
          modulesCount: (enrollment as any).course.modules.length,
          lessonsCount: (enrollment as any).course.modules.reduce((sum, module) => sum + (module as any)._count.lessons, 0),
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

  async getCourseBySlug(slug: string, language: string = 'en') {
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
      throw new NotFoundException('Course not found');
    }

    const transformedModules = (course as any).modules.map(module => ({
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
        hasQuiz: (lesson as any)._count.quizQuestions > 0,
      })),
      quizzes: module.quizzes.map(quiz => ({
        id: quiz.id,
        title: language === 'ar' ? quiz.titleAr : quiz.titleEn,
        description: language === 'ar' ? quiz.descriptionAr : quiz.descriptionEn,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        maxAttempts: quiz.maxAttempts,
        questionsCount: (quiz as any)._count.questions,
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
      duration: (course as any).duration,
      level: course.level,
      isFeatured: course.isFeatured,
      status: course.status,
      careerPath: {
        id: (course as any).careerPath.id,
        slug: (course as any).careerPath.slug,
        title: language === 'ar' ? (course as any).careerPath.titleAr : (course as any).careerPath.titleEn,
        description: language === 'ar' ? (course as any).careerPath.descriptionAr : (course as any).careerPath.descriptionEn,
        color: (course as any).careerPath.color,
        icon: (course as any).careerPath.icon,
      },
      modules: transformedModules,
      stats: {
        modulesCount: (course as any).modules.length,
        lessonsCount: (course as any).modules.reduce((sum, module) => sum + module.lessons.length, 0),
        quizzesCount: (course as any).modules.reduce((sum, module) => sum + module.quizzes.length, 0),
        enrollments: (course as any)._count.enrollments,
        certificates: (course as any)._count.certificates,
        rating: this.calculateMockRating((course as any)._count.certificates, (course as any)._count.enrollments),
      },
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  async getCourseLessons(courseId: string, language: string = 'en') {
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
      throw new NotFoundException('Course not found');
    }

    return (course as any).modules.map(module => ({
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

  async getCourseStats(courseId: string, userId?: string) {
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
      throw new NotFoundException('Course not found');
    }

    const totalLessons = (course as any).modules.reduce((sum, module) => sum + module.lessons.length, 0);
    const averageProgress = (course as any).enrollments.length > 0
      ? (course as any).enrollments.reduce((sum, enrollment) => sum + enrollment.progress, 0) / (course as any).enrollments.length
      : 0;

    const userStats = userId && (course as any).enrollments.length > 0 ? {
      enrolled: true,
      progress: (course as any).enrollments[0].progress,
      completedLessons: (course as any).enrollments[0].lessonProgress.filter(
        progress => progress.status === 'COMPLETED'
      ).length,
      timeSpent: (course as any).enrollments[0].lessonProgress.reduce(
        (sum, progress) => sum + progress.timeSpent, 0
      ),
      lastAccessed: (course as any).enrollments[0].updatedAt,
    } : { enrolled: false };

    return {
      totalLessons,
      totalEnrollments: (course as any)._count.enrollments,
      totalCertificates: (course as any)._count.certificates,
      averageProgress: Math.round(averageProgress),
      completionRate: (course as any)._count.enrollments > 0
        ? Math.round(((course as any)._count.certificates / (course as any)._count.enrollments) * 100)
        : 0,
      userStats,
    };
  }

  async getCategories(language: string = 'en') {
    const careerPaths = await (this.prisma as any).careerPath.findMany({
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
      coursesCount: (path as any)._count.courses,
    }));
  }

  async getLevels() {
    return [
      { value: 'BEGINNER', label: 'Beginner' },
      { value: 'INTERMEDIATE', label: 'Intermediate' },
      { value: 'ADVANCED', label: 'Advanced' },
    ];
  }

  async getRecommendations(userId: string) {
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
      duration: (course as any).duration,
      level: course.level,
      careerPath: {
        id: (course as any).careerPath.id,
        slug: (course as any).careerPath.slug,
        title: (course as any).careerPath.titleEn,
        color: (course as any).careerPath.color,
      },
      enrollments: (course as any)._count.enrollments,
      reason: this.getRecommendationReason(course, enrollments, assessments),
    }));
  }

  async getSearchSuggestions(query: string) {
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
  async createCourse(createCourseDto: any) {
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

  async updateCourse(id: string, updateCourseDto: any) {
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

  async deleteCourse(id: string) {
    await this.prisma.course.delete({
      where: { id },
    });

    this.logger.log(`Course deleted: ${id}`);
  }

  async publishCourse(id: string) {
    const course = await this.prisma.course.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });

    this.logger.log(`Course published: ${course.titleEn}`);

    return course;
  }

  async unpublishCourse(id: string) {
    const course = await this.prisma.course.update({
      where: { id },
      data: { status: 'DRAFT' },
    });

    this.logger.log(`Course unpublished: ${course.titleEn}`);

    return course;
  }

  async getAdminCourses(options: {
    page: number;
    limit: number;
    status?: string;
    search?: string;
  }) {
    const { page, limit, status, search } = options;
    const skip = (page - 1) * limit;

    const where: any = {};

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

  async getCourseAnalytics(courseId: string) {
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
      throw new NotFoundException('Course not found');
    }

    const totalEnrollments = (course as any).enrollments.length;
    const completedCourses = (course as any).enrollments.filter(e => e.status === 'COMPLETED').length;
    const averageProgress = totalEnrollments > 0
      ? (course as any).enrollments.reduce((sum, e) => sum + e.progress, 0) / totalEnrollments
      : 0;

    const lessonAnalytics = (course as any).modules.flatMap(module =>
      module.lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.titleEn,
        totalViews: (lesson as any).lessonProgress.length,
        completedViews: (lesson as any).lessonProgress.filter(p => p.status === 'COMPLETED').length,
        averageTimeSpent: (lesson as any).lessonProgress.length > 0
          ? (lesson as any).lessonProgress.reduce((sum, p) => sum + p.timeSpent, 0) / (lesson as any).lessonProgress.length
          : 0,
      }))
    );

    return {
      totalEnrollments,
      completedCourses,
      averageProgress: Math.round(averageProgress),
      completionRate: totalEnrollments > 0 ? Math.round((completedCourses / totalEnrollments) * 100) : 0,
      lessonAnalytics,
      revenue: totalEnrollments * course.price,
    };
  }

  private calculateMockRating(certificates: number, enrollments: number): number {
    if (enrollments === 0) return 0;
    const completionRate = certificates / enrollments;
    return Math.min(5, 3 + completionRate * 2); // Rating between 3-5 based on completion rate
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private getRecommendationReason(
    course: any,
    enrollments: any[],
    assessments: any[]
  ): string {
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
}





