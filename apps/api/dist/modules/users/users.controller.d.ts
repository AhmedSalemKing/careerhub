import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from '@prisma/client';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(user: User): Promise<{
        success: boolean;
        data: {
            profile: {
                profile: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    bio: string | null;
                    linkedinUrl: string | null;
                    updatedAt: Date;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                    country: string | null;
                    city: string | null;
                    language: string;
                    dateOfBirth: Date | null;
                    gender: import(".prisma/client").$Enums.Gender | null;
                    nationality: string | null;
                    avatar: string | null;
                    timezone: string;
                };
                _count: {
                    enrollments: number;
                    certificates: number;
                    coachingSessions: number;
                };
                id: string;
                createdAt: Date;
                email: string;
                role: import(".prisma/client").$Enums.UserRole;
                isActive: boolean;
                accountType: string;
                status: string;
                cvUrl: string | null;
                bio: string | null;
                experience: number | null;
                speciality: string | null;
                linkedinUrl: string | null;
                hourlyRate: number | null;
                meetingMethod: string | null;
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
                updatedAt: Date;
                deletedAt: Date | null;
            };
        };
    }>;
    updateProfile(user: User, updateProfileDto: UpdateProfileDto): Promise<{
        success: boolean;
        message: string;
        data: {
            profile: {
                id: string;
                createdAt: Date;
                userId: string;
                bio: string | null;
                linkedinUrl: string | null;
                updatedAt: Date;
                firstName: string;
                lastName: string;
                phone: string | null;
                country: string | null;
                city: string | null;
                language: string;
                dateOfBirth: Date | null;
                gender: import(".prisma/client").$Enums.Gender | null;
                nationality: string | null;
                avatar: string | null;
                timezone: string;
            };
        };
    }>;
    uploadAvatar(user: User, file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            avatarUrl: string;
        };
    }>;
    getDashboard(user: User): Promise<{
        success: boolean;
        data: any;
    }>;
    getEnrollments(user: User, page?: number, limit?: number, status?: string): Promise<{
        success: boolean;
        data: {
            enrollments: ({
                course: {
                    careerPath: {
                        id: string;
                        createdAt: Date;
                        isActive: boolean;
                        updatedAt: Date;
                        titleEn: string;
                        titleAr: string;
                        slug: string;
                        descriptionEn: string;
                        descriptionAr: string;
                        sortOrder: number;
                        skills: string[];
                        salaryRangeEn: string;
                        salaryRangeAr: string;
                        jobTitlesEn: string[];
                        jobTitlesAr: string[];
                        demandLevel: string;
                        icon: string | null;
                        color: string | null;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    status: import(".prisma/client").$Enums.CourseStatus;
                    updatedAt: Date;
                    titleEn: string;
                    titleAr: string | null;
                    slug: string;
                    careerPathId: string | null;
                    instructorId: string | null;
                    categoryId: string | null;
                    descriptionEn: string | null;
                    descriptionAr: string | null;
                    thumbnail: string | null;
                    previewVideo: string | null;
                    price: number;
                    currency: string;
                    duration: number | null;
                    level: string;
                    isFeatured: boolean;
                    sortOrder: number;
                };
            } & {
                id: string;
                userId: string;
                status: import(".prisma/client").$Enums.EnrollmentStatus;
                expiresAt: Date | null;
                courseId: string;
                progress: number;
                enrolledAt: Date;
                completedAt: Date | null;
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
    getCertificates(user: User, page?: number, limit?: number): Promise<{
        success: boolean;
        data: {
            certificates: ({
                course: {
                    careerPath: {
                        id: string;
                        createdAt: Date;
                        isActive: boolean;
                        updatedAt: Date;
                        titleEn: string;
                        titleAr: string;
                        slug: string;
                        descriptionEn: string;
                        descriptionAr: string;
                        sortOrder: number;
                        skills: string[];
                        salaryRangeEn: string;
                        salaryRangeAr: string;
                        jobTitlesEn: string[];
                        jobTitlesAr: string[];
                        demandLevel: string;
                        icon: string | null;
                        color: string | null;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    status: import(".prisma/client").$Enums.CourseStatus;
                    updatedAt: Date;
                    titleEn: string;
                    titleAr: string | null;
                    slug: string;
                    careerPathId: string | null;
                    instructorId: string | null;
                    categoryId: string | null;
                    descriptionEn: string | null;
                    descriptionAr: string | null;
                    thumbnail: string | null;
                    previewVideo: string | null;
                    price: number;
                    currency: string;
                    duration: number | null;
                    level: string;
                    isFeatured: boolean;
                    sortOrder: number;
                };
            } & {
                id: string;
                userId: string;
                certificateUrl: string;
                expiresAt: Date | null;
                courseId: string;
                serialNumber: string;
                qrCodeUrl: string;
                issuedAt: Date;
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
    getProgress(user: User): Promise<{
        success: boolean;
        data: {
            overallProgress: number;
            courses: {
                courseId: string;
                courseTitle: any;
                progress: number;
                totalLessons: number;
                enrolledAt: Date;
                completedAt: Date;
                status: import(".prisma/client").$Enums.EnrollmentStatus;
            }[];
        };
    }>;
    getAchievements(user: User): Promise<{
        success: boolean;
        data: {
            achievements: {
                id: string;
                title: string;
                description: string;
                icon: string;
                earnedAt: Date;
            }[];
        };
    }>;
    getNotifications(user: User, page?: number, limit?: number, unread?: boolean): Promise<{
        success: boolean;
        data: {
            notifications: {
                data: import("@prisma/client/runtime/library").JsonValue | null;
                id: string;
                createdAt: Date;
                userId: string;
                titleEn: string;
                titleAr: string;
                contentEn: string;
                contentAr: string;
                type: import(".prisma/client").$Enums.NotificationType;
                isRead: boolean;
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
    markNotificationsRead(user: User, notificationIds: string[]): Promise<{
        success: boolean;
        message: string;
    }>;
    getSettings(user: User): Promise<{
        success: boolean;
        data: {
            settings: {
                language: string;
                timezone: string;
                emailNotifications: boolean;
                pushNotifications: boolean;
                theme: string;
            };
        };
    }>;
    updateSettings(user: User, settings: {
        language?: string;
        timezone?: string;
        emailNotifications?: boolean;
        pushNotifications?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            settings: {
                language?: string;
                timezone?: string;
                emailNotifications?: boolean;
                pushNotifications?: boolean;
            };
        };
    }>;
    deleteAccount(user: User, password: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getStats(user: User): Promise<{
        success: boolean;
        data: {
            totalEnrollments: number;
            completedCourses: number;
            totalCertificates: number;
            totalLearningTime: number;
            upcomingSessions: number;
            completionRate: number;
        };
    }>;
}
