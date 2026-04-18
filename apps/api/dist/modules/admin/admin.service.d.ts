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
    createCourseAdminFull(courseData: any, adminId?: string): Promise<any>;
    createCourseWithUploads(courseData: any, files: Express.Multer.File[], adminId?: string): Promise<{
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
    }>;
    createSessionWithImage(data: any, image?: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        meetingMethod: string;
        updatedAt: Date;
        price: number;
        duration: number;
        notes: string | null;
        studentId: string;
        consultantId: string;
        scheduledAt: Date;
        meetingLink: string | null;
        topic: string | null;
        paymentStatus: string;
        paymentId: string | null;
        proposedAt: Date | null;
        proposedTime: Date | null;
    }>;
    getAllConfirmedPayments(): Promise<{
        success: boolean;
        data: ({
            user: {
                email: string;
                profile: {
                    firstName: string;
                    lastName: string;
                };
            };
            course: {
                titleEn: string;
                titleAr: string;
            };
        } & {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            method: string;
            status: string;
            updatedAt: Date;
            description: string | null;
            courseId: string | null;
            completedAt: Date | null;
            currency: string;
            amount: number;
            transactionId: string | null;
            stripeIntentId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
        })[];
        total: number;
    }>;
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
                userId: string;
                bio: string | null;
                linkedinUrl: string | null;
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
            };
        } & {
            id: string;
            createdAt: Date;
            email: string;
            password: string;
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
        })[];
        recentPayments: any[] | ({
            user: {
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
                    dateOfBirth: Date | null;
                    gender: import(".prisma/client").$Enums.Gender | null;
                    nationality: string | null;
                    country: string | null;
                    city: string | null;
                    avatar: string | null;
                    timezone: string;
                    language: string;
                };
            } & {
                id: string;
                createdAt: Date;
                email: string;
                password: string;
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
        } & {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            method: string;
            status: string;
            updatedAt: Date;
            description: string | null;
            courseId: string | null;
            completedAt: Date | null;
            currency: string;
            amount: number;
            transactionId: string | null;
            stripeIntentId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
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
                dateOfBirth: Date | null;
                gender: import(".prisma/client").$Enums.Gender | null;
                nationality: string | null;
                country: string | null;
                city: string | null;
                avatar: string | null;
                timezone: string;
                language: string;
            };
            _count: {
                enrollments: number;
                payments: number;
            };
        } & {
            id: string;
            createdAt: Date;
            email: string;
            password: string;
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
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    getUserDetails(id: string): Promise<{
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
            dateOfBirth: Date | null;
            gender: import(".prisma/client").$Enums.Gender | null;
            nationality: string | null;
            country: string | null;
            city: string | null;
            avatar: string | null;
            timezone: string;
            language: string;
        };
        enrollments: ({
            course: {
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
        payments: {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            method: string;
            status: string;
            updatedAt: Date;
            description: string | null;
            courseId: string | null;
            completedAt: Date | null;
            currency: string;
            amount: number;
            transactionId: string | null;
            stripeIntentId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        email: string;
        password: string;
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
    }>;
    getUserById(id: string): Promise<{
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
            dateOfBirth: Date | null;
            gender: import(".prisma/client").$Enums.Gender | null;
            nationality: string | null;
            country: string | null;
            city: string | null;
            avatar: string | null;
            timezone: string;
            language: string;
        };
    } & {
        id: string;
        createdAt: Date;
        email: string;
        password: string;
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
    }>;
    updateUser(id: string, updateData: any): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        password: string;
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
    }>;
    deleteUser(id: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        password: string;
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
    }>;
    suspendUser(id: string, reason?: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        password: string;
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
    }>;
    unsuspendUser(id: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        password: string;
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
            category: {
                id: string;
                slug: string;
                icon: string | null;
                nameAr: string;
                nameEn: string;
            };
            _count: {
                enrollments: number;
            };
            instructor: {
                id: string;
                email: string;
                profile: {
                    firstName: string;
                    lastName: string;
                };
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
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    createCourse(courseData: any, adminId?: string): Promise<{
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
            _count: {
                sections: number;
            };
            sections: ({
                lessons: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    titleAr: string | null;
                    type: string;
                    description: string | null;
                    title: string;
                    content: import("@prisma/client/runtime/library").JsonValue | null;
                    descriptionAr: string | null;
                    isPublished: boolean;
                    moduleId: string | null;
                    sectionId: string | null;
                    videoUrl: string | null;
                    videoDuration: number | null;
                    fileUrl: string | null;
                    fileName: string | null;
                    fileSize: number | null;
                    isFree: boolean;
                    order: number;
                }[];
            } & {
                id: string;
                title: string;
                courseId: string;
                order: number;
            })[];
            instructor: {
                id: string;
                email: string;
                profile: {
                    firstName: string;
                    lastName: string;
                };
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
        })[];
    }>;
    approveCourse(id: string): Promise<{
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
    }>;
    rejectCourse(id: string, reason?: string): Promise<{
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
    }>;
    getPendingContent(): Promise<{
        courses: {
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
                userId: string;
                bio: string | null;
                linkedinUrl: string | null;
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
            };
        } & {
            id: string;
            createdAt: Date;
            email: string;
            password: string;
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
        })[];
        format: string;
    }>;
    exportCourses(format: string): Promise<{
        courses: ({
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
        createdAt: Date;
        email: string;
        accountType: string;
        status: string;
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
        recentUsers: {
            id: string;
            createdAt: Date;
            email: string;
            accountType: string;
            status: string;
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
            user: {
                email: string;
                profile: {
                    firstName: string;
                    lastName: string;
                };
            };
            course: {
                titleEn: string;
                titleAr: string;
            };
        } & {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            method: string;
            status: string;
            updatedAt: Date;
            description: string | null;
            courseId: string | null;
            completedAt: Date | null;
            currency: string;
            amount: number;
            transactionId: string | null;
            stripeIntentId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
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
            userId: string;
            bio: string | null;
            linkedinUrl: string | null;
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
        };
    } & {
        id: string;
        createdAt: Date;
        email: string;
        password: string;
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
    }>;
    rejectUser(userId: string, reason?: string, adminId?: string): Promise<{
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
            dateOfBirth: Date | null;
            gender: import(".prisma/client").$Enums.Gender | null;
            nationality: string | null;
            country: string | null;
            city: string | null;
            avatar: string | null;
            timezone: string;
            language: string;
        };
    } & {
        id: string;
        createdAt: Date;
        email: string;
        password: string;
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
    }>;
    banUser(userId: string, adminId?: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        password: string;
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
    }>;
    unbanUser(userId: string, adminId?: string): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        password: string;
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
            createdAt: Date;
            status: string;
            meetingMethod: string;
            updatedAt: Date;
            price: number;
            duration: number;
            notes: string | null;
            studentId: string;
            consultantId: string;
            scheduledAt: Date;
            meetingLink: string | null;
            topic: string | null;
            paymentStatus: string;
            paymentId: string | null;
            proposedAt: Date | null;
            proposedTime: Date | null;
        })[];
    }>;
    createUser(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        accountType: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        accountType: string;
        status: string;
        profile: {
            firstName: string;
            lastName: string;
        };
    }>;
    changeUserRole(id: string, accountType: string): Promise<{
        id: string;
        email: string;
        accountType: string;
    }>;
    changeUserStatus(id: string, status: string): Promise<{
        id: string;
        email: string;
        status: string;
    }>;
    createSession(data: any): Promise<{
        id: string;
        createdAt: Date;
        status: string;
        meetingMethod: string;
        updatedAt: Date;
        price: number;
        duration: number;
        notes: string | null;
        studentId: string;
        consultantId: string;
        scheduledAt: Date;
        meetingLink: string | null;
        topic: string | null;
        paymentStatus: string;
        paymentId: string | null;
        proposedAt: Date | null;
        proposedTime: Date | null;
    }>;
    getLiveActivity(limit?: number): Promise<({
        user: {
            id: string;
            email: string;
            accountType: string;
            profile: {
                firstName: string;
                lastName: string;
            };
        };
    } & {
        id: string;
        action: string;
        entity: string | null;
        entityId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        createdAt: Date;
        userId: string;
    })[]>;
    getUserActivity(userId: string, limit?: number): Promise<{
        id: string;
        action: string;
        entity: string | null;
        entityId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        createdAt: Date;
        userId: string;
    }[]>;
    getUserDetail(id: string): Promise<{
        user: {
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
                dateOfBirth: Date | null;
                gender: import(".prisma/client").$Enums.Gender | null;
                nationality: string | null;
                country: string | null;
                city: string | null;
                avatar: string | null;
                timezone: string;
                language: string;
            };
            _count: {
                enrollments: number;
            };
        } & {
            id: string;
            createdAt: Date;
            email: string;
            password: string;
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
        activities: {
            id: string;
            action: string;
            entity: string | null;
            entityId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string | null;
            createdAt: Date;
            userId: string;
        }[];
        payments: any[] | ({
            course: {
                titleEn: string;
                titleAr: string;
            };
        } & {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            method: string;
            status: string;
            updatedAt: Date;
            description: string | null;
            courseId: string | null;
            completedAt: Date | null;
            currency: string;
            amount: number;
            transactionId: string | null;
            stripeIntentId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
        })[];
        enrollments: any[] | ({
            course: {
                titleEn: string;
                titleAr: string;
                thumbnail: string;
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
        totalSpent: any;
    }>;
    getActivityStats(): Promise<{
        onlineUsers: number;
        todayActivity: number;
        totalActivities: number;
    }>;
}
