import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { ZoomService } from './zoom.service';
export declare class CoachingService {
    private prisma;
    private configService;
    private zoomService;
    private readonly logger;
    private readonly cacheTtlMs;
    private readonly cache;
    constructor(prisma: PrismaService, configService: ConfigService, zoomService: ZoomService);
    getCoaches(specialization?: string, language?: string): Promise<any>;
    getCoach(id: string, language?: string): Promise<{
        id: string;
        user: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
            email: string;
        };
        bio: string;
        specialties: any;
        hourlyRate: number;
        experience: number;
        rating: number;
        totalSessions: any;
        totalReviews: any;
        reviews: {
            id: any;
            rating: any;
            comment: any;
            createdAt: any;
            user: {
                firstName: any;
                lastName: any;
                avatar: any;
            };
        }[];
        availability: {
            monday: string[];
            tuesday: string[];
            wednesday: string[];
            thursday: string[];
            friday: string[];
            saturday: any[];
            sunday: any[];
        };
        education: any;
        certifications: any;
    }>;
    getUserSessions(userId: string, options: {
        page: number;
        limit: number;
        status?: string;
    }): Promise<{
        sessions: {
            id: string;
            sessionType: any;
            status: import(".prisma/client").$Enums.SessionStatus;
            startTime: Date;
            endTime: any;
            duration: any;
            price: any;
            currency: any;
            notes: string;
            meetingUrl: any;
            meetingId: any;
            coach: {
                id: string;
                firstName: any;
                lastName: any;
                avatar: any;
                specialties: any;
            };
            review: any;
            canReschedule: boolean;
            canCancel: boolean;
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
    getSession(userId: string, sessionId: string): Promise<{
        id: string;
        sessionType: any;
        status: import(".prisma/client").$Enums.SessionStatus;
        startTime: Date;
        endTime: any;
        duration: any;
        price: any;
        currency: any;
        notes: string;
        meetingUrl: any;
        meetingId: any;
        coach: {
            id: string;
            firstName: any;
            lastName: any;
            avatar: any;
            email: string;
            specialties: any;
            hourlyRate: number;
        };
        review: any;
        canReschedule: boolean;
        canCancel: boolean;
        canJoin: boolean;
    }>;
    joinSession(userId: string, sessionId: string): Promise<{
        joinUrl: any;
        meetingId: any;
        startTime: Date;
        endTime: any;
        coachName: string;
    }>;
    completeSession(coachId: string, sessionId: string, completionData: {
        notes?: string;
        followUpActions?: string[];
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.SessionStatus;
        updatedAt: Date;
        coachId: string;
        slotId: string;
        zoomMeetingId: string | null;
        zoomJoinUrl: string | null;
        notes: string | null;
        recordingUrl: string | null;
        startTime: Date;
    }>;
    submitReview(userId: string, sessionId: string, reviewData: {
        rating: number;
        comment?: string;
    }): Promise<{
        rating: number;
        id: string;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        sessionId: string;
        coachId: string;
        comment: string | null;
    }>;
    getCoachReviews(coachId: string, options: {
        page: number;
        limit: number;
    }): Promise<{
        reviews: ({
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
                    country: string | null;
                    city: string | null;
                    language: string;
                    dateOfBirth: Date | null;
                    gender: import(".prisma/client").$Enums.Gender | null;
                    nationality: string | null;
                    avatar: string | null;
                    timezone: string;
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
            session: {};
        } & {
            rating: number;
            id: string;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            sessionId: string;
            coachId: string;
            comment: string | null;
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
    getPackages(language?: string): Promise<{
        id: string;
        name: string;
        description: string;
        price: number;
        currency: string;
        sessions: number;
        duration: string;
        features: string[];
        popular: boolean;
    }[]>;
    purchasePackage(userId: string, packageId: string, purchaseData: {
        paymentMethodId: string;
    }): Promise<{
        purchase: {
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
        };
        package: {
            id: string;
            name: string;
            description: string;
            price: number;
            currency: string;
            sessions: number;
            duration: string;
            features: string[];
            popular: boolean;
        };
        credits: number;
    }>;
    getUserStats(userId: string): Promise<{
        totalSessions: number;
        completedSessions: number;
        totalSpent: any;
        averageRating: number;
        completionRate: number;
    }>;
    getCoachDashboard(coachId: string): Promise<{
        totalSessions: number;
        completedSessions: number;
        upcomingSessions: number;
        totalEarnings: any;
        averageRating: number;
        thisMonthSessions: number;
        recentSessions: {
            id: string;
            user: {
                name: string;
                avatar: string;
            };
            startTime: Date;
            status: import(".prisma/client").$Enums.SessionStatus;
        }[];
    }>;
    getCoachSchedule(coachId: string, startDate: Date, endDate: Date): Promise<{
        id: string;
        title: string;
        start: Date;
        end: any;
        status: import(".prisma/client").$Enums.SessionStatus;
        sessionType: any;
        user: {
            id: string;
            name: string;
            avatar: string;
        };
    }[]>;
    createCoach(coachData: {
        userId: string;
        bio: string;
        specialties: string[];
        hourlyRate: number;
        experience: number;
    }): Promise<{
        rating: number;
        id: string;
        createdAt: Date;
        userId: string;
        experience: number;
        hourlyRate: number;
        updatedAt: Date;
        currency: string;
        bioEn: string;
        bioAr: string;
        specialties: string[];
        availability: import("@prisma/client/runtime/library").JsonValue;
        isVerified: boolean;
        reviewCount: number;
    }>;
    getAllCoaches(options: {
        page: number;
        limit: number;
        status?: string;
    }): Promise<{
        coaches: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getAllSessions(options: {
        page: number;
        limit: number;
        status?: string;
        coachId?: string;
    }): Promise<{
        sessions: ({
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
                    country: string | null;
                    city: string | null;
                    language: string;
                    dateOfBirth: Date | null;
                    gender: import(".prisma/client").$Enums.Gender | null;
                    nationality: string | null;
                    avatar: string | null;
                    timezone: string;
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
            coach: {
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
                        country: string | null;
                        city: string | null;
                        language: string;
                        dateOfBirth: Date | null;
                        gender: import(".prisma/client").$Enums.Gender | null;
                        nationality: string | null;
                        avatar: string | null;
                        timezone: string;
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
                rating: number;
                id: string;
                createdAt: Date;
                userId: string;
                experience: number;
                hourlyRate: number;
                updatedAt: Date;
                currency: string;
                bioEn: string;
                bioAr: string;
                specialties: string[];
                availability: import("@prisma/client/runtime/library").JsonValue;
                isVerified: boolean;
                reviewCount: number;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.SessionStatus;
            updatedAt: Date;
            coachId: string;
            slotId: string;
            zoomMeetingId: string | null;
            zoomJoinUrl: string | null;
            notes: string | null;
            recordingUrl: string | null;
            startTime: Date;
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
    getAnalytics(): Promise<{
        totalSessions: number;
        completedSessions: number;
        totalRevenue: any;
        totalCoaches: number;
        averageRating: number;
        completionRate: number;
        sessionsByMonth: any[];
    }>;
    private getMockAvailability;
    private canReschedule;
    private canCancel;
    private canJoin;
    private updateCoachAvailabilityAfterSession;
    private getRecentSessions;
    getConsultingSessions(userId: string, accountType: string): Promise<({
        student: {
            id: string;
            profile: {
                firstName: string;
                lastName: string;
                avatar: string;
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
    })[] | ({
        consultant: {
            id: string;
            profile: {
                firstName: string;
                lastName: string;
                avatar: string;
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
    })[]>;
    confirmConsultingSession(sessionId: string, consultantId: string): Promise<{
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
    cancelConsultingSession(sessionId: string, userId: string): Promise<{
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
    private getSessionsByMonth;
}
