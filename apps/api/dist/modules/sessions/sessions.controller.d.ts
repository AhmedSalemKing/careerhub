import { PrismaService } from '../../prisma/prisma.service';
export declare class SessionsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getConsultants(): Promise<{
        success: boolean;
        data: {
            id: string;
            email: string;
            bio: string;
            experience: number;
            speciality: string;
            linkedinUrl: string;
            hourlyRate: number;
            meetingMethod: string;
            profile: {
                firstName: string;
                lastName: string;
                country: string;
                avatar: string;
            };
            _count: {
                consultantSessions: number;
            };
        }[];
    }>;
    getConsultant(id: string): Promise<{
        success: boolean;
        data: {
            id: string;
            bio: string;
            experience: number;
            speciality: string;
            linkedinUrl: string;
            hourlyRate: number;
            meetingMethod: string;
            profile: {
                firstName: string;
                lastName: string;
                country: string;
                avatar: string;
            };
            _count: {
                consultantSessions: number;
            };
        };
    }>;
    bookSession(req: any, body: {
        consultantId: string;
        scheduledAt: string;
        duration?: number;
        meetingMethod: string;
        topic?: string;
        notes?: string;
    }): Promise<{
        success: boolean;
        data: {
            student: {
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
                walletBalance: number;
                updatedAt: Date;
                deletedAt: Date | null;
            };
            consultant: {
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
                walletBalance: number;
                updatedAt: Date;
                deletedAt: Date | null;
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
        };
    }>;
    getMySessions(req: any, status?: string): Promise<{
        success: boolean;
        data: ({
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
                speciality: string;
                hourlyRate: number;
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
        })[];
    }>;
    confirmSession(id: string, req: any, body: {
        meetingLink?: string;
    }): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    rejectSession(id: string, req: any, body: {
        reason?: string;
    }): Promise<{
        success: boolean;
    }>;
    rescheduleSession(id: string, req: any, body: {
        proposedTime: string;
        message?: string;
    }): Promise<{
        success: boolean;
    }>;
    acceptReschedule(id: string, req: any): Promise<{
        success: boolean;
    }>;
    paySession(id: string, req: any): Promise<{
        success: boolean;
        data: {
            free: boolean;
            clientSecret?: undefined;
            amount?: undefined;
            sessionId?: undefined;
            mode?: undefined;
            sandbox?: undefined;
        };
    } | {
        success: boolean;
        data: {
            clientSecret: any;
            amount: number;
            sessionId: string;
            mode: string;
            free?: undefined;
            sandbox?: undefined;
        };
    } | {
        success: boolean;
        data: {
            sandbox: boolean;
            sessionId: string;
            free?: undefined;
            clientSecret?: undefined;
            amount?: undefined;
            mode?: undefined;
        };
    }>;
    confirmSessionPayment(id: string, req: any, body: {
        paymentIntentId: string;
    }): Promise<{
        success: boolean;
    }>;
    private doPaySession;
    cancelSession(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
