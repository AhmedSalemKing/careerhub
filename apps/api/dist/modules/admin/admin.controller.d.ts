import { AdminService } from './admin.service';
import { User } from '@prisma/client';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
        success: boolean;
        data: {
            dashboard: {
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
            };
        };
    }>;
    getStatsOverview(): Promise<{
        success: boolean;
        data: {
            stats: {
                totalUsers: number;
                totalCourses: number;
                totalSessions: number;
                totalRevenue: number;
            };
        };
    }>;
    getUsers(page?: number, limit?: number, role?: string, status?: string, search?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getUser(id: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    updateUser(id: string, updateData: {
        role?: string;
        isActive?: boolean;
        email?: string;
        profile?: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            bio?: string;
        };
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            user: {
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
        };
    }>;
    deleteUser(id: string): Promise<void>;
    suspendUser(id: string, reason: string): Promise<{
        success: boolean;
        message: string;
        data: {
            user: {
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
        };
    }>;
    unsuspendUser(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            user: {
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
        };
    }>;
    getAdminCourses(page?: number, limit?: number, status?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    createCourse(courseData: {
        titleEn: string;
        titleAr: string;
        descriptionEn: string;
        descriptionAr: string;
        careerPathId: string;
        price: number;
        currency: string;
        duration: number;
        level: string;
        thumbnail?: string;
        tags?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    approveCourse(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    rejectCourse(id: string, reason: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    getPendingContent(): Promise<{
        success: boolean;
        data: {
            content: {
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
            };
        };
    }>;
    approveContent(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            content: {
                success: boolean;
                id: string;
            };
        };
    }>;
    rejectContent(id: string, reason: string): Promise<{
        success: boolean;
        message: string;
        data: {
            content: {
                success: boolean;
                id: string;
                reason: string;
            };
        };
    }>;
    getReports(page?: number, limit?: number, status?: string): Promise<{
        success: boolean;
        data: {
            reports: any[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    resolveReport(id: string, resolutionData: {
        action: 'IGNORE' | 'WARNING' | 'SUSPEND' | 'DELETE_CONTENT';
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            report: {
                success: boolean;
                id: string;
                resolutionData: any;
            };
        };
    }>;
    getRevenueAnalytics(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            analytics: {
                total: number;
                monthly: any[];
            };
        };
    }>;
    getEngagementAnalytics(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            analytics: {
                data: any[];
            };
        };
    }>;
    getCourseAnalytics(): Promise<{
        success: boolean;
        data: {
            analytics: {
                enrollments: number;
            };
        };
    }>;
    getSystemHealth(): Promise<{
        success: boolean;
        data: {
            health: {
                status: string;
                uptime: number;
                memory: NodeJS.MemoryUsage;
                timestamp: Date;
            };
        };
    }>;
    getSystemLogs(level?: string, limit?: number): Promise<{
        success: boolean;
        data: {
            logs: {
                logs: {
                    id: string;
                    level: string;
                    message: string;
                    timestamp: Date;
                }[];
                total: number;
            };
        };
    }>;
    createBackup(backupData: {
        type: 'FULL' | 'INCREMENTAL';
        includeFiles?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            backup: {
                id: string;
                type: any;
                createdAt: Date;
                status: string;
            };
        };
    }>;
    getBackups(): Promise<{
        success: boolean;
        data: {
            backups: {
                id: string;
                type: string;
                createdAt: Date;
                status: string;
            }[];
        };
    }>;
    restoreBackup(backupId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            backupId: string;
            restoredAt: Date;
            status: string;
        };
    }>;
    getSettings(): Promise<{
        success: boolean;
        data: {
            settings: {
                siteName: string;
                maintenanceMode: boolean;
                registrationEnabled: boolean;
                emailNotifications: boolean;
            };
        };
    }>;
    updateSettings(settingsData: {
        siteName?: string;
        siteDescription?: string;
        maintenanceMode?: boolean;
        registrationEnabled?: boolean;
        emailNotifications?: boolean;
        maxUploadSize?: number;
        allowedFileTypes?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            settings: any;
        };
    }>;
    uploadLogo(file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            url: string;
            size: number;
            originalName: string;
        };
    }>;
    broadcastNotification(notificationData: {
        titleEn: string;
        titleAr: string;
        contentEn: string;
        contentAr: string;
        type: string;
        channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>;
        sendToAll?: boolean;
        userRoles?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            sent: number;
            skipped: number;
        };
    }>;
    getNotificationTemplates(): Promise<{
        success: boolean;
        data: {
            templates: {
                id: string;
                name: string;
                type: string;
                subjectEn: string;
                subjectAr: string;
                contentEn: string;
                contentAr: string;
                variables: string[];
            }[];
        };
    }>;
    exportUsers(format?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    exportCourses(format?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    importUsers(file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            total: number;
            imported: number;
            failed: number;
            errors: any[];
        };
    }>;
    getAuditLog(page?: number, limit?: number, action?: string, userId?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    forcePasswordReset(data: {
        message?: string;
        excludeRoles?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            sent: number;
            message: any;
        };
    }>;
    getActiveSessions(): Promise<{
        success: boolean;
        data: {
            sessions: {
                sessionId: string;
                userId: string;
                email: string;
                createdAt: Date;
                lastActivity: Date;
            }[];
        };
    }>;
    revokeSession(sessionId: string): Promise<void>;
    getPerformanceMetrics(): Promise<{
        success: boolean;
        data: {
            metrics: {
                cpu: number;
                memory: number;
                requests: number;
                responseTime: number;
                timestamp: Date;
            };
        };
    }>;
    getRecentErrors(limit?: number): Promise<{
        success: boolean;
        data: {
            errors: {
                id: string;
                message: string;
                timestamp: Date;
                level: string;
            }[];
        };
    }>;
    getUsageStatistics(): Promise<{
        success: boolean;
        data: {
            stats: {
                apiCalls: number;
                storageUsed: number;
                bandwidthUsed: number;
                activeConnections: number;
            };
        };
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
    postApproveCourse(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    postRejectCourse(id: string, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    getPendingApprovals(): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    getDashboardStats(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    clearSeedData(): Promise<{
        success: boolean;
        message: string;
    }>;
    approveUser(userId: string, admin: User): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    rejectUser(userId: string, reason: string | undefined, admin: User): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    banUser(userId: string, admin: User): Promise<{
        success: boolean;
        message: string;
        data: {
            user: {
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
        };
    }>;
    unbanUser(userId: string, admin: User): Promise<{
        success: boolean;
        message: string;
        data: {
            user: {
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
        };
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
    getAuditLogs(limit?: string): Promise<{
        success: boolean;
        data: {
            logs: any;
        };
    }>;
    getSiteSettings(): Promise<{
        success: boolean;
        data: {
            settings: {
                id: string;
                updatedAt: Date;
                siteName: string;
                primaryColor: string;
                backgroundColor: string;
                buttonColor: string;
                logoUrl: string | null;
            };
        };
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
    updateSiteSettings(body: {
        primaryColor?: string;
        backgroundColor?: string;
        buttonColor?: string;
        logoUrl?: string;
        siteName?: string;
    }): Promise<{
        success: boolean;
        data: {
            settings: {
                id: string;
                updatedAt: Date;
                siteName: string;
                primaryColor: string;
                backgroundColor: string;
                buttonColor: string;
                logoUrl: string | null;
            };
        };
    }>;
}
