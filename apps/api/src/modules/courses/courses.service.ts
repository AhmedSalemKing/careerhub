import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CertificatesService } from '../certificates/certificates.service';
import { Course, CourseStatus, User } from '@prisma/client';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);
  private readonly cacheTtlMs = 30_000;
  private readonly cache = new Map<string, { expiresAt: number; data: any }>();

  constructor(
    private prisma: PrismaService,
    private certificatesService: CertificatesService,
  ) { }

  async getCourses(options: {
    page: number;
    limit: number;
    careerPath?: string;
    categoryId?: string;
    level?: string;
    search?: string;
    language: string;
    type?: string;
    userId?: string;
  }) {
    const { page, limit, careerPath, categoryId, level, search, language, type, userId } = options;
    const effectiveLimit = limit || 12;
    const safePage = page || 1;
    const skip = (safePage - 1) * effectiveLimit;
    const cacheKey = `courses:${safePage}:${effectiveLimit}:${careerPath || ''}:${level || ''}:${search || ''}:${language}:${type || ''}:${userId || 'anon'}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const where: any = {
      status: 'PUBLISHED',
    };

    const andConditions: any[] = [];

    if (type === 'recorded') {
      andConditions.push({
        OR: [
          { type: 'recorded' },
          { type: null },
          { type: '' },
        ]
      });
    } else if (type === 'live') {
      andConditions.push({ type: 'live' });
    } else if (type === 'offline') {
      andConditions.push({ type: 'offline' });
    }

    if (careerPath) {
      andConditions.push({ careerPath: { slug: careerPath } });
    }

    if (level) {
      andConditions.push({ level: level.toUpperCase() });
    }

    if (search) {
      andConditions.push({
        OR: [
          { titleEn: { contains: search, mode: 'insensitive' } },
          { titleAr: { contains: search, mode: 'insensitive' } },
          { descriptionEn: { contains: search, mode: 'insensitive' } },
          { descriptionAr: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    if (categoryId) {
      const cat = await this.prisma.category.findUnique({
        where: { id: categoryId },
        include: { children: { select: { id: true } } },
      });
      if (cat) {
        const ids = [cat.id, ...((cat as any).children?.map((c: any) => c.id) || [])];
        andConditions.push({ categoryId: { in: ids } });
      }
    }

    const finalWhere: any = andConditions.length > 0 ? { AND: [{ status: 'PUBLISHED' }, ...andConditions] } : { status: 'PUBLISHED' };

    this.logger.log(`[getCourses] type=${type}, where=${JSON.stringify(finalWhere)}`)

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where: finalWhere,
        select: {
          id: true,
          titleEn: true,
          titleAr: true,
          descriptionEn: true,
          descriptionAr: true,
          thumbnail: true,
          price: true,
          level: true,
          type: true,
          liveStatus: true,
          liveStartTime: true,
          liveEndTime: true,
          liveViewerCount: true,
          locationName: true,
          locationAddress: true,
          locationLat: true,
          locationLng: true,
          offlinePaymentType: true,
          maxAttendees: true,
          instructor: {
            select: {
              id: true,
              isVerified: true,
              profile: { select: { firstName: true, lastName: true, avatar: true } }
            }
          },
          _count: {
            select: {
              enrollments: true,
              sections: true,
            }
          },
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
      description: language === 'ar' ? course.descriptionAr : course.descriptionEn,
      thumbnail: course.thumbnail,
      price: course.price,
      level: course.level,
      type: course.type,
      liveStatus: course.liveStatus,
      liveStartTime: course.liveStartTime,
      liveEndTime: course.liveEndTime,
      liveViewerCount: course.liveViewerCount,
      locationName: course.locationName,
      locationAddress: course.locationAddress,
      locationLat: course.locationLat,
      locationLng: course.locationLng,
      offlinePaymentType: course.offlinePaymentType,
      maxAttendees: course.maxAttendees,
      instructor: course.instructor ? {
        id: course.instructor.id,
        isVerified: course.instructor.isVerified,
        profile: course.instructor.profile,
      } : undefined,
      _count: course._count,
    }));

    // If userId provided, check enrollment for each course
    let coursesWithEnrollment = transformedCourses
    if (userId) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          userId,
          courseId: { in: courses.map(c => c.id) },
          status: 'ACTIVE'
        },
        select: { courseId: true }
      })
      const enrolledIds = new Set(enrollments.map(e => e.courseId))
      console.log('[Courses] userId:', userId, 'enrollments found:', enrollments.length, 'ids:', Array.from(enrolledIds))
      coursesWithEnrollment = transformedCourses.map(c => ({
        ...c,
        isEnrolled: enrolledIds.has(c.id)
      }))
    } else {
      coursesWithEnrollment = transformedCourses.map(c => ({
        ...c,
        isEnrolled: false
      }))
    }

    const data = {
      courses: coursesWithEnrollment,
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

  async getRecommendedCourses(options: {
    paths?: string;
    fields?: string;
    limit?: number;
    language?: string;
    userId?: string;
  }) {
    const { paths, fields, limit = 12, language = 'en', userId } = options;
    const effectiveLimit = limit || 12;

    const pathIds = paths
      ? paths.split(',').map(p => p.trim()).filter(Boolean)
      : [];

    const fieldSlugs = fields
      ? fields.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    const allPaths = await this.prisma.careerPath.findMany({
      where: { id: { in: pathIds } },
      select: { id: true, slug: true, titleEn: true, titleAr: true },
    });

    const resolvedKeywords: string[] = [];
    for (const p of allPaths) {
      resolvedKeywords.push(p.slug.toLowerCase());
      resolvedKeywords.push(p.titleEn.toLowerCase());
      resolvedKeywords.push(p.titleAr.toLowerCase());
    }
    const uniqueKeywords = [...new Set(resolvedKeywords)];

    console.log('[Recommended] pathIds:', pathIds, '| fieldSlugs:', fieldSlugs, '| resolvedKeywords:', uniqueKeywords);

    // Fetch all published courses with tags and careerPathId for scoring
    const allPublished = await this.prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: {
        id: true,
        titleEn: true,
        titleAr: true,
        descriptionEn: true,
        descriptionAr: true,
        thumbnail: true,
        price: true,
        level: true,
        type: true,
        liveStatus: true,
        liveStartTime: true,
        liveEndTime: true,
        liveViewerCount: true,
        locationName: true,
        locationAddress: true,
        locationLat: true,
        locationLng: true,
        offlinePaymentType: true,
        maxAttendees: true,
        tags: true,
        careerPathId: true,
        careerPaths: true,
        instructor: {
          select: {
            id: true,
            isVerified: true,
            profile: { select: { firstName: true, lastName: true, avatar: true } },
          },
        },
        _count: {
          select: {
            enrollments: true,
            sections: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const scoredCourses = allPublished.map(course => {
      let score = 0;
      const courseTags = (course.tags || []).map(t => t.toLowerCase());
      const courseCareerPaths = (course.careerPaths || []).map(cp => cp.toLowerCase());
      const courseText = [
        (course.titleEn || '').toLowerCase(),
        (course.titleAr || '').toLowerCase(),
        (course.descriptionEn || '').toLowerCase(),
        (course.descriptionAr || '').toLowerCase(),
        ...courseTags,
        ...courseCareerPaths,
      ].join(' ');

      // Score from resolved path keywords (slugs + titles)
      for (const kw of uniqueKeywords) {
        if (courseText.includes(kw)) score += 3;
      }

      // Direct careerPathId match (highest)
      for (const pid of pathIds) {
        if (course.careerPathId === pid) score += 10;
      }

      // careerPaths array slug match
      for (const slug of [...fieldSlugs, ...allPaths.map(p => p.slug)]) {
        const slugLower = slug.toLowerCase();
        if (courseCareerPaths.some(cp => cp === slugLower || cp.includes(slugLower) || slugLower.includes(cp))) {
          score += 8;
        }
      }

      // Tag match against path slugs/titles directly
      for (const tag of courseTags) {
        for (const kw of uniqueKeywords) {
          if (kw.includes(tag) || tag.includes(kw)) {
            score += 5;
            break;
          }
        }
      }

      return { ...course, _score: score };
    });

    // Sort by score descending
    scoredCourses.sort((a, b) => b._score - a._score);

    // Only return courses with score > 0; if none at all, return top 6 anyway
    const relevant = scoredCourses.filter(c => c._score > 0);
    const topCourses = relevant.length > 0
      ? relevant.slice(0, effectiveLimit)
      : allPublished.length > 0 ? scoredCourses.slice(0, Math.min(6, effectiveLimit)) : [];

    // Transform to match expected output format
    const transformedCourses = topCourses.map(course => ({
      id: course.id,
      title: language === 'ar' ? course.titleAr : course.titleEn,
      description: language === 'ar' ? course.descriptionAr : course.descriptionEn,
      thumbnail: course.thumbnail,
      price: course.price,
      level: course.level,
      type: course.type,
      liveStatus: course.liveStatus,
      liveStartTime: course.liveStartTime,
      liveEndTime: course.liveEndTime,
      liveViewerCount: course.liveViewerCount,
      locationName: course.locationName,
      locationAddress: course.locationAddress,
      locationLat: course.locationLat,
      locationLng: course.locationLng,
      offlinePaymentType: course.offlinePaymentType,
      maxAttendees: course.maxAttendees,
      instructor: course.instructor
        ? {
            id: course.instructor.id,
            isVerified: course.instructor.isVerified,
            profile: course.instructor.profile,
          }
        : undefined,
      _count: course._count,
      _score: course._score,
    }));

    let coursesWithEnrollment = transformedCourses;
    if (userId) {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          userId,
          courseId: { in: topCourses.map(c => c.id) },
          status: 'ACTIVE',
        },
        select: { courseId: true },
      });
      const enrolledIds = new Set(enrollments.map(e => e.courseId));
      coursesWithEnrollment = transformedCourses.map(c => ({
        ...c,
        isEnrolled: enrolledIds.has(c.id),
      }));
    } else {
      coursesWithEnrollment = transformedCourses.map(c => ({
        ...c,
        isEnrolled: false,
      }));
    }

    return {
      courses: coursesWithEnrollment,
      meta: {
        total: topCourses.length,
        page: 1,
        limit: effectiveLimit,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
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

  async getBundles(language: string = 'en') {
    try {
      const bundles = await this.prisma.courseBundle.findMany({
        where: { isActive: true },
        include: {
          bundles: {
            include: {
              course: {
                select: { id: true, slug: true, titleEn: true, titleAr: true, thumbnail: true, price: true }
              }
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: { bundles: true }
          }
        },
        orderBy: [
          { isFeatured: 'desc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return bundles.map(bundle => ({
        id: bundle.id,
        title: language === 'ar' ? bundle.titleAr : bundle.titleEn,
        description: bundle.description,
        price: bundle.price,
        discount: bundle.discount,
        isFeatured: bundle.isFeatured,
        courses: bundle.bundles.map(bc => ({
          id: bc.course.id,
          slug: bc.course.slug,
          title: language === 'ar' ? bc.course.titleAr : bc.course.titleEn,
          thumbnail: bc.course.thumbnail,
          price: bc.course.price
        })),
        coursesCount: bundle._count.bundles
      }));
    } catch {
      return [];
    }
  }

  async getCoursesByCareerPath(category: string = 'tech', limit: number = 8) {
    try {
      const categoryCondition: any = {}
      if (category === 'tech') {
        categoryCondition.OR = [
          { category: { name: { contains: 'Tech', mode: 'insensitive' } } },
          { category: { name: { contains: 'Development', mode: 'insensitive' } } },
          { category: { nameAr: { contains: 'برمجة' } } },
        ]
      } else if (category === 'design') {
        categoryCondition.OR = [
          { category: { name: { contains: 'Design', mode: 'insensitive' } } },
          { category: { nameAr: { contains: 'تصميم' } } },
        ]
      } else if (category === 'marketing') {
        categoryCondition.OR = [
          { category: { name: { contains: 'Marketing', mode: 'insensitive' } } },
          { category: { nameAr: { contains: 'تسويق' } } },
        ]
      } else if (category === 'business') {
        categoryCondition.OR = [
          { category: { name: { contains: 'Business', mode: 'insensitive' } } },
          { category: { nameAr: { contains: 'أعمال' } } },
        ]
      }
      
      const courses = await this.prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          ...categoryCondition,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      })
      return courses
    } catch (e) {
      console.error('[getCoursesByCareerPath]', e)
      return []
    }
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

async getMyEnrollments(userId: string) {
    try {
const enrollments: any[] = await this.prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              instructor: {
                select: {
                  id: true,
                  isVerified: true,
                  profile: { select: { firstName: true, lastName: true, avatar: true } }
                }
              },
              sections: {
                include: { _count: { select: { lessons: true } } },
              },
              _count: { select: { enrollments: true } }
            }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      });

      console.log('[MyEnrollments] Found:', enrollments.length, 'for user:', userId)
      return enrollments.map(enrollment => ({
        id: enrollment.id,
        progress: enrollment.progress,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt,
        completedAt: enrollment.completedAt,
        course: {
          id: enrollment.course.id,
          slug: enrollment.course.slug,
          titleEn: enrollment.course.titleEn,
          titleAr: enrollment.course.titleAr,
          descriptionEn: enrollment.course.descriptionEn,
          descriptionAr: enrollment.course.descriptionAr,
          thumbnail: enrollment.course.thumbnail,
          duration: (enrollment as any).course.duration,
          level: enrollment.course.level,
          instructor: enrollment.course.instructor,
          _count: {
            enrollments: enrollment.course._count.enrollments,
            lessons: (enrollment as any).course.sections.reduce(
              (sum: number, s: any) => sum + s._count.lessons, 0
            ),
            sections: (enrollment as any).course.sections.length,
          },
        },
      }));
    } catch(e: any) {
      console.error('[MyEnrollments] Error:', e.message)
      return []
    }
  }

  async getCourseById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            isVerified: true,
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
      throw new NotFoundException('Course not found');
    }

    return course;
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
      duration: (course as any).duration,
      level: course.level,
      isFeatured: course.isFeatured,
      status: course.status,
      careerPath: (course as any).careerPath ? {
        id: (course as any).careerPath.id,
        slug: (course as any).careerPath.slug,
        title: language === 'ar' ? (course as any).careerPath.titleAr : (course as any).careerPath.titleEn,
        description: language === 'ar' ? (course as any).careerPath.descriptionAr : (course as any).careerPath.descriptionEn,
        color: (course as any).careerPath.color,
        icon: (course as any).careerPath.icon,
      } : null,
      modules: transformedModules,
      stats: {
        modulesCount: (course as any).modules.length,
        lessonsCount: (course as any).modules.reduce((sum, module) => sum + module.lessons.length, 0),
        quizzesCount: 0,
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
    const categories = await this.prisma.category.findMany({
      include: {
        _count: { select: { courses: true } },
        children: {
          include: { _count: { select: { courses: true } } }
        }
      },
      orderBy: { nameAr: 'asc' },
    });

    return categories.map(cat => ({
      id: cat.id,
      name: language === 'ar' ? cat.nameAr : cat.nameEn,
      slug: cat.slug,
      icon: cat.icon,
      parentId: (cat as any).parentId ?? null,
      courseCount: (cat as any)._count.courses + ((cat as any).children?.reduce((s: number, sub: any) => s + sub._count.courses, 0) || 0),
      children: (cat as any).children.map((sub: any) => ({
        id: sub.id,
        name: language === 'ar' ? sub.nameAr : sub.nameEn,
        slug: sub.slug,
        parentId: sub.parentId,
        courseCount: (sub as any)._count.courses,
      })),
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
    this.logger.log(`[CreateCourse] DTO keys: ${Object.keys(createCourseDto).join(', ')}`);

    const rawSlug = this.generateSlug(createCourseDto.titleEn || createCourseDto.title || '');
    const slug = rawSlug ? `${rawSlug}-${Date.now()}` : `course-${Date.now()}`;

    const courseData: any = {
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

    if (createCourseDto.instructorId) courseData.instructorId = createCourseDto.instructorId;
    if (createCourseDto.careerPathId) courseData.careerPathId = createCourseDto.careerPathId;
    if (createCourseDto.categoryId && createCourseDto.categoryId !== '') courseData.categoryId = createCourseDto.categoryId;

    if (Array.isArray(createCourseDto.sections) && createCourseDto.sections.length > 0) {
      courseData.sections = {
        create: createCourseDto.sections.map((s: any, i: number) => ({
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

  // ─────────────────────────────────────────────────────────────
  // Instructor methods
  // ─────────────────────────────────────────────────────────────

  async getInstructorCourses(instructorId: string) {
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

  async createInstructorCourse(instructorId: string, dto: any) {
    this.logger.log(`[Courses] Creating course for instructor: ${instructorId}`);
    this.logger.log(`[Courses] DTO: ${JSON.stringify({ ...dto, thumbnail: dto.thumbnail ? '(set)' : null, previewVideo: dto.previewVideo ? '(set)' : null })}`);

    try {
      const rawSlug = this.generateSlug(dto.title || '');
      const slug = rawSlug ? `${rawSlug}-${Date.now()}` : `course-${Date.now()}`;

      // Instructors can only save as DRAFT or PENDING_REVIEW — never directly PUBLISHED
      let courseStatus: string = (dto.status as string) || 'DRAFT'
      if (courseStatus === 'PUBLISHED' || courseStatus === 'PENDING_REVIEW') {
        courseStatus = 'PENDING_REVIEW'
      }

      const courseData: any = {
        slug,
        titleEn: dto.title || dto.titleAr || 'بدون عنوان',
        titleAr: dto.titleAr || dto.title,
        descriptionEn: dto.description,
        descriptionAr: dto.descriptionAr,
        price: parseFloat(dto.price) || 0,
        level: dto.level || 'BEGINNER',
        status: courseStatus as any,
        thumbnail: dto.thumbnail || null,
        previewVideo: dto.previewVideo || null,
        instructorId,
      };

      if (dto.type) courseData.type = dto.type;
      if (dto.liveStartTime) courseData.liveStartTime = new Date(dto.liveStartTime);
      if (dto.liveEndTime) courseData.liveEndTime = new Date(dto.liveEndTime);
      if (dto.liveStatus) courseData.liveStatus = dto.liveStatus;
      if (dto.autoPublishRecording !== undefined) courseData.autoPublishRecording = dto.autoPublishRecording;
      if (dto.autoDeleteAfterLive !== undefined) courseData.autoDeleteAfterLive = dto.autoDeleteAfterLive;
      if (dto.locationName) courseData.locationName = dto.locationName;
      if (dto.locationAddress) courseData.locationAddress = dto.locationAddress;
      if (dto.locationLat !== undefined) courseData.locationLat = dto.locationLat;
      if (dto.locationLng !== undefined) courseData.locationLng = dto.locationLng;
      if (dto.offlinePaymentType) courseData.offlinePaymentType = dto.offlinePaymentType;
      if (dto.maxAttendees) courseData.maxAttendees = parseInt(dto.maxAttendees);

      if (dto.careerPathId && dto.careerPathId !== '') {
        courseData.careerPathId = dto.careerPathId;
      }

      if (dto.categoryId && dto.categoryId !== '') {
        const cat = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
        if (cat) courseData.categoryId = dto.categoryId;
        else this.logger.warn(`[Courses] Category not found: ${dto.categoryId}, skipping`);
      }

      if (dto.sections?.length) {
        courseData.sections = {
          create: dto.sections.map((s: any, i: number) => ({
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

      // Notify instructor when course is submitted for review
      if (courseStatus === 'PENDING_REVIEW') {
        await this.prisma.notification.create({
          data: {
            userId: instructorId,
            type: 'SYSTEM_ANNOUNCEMENT' as any,
            titleEn: 'Course Submission Received',
            titleAr: 'تم استلام طلب نشر الكورس',
            contentEn: `Your course "${course.titleEn}" has been received and will be reviewed by the DeveWay team within 24-48 hours.`,
            contentAr: `تم استلام كورسك "${course.titleEn}" وسيتم مراجعته من قبل فريق DeveWay. سنخبرك بالنتيجة خلال 24-48 ساعة.`,
            isRead: false,
          }
        }).catch(e => this.logger.warn(`[Courses] Notification skip: ${e.message}`))
      }

      return { success: true, data: course };
    } catch (error: any) {
      this.logger.error(`[Courses] Create error: ${error.message}`);
      this.logger.error(`[Courses] Stack: ${error.stack}`);
      throw error;
    }
  }

  async updateInstructorCourse(id: string, instructorId: string, dto: any) {
    const course = await this.prisma.course.findFirst({ where: { id, instructorId } });
    if (!course) throw new NotFoundException('Course not found or not yours');

    const updated = await this.prisma.course.update({
      where: { id },
      data: {
        ...(dto.title && { titleEn: dto.title }),
        ...(dto.titleAr !== undefined && { titleAr: dto.titleAr }),
        ...(dto.description !== undefined && { descriptionEn: dto.description }),
        ...(dto.descriptionAr !== undefined && { descriptionAr: dto.descriptionAr }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.level && { level: dto.level }),
        ...(dto.status && { status: dto.status as any }),
        ...(dto.thumbnail !== undefined && { thumbnail: dto.thumbnail }),
        ...(dto.previewVideo !== undefined && { previewVideo: dto.previewVideo }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.liveStartTime && { liveStartTime: new Date(dto.liveStartTime) }),
        ...(dto.liveEndTime && { liveEndTime: new Date(dto.liveEndTime) }),
        ...(dto.liveStatus !== undefined && { liveStatus: dto.liveStatus }),
        ...(dto.autoPublishRecording !== undefined && { autoPublishRecording: dto.autoPublishRecording }),
        ...(dto.autoDeleteAfterLive !== undefined && { autoDeleteAfterLive: dto.autoDeleteAfterLive }),
        ...(dto.locationName !== undefined && { locationName: dto.locationName }),
        ...(dto.locationAddress !== undefined && { locationAddress: dto.locationAddress }),
        ...(dto.locationLat !== undefined && { locationLat: dto.locationLat }),
        ...(dto.locationLng !== undefined && { locationLng: dto.locationLng }),
        ...(dto.offlinePaymentType !== undefined && { offlinePaymentType: dto.offlinePaymentType }),
        ...(dto.maxAttendees !== undefined && { maxAttendees: dto.maxAttendees }),
        ...(dto.recordingUrl !== undefined && { recordingUrl: dto.recordingUrl }),
      },
    });
    return { success: true, data: updated };
  }

  async addSection(courseId: string, instructorId: string, title: string) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, instructorId } });
    if (!course) throw new NotFoundException('Course not found');

    const count = await this.prisma.section.count({ where: { courseId } });
    const section = await this.prisma.section.create({
      data: { title, courseId, order: count },
    });
    return { success: true, data: section };
  }

  async addLesson(sectionId: string, dto: any) {
    const count = await this.prisma.lesson.count({ where: { sectionId } });
    const lessonType = dto.lessonType || dto.type || 'VIDEO';
    const isLive = lessonType === 'LIVE';
    const lesson = await this.prisma.lesson.create({
      data: {
        title: dto.title,
        description: dto.description,
        type: lessonType,
        videoUrl: !isLive ? dto.videoUrl : undefined,
        videoDuration: !isLive ? dto.duration : undefined,
        fileUrl: !isLive ? dto.fileUrl : undefined,
        fileName: !isLive ? dto.fileName : undefined,
        imageUrl: !isLive ? dto.imageUrl : undefined,
        fileSize: !isLive ? dto.fileSize : undefined,
        isFree: dto.isFree || false,
        order: dto.order ?? count,
        sectionId,
        liveStartTime: isLive && dto.liveDate ? new Date(dto.liveDate) : null,
        liveStatus: isLive && dto.liveDate ? 'SCHEDULED' : null,
        content: isLive ? { liveDuration: dto.liveDuration || 60, saveRecording: dto.saveRecording ?? true, autoPublish: dto.autoPublish ?? false } : undefined,
      },
    });
    return { success: true, data: lesson };
  }

  async getLiveLessons(courseId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: {
        section: { courseId },
        type: 'LIVE',
      },
      include: { section: { select: { id: true, title: true } } },
      orderBy: { liveStartTime: 'asc' },
    });
    return { success: true, data: lessons };
  }

  async completeCheck(userId: string, courseId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    }).catch(() => null);
    if (!enrollment) return { completed: false };
    if (enrollment.progress >= 100) {
      const cert = await this.prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
      }).catch(() => null);
      return { completed: true, certificateUrl: cert?.certificateUrl ?? null };
    }
    return { completed: false, progress: enrollment.progress };
  }

  async globalSearch(q: string) {
    if (!q || q.length < 2) return { courses: [], consultants: [] };
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

  async getInstructorCourseDetails(id: string, instructorId: string) {
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
    if (!course) throw new NotFoundException('Course not found');
    return { success: true, data: course };
  }

  async getInstructorStats(userId: string) {
    try {
      const courses = await this.prisma.course.findMany({
        where: { instructorId: userId },
        select: {
          id: true, titleAr: true, titleEn: true,
          status: true, price: true,
          _count: { select: { enrollments: true } }
        }
      }).catch(() => [])
      
      const courseIds = courses.map(c => c.id)
      
      const [totalStudents, certificatesIssued] = await Promise.all([
        courseIds.length ? this.prisma.enrollment.count({
          where: { courseId: { in: courseIds } }
        }).catch(() => 0) : Promise.resolve(0),
        courseIds.length ? this.prisma.certificate.count({
          where: { courseId: { in: courseIds } }
        }).catch(() => 0) : Promise.resolve(0),
      ])
      
      let totalRevenue = 0
      if (courseIds.length) {
        const rev = await this.prisma.payment.aggregate({
          where: { courseId: { in: courseIds } },
          _sum: { amount: true }
        }).catch(() => ({ _sum: { amount: 0 } }))
        totalRevenue = Number(rev._sum?.amount) || 0
      }
      
      const completedEnrollments = courseIds.length ? await this.prisma.enrollment.count({
        where: { courseId: { in: courseIds }, completedAt: { not: null } }
      }).catch(() => 0) : 0
      
      const completionRate = totalStudents > 0
        ? Math.round((completedEnrollments / totalStudents) * 100) : 0
      
      return {
        success: true,
        data: {
          totalStudents,
          publishedCourses: courses.filter(c => c.status === 'PUBLISHED').length,
          totalCourses: courses.length,
          avgRating: 0,
          totalRevenue,
          certificatesIssued,
          completionRate,
          courses: courses.map(c => ({
            id: c.id,
            title: c.titleAr || c.titleEn || 'كورس',
            status: c.status,
            price: c.price || 0,
            enrollments: c._count.enrollments,
          }))
        }
      }
    } catch(e: any) {
      console.error('[InstructorStats]', e.message)
      return { success: true, data: {
        totalStudents: 0, publishedCourses: 0, totalCourses: 0,
        avgRating: 0, totalRevenue: 0, certificatesIssued: 0,
        completionRate: 0, courses: []
      }}
    }
  }

  async updateSection(sectionId: string, instructorId: string, title: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, course: { instructorId } },
    });
    if (!section) throw new NotFoundException('Section not found');
    const updated = await this.prisma.section.update({
      where: { id: sectionId },
      data: { title },
    });
    return { success: true, data: updated };
  }

  async markLessonComplete(userId: string, courseId: string, lessonId: string) {
    // Verify enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!enrollment) {
      throw new ForbiddenException('You must be enrolled in this course to complete lessons.');
    }

    // Upsert LessonProgress record
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

    // Count completed lessons and total published lessons for this course in parallel
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
          section: { courseId },
        },
      }),
    ]);

    const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
    const isCourseComplete = progressPercent >= 100;

    this.logger.log(
      `[Lesson] Returning progress: ${progressPercent}% | isCourseComplete: ${isCourseComplete} | completed: ${completedCount}/${totalCount}`
    );

    this.logger.log(
      `[Progress] userId=${userId} courseId=${courseId} ` +
      `completed=${completedCount}/${totalCount} (${progressPercent}%)`
    );

    // Update enrollment progress
    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { userId_courseId: { userId, courseId } },
      data: {
        progress: progressPercent,
        ...(isCourseComplete ? { status: 'COMPLETED', completedAt: new Date() } : {}),
      },
    });

    // Auto Certificate Generation - fire-and-forget (non-blocking)
    if (isCourseComplete) {
      this.certificatesService
        .generateCertificate(userId, courseId)
        .then((cert) => {
          if (cert) {
            this.logger.log(`[Certificate] Auto-issued: ${cert.data?.serialNumber}`)
          }
        })
        .catch((err: any) => {
          this.logger.error(`[Certificate] Auto-generation failed: ${err.message}`)
        })
    }

    return {
      success: true,
      data: {
        lessonId,
        completedLessons: completedCount,
        totalLessons: totalCount,
        progress: progressPercent,
        isCourseComplete,
      },
    };
  }

  async heartbeat(userId: string, courseId: string, lessonId: string, seconds: number): Promise<{ timeSpent: number }> {
    // Verify enrollment silently — heartbeat should not throw for missing enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!enrollment) {
      return { timeSpent: 0 };
    }

    // Upsert progress record, increment timeSpent, keep status if already COMPLETED
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
        // Only set IN_PROGRESS if not already COMPLETED
        ...(existing?.status !== 'COMPLETED' ? { status: 'IN_PROGRESS' } : {}),
      },
    });

    return { timeSpent: lessonProgress.timeSpent };
  }

  async deleteLesson(lessonId: string, instructorId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, section: { course: { instructorId } } },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.prisma.lesson.delete({ where: { id: lessonId } });
    return { success: true };
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

  private slugToKeywords(slug: string): string[] {
    const map: Record<string, string[]> = {
      'software-engineer': ['software', 'programming', 'javascript', 'python', 'java', 'backend', 'fullstack', 'algorithms'],
      'frontend-developer': ['frontend', 'react', 'vue', 'javascript', 'html', 'css', 'typescript', 'ui'],
      'backend-developer': ['backend', 'api', 'nodejs', 'python', 'java', 'database', 'server', 'rest'],
      'fullstack-developer': ['fullstack', 'frontend', 'backend', 'react', 'nodejs', 'javascript', 'typescript'],
      'mobile-developer': ['mobile', 'android', 'ios', 'react-native', 'flutter', 'swift', 'kotlin'],
      'mobile-app-developer': ['mobile', 'android', 'ios', 'react-native', 'flutter', 'swift', 'kotlin'],
      'ios-developer': ['ios', 'swift', 'xcode', 'apple', 'objective-c', 'swiftui', 'mobile'],
      'android-developer': ['android', 'kotlin', 'java', 'android-studio', 'mobile', 'jetpack'],
      'devops-engineer': ['devops', 'docker', 'kubernetes', 'ci-cd', 'linux', 'aws', 'cloud', 'jenkins'],
      'devops': ['devops', 'docker', 'kubernetes', 'ci-cd', 'linux', 'aws', 'cloud', 'jenkins'],
      'data-scientist': ['data', 'machine-learning', 'python', 'statistics', 'pandas', 'numpy', 'ai', 'analytics'],
      'data-science': ['data', 'machine-learning', 'python', 'statistics', 'pandas', 'numpy', 'ai', 'analytics'],
      'data-analyst': ['data', 'excel', 'sql', 'tableau', 'power-bi', 'analytics', 'visualization', 'python'],
      'data-analysis': ['data', 'excel', 'sql', 'tableau', 'power-bi', 'analytics', 'visualization'],
      'data-engineer': ['data', 'etl', 'spark', 'hadoop', 'sql', 'pipeline', 'bigdata', 'python'],
      'machine-learning-engineer': ['machine-learning', 'deep-learning', 'tensorflow', 'pytorch', 'python', 'ai', 'neural-networks'],
      'ml-engineer': ['machine-learning', 'deep-learning', 'tensorflow', 'pytorch', 'python', 'ai'],
      'ai-engineer': ['ai', 'artificial-intelligence', 'machine-learning', 'python', 'deep-learning', 'llm'],
      'artificial-intelligence': ['ai', 'artificial-intelligence', 'machine-learning', 'python', 'deep-learning'],
      'cloud-engineer': ['cloud', 'aws', 'azure', 'gcp', 'devops', 'kubernetes', 'terraform', 'infrastructure'],
      'cloud-computing': ['cloud', 'aws', 'azure', 'gcp', 'serverless', 'infrastructure', 'cloud-native'],
      'cybersecurity': ['security', 'networking', 'ethical-hacking', 'penetration-testing', 'firewall', 'cryptography'],
      'security-engineer': ['security', 'cybersecurity', 'networking', 'ethical-hacking', 'soc', 'incident-response'],
      'network-engineer': ['networking', 'cisco', 'tcp-ip', 'routing', 'switching', 'firewall', 'ccna'],
      'blockchain-developer': ['blockchain', 'solidity', 'ethereum', 'web3', 'smart-contracts', 'defi', 'nft'],
      'blockchain': ['blockchain', 'solidity', 'ethereum', 'web3', 'smart-contracts', 'crypto'],
      'game-developer': ['game', 'unity', 'unreal', 'c#', 'c++', 'game-design', '3d', 'graphics'],
      'game-development': ['game', 'unity', 'unreal', 'c#', 'c++', 'game-design', '3d'],
      'embedded-systems': ['embedded', 'c', 'c++', 'microcontroller', 'arduino', 'raspberry-pi', 'iot', 'firmware'],
      'iot-engineer': ['iot', 'embedded', 'sensors', 'mqtt', 'raspberry-pi', 'arduino', 'networking'],
      'qa-engineer': ['testing', 'qa', 'automation', 'selenium', 'jest', 'cypress', 'manual-testing', 'bug'],
      'software-testing': ['testing', 'qa', 'automation', 'selenium', 'jest', 'cypress', 'quality'],
      'ui-ux-designer': ['ui', 'ux', 'design', 'figma', 'sketch', 'prototyping', 'user-experience', 'wireframe'],
      'ui-designer': ['ui', 'design', 'figma', 'css', 'visual-design', 'prototype', 'interface'],
      'ux-designer': ['ux', 'user-experience', 'research', 'figma', 'wireframe', 'usability', 'design'],
      'graphic-designer': ['graphic-design', 'photoshop', 'illustrator', 'branding', 'typography', 'adobe', 'design'],
      'motion-designer': ['motion', 'after-effects', 'animation', 'video', 'premiere', 'design', 'vfx'],
      'video-editor': ['video', 'premiere', 'after-effects', 'editing', 'youtube', 'cinematography', 'davinci'],
      'digital-marketing': ['marketing', 'seo', 'social-media', 'ads', 'google-ads', 'facebook-ads', 'email-marketing'],
      'content-creator': ['content', 'writing', 'social-media', 'youtube', 'blog', 'copywriting', 'video'],
      'content-marketing': ['content', 'writing', 'seo', 'blog', 'copywriting', 'social-media', 'marketing'],
      'seo-specialist': ['seo', 'search-engine', 'google', 'keywords', 'analytics', 'content', 'backlinks'],
      'social-media-manager': ['social-media', 'instagram', 'tiktok', 'facebook', 'marketing', 'content', 'analytics'],
      'project-manager': ['project-management', 'agile', 'scrum', 'pmp', 'jira', 'leadership', 'planning'],
      'product-manager': ['product', 'agile', 'roadmap', 'analytics', 'strategy', 'user-research', 'stakeholder'],
      'business-analyst': ['business', 'analysis', 'requirements', 'sql', 'excel', 'process', 'uml', 'documentation'],
      'financial-analyst': ['finance', 'excel', 'financial-modeling', 'accounting', 'investment', 'valuation', 'sql'],
      'accounting': ['accounting', 'finance', 'excel', 'quickbooks', 'tax', 'bookkeeping', 'financial-statements'],
      'hr-specialist': ['hr', 'human-resources', 'recruitment', 'onboarding', 'payroll', 'talent', 'management'],
      'entrepreneur': ['entrepreneurship', 'startup', 'business', 'marketing', 'finance', 'leadership', 'strategy'],
      'startup-founder': ['startup', 'entrepreneurship', 'business-model', 'funding', 'pitch', 'mvp', 'growth'],
      'e-commerce': ['ecommerce', 'shopify', 'amazon', 'dropshipping', 'marketing', 'store', 'sales', 'online'],
      'sales-manager': ['sales', 'crm', 'negotiation', 'lead-generation', 'marketing', 'b2b', 'customer'],
      'technical-writer': ['writing', 'documentation', 'api-docs', 'markdown', 'communication', 'technical'],
      'database-administrator': ['database', 'sql', 'postgresql', 'mysql', 'mongodb', 'dba', 'performance', 'backup'],
    };
    return map[slug] || [slug.replace(/-/g, ' ')];
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

  async createCoursePaymentIntent(courseId: string, userId: string, amount: number) {
    try {
      const course = await this.prisma.course.findUnique({ where: { id: courseId } })
      if (!course) throw new NotFoundException('Course not found')

      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

      const finalAmount = amount || parseFloat(course.price?.toString() || '0')
      if (finalAmount <= 0) {
        return { success: true, free: true }
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalAmount * 100), // SAR in halalas
        currency: 'sar',
        metadata: { courseId, userId, courseTitle: course.titleEn || course.titleAr || '' },
        description: `Course enrollment: ${course.titleEn || course.titleAr}`,
      })

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          amount: finalAmount,
        }
      }
    } catch(e: any) {
      this.logger.error('[createCoursePaymentIntent]', e.message)
      throw new Error(e.message)
    }
  }

  async confirmCourseEnrollment(courseId: string, userId: string, paymentIntentId: string) {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
    if (pi.status !== 'succeeded') throw new BadRequestException('Payment not completed')

    const enrollment = await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: 'ACTIVE' },
      update: { status: 'ACTIVE' },
    })

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, price: true }
    })
    if (course?.price && parseFloat(course.price.toString()) > 0) {
      const instructorShare = parseFloat(course.price.toString()) * 0.8
      await this.prisma.$executeRawUnsafe(
        `UPDATE "users" SET "earningsBalance" = COALESCE("earningsBalance", 0) + ${instructorShare} WHERE "id" = '${course.instructorId}'`
      ).catch(() => {})
    }

    return { success: true, data: enrollment }
  }

  async getCourseProgress(userId: string, courseId: string) {
    const totalLessons = await this.prisma.lesson.count({
      where: { section: { courseId } },
    });

    const completedLessons = await this.prisma.lessonProgress.count({
      where: {
        userId,
        status: 'COMPLETED',
        lesson: { section: { courseId } },
      },
    });

    const progress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0;

    return {
      success: true,
      data: {
        progress,
        completedLessons,
        totalLessons,
        isCourseComplete: progress >= 100,
      },
    };
  }

  async markCourseCompleted(
    courseId: string,
    instructorId: string,
    body: { expectedLessons?: number; certificateEnabled?: boolean }
  ) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, instructorId },
    })
    if (!course) throw new NotFoundException('Course not found')

    const totalLessons = await this.prisma.lesson.count({
      where: { section: { courseId } },
    })

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        isCompleted: true,
        completedAt: new Date(),
        certificateEnabled: body.certificateEnabled ?? true,
        expectedLessons: body.expectedLessons ?? totalLessons,
      },
    })
  }

  async updateCourseSettings(
    courseId: string,
    instructorId: string,
    body: { expectedLessons?: number; certificateEnabled?: boolean; isCompleted?: boolean }
  ) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, instructorId },
    })
    if (!course) throw new NotFoundException('Course not found')

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        ...(body.expectedLessons !== undefined && { expectedLessons: body.expectedLessons }),
        ...(body.certificateEnabled !== undefined && { certificateEnabled: body.certificateEnabled }),
        ...(body.isCompleted !== undefined && {
          isCompleted: body.isCompleted,
          completedAt: body.isCompleted ? new Date() : null,
        }),
      },
    })
  }
}


