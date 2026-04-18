import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
export declare class CoursesService {
    private prisma;
    private certificateQueue;
    private readonly logger;
    private readonly cacheTtlMs;
    private readonly cache;
    constructor(prisma: PrismaService, certificateQueue: Queue);
    getCourses(options: {
        page: number;
        limit: number;
        careerPath?: string;
        level?: string;
        search?: string;
        language: string;
    }): Promise<any>;
    getFeaturedCourses(limit: number, language?: string): Promise<{
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
    }[]>;
    getMyCourses(userId: string, options: {
        page: number;
        limit: number;
        status?: string;
    }): Promise<{
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
    }>;
    getCourseById(id: string): Promise<{
        careerPath: {
            createdAt: Date;
            sortOrder: number;
            id: string;
            slug: string;
            titleEn: string;
            titleAr: string;
            descriptionEn: string;
            descriptionAr: string;
            updatedAt: Date;
            isActive: boolean;
            skills: string[];
            salaryRangeEn: string;
            salaryRangeAr: string;
            jobTitlesEn: string[];
            jobTitlesAr: string[];
            demandLevel: string;
            icon: string | null;
            color: string | null;
        };
        category: {
            id: string;
            slug: string;
            icon: string | null;
            nameAr: string;
            nameEn: string;
        };
        instructor: {
            id: string;
            profile: {
                firstName: string;
                lastName: string;
                avatar: string;
            };
        };
        sections: ({
            lessons: {
                description: string | null;
                content: import("@prisma/client/runtime/library").JsonValue | null;
                type: string;
                title: string;
                createdAt: Date;
                id: string;
                titleAr: string | null;
                descriptionAr: string | null;
                updatedAt: Date;
                moduleId: string | null;
                sectionId: string | null;
                videoUrl: string | null;
                videoDuration: number | null;
                fileUrl: string | null;
                fileName: string | null;
                fileSize: number | null;
                isFree: boolean;
                order: number;
                isPublished: boolean;
            }[];
        } & {
            title: string;
            id: string;
            order: number;
            courseId: string;
        })[];
        _count: {
            enrollments: number;
        };
    } & {
        createdAt: Date;
        sortOrder: number;
        id: string;
        slug: string;
        careerPathId: string | null;
        instructorId: string | null;
        categoryId: string | null;
        titleEn: string;
        titleAr: string | null;
        descriptionEn: string | null;
        descriptionAr: string | null;
        thumbnail: string | null;
        previewVideo: string | null;
        price: number;
        currency: string;
        duration: number | null;
        level: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        isFeatured: boolean;
        updatedAt: Date;
    }>;
    getCourseBySlug(slug: string, language?: string): Promise<{
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
            quizzesCount: number;
            enrollments: any;
            certificates: any;
            rating: number;
        };
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCourseLessons(courseId: string, language?: string): Promise<any>;
    getCourseStats(courseId: string, userId?: string): Promise<{
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
    }>;
    getCategories(language?: string): Promise<any>;
    getLevels(): Promise<{
        value: string;
        label: string;
    }[]>;
    getRecommendations(userId: string): Promise<{
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
    }[]>;
    getSearchSuggestions(query: string): Promise<{
        id: string;
        title: string;
        slug: string;
    }[]>;
    createCourse(createCourseDto: any): Promise<{
        category: {
            id: string;
            slug: string;
            icon: string | null;
            nameAr: string;
            nameEn: string;
        };
        sections: {
            title: string;
            id: string;
            order: number;
            courseId: string;
        }[];
    } & {
        createdAt: Date;
        sortOrder: number;
        id: string;
        slug: string;
        careerPathId: string | null;
        instructorId: string | null;
        categoryId: string | null;
        titleEn: string;
        titleAr: string | null;
        descriptionEn: string | null;
        descriptionAr: string | null;
        thumbnail: string | null;
        previewVideo: string | null;
        price: number;
        currency: string;
        duration: number | null;
        level: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        isFeatured: boolean;
        updatedAt: Date;
    }>;
    updateCourse(id: string, updateCourseDto: any): Promise<{
        createdAt: Date;
        sortOrder: number;
        id: string;
        slug: string;
        careerPathId: string | null;
        instructorId: string | null;
        categoryId: string | null;
        titleEn: string;
        titleAr: string | null;
        descriptionEn: string | null;
        descriptionAr: string | null;
        thumbnail: string | null;
        previewVideo: string | null;
        price: number;
        currency: string;
        duration: number | null;
        level: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        isFeatured: boolean;
        updatedAt: Date;
    }>;
    deleteCourse(id: string): Promise<void>;
    publishCourse(id: string): Promise<{
        createdAt: Date;
        sortOrder: number;
        id: string;
        slug: string;
        careerPathId: string | null;
        instructorId: string | null;
        categoryId: string | null;
        titleEn: string;
        titleAr: string | null;
        descriptionEn: string | null;
        descriptionAr: string | null;
        thumbnail: string | null;
        previewVideo: string | null;
        price: number;
        currency: string;
        duration: number | null;
        level: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        isFeatured: boolean;
        updatedAt: Date;
    }>;
    unpublishCourse(id: string): Promise<{
        createdAt: Date;
        sortOrder: number;
        id: string;
        slug: string;
        careerPathId: string | null;
        instructorId: string | null;
        categoryId: string | null;
        titleEn: string;
        titleAr: string | null;
        descriptionEn: string | null;
        descriptionAr: string | null;
        thumbnail: string | null;
        previewVideo: string | null;
        price: number;
        currency: string;
        duration: number | null;
        level: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        isFeatured: boolean;
        updatedAt: Date;
    }>;
    getAdminCourses(options: {
        page: number;
        limit: number;
        status?: string;
        search?: string;
    }): Promise<{
        courses: ({
            careerPath: {
                createdAt: Date;
                sortOrder: number;
                id: string;
                slug: string;
                titleEn: string;
                titleAr: string;
                descriptionEn: string;
                descriptionAr: string;
                updatedAt: Date;
                isActive: boolean;
                skills: string[];
                salaryRangeEn: string;
                salaryRangeAr: string;
                jobTitlesEn: string[];
                jobTitlesAr: string[];
                demandLevel: string;
                icon: string | null;
                color: string | null;
            };
            _count: {
                enrollments: number;
                certificates: number;
            };
        } & {
            createdAt: Date;
            sortOrder: number;
            id: string;
            slug: string;
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
            titleEn: string;
            titleAr: string | null;
            descriptionEn: string | null;
            descriptionAr: string | null;
            thumbnail: string | null;
            previewVideo: string | null;
            price: number;
            currency: string;
            duration: number | null;
            level: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            isFeatured: boolean;
            updatedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    getCourseAnalytics(courseId: string): Promise<{
        totalEnrollments: any;
        completedCourses: any;
        averageProgress: number;
        completionRate: number;
        lessonAnalytics: any;
        revenue: number;
    }>;
    getInstructorCourses(instructorId: string): Promise<{
        success: boolean;
        data: ({
            sections: ({
                _count: {
                    lessons: number;
                };
            } & {
                title: string;
                id: string;
                order: number;
                courseId: string;
            })[];
            _count: {
                sections: number;
                enrollments: number;
            };
        } & {
            createdAt: Date;
            sortOrder: number;
            id: string;
            slug: string;
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
            titleEn: string;
            titleAr: string | null;
            descriptionEn: string | null;
            descriptionAr: string | null;
            thumbnail: string | null;
            previewVideo: string | null;
            price: number;
            currency: string;
            duration: number | null;
            level: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            isFeatured: boolean;
            updatedAt: Date;
        })[];
    }>;
    createInstructorCourse(instructorId: string, dto: any): Promise<{
        success: boolean;
        data: {
            category: {
                id: string;
                slug: string;
                icon: string | null;
                nameAr: string;
                nameEn: string;
            };
            sections: {
                title: string;
                id: string;
                order: number;
                courseId: string;
            }[];
        } & {
            createdAt: Date;
            sortOrder: number;
            id: string;
            slug: string;
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
            titleEn: string;
            titleAr: string | null;
            descriptionEn: string | null;
            descriptionAr: string | null;
            thumbnail: string | null;
            previewVideo: string | null;
            price: number;
            currency: string;
            duration: number | null;
            level: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            isFeatured: boolean;
            updatedAt: Date;
        };
    }>;
    updateInstructorCourse(id: string, instructorId: string, dto: any): Promise<{
        success: boolean;
        data: {
            createdAt: Date;
            sortOrder: number;
            id: string;
            slug: string;
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
            titleEn: string;
            titleAr: string | null;
            descriptionEn: string | null;
            descriptionAr: string | null;
            thumbnail: string | null;
            previewVideo: string | null;
            price: number;
            currency: string;
            duration: number | null;
            level: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            isFeatured: boolean;
            updatedAt: Date;
        };
    }>;
    addSection(courseId: string, instructorId: string, title: string): Promise<{
        success: boolean;
        data: {
            title: string;
            id: string;
            order: number;
            courseId: string;
        };
    }>;
    addLesson(sectionId: string, dto: any): Promise<{
        success: boolean;
        data: {
            description: string | null;
            content: import("@prisma/client/runtime/library").JsonValue | null;
            type: string;
            title: string;
            createdAt: Date;
            id: string;
            titleAr: string | null;
            descriptionAr: string | null;
            updatedAt: Date;
            moduleId: string | null;
            sectionId: string | null;
            videoUrl: string | null;
            videoDuration: number | null;
            fileUrl: string | null;
            fileName: string | null;
            fileSize: number | null;
            isFree: boolean;
            order: number;
            isPublished: boolean;
        };
    }>;
    completeCheck(userId: string, courseId: string): Promise<{
        completed: boolean;
        certificateUrl?: undefined;
        progress?: undefined;
    } | {
        completed: boolean;
        certificateUrl: any;
        progress?: undefined;
    } | {
        completed: boolean;
        progress: any;
        certificateUrl?: undefined;
    }>;
    globalSearch(q: string): Promise<{
        courses: {
            title: string;
            id: string;
            titleEn: string;
            titleAr: string;
            thumbnail: string;
            price: number;
        }[];
        consultants: {
            id: string;
            speciality: string;
            profile: {
                firstName: string;
                lastName: string;
            };
        }[];
    }>;
    getInstructorCourseDetails(id: string, instructorId: string): Promise<{
        success: boolean;
        data: {
            sections: ({
                lessons: {
                    description: string | null;
                    content: import("@prisma/client/runtime/library").JsonValue | null;
                    type: string;
                    title: string;
                    createdAt: Date;
                    id: string;
                    titleAr: string | null;
                    descriptionAr: string | null;
                    updatedAt: Date;
                    moduleId: string | null;
                    sectionId: string | null;
                    videoUrl: string | null;
                    videoDuration: number | null;
                    fileUrl: string | null;
                    fileName: string | null;
                    fileSize: number | null;
                    isFree: boolean;
                    order: number;
                    isPublished: boolean;
                }[];
            } & {
                title: string;
                id: string;
                order: number;
                courseId: string;
            })[];
            enrollments: ({
                user: {
                    id: string;
                    email: string;
                    profile: {
                        firstName: string;
                        lastName: string;
                        avatar: string;
                    };
                };
            } & {
                id: string;
                status: import(".prisma/client").$Enums.EnrollmentStatus;
                progress: number;
                courseId: string;
                userId: string;
                enrolledAt: Date;
                completedAt: Date | null;
                expiresAt: Date | null;
            })[];
            _count: {
                enrollments: number;
            };
        } & {
            createdAt: Date;
            sortOrder: number;
            id: string;
            slug: string;
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
            titleEn: string;
            titleAr: string | null;
            descriptionEn: string | null;
            descriptionAr: string | null;
            thumbnail: string | null;
            previewVideo: string | null;
            price: number;
            currency: string;
            duration: number | null;
            level: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            isFeatured: boolean;
            updatedAt: Date;
        };
    }>;
    getInstructorStats(instructorId: string): Promise<{
        success: boolean;
        data: {
            totalCourses: number;
            totalStudents: number;
            revenue: number;
        };
    }>;
    updateSection(sectionId: string, instructorId: string, title: string): Promise<{
        success: boolean;
        data: {
            title: string;
            id: string;
            order: number;
            courseId: string;
        };
    }>;
    markLessonComplete(userId: string, courseId: string, lessonId: string): Promise<{
        lessonProgress: {
            lessonId: string;
            status: import(".prisma/client").$Enums.LessonStatus;
            completedAt: Date;
        };
        enrollmentProgress: {
            certificateQueued?: boolean;
            courseId: string;
            progress: number;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            completedLessons: number;
            totalLessons: number;
        };
    }>;
    heartbeat(userId: string, courseId: string, lessonId: string, seconds: number): Promise<{
        timeSpent: number;
    }>;
    deleteLesson(lessonId: string, instructorId: string): Promise<{
        success: boolean;
    }>;
    private calculateMockRating;
    private generateSlug;
    private getRecommendationReason;
}
