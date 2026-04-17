import { SuperAdminService } from './super-admin.service';
import { ActivityService } from '../activity/activity.service';
export declare class SuperAdminBootstrapController {
    private readonly superAdminService;
    constructor(superAdminService: SuperAdminService);
    bootstrapSuperAdmin(secret: string, body: {
        email: string;
        password: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            accountType: string;
        };
    }>;
}
export declare class SuperAdminController {
    private readonly superAdminService;
    private readonly activityService;
    constructor(superAdminService: SuperAdminService, activityService: ActivityService);
    getDashboardStats(): Promise<{
        success: boolean;
        data: {
            users: {
                total: number;
                newToday: number;
                newThisWeek: number;
                byRole: {
                    [k: string]: number;
                };
            };
            courses: {
                total: number;
                published: number;
                draft: number;
            };
            enrollments: {
                total: number;
            };
            revenue: {
                total: number;
                monthly: number;
                today: number;
            };
            sessions: {
                pending: number;
                active: number;
            };
            activity: {
                total: number;
                today: number;
            };
            charts: {
                revenue: {
                    month: string;
                    revenue: number;
                }[];
                userGrowth: {
                    day: string;
                    count: number;
                }[];
            };
        };
    }>;
    getLiveActivity(limit?: string): Promise<{
        success: boolean;
        data: ({
            user: {
                id: string;
                email: string;
                role: import(".prisma/client").$Enums.UserRole;
                accountType: string;
                profile: {
                    firstName: string;
                    lastName: string;
                    avatar: string;
                };
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            action: string;
            ipAddress: string | null;
            entity: string | null;
            entityId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    }>;
    getActivity(userId?: string, action?: string, entity?: string, from?: string, to?: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            items: ({
                user: {
                    id: string;
                    email: string;
                    role: import(".prisma/client").$Enums.UserRole;
                    accountType: string;
                    profile: {
                        firstName: string;
                        lastName: string;
                        avatar: string;
                    };
                };
            } & {
                id: string;
                createdAt: Date;
                userId: string;
                action: string;
                ipAddress: string | null;
                entity: string | null;
                entityId: string | null;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
            })[];
            total: number;
            page: number;
            pages: number;
        };
    }>;
    getActivityStats(): Promise<{
        success: boolean;
        data: {
            total: number;
            today: number;
            thisWeek: number;
            topActions: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserActivityGroupByOutputType, "action"[]> & {
                _count: {
                    action: number;
                };
            })[];
        };
    }>;
    getUsers(page?: string, limit?: string, search?: string, role?: string, status?: string, accountType?: string): Promise<{
        success: boolean;
        data: {
            users: {
                id: string;
                email: string;
                role: import(".prisma/client").$Enums.UserRole;
                isActive: boolean;
                accountType: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                profile: {
                    firstName: string;
                    lastName: string;
                    phone: string;
                    country: string;
                    avatar: string;
                };
                _count: {
                    enrollments: number;
                    payments: number;
                    instructorCourses: number;
                    activities: number;
                };
            }[];
            total: number;
            page: number;
            pages: number;
        };
    }>;
    getUserById(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            accountType: string;
            status: string;
            bio: string;
            experience: number;
            speciality: string;
            linkedinUrl: string;
            hourlyRate: number;
            meetingMethod: string;
            stripeCustomerId: string;
            approvedAt: Date;
            rejectedAt: Date;
            rejectedReason: string;
            createdAt: Date;
            updatedAt: Date;
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
            enrollments: ({
                course: {
                    id: string;
                    titleEn: string;
                    thumbnail: string;
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
            payments: {
                id: string;
                status: string;
                createdAt: Date;
                currency: string;
                amount: number;
            }[];
            _count: {
                enrollments: number;
                payments: number;
                coachingSessions: number;
                studentSessions: number;
                instructorCourses: number;
                activities: number;
            };
        };
    }>;
    getUserActivity(id: string, limit?: string): Promise<{
        success: boolean;
        data: ({
            user: {
                id: string;
                email: string;
                accountType: string;
                profile: {
                    firstName: string;
                    lastName: string;
                    avatar: string;
                };
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            action: string;
            ipAddress: string | null;
            entity: string | null;
            entityId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
    }>;
    createUser(body: {
        email: string;
        password: string;
        accountType: string;
        firstName: string;
        lastName: string;
        phone?: string;
    }, actor: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            accountType: string;
            status: string;
            createdAt: Date;
            profile: {
                firstName: string;
                lastName: string;
            };
        };
    }>;
    updateUserRole(id: string, body: {
        accountType: string;
    }, actor: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            accountType: string;
            status: string;
            profile: {
                firstName: string;
                lastName: string;
            };
        };
    }>;
    setCredentials(id: string, body: {
        email?: string;
        password?: string;
    }, actor: any): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            accountType: string;
        };
    }>;
    updateUser(id: string, body: {
        status?: string;
        isActive?: boolean;
        accountType?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            isActive: boolean;
            accountType: string;
            status: string;
        };
    }>;
    getCourses(page?: string, limit?: string, status?: string): Promise<{
        success: boolean;
        data: {
            courses: ({
                _count: {
                    enrollments: number;
                    sections: number;
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
            })[];
            total: number;
            page: number;
            pages: number;
        };
    }>;
    createCourse(body: {
        titleEn: string;
        titleAr?: string;
        descriptionEn?: string;
        descriptionAr?: string;
        price?: number;
        currency?: string;
        level?: string;
        thumbnail?: string;
        categoryId?: string;
        careerPathId?: string;
    }, actor: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
    }>;
    getSessions(page?: string, limit?: string, status?: string): Promise<{
        success: boolean;
        data: {
            sessions: ({
                student: {
                    id: string;
                    email: string;
                    profile: {
                        firstName: string;
                        lastName: string;
                        avatar: string;
                    };
                };
                consultant: {
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
                status: string;
                meetingMethod: string;
                createdAt: Date;
                updatedAt: Date;
                price: number;
                duration: number;
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
            total: number;
            page: number;
            pages: number;
        };
    }>;
    createSession(body: {
        studentId: string;
        consultantId: string;
        scheduledAt: string;
        duration?: number;
        topic?: string;
        meetingMethod?: string;
        price?: number;
    }, actor: any): Promise<{
        success: boolean;
        message: string;
        data: {
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
            status: string;
            meetingMethod: string;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            duration: number;
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
        };
    }>;
    getRevenue(from?: string, to?: string): Promise<{
        success: boolean;
        data: {
            total: import(".prisma/client").Prisma.GetPaymentAggregateType<{
                _sum: {
                    amount: true;
                };
                _count: {
                    id: true;
                };
                where: Record<string, any>;
            }>;
            payments: ({
                user: {
                    email: string;
                    profile: {
                        firstName: string;
                        lastName: string;
                    };
                };
                course: {
                    id: string;
                    titleEn: string;
                };
            } & {
                id: string;
                status: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                courseId: string | null;
                completedAt: Date | null;
                currency: string;
                description: string | null;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                amount: number;
                method: string;
                transactionId: string | null;
                stripeIntentId: string | null;
                itemType: string | null;
                itemId: string | null;
                refundedAt: Date | null;
            })[];
            byMethod: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PaymentGroupByOutputType, "method"[]> & {
                _count: {
                    id: number;
                };
                _sum: {
                    amount: number;
                };
            })[];
            topCourses: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PaymentGroupByOutputType, "courseId"[]> & {
                _count: {
                    id: number;
                };
                _sum: {
                    amount: number;
                };
            })[];
        };
    }>;
    getSystemLogs(limit?: string): Promise<{
        success: boolean;
        data: {
            adminLogs: ({
                admin: {
                    email: string;
                    profile: {
                        firstName: string;
                        lastName: string;
                    };
                };
            } & {
                id: string;
                createdAt: Date;
                action: string;
                resource: string;
                resourceId: string | null;
                details: import("@prisma/client/runtime/library").JsonValue | null;
                ipAddress: string | null;
                userAgent: string | null;
                adminId: string;
            })[];
            auditLogs: {
                id: string;
                createdAt: Date;
                action: string;
                details: import("@prisma/client/runtime/library").JsonValue | null;
                adminId: string | null;
                entityId: string | null;
                entityType: string | null;
            }[];
        };
    }>;
    getSystemHealth(): Promise<{
        success: boolean;
        data: {
            status: string;
            uptime: number;
            memory: NodeJS.MemoryUsage;
            database: {
                users: number;
                activeSessions: number;
                payments: number;
                activityLogs: number;
            };
            timestamp: string;
        };
    }>;
}
