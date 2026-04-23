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
        slug: string;
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
        careerPathId: string | null;
        instructorId: string | null;
        categoryId: string | null;
    }>;
    createSessionWithImage(data: any, image?: Express.Multer.File): Promise<{
        id: string;
        price: number;
        duration: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledAt: Date;
        meetingMethod: string;
        meetingLink: string | null;
        topic: string | null;
        notes: string | null;
        paymentStatus: string;
        paymentId: string | null;
        proposedAt: Date | null;
        proposedTime: Date | null;
        studentId: string;
        consultantId: string;
    }>;
    getAllConfirmedPayments(): Promise<{
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
            userId: string;
            courseId: string | null;
            amount: number;
            method: string;
            transactionId: string | null;
            stripeIntentId: string | null;
            description: string | null;
            itemType: string | null;
            itemId: string | null;
            completedAt: Date | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
                updatedAt: Date;
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
                language: string;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            meetingMethod: string | null;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            accountType: string;
            cvUrl: string | null;
            bio: string | null;
            experience: number | null;
            speciality: string | null;
            linkedinUrl: string | null;
            hourlyRate: number | null;
            googleId: string | null;
            provider: string;
            stripeCustomerId: string | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            rejectedReason: string | null;
            lastSeenAt: Date | null;
            deletedAt: Date | null;
        })[];
        recentPayments: any[] | ({
            user: {
                profile: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
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
                    language: string;
                };
            } & {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                meetingMethod: string | null;
                email: string;
                password: string;
                role: import(".prisma/client").$Enums.UserRole;
                isActive: boolean;
                accountType: string;
                cvUrl: string | null;
                bio: string | null;
                experience: number | null;
                speciality: string | null;
                linkedinUrl: string | null;
                hourlyRate: number | null;
                googleId: string | null;
                provider: string;
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
                deletedAt: Date | null;
            };
        } & {
            id: string;
            currency: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            courseId: string | null;
            amount: number;
            method: string;
            transactionId: string | null;
            stripeIntentId: string | null;
            description: string | null;
            itemType: string | null;
            itemId: string | null;
            completedAt: Date | null;
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
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
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
                language: string;
            };
            _count: {
                enrollments: number;
                payments: number;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            meetingMethod: string | null;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            accountType: string;
            cvUrl: string | null;
            bio: string | null;
            experience: number | null;
            speciality: string | null;
            linkedinUrl: string | null;
            hourlyRate: number | null;
            googleId: string | null;
            provider: string;
            stripeCustomerId: string | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            rejectedReason: string | null;
            lastSeenAt: Date | null;
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
                careerPathId: string | null;
                instructorId: string | null;
                categoryId: string | null;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            userId: string;
            courseId: string;
            completedAt: Date | null;
            enrolledAt: Date;
            progress: number;
            expiresAt: Date | null;
        })[];
        payments: {
            id: string;
            currency: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            courseId: string | null;
            amount: number;
            method: string;
            transactionId: string | null;
            stripeIntentId: string | null;
            description: string | null;
            itemType: string | null;
            itemId: string | null;
            completedAt: Date | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        }[];
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
            language: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        meetingMethod: string | null;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        cvUrl: string | null;
        bio: string | null;
        experience: number | null;
        speciality: string | null;
        linkedinUrl: string | null;
        hourlyRate: number | null;
        googleId: string | null;
        provider: string;
        stripeCustomerId: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectedReason: string | null;
        lastSeenAt: Date | null;
        deletedAt: Date | null;
    }>;
    getUserById(id: string): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
            language: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        meetingMethod: string | null;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        cvUrl: string | null;
        bio: string | null;
        experience: number | null;
        speciality: string | null;
        linkedinUrl: string | null;
        hourlyRate: number | null;
        googleId: string | null;
        provider: string;
        stripeCustomerId: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectedReason: string | null;
        lastSeenAt: Date | null;
        deletedAt: Date | null;
    }>;
    updateUser(id: string, updateData: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        meetingMethod: string | null;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        cvUrl: string | null;
        bio: string | null;
        experience: number | null;
        speciality: string | null;
        linkedinUrl: string | null;
        hourlyRate: number | null;
        googleId: string | null;
        provider: string;
        stripeCustomerId: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectedReason: string | null;
        lastSeenAt: Date | null;
        deletedAt: Date | null;
    }>;
    deleteUser(id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        meetingMethod: string | null;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        cvUrl: string | null;
        bio: string | null;
        experience: number | null;
        speciality: string | null;
        linkedinUrl: string | null;
        hourlyRate: number | null;
        googleId: string | null;
        provider: string;
        stripeCustomerId: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectedReason: string | null;
        lastSeenAt: Date | null;
        deletedAt: Date | null;
    }>;
    suspendUser(id: string, reason?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        meetingMethod: string | null;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        cvUrl: string | null;
        bio: string | null;
        experience: number | null;
        speciality: string | null;
        linkedinUrl: string | null;
        hourlyRate: number | null;
        googleId: string | null;
        provider: string;
        stripeCustomerId: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectedReason: string | null;
        lastSeenAt: Date | null;
        deletedAt: Date | null;
    }>;
    unsuspendUser(id: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        meetingMethod: string | null;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        cvUrl: string | null;
        bio: string | null;
        experience: number | null;
        speciality: string | null;
        linkedinUrl: string | null;
        hourlyRate: number | null;
        googleId: string | null;
        provider: string;
        stripeCustomerId: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectedReason: string | null;
        lastSeenAt: Date | null;
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
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    createCourse(courseData: any, adminId?: string): Promise<{
        id: string;
        slug: string;
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
        careerPathId: string | null;
        instructorId: string | null;
        categoryId: string | null;
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
                email: string;
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
                    description: string | null;
                    title: string;
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
                    isPublished: boolean;
                }[];
            } & {
                id: string;
                courseId: string;
                title: string;
                order: number;
            })[];
            _count: {
                sections: number;
            };
        } & {
            id: string;
            slug: string;
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
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
        })[];
    }>;
    approveCourse(id: string): Promise<{
        id: string;
        slug: string;
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
        careerPathId: string | null;
        instructorId: string | null;
        categoryId: string | null;
    }>;
    rejectCourse(id: string, reason?: string): Promise<{
        id: string;
        slug: string;
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
        careerPathId: string | null;
        instructorId: string | null;
        categoryId: string | null;
    }>;
    getPendingContent(): Promise<{
        courses: {
            id: string;
            slug: string;
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
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
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
                language: string;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            meetingMethod: string | null;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            accountType: string;
            cvUrl: string | null;
            bio: string | null;
            experience: number | null;
            speciality: string | null;
            linkedinUrl: string | null;
            hourlyRate: number | null;
            googleId: string | null;
            provider: string;
            stripeCustomerId: string | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            rejectedReason: string | null;
            lastSeenAt: Date | null;
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
        } & {
            id: string;
            slug: string;
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
            careerPathId: string | null;
            instructorId: string | null;
            categoryId: string | null;
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
        meetingMethod: string;
        email: string;
        accountType: string;
        cvUrl: string;
        bio: string;
        experience: number;
        speciality: string;
        linkedinUrl: string;
        hourlyRate: number;
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
            userId: string;
            courseId: string | null;
            amount: number;
            method: string;
            transactionId: string | null;
            stripeIntentId: string | null;
            description: string | null;
            itemType: string | null;
            itemId: string | null;
            completedAt: Date | null;
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
            language: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        meetingMethod: string | null;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        cvUrl: string | null;
        bio: string | null;
        experience: number | null;
        speciality: string | null;
        linkedinUrl: string | null;
        hourlyRate: number | null;
        googleId: string | null;
        provider: string;
        stripeCustomerId: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectedReason: string | null;
        lastSeenAt: Date | null;
        deletedAt: Date | null;
    }>;
    rejectUser(userId: string, reason?: string, adminId?: string): Promise<{
        profile: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
            language: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        meetingMethod: string | null;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        cvUrl: string | null;
        bio: string | null;
        experience: number | null;
        speciality: string | null;
        linkedinUrl: string | null;
        hourlyRate: number | null;
        googleId: string | null;
        provider: string;
        stripeCustomerId: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectedReason: string | null;
        lastSeenAt: Date | null;
        deletedAt: Date | null;
    }>;
    banUser(userId: string, adminId?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        meetingMethod: string | null;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        cvUrl: string | null;
        bio: string | null;
        experience: number | null;
        speciality: string | null;
        linkedinUrl: string | null;
        hourlyRate: number | null;
        googleId: string | null;
        provider: string;
        stripeCustomerId: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectedReason: string | null;
        lastSeenAt: Date | null;
        deletedAt: Date | null;
    }>;
    unbanUser(userId: string, adminId?: string): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        meetingMethod: string | null;
        email: string;
        password: string;
        role: import(".prisma/client").$Enums.UserRole;
        isActive: boolean;
        accountType: string;
        cvUrl: string | null;
        bio: string | null;
        experience: number | null;
        speciality: string | null;
        linkedinUrl: string | null;
        hourlyRate: number | null;
        googleId: string | null;
        provider: string;
        stripeCustomerId: string | null;
        approvedAt: Date | null;
        rejectedAt: Date | null;
        rejectedReason: string | null;
        lastSeenAt: Date | null;
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
            scheduledAt: Date;
            meetingMethod: string;
            meetingLink: string | null;
            topic: string | null;
            notes: string | null;
            paymentStatus: string;
            paymentId: string | null;
            proposedAt: Date | null;
            proposedTime: Date | null;
            studentId: string;
            consultantId: string;
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
        status: string;
        createdAt: Date;
        email: string;
        accountType: string;
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
        status: string;
        email: string;
    }>;
    createSession(data: any): Promise<{
        id: string;
        price: number;
        duration: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        scheduledAt: Date;
        meetingMethod: string;
        meetingLink: string | null;
        topic: string | null;
        notes: string | null;
        paymentStatus: string;
        paymentId: string | null;
        proposedAt: Date | null;
        proposedTime: Date | null;
        studentId: string;
        consultantId: string;
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
        createdAt: Date;
        userId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        action: string;
        entity: string | null;
        entityId: string | null;
        ipAddress: string | null;
    })[]>;
    getUserActivity(userId: string, limit?: number): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        action: string;
        entity: string | null;
        entityId: string | null;
        ipAddress: string | null;
    }[]>;
    getUserDetail(id: string): Promise<{
        user: {
            profile: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
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
                language: string;
            };
            _count: {
                enrollments: number;
            };
        } & {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            meetingMethod: string | null;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            accountType: string;
            cvUrl: string | null;
            bio: string | null;
            experience: number | null;
            speciality: string | null;
            linkedinUrl: string | null;
            hourlyRate: number | null;
            googleId: string | null;
            provider: string;
            stripeCustomerId: string | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            rejectedReason: string | null;
            lastSeenAt: Date | null;
            deletedAt: Date | null;
        };
        activities: {
            id: string;
            createdAt: Date;
            userId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            action: string;
            entity: string | null;
            entityId: string | null;
            ipAddress: string | null;
        }[];
        payments: any[] | ({
            course: {
                titleEn: string;
                titleAr: string;
            };
        } & {
            id: string;
            currency: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            courseId: string | null;
            amount: number;
            method: string;
            transactionId: string | null;
            stripeIntentId: string | null;
            description: string | null;
            itemType: string | null;
            itemId: string | null;
            completedAt: Date | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        enrollments: any[] | ({
            course: {
                titleEn: string;
                titleAr: string;
                thumbnail: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            userId: string;
            courseId: string;
            completedAt: Date | null;
            enrolledAt: Date;
            progress: number;
            expiresAt: Date | null;
        })[];
        totalSpent: any;
    }>;
    getActivityStats(): Promise<{
        onlineUsers: number;
        todayActivity: number;
        totalActivities: number;
    }>;
}
