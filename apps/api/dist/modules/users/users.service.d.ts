import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class UsersService {
    private prisma;
    private configService;
    private readonly logger;
    private readonly s3;
    private readonly cacheTtlMs;
    private readonly cache;
    constructor(prisma: PrismaService, configService: ConfigService);
    getProfile(userId: string): Promise<{
        profile: {
            id: string;
            bio: string | null;
            linkedinUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            firstName: string;
            lastName: string;
            phone: string | null;
            dateOfBirth: Date | null;
            gender: import(".prisma/client").$Enums.Gender | null;
            nationality: string | null;
            country: string | null;
            city: string | null;
            avatar: string | null;
            timezone: string;
            language: string;
            userId: string;
        };
        _count: {
            enrollments: number;
            certificates: number;
            coachingSessions: number;
        };
        id: string;
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
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
    }>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<{
        id: string;
        bio: string | null;
        linkedinUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
        firstName: string;
        lastName: string;
        phone: string | null;
        dateOfBirth: Date | null;
        gender: import(".prisma/client").$Enums.Gender | null;
        nationality: string | null;
        country: string | null;
        city: string | null;
        avatar: string | null;
        timezone: string;
        language: string;
        userId: string;
    }>;
    uploadAvatar(userId: string, file: Express.Multer.File): Promise<string>;
    getDashboard(userId: string): Promise<any>;
    getUserDashboard(userId: string): Promise<any>;
    getEnrollments(userId: string, options: {
        page: number;
        limit: number;
        status?: string;
    }): Promise<{
        enrollments: ({
            course: {
                careerPath: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    titleEn: string;
                    titleAr: string;
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
                status: import(".prisma/client").$Enums.CourseStatus;
                createdAt: Date;
                updatedAt: Date;
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
                isFeatured: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            userId: string;
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
    }>;
    getCertificates(userId: string, options: {
        page: number;
        limit: number;
    }): Promise<{
        certificates: ({
            course: {
                careerPath: {
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    slug: string;
                    titleEn: string;
                    titleAr: string;
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
                status: import(".prisma/client").$Enums.CourseStatus;
                createdAt: Date;
                updatedAt: Date;
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
                isFeatured: boolean;
                sortOrder: number;
            };
        } & {
            id: string;
            userId: string;
            expiresAt: Date | null;
            courseId: string;
            serialNumber: string;
            certificateUrl: string;
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
    }>;
    getProgress(userId: string): Promise<{
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
    }>;
    getAchievements(userId: string): Promise<{
        id: string;
        title: string;
        description: string;
        icon: string;
        earnedAt: Date;
    }[]>;
    getNotifications(userId: string, options: {
        page: number;
        limit: number;
        unread?: boolean;
    }): Promise<{
        notifications: {
            id: string;
            createdAt: Date;
            data: import("@prisma/client/runtime/library").JsonValue | null;
            userId: string;
            type: import(".prisma/client").$Enums.NotificationType;
            titleEn: string;
            titleAr: string;
            contentEn: string;
            contentAr: string;
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
    }>;
    markNotificationsRead(userId: string, notificationIds: string[]): Promise<void>;
    getSettings(userId: string): Promise<{
        language: string;
        timezone: string;
        emailNotifications: boolean;
        pushNotifications: boolean;
        theme: string;
    }>;
    updateSettings(userId: string, settings: {
        language?: string;
        timezone?: string;
        emailNotifications?: boolean;
        pushNotifications?: boolean;
    }): Promise<{
        language?: string;
        timezone?: string;
        emailNotifications?: boolean;
        pushNotifications?: boolean;
    }>;
    deleteAccount(userId: string, password: string): Promise<void>;
    getStats(userId: string): Promise<{
        totalEnrollments: number;
        completedCourses: number;
        totalCertificates: number;
        totalLearningTime: number;
        upcomingSessions: number;
        completionRate: number;
    }>;
    private sanitizeUser;
    private calculateOverallProgress;
    private getUserStats;
    private getRecentActivity;
    private getRecommendations;
}
