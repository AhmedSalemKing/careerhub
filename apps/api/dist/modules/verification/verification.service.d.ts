import { PrismaService } from '../../prisma/prisma.service';
export declare class VerificationService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    submitVerification(userId: string, data: {
        idFrontUrl: string;
        idBackUrl: string;
    }): Promise<{
        success: boolean;
        data: {
            status: string;
        };
    }>;
    getVerificationStatus(userId: string): Promise<{
        success: boolean;
        data: {
            idVerificationStatus: string;
            idFrontUrl: string;
            idBackUrl: string;
            idVerifiedAt: Date;
            idRejectedReason: string;
            isVerified: boolean;
        };
    }>;
    getPendingVerifications(): Promise<{
        id: string;
        email: string;
        accountType: string;
        idFrontUrl: string;
        idBackUrl: string;
        createdAt: Date;
        profile: {
            firstName: string;
            lastName: string;
            avatar: string;
        };
    }[]>;
    approveVerification(userId: string, adminId?: string): Promise<{
        success: boolean;
        data: {
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
    }>;
    rejectVerification(userId: string, reason: string, adminId?: string): Promise<{
        success: boolean;
        data: {
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
    }>;
}
