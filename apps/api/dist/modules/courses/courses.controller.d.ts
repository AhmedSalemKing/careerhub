import { CoursesService } from './courses.service';
import { EnrollmentService } from './enrollment.service';
import { User } from '@prisma/client';
export declare class CoursesController {
    private readonly coursesService;
    private readonly enrollmentService;
    constructor(coursesService: CoursesService, enrollmentService: EnrollmentService);
    getCourses(page?: number, limit?: number, careerPath?: string, level?: string, search?: string, language?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    globalSearch(q: string): Promise<{
        success: boolean;
        data: {
            courses: {
                title: string;
                id: string;
                titleAr: string;
                titleEn: string;
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
        };
    }>;
    getCategories(language?: string): Promise<any>;
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
    getEnrolledCourses(req: any): Promise<{
        success: boolean;
        data: {
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
    }>;
    getMyCourses(req: any, page?: number, limit?: number, status?: string): Promise<{
        success: boolean;
        data: ({
            sections: ({
                _count: {
                    lessons: number;
                };
            } & {
                id: string;
                courseId: string;
                title: string;
                order: number;
            })[];
            _count: {
                sections: number;
                enrollments: number;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            createdAt: Date;
            updatedAt: Date;
            titleAr: string | null;
            descriptionAr: string | null;
            titleEn: string;
            descriptionEn: string | null;
            sortOrder: number;
            thumbnail: string | null;
            duration: number | null;
            slug: string;
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
            previewVideo: string | null;
            price: number;
            currency: string;
            level: string;
            isFeatured: boolean;
        })[];
    } | {
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
    getInstructorStats(req: any): Promise<{
        success: boolean;
        data: {
            totalCourses: number;
            totalStudents: number;
            revenue: number;
        };
    }>;
    getCourseBySlug(slug: string, language?: string): Promise<{
        success: boolean;
        data: {
            course: {
                careerPath: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    titleAr: string;
                    descriptionAr: string;
                    titleEn: string;
                    descriptionEn: string;
                    sortOrder: number;
                    slug: string;
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
                        id: string;
                        createdAt: Date;
                        updatedAt: Date;
                        moduleId: string | null;
                        sectionId: string | null;
                        title: string;
                        titleAr: string | null;
                        description: string | null;
                        descriptionAr: string | null;
                        content: import("@prisma/client/runtime/library").JsonValue | null;
                        type: string;
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
                    id: string;
                    courseId: string;
                    title: string;
                    order: number;
                })[];
                _count: {
                    enrollments: number;
                };
            } & {
                id: string;
                status: import(".prisma/client").$Enums.CourseStatus;
                createdAt: Date;
                updatedAt: Date;
                titleAr: string | null;
                descriptionAr: string | null;
                titleEn: string;
                descriptionEn: string | null;
                sortOrder: number;
                thumbnail: string | null;
                duration: number | null;
                slug: string;
                careerPathId: string | null;
                instructorId: string | null;
                categoryId: string | null;
                previewVideo: string | null;
                price: number;
                currency: string;
                level: string;
                isFeatured: boolean;
            };
        };
    } | {
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
                    quizzesCount: number;
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
            enrollment: {
                id: string;
                courseId: string;
                status: import(".prisma/client").$Enums.EnrollmentStatus;
                progress: number;
                completedLessons: number;
                completedLessonIds: string[];
                totalLessons: number;
                enrolledAt: Date;
                completedAt: Date;
            };
        };
    }>;
    markLessonComplete(courseId: string, lessonId: string, req: any): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    heartbeat(courseId: string, lessonId: string, seconds: number, req: any): Promise<{
        success: boolean;
        data: {
            timeSpent: number;
        };
    }>;
    completeCheck(courseId: string, req: any): Promise<{
        success: boolean;
        data: {
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
    getInstructorCourseDetails(id: string, req: any): Promise<{
        success: boolean;
        data: {
            sections: ({
                lessons: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    moduleId: string | null;
                    sectionId: string | null;
                    title: string;
                    titleAr: string | null;
                    description: string | null;
                    descriptionAr: string | null;
                    content: import("@prisma/client/runtime/library").JsonValue | null;
                    type: string;
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
                id: string;
                courseId: string;
                title: string;
                order: number;
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
                userId: string;
                courseId: string;
                status: import(".prisma/client").$Enums.EnrollmentStatus;
                progress: number;
                enrolledAt: Date;
                completedAt: Date | null;
                expiresAt: Date | null;
            })[];
            _count: {
                enrollments: number;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            createdAt: Date;
            updatedAt: Date;
            titleAr: string | null;
            descriptionAr: string | null;
            titleEn: string;
            descriptionEn: string | null;
            sortOrder: number;
            thumbnail: string | null;
            duration: number | null;
            slug: string;
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
            previewVideo: string | null;
            price: number;
            currency: string;
            level: string;
            isFeatured: boolean;
        };
    }>;
    addSection(id: string, req: any, body: {
        title: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            courseId: string;
            title: string;
            order: number;
        };
    }>;
    addLesson(sectionId: string, body: any): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            moduleId: string | null;
            sectionId: string | null;
            title: string;
            titleAr: string | null;
            description: string | null;
            descriptionAr: string | null;
            content: import("@prisma/client/runtime/library").JsonValue | null;
            type: string;
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
    createCourse(req: any, body: any): Promise<{
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
                id: string;
                courseId: string;
                title: string;
                order: number;
            }[];
        } & {
            id: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            createdAt: Date;
            updatedAt: Date;
            titleAr: string | null;
            descriptionAr: string | null;
            titleEn: string;
            descriptionEn: string | null;
            sortOrder: number;
            thumbnail: string | null;
            duration: number | null;
            slug: string;
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
            previewVideo: string | null;
            price: number;
            currency: string;
            level: string;
            isFeatured: boolean;
        };
    } | {
        success: boolean;
        message: string;
        data: {
            course: {
                category: {
                    id: string;
                    slug: string;
                    icon: string | null;
                    nameAr: string;
                    nameEn: string;
                };
                sections: {
                    id: string;
                    courseId: string;
                    title: string;
                    order: number;
                }[];
            } & {
                id: string;
                status: import(".prisma/client").$Enums.CourseStatus;
                createdAt: Date;
                updatedAt: Date;
                titleAr: string | null;
                descriptionAr: string | null;
                titleEn: string;
                descriptionEn: string | null;
                sortOrder: number;
                thumbnail: string | null;
                duration: number | null;
                slug: string;
                careerPathId: string | null;
                instructorId: string | null;
                categoryId: string | null;
                previewVideo: string | null;
                price: number;
                currency: string;
                level: string;
                isFeatured: boolean;
            };
        };
    }>;
    updateCourse(id: string, req: any, body: any): Promise<{
        success: boolean;
        data: {
            id: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            createdAt: Date;
            updatedAt: Date;
            titleAr: string | null;
            descriptionAr: string | null;
            titleEn: string;
            descriptionEn: string | null;
            sortOrder: number;
            thumbnail: string | null;
            duration: number | null;
            slug: string;
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
            previewVideo: string | null;
            price: number;
            currency: string;
            level: string;
            isFeatured: boolean;
        };
    } | {
        success: boolean;
        message: string;
        data: {
            course: {
                id: string;
                status: import(".prisma/client").$Enums.CourseStatus;
                createdAt: Date;
                updatedAt: Date;
                titleAr: string | null;
                descriptionAr: string | null;
                titleEn: string;
                descriptionEn: string | null;
                sortOrder: number;
                thumbnail: string | null;
                duration: number | null;
                slug: string;
                careerPathId: string | null;
                instructorId: string | null;
                categoryId: string | null;
                previewVideo: string | null;
                price: number;
                currency: string;
                level: string;
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
                id: string;
                status: import(".prisma/client").$Enums.CourseStatus;
                createdAt: Date;
                updatedAt: Date;
                titleAr: string | null;
                descriptionAr: string | null;
                titleEn: string;
                descriptionEn: string | null;
                sortOrder: number;
                thumbnail: string | null;
                duration: number | null;
                slug: string;
                careerPathId: string | null;
                instructorId: string | null;
                categoryId: string | null;
                previewVideo: string | null;
                price: number;
                currency: string;
                level: string;
                isFeatured: boolean;
            };
        };
    }>;
    unpublishCourse(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            course: {
                id: string;
                status: import(".prisma/client").$Enums.CourseStatus;
                createdAt: Date;
                updatedAt: Date;
                titleAr: string | null;
                descriptionAr: string | null;
                titleEn: string;
                descriptionEn: string | null;
                sortOrder: number;
                thumbnail: string | null;
                duration: number | null;
                slug: string;
                careerPathId: string | null;
                instructorId: string | null;
                categoryId: string | null;
                previewVideo: string | null;
                price: number;
                currency: string;
                level: string;
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
                    createdAt: Date;
                    updatedAt: Date;
                    titleAr: string;
                    descriptionAr: string;
                    titleEn: string;
                    descriptionEn: string;
                    sortOrder: number;
                    slug: string;
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
                id: string;
                status: import(".prisma/client").$Enums.CourseStatus;
                createdAt: Date;
                updatedAt: Date;
                titleAr: string | null;
                descriptionAr: string | null;
                titleEn: string;
                descriptionEn: string | null;
                sortOrder: number;
                thumbnail: string | null;
                duration: number | null;
                slug: string;
                careerPathId: string | null;
                instructorId: string | null;
                categoryId: string | null;
                previewVideo: string | null;
                price: number;
                currency: string;
                level: string;
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
