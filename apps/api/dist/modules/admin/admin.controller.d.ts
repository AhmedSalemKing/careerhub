import { AdminService } from './admin.service';
import { CreateCourseAdminDto } from './dto/create-course-admin.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
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
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
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
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
                deletedAt: Date | null;
            };
        };
    }>;
    deleteUserRecord(id: string): Promise<void>;
    suspendUser(id: string, reason: string): Promise<{
        success: boolean;
        message: string;
        data: {
            user: {
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
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
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
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
                deletedAt: Date | null;
            };
        };
    }>;
    createCourseAdmin(body: CreateCourseAdminDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    createCourseWithFiles(files: Express.Multer.File[], body: any, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    createCourseBase(courseData: {
        titleEn: string;
        titleAr?: string;
        descriptionEn?: string;
        descriptionAr?: string;
        careerPathId?: string;
        price?: number;
        currency?: string;
        duration?: number;
        level?: string;
        thumbnail?: string;
        tags?: string[];
    }, req: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    approveCourse(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    rejectCourse(id: string, reason: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    getPendingContent(): Promise<{
        success: boolean;
        data: {
            content: {
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
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
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
    postApproveCourse(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    getPendingApprovals(): Promise<{
        success: boolean;
        data: {
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
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
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
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
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
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
                deletedAt: Date | null;
            };
        };
    }>;
    unbanUser(userId: string, admin: User): Promise<{
        success: boolean;
        message: string;
        data: {
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
            stripeCustomerId: string | null;
            approvedAt: Date | null;
            rejectedAt: Date | null;
            rejectedReason: string | null;
            lastSeenAt: Date | null;
            deletedAt: Date | null;
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
    createUser(body: CreateUserAdminDto): Promise<{
        success: boolean;
        data: {
            id: string;
            status: string;
            createdAt: Date;
            email: string;
            accountType: string;
            profile: {
                firstName: string;
                lastName: string;
            };
        };
    }>;
    changeRole(id: string, body: {
        accountType: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            email: string;
            accountType: string;
        };
    }>;
    changeStatus(id: string, body: {
        status: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            status: string;
            email: string;
        };
    }>;
    getUserDetail(id: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    createSessionWithImage(image: Express.Multer.File | null, body: any): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getLiveActivity(limit?: string): Promise<{
        success: boolean;
        data: ({
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
        })[];
    }>;
    getActivityStats(): Promise<{
        success: boolean;
        data: {
            onlineUsers: number;
            todayActivity: number;
            totalActivities: number;
        };
    }>;
    getUserActivity(id: string, limit?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            action: string;
            entity: string | null;
            entityId: string | null;
            ipAddress: string | null;
        }[];
    }>;
}
