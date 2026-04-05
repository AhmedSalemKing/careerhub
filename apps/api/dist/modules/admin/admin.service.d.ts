import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
export declare class AdminService {
    private prisma;
    private configService;
    private analyticsService;
    private notificationsService;
    private emailService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, analyticsService: AnalyticsService, notificationsService: NotificationsService, emailService: EmailService);
    getDashboardOverview(): Promise<{
        stats: {
            totalUsers: number;
            activeCourses: number;
            monthlyRevenue: number;
            totalRevenue: number;
            pendingSessions: number;
        };
        revenueLast12Months: {
            month: string;
            revenue: number;
        }[];
        newUsersLast30Days: {
            date: string;
            users: number;
        }[];
        recentUsers: any[] | ({
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                language: string;
                userId: string;
                bio: string | null;
                linkedinUrl: string | null;
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
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            accountType: string;
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
            deletedAt: Date | null;
        })[];
        recentPayments: any[] | ({
            user: {
                profile: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    language: string;
                    userId: string;
                    bio: string | null;
                    linkedinUrl: string | null;
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
                };
            } & {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                isActive: boolean;
                email: string;
                password: string;
                role: import(".prisma/client").$Enums.UserRole;
                accountType: string;
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
                deletedAt: Date | null;
            };
        } & {
            id: string;
            currency: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            courseId: string | null;
            userId: string;
            completedAt: Date | null;
            amount: number;
            method: string;
            transactionId: string | null;
            stripeIntentId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    }>;
    getPlatformStats(): Promise<{
        totalUsers: number;
        totalCourses: number;
        totalSessions: number;
        totalRevenue: number;
    }>;
    getUsers(options: {
        page: number;
        limit: number;
        search?: string;
        role?: string;
        status?: string;
    }): Promise<{
        users: ({
            _count: {
                enrollments: number;
                payments: number;
            };
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                language: string;
                userId: string;
                bio: string | null;
                linkedinUrl: string | null;
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
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            accountType: string;
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
            deletedAt: Date | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUserDetails(id: string): Promise<{
        enrollments: ({
            course: {
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
                sortOrder: number;
                createdAt: Date;
                updatedAt: Date;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            courseId: string;
            userId: string;
            progress: number;
            enrolledAt: Date;
            completedAt: Date | null;
            expiresAt: Date | null;
        })[];
        payments: {
            id: string;
            currency: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            courseId: string | null;
            userId: string;
            completedAt: Date | null;
            amount: number;
            method: string;
            transactionId: string | null;
            stripeIntentId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            language: string;
            userId: string;
            bio: string | null;
            linkedinUrl: string | null;
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
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
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
        deletedAt: Date | null;
    }>;
    getUserById(id: string): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            language: string;
            userId: string;
            bio: string | null;
            linkedinUrl: string | null;
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
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
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
        deletedAt: Date | null;
    }>;
    updateUser(id: string, updateData: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
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
        deletedAt: Date | null;
    }>;
    deleteUser(id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
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
        deletedAt: Date | null;
    }>;
    suspendUser(id: string, reason?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
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
        deletedAt: Date | null;
    }>;
    unsuspendUser(id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
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
        deletedAt: Date | null;
    }>;
    getAdminCourses(options: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        level?: string;
    }): Promise<{
        courses: ({
            careerPath: {
                id: string;
                slug: string;
                titleEn: string;
                titleAr: string;
                descriptionEn: string;
                descriptionAr: string;
                sortOrder: number;
                createdAt: Date;
                updatedAt: Date;
                skills: string[];
                salaryRangeEn: string;
                salaryRangeAr: string;
                jobTitlesEn: string[];
                jobTitlesAr: string[];
                demandLevel: string;
                icon: string | null;
                color: string | null;
                isActive: boolean;
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
                email: string;
                profile: {
                    firstName: string;
                    lastName: string;
                };
            };
            _count: {
                enrollments: number;
            };
        } & {
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
            sortOrder: number;
            createdAt: Date;
            updatedAt: Date;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    createCourse(courseData: any): Promise<{
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
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPendingCourses(): Promise<{
        success: boolean;
        data: ({
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
                };
            };
            sections: ({
                lessons: {
                    id: string;
                    titleAr: string | null;
                    descriptionAr: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    title: string;
                    description: string | null;
                    isPublished: boolean;
                    order: number;
                    moduleId: string | null;
                    sectionId: string | null;
                    content: import("@prisma/client/runtime/library").JsonValue | null;
                    type: string;
                    videoUrl: string | null;
                    videoDuration: number | null;
                    fileUrl: string | null;
                    fileName: string | null;
                    fileSize: number | null;
                    isFree: boolean;
                }[];
            } & {
                id: string;
                title: string;
                courseId: string;
                order: number;
            })[];
            _count: {
                sections: number;
            };
        } & {
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
            sortOrder: number;
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
    approveCourse(id: string): Promise<{
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
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    rejectCourse(id: string, reason?: string): Promise<{
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
        sortOrder: number;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getPendingContent(): Promise<{
        courses: {
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
            sortOrder: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
        lessons: any[];
        assessments: any[];
    }>;
    approveContent(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
    rejectContent(id: string, reason: string): Promise<{
        success: boolean;
        id: string;
        reason: string;
    }>;
    getReports(options: {
        page: number;
        limit: number;
        status?: string;
    }): Promise<{
        reports: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    resolveReport(id: string, resolutionData: any): Promise<{
        success: boolean;
        id: string;
        resolutionData: any;
    }>;
    getRevenueAnalytics(startDate?: Date, endDate?: Date): Promise<{
        total: number;
        monthly: any[];
    }>;
    getEngagementAnalytics(startDate?: Date, endDate?: Date): Promise<{
        data: any[];
    }>;
    getCourseAnalyticsAll(): Promise<{
        enrollments: number;
    }>;
    getSystemHealth(): Promise<{
        status: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        timestamp: Date;
    }>;
    getSystemLogs(level?: string, limit?: number): Promise<{
        logs: {
            id: string;
            level: string;
            message: string;
            timestamp: Date;
        }[];
        total: number;
    }>;
    createBackup(backupData: any): Promise<{
        id: string;
        type: any;
        createdAt: Date;
        status: string;
    }>;
    getBackups(): Promise<{
        id: string;
        type: string;
        createdAt: Date;
        status: string;
    }[]>;
    restoreBackup(backupId: string): Promise<{
        backupId: string;
        restoredAt: Date;
        status: string;
    }>;
    getSettings(): Promise<{
        siteName: string;
        maintenanceMode: boolean;
        registrationEnabled: boolean;
        emailNotifications: boolean;
    }>;
    updateSettings(settingsData: any): Promise<any>;
    uploadLogo(file: Express.Multer.File): Promise<{
        url: string;
        size: number;
        originalName: string;
    }>;
    broadcastNotification(notificationData: any): Promise<{
        sent: number;
        skipped: number;
    }>;
    getNotificationTemplates(): Promise<{
        id: string;
        name: string;
        type: string;
        subjectEn: string;
        subjectAr: string;
        contentEn: string;
        contentAr: string;
        variables: string[];
    }[]>;
    exportUsers(format: string): Promise<{
        users: ({
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                language: string;
                userId: string;
                bio: string | null;
                linkedinUrl: string | null;
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
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            isActive: boolean;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            accountType: string;
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
            deletedAt: Date | null;
        })[];
        format: string;
    }>;
    exportCourses(format: string): Promise<{
        courses: ({
            careerPath: {
                id: string;
                slug: string;
                titleEn: string;
                titleAr: string;
                descriptionEn: string;
                descriptionAr: string;
                sortOrder: number;
                createdAt: Date;
                updatedAt: Date;
                skills: string[];
                salaryRangeEn: string;
                salaryRangeAr: string;
                jobTitlesEn: string[];
                jobTitlesAr: string[];
                demandLevel: string;
                icon: string | null;
                color: string | null;
                isActive: boolean;
            };
        } & {
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
            sortOrder: number;
            createdAt: Date;
            updatedAt: Date;
        })[];
        format: string;
    }>;
    importUsers(file: Express.Multer.File): Promise<{
        total: number;
        imported: number;
        failed: number;
        errors: any[];
    }>;
    getAuditLog(options: {
        page: number;
        limit: number;
        action?: string;
        userId?: string;
    }): Promise<{
        entries: {
            id: string;
            userId: string;
            action: string;
            timestamp: Date;
            details: {};
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    forcePasswordReset(data: any): Promise<{
        sent: number;
        message: any;
    }>;
    getActiveSessions(): Promise<{
        sessionId: string;
        userId: string;
        email: string;
        createdAt: Date;
        lastActivity: Date;
    }[]>;
    revokeSession(sessionId: string): Promise<{
        success: boolean;
        sessionId: string;
    }>;
    getPerformanceMetrics(): Promise<{
        cpu: number;
        memory: number;
        requests: number;
        responseTime: number;
        timestamp: Date;
    }>;
    getRecentErrors(limit?: number): Promise<{
        id: string;
        message: string;
        timestamp: Date;
        level: string;
    }[]>;
    getUsageStatistics(): Promise<{
        apiCalls: number;
        storageUsed: number;
        bandwidthUsed: number;
        activeConnections: number;
    }>;
    private log;
    getAuditLogs(limit?: number): Promise<any>;
    getPendingApprovals(): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        email: string;
        accountType: string;
        cvUrl: string;
        bio: string;
        experience: number;
        speciality: string;
        linkedinUrl: string;
        hourlyRate: number;
        meetingMethod: string;
        profile: {
            firstName: string;
            lastName: string;
            avatar: string;
        };
    }[]>;
    getDashboardStats(): Promise<{
        totalUsers: number;
        totalCourses: number;
        pendingUsers: number;
        totalRevenue: number;
        monthlyRevenue: number;
        todayRevenue: number;
        recentUsers: any[] | {
            id: string;
            status: string;
            createdAt: Date;
            email: string;
            accountType: string;
            profile: {
                firstName: string;
                lastName: string;
                avatar: string;
            };
        }[];
        monthlyChart: {
            month: string;
            revenue: number;
        }[];
    }>;
    getAllPayments(): Promise<{
        success: boolean;
        data: ({
            course: {
                titleEn: string;
                titleAr: string;
            };
            user: {
                email: string;
                profile: {
                    firstName: string;
                    lastName: string;
                };
            };
        } & {
            id: string;
            currency: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            courseId: string | null;
            userId: string;
            completedAt: Date | null;
            amount: number;
            method: string;
            transactionId: string | null;
            stripeIntentId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        total: number;
    }>;
    clearSeedData(): Promise<{
        success: boolean;
        message: string;
    }>;
    approveUser(userId: string, adminId?: string): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            language: string;
            userId: string;
            bio: string | null;
            linkedinUrl: string | null;
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
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
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
        deletedAt: Date | null;
    }>;
    rejectUser(userId: string, reason?: string, adminId?: string): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            language: string;
            userId: string;
            bio: string | null;
            linkedinUrl: string | null;
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
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
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
        deletedAt: Date | null;
    }>;
    banUser(userId: string, adminId?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
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
        deletedAt: Date | null;
    }>;
    unbanUser(userId: string, adminId?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        accountType: string;
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
        deletedAt: Date | null;
    }>;
    getSiteSettings(): Promise<{
        id: string;
        updatedAt: Date;
        siteName: string;
        primaryColor: string;
        backgroundColor: string;
        buttonColor: string;
        logoUrl: string | null;
    }>;
    updateSiteSettings(data: {
        siteName?: string;
        primaryColor?: string;
        backgroundColor?: string;
        buttonColor?: string;
        logoUrl?: string;
    }): Promise<{
        id: string;
        updatedAt: Date;
        siteName: string;
        primaryColor: string;
        backgroundColor: string;
        buttonColor: string;
        logoUrl: string | null;
    }>;
    getAllSessions(): Promise<{
        success: boolean;
        data: ({
            student: {
                email: string;
                profile: {
                    firstName: string;
                    lastName: string;
                };
            };
            consultant: {
                email: string;
                profile: {
                    firstName: string;
                    lastName: string;
                };
            };
        } & {
            id: string;
            price: number;
            duration: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            meetingMethod: string;
            studentId: string;
            consultantId: string;
            scheduledAt: Date;
            meetingLink: string | null;
            topic: string | null;
            notes: string | null;
            paymentStatus: string;
            paymentId: string | null;
            proposedAt: Date | null;
            proposedTime: Date | null;
        })[];
    }>;
}
