import { CoachingService } from './coaching.service';
import { SchedulingService } from './scheduling.service';
import { User } from '@prisma/client';
export declare class CoachingController {
    private readonly coachingService;
    private readonly schedulingService;
    constructor(coachingService: CoachingService, schedulingService: SchedulingService);
    getCoaches(specialization?: string, language?: string): Promise<{
        success: boolean;
        data: {
            coaches: any;
        };
    }>;
    getCoach(id: string, language?: string): Promise<{
        success: boolean;
        data: {
            coach: {
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
            };
        };
    }>;
    getCoachAvailability(id: string, startDate: string, endDate: string): Promise<{
        success: boolean;
        data: {
            availability: {
                slots: any[];
            };
        };
    }>;
    getAvailableSlots(id: string, date: string): Promise<{
        success: boolean;
        data: {
            slots: {
                data: any[];
                total: number;
            };
        };
    }>;
    bookSession(user: User, bookingData: {
        coachId: string;
        slotId: string;
        sessionType: 'ONE_ON_ONE' | 'GROUP';
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            session: {
                success: boolean;
                sessionId: string;
            };
        };
    }>;
    getConsultingSessions(user: any): Promise<{
        success: boolean;
        data: ({
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
            status: string;
            meetingMethod: string;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            duration: number;
            paymentId: string | null;
            scheduledAt: Date;
            meetingLink: string | null;
            topic: string | null;
            notes: string | null;
            paymentStatus: string;
            proposedAt: Date | null;
            proposedTime: Date | null;
            studentId: string;
            consultantId: string;
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
            status: string;
            meetingMethod: string;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            duration: number;
            paymentId: string | null;
            scheduledAt: Date;
            meetingLink: string | null;
            topic: string | null;
            notes: string | null;
            paymentStatus: string;
            proposedAt: Date | null;
            proposedTime: Date | null;
            studentId: string;
            consultantId: string;
        })[];
    }>;
    confirmConsultingSession(user: any, id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            status: string;
            meetingMethod: string;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            duration: number;
            paymentId: string | null;
            scheduledAt: Date;
            meetingLink: string | null;
            topic: string | null;
            notes: string | null;
            paymentStatus: string;
            proposedAt: Date | null;
            proposedTime: Date | null;
            studentId: string;
            consultantId: string;
        };
    }>;
    cancelConsultingSession(user: any, id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            status: string;
            meetingMethod: string;
            createdAt: Date;
            updatedAt: Date;
            price: number;
            duration: number;
            paymentId: string | null;
            scheduledAt: Date;
            meetingLink: string | null;
            topic: string | null;
            notes: string | null;
            paymentStatus: string;
            proposedAt: Date | null;
            proposedTime: Date | null;
            studentId: string;
            consultantId: string;
        };
    }>;
    getMySessions(user: User, page?: number, limit?: number, status?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getSession(user: User, id: string): Promise<{
        success: boolean;
        data: {
            session: {
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
            };
        };
    }>;
    rescheduleSession(user: User, id: string, rescheduleData: {
        newSlotId: string;
        reason?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            session: {
                success: boolean;
            };
        };
    }>;
    cancelSession(user: User, id: string, reason?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            session: {
                success: boolean;
            };
        };
    }>;
    joinSession(user: User, id: string): Promise<{
        success: boolean;
        data: {
            joinUrl: any;
            meetingId: any;
            startTime: Date;
            endTime: any;
            coachName: string;
        };
    }>;
    completeSession(user: User, id: string, completionData: {
        notes?: string;
        followUpActions?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            session: {
                id: string;
                status: import(".prisma/client").$Enums.SessionStatus;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                notes: string | null;
                coachId: string;
                slotId: string;
                zoomMeetingId: string | null;
                zoomJoinUrl: string | null;
                recordingUrl: string | null;
                startTime: Date;
            };
        };
    }>;
    submitReview(user: User, id: string, reviewData: {
        rating: number;
        comment?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            review: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                rating: number;
                sessionId: string;
                coachId: string;
                comment: string | null;
            };
        };
    }>;
    getCoachReviews(coachId: string, page?: number, limit?: number): Promise<{
        success: boolean;
        data: {
            reviews: ({
                user: {
                    profile: {
                        id: string;
                        bio: string | null;
                        linkedinUrl: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
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
                    email: string;
                    googleId: string | null;
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
                    provider: string;
                    stripeCustomerId: string | null;
                    approvedAt: Date | null;
                    rejectedAt: Date | null;
                    rejectedReason: string | null;
                    lastSeenAt: Date | null;
                    idVerificationStatus: string;
                    idFrontUrl: string | null;
                    idBackUrl: string | null;
                    idVerifiedAt: Date | null;
                    idRejectedReason: string | null;
                    isVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                };
                session: {};
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                rating: number;
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
        };
    }>;
    getPackages(language?: string): Promise<{
        success: boolean;
        data: {
            packages: {
                id: string;
                name: string;
                description: string;
                price: number;
                currency: string;
                sessions: number;
                duration: string;
                features: string[];
                popular: boolean;
            }[];
        };
    }>;
    purchasePackage(user: User, packageId: string, purchaseData: {
        paymentMethodId: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            purchase: {
                purchase: {
                    id: string;
                    status: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    metadata: import("@prisma/client/runtime/library").JsonValue | null;
                    method: string;
                    description: string | null;
                    currency: string;
                    courseId: string | null;
                    completedAt: Date | null;
                    itemType: string | null;
                    itemId: string | null;
                    amount: number;
                    transactionId: string | null;
                    stripeIntentId: string | null;
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
            };
        };
    }>;
    getMyStats(user: User): Promise<{
        success: boolean;
        data: {
            stats: {
                totalSessions: number;
                completedSessions: number;
                totalSpent: any;
                averageRating: number;
                completionRate: number;
            };
        };
    }>;
    getCoachDashboard(user: User): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getCoachSchedule(user: User, startDate: string, endDate: string): Promise<{
        success: boolean;
        data: {
            schedule: {
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
            }[];
        };
    }>;
    setAvailability(user: User, availabilityData: {
        slots: Array<{
            startTime: string;
            endTime: string;
            date: string;
            recurring?: boolean;
        }>;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
        };
    }>;
    createCoach(coachData: {
        userId: string;
        bio: string;
        specialties: string[];
        hourlyRate: number;
        languages: string[];
        experience: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            coach: {
                id: string;
                experience: number;
                hourlyRate: number;
                isVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                rating: number;
                currency: string;
                bioEn: string;
                bioAr: string;
                specialties: string[];
                availability: import("@prisma/client/runtime/library").JsonValue;
                reviewCount: number;
            };
        };
    }>;
    getAllCoaches(page?: number, limit?: number, status?: string): Promise<{
        success: boolean;
        data: {
            coaches: any[];
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getAllSessions(page?: number, limit?: number, status?: string, coachId?: string): Promise<{
        success: boolean;
        data: {
            sessions: ({
                user: {
                    profile: {
                        id: string;
                        bio: string | null;
                        linkedinUrl: string | null;
                        createdAt: Date;
                        updatedAt: Date;
                        userId: string;
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
                    email: string;
                    googleId: string | null;
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
                    provider: string;
                    stripeCustomerId: string | null;
                    approvedAt: Date | null;
                    rejectedAt: Date | null;
                    rejectedReason: string | null;
                    lastSeenAt: Date | null;
                    idVerificationStatus: string;
                    idFrontUrl: string | null;
                    idBackUrl: string | null;
                    idVerifiedAt: Date | null;
                    idRejectedReason: string | null;
                    isVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                };
                coach: {
                    user: {
                        profile: {
                            id: string;
                            bio: string | null;
                            linkedinUrl: string | null;
                            createdAt: Date;
                            updatedAt: Date;
                            userId: string;
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
                        email: string;
                        googleId: string | null;
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
                        provider: string;
                        stripeCustomerId: string | null;
                        approvedAt: Date | null;
                        rejectedAt: Date | null;
                        rejectedReason: string | null;
                        lastSeenAt: Date | null;
                        idVerificationStatus: string;
                        idFrontUrl: string | null;
                        idBackUrl: string | null;
                        idVerifiedAt: Date | null;
                        idRejectedReason: string | null;
                        isVerified: boolean;
                        createdAt: Date;
                        updatedAt: Date;
                        deletedAt: Date | null;
                    };
                } & {
                    id: string;
                    experience: number;
                    hourlyRate: number;
                    isVerified: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    rating: number;
                    currency: string;
                    bioEn: string;
                    bioAr: string;
                    specialties: string[];
                    availability: import("@prisma/client/runtime/library").JsonValue;
                    reviewCount: number;
                };
            } & {
                id: string;
                status: import(".prisma/client").$Enums.SessionStatus;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                notes: string | null;
                coachId: string;
                slotId: string;
                zoomMeetingId: string | null;
                zoomJoinUrl: string | null;
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
        };
    }>;
    getAnalytics(): Promise<{
        success: boolean;
        data: {
            analytics: {
                totalSessions: number;
                completedSessions: number;
                totalRevenue: any;
                totalCoaches: number;
                averageRating: number;
                completionRate: number;
                sessionsByMonth: any[];
            };
        };
    }>;
}
