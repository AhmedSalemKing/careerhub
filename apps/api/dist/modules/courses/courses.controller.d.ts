import { CoursesService } from './courses.service';
import { EnrollmentService } from './enrollment.service';
import { User } from '@prisma/client';
export declare class CoursesController {
    private readonly coursesService;
    private readonly enrollmentService;
    constructor(coursesService: CoursesService, enrollmentService: EnrollmentService);
    getCourses(page?: number, limit?: number, careerPath?: string, level?: string, search?: string, language?: string): Promise<{
        success: boolean;
        data: {
            courses: {
                id: string;
                slug: string;
                title: string;
                description: string;
                thumbnail: string;
                price: number;
                currency: string;
                duration: any;
                level: string;
                isFeatured: boolean;
                careerPath: {
                    id: any;
                    slug: any;
                    title: any;
                    color: any;
                    icon: any;
                };
                stats: {
                    modulesCount: number;
                    lessonsCount: number;
                    enrollments: any;
                    certificates: any;
                    rating: number;
                };
                createdAt: Date;
                updatedAt: Date;
            }[];
            meta: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
        };
    }>;
    getFeaturedCourses(limit?: number, language?: string): Promise<{
        success: boolean;
        data: {
            courses: {
                id: string;
                slug: string;
                title: string;
                description: string;
                thumbnail: string;
                price: number;
                currency: string;
                duration: any;
                level: string;
                careerPath: {
                    id: any;
                    slug: any;
                    title: any;
                    color: any;
                };
                stats: {
                    modulesCount: any;
                    lessonsCount: any;
                    enrollments: any;
                    rating: number;
                };
            }[];
        };
    }>;
    getMyCourses(user: User, page?: number, limit?: number, status?: string): Promise<{
        success: boolean;
        data: {
            enrollments: {
                id: string;
                progress: number;
                status: import(".prisma/client").$Enums.EnrollmentStatus;
                enrolledAt: Date;
                completedAt: Date;
                course: {
                    id: string;
                    slug: string;
                    title: string;
                    description: string;
                    thumbnail: string;
                    duration: any;
                    level: string;
                    careerPath: {
                        id: any;
                        slug: any;
                        title: any;
                        color: any;
                    };
                    stats: {
                        modulesCount: any;
                        lessonsCount: any;
                    };
                };
            }[];
            meta: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
        };
    }>;
    getCourseBySlug(slug: string, language?: string): Promise<{
        success: boolean;
        data: {
            course: {
                id: string;
                slug: string;
                title: string;
                description: string;
                thumbnail: string;
                price: number;
                currency: string;
                duration: any;
                level: string;
                isFeatured: boolean;
                status: import(".prisma/client").$Enums.CourseStatus;
                careerPath: {
                    id: any;
                    slug: any;
                    title: any;
                    description: any;
                    color: any;
                    icon: any;
                };
                modules: any;
                stats: {
                    modulesCount: any;
                    lessonsCount: any;
                    quizzesCount: any;
                    enrollments: any;
                    certificates: any;
                    rating: number;
                };
                createdAt: Date;
                updatedAt: Date;
            };
        };
    }>;
    getCourseLessons(id: string, language?: string): Promise<{
        success: boolean;
        data: {
            lessons: any;
        };
    }>;
    enrollInCourse(user: User, courseId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            enrollment: {
                success: boolean;
                courseId: string;
                userId: string;
            };
        };
    }>;
    getEnrollmentStatus(user: User, courseId: string): Promise<{
        success: boolean;
        data: {
            enrollment: any;
        };
    }>;
    updateProgress(user: User, courseId: string, lessonId: string, progress: number, timeSpent?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
            progress: number;
        };
    }>;
    getCourseStats(user: User, courseId: string): Promise<{
        success: boolean;
        data: {
            stats: {
                totalLessons: any;
                totalEnrollments: any;
                totalCertificates: any;
                averageProgress: number;
                completionRate: number;
                userStats: {
                    enrolled: boolean;
                    progress: any;
                    completedLessons: any;
                    timeSpent: any;
                    lastAccessed: any;
                } | {
                    enrolled: boolean;
                    progress?: undefined;
                    completedLessons?: undefined;
                    timeSpent?: undefined;
                    lastAccessed?: undefined;
                };
            };
        };
    }>;
    getCategories(language?: string): Promise<{
        success: boolean;
        data: {
            categories: any;
        };
    }>;
    getLevels(): Promise<{
        success: boolean;
        data: {
            levels: {
                value: string;
                label: string;
            }[];
        };
    }>;
    getRecommendations(user: User): Promise<{
        success: boolean;
        data: {
            recommendations: {
                id: string;
                slug: string;
                title: string;
                description: string;
                thumbnail: string;
                price: number;
                currency: string;
                duration: any;
                level: string;
                careerPath: {
                    id: any;
                    slug: any;
                    title: any;
                    color: any;
                };
                enrollments: any;
                reason: string;
            }[];
        };
    }>;
    getSearchSuggestions(query: string): Promise<{
        success: boolean;
        data: {
            suggestions: {
                id: string;
                title: string;
                slug: string;
            }[];
        };
    }>;
    createCourse(createCourseDto: any): Promise<{
        success: boolean;
        message: string;
        data: {
            course: {
                status: import(".prisma/client").$Enums.CourseStatus;
                id: string;
                level: string;
                titleAr: string;
                titleEn: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                descriptionEn: string;
                descriptionAr: string;
                sortOrder: number;
                careerPathId: string;
                thumbnail: string | null;
                price: number;
                currency: string;
                duration: number;
                isFeatured: boolean;
            };
        };
    }>;
    updateCourse(id: string, updateCourseDto: any): Promise<{
        success: boolean;
        message: string;
        data: {
            course: {
                status: import(".prisma/client").$Enums.CourseStatus;
                id: string;
                level: string;
                titleAr: string;
                titleEn: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                descriptionEn: string;
                descriptionAr: string;
                sortOrder: number;
                careerPathId: string;
                thumbnail: string | null;
                price: number;
                currency: string;
                duration: number;
                isFeatured: boolean;
            };
        };
    }>;
    deleteCourse(id: string): Promise<void>;
    publishCourse(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            course: {
                status: import(".prisma/client").$Enums.CourseStatus;
                id: string;
                level: string;
                titleAr: string;
                titleEn: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                descriptionEn: string;
                descriptionAr: string;
                sortOrder: number;
                careerPathId: string;
                thumbnail: string | null;
                price: number;
                currency: string;
                duration: number;
                isFeatured: boolean;
            };
        };
    }>;
    unpublishCourse(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            course: {
                status: import(".prisma/client").$Enums.CourseStatus;
                id: string;
                level: string;
                titleAr: string;
                titleEn: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                descriptionEn: string;
                descriptionAr: string;
                sortOrder: number;
                careerPathId: string;
                thumbnail: string | null;
                price: number;
                currency: string;
                duration: number;
                isFeatured: boolean;
            };
        };
    }>;
    getAdminCourses(page?: number, limit?: number, status?: string, search?: string): Promise<{
        success: boolean;
        data: {
            courses: ({
                careerPath: {
                    id: string;
                    titleAr: string;
                    titleEn: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    descriptionEn: string;
                    descriptionAr: string;
                    skills: string[];
                    salaryRangeEn: string;
                    salaryRangeAr: string;
                    jobTitlesEn: string[];
                    jobTitlesAr: string[];
                    demandLevel: string;
                    icon: string | null;
                    color: string | null;
                    sortOrder: number;
                };
                _count: {
                    enrollments: number;
                    certificates: number;
                };
            } & {
                status: import(".prisma/client").$Enums.CourseStatus;
                id: string;
                level: string;
                titleAr: string;
                titleEn: string;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                descriptionEn: string;
                descriptionAr: string;
                sortOrder: number;
                careerPathId: string;
                thumbnail: string | null;
                price: number;
                currency: string;
                duration: number;
                isFeatured: boolean;
            })[];
            meta: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
        };
    }>;
    getCourseAnalytics(id: string): Promise<{
        success: boolean;
        data: {
            analytics: {
                totalEnrollments: any;
                completedCourses: any;
                averageProgress: number;
                completionRate: number;
                lessonAnalytics: any;
                revenue: number;
            };
        };
    }>;
}
