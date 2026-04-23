import { CertificatesService } from './certificates.service';
export declare class CertificatesController {
    private readonly certificatesService;
    constructor(certificatesService: CertificatesService);
    generate(courseId: string, req: any): Promise<{
        success: boolean;
        data: {
            id: string;
            serialNumber: string;
            userId: string;
            courseId: string;
            certificateUrl: string;
            qrCodeUrl: string;
            issuedAt: Date;
            expiresAt: Date | null;
        };
    }>;
    getMy(req: any): Promise<{
        success: boolean;
        data: ({
            course: {
                id: string;
                titleEn: string;
                titleAr: string;
                thumbnail: string;
                instructor: {
                    profile: {
                        firstName: string;
                        lastName: string;
                    };
                } & {
                    id: string;
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
                    googleId: string | null;
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
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                };
            };
        } & {
            id: string;
            serialNumber: string;
            userId: string;
            courseId: string;
            certificateUrl: string;
            qrCodeUrl: string;
            issuedAt: Date;
            expiresAt: Date | null;
        })[];
    }>;
    getMyCertificatesLegacy(req: any): Promise<{
        success: boolean;
        data: ({
            course: {
                id: string;
                titleEn: string;
                titleAr: string;
                thumbnail: string;
                instructor: {
                    profile: {
                        firstName: string;
                        lastName: string;
                    };
                } & {
                    id: string;
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
                    googleId: string | null;
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
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                };
            };
        } & {
            id: string;
            serialNumber: string;
            userId: string;
            courseId: string;
            certificateUrl: string;
            qrCodeUrl: string;
            issuedAt: Date;
            expiresAt: Date | null;
        })[];
    }>;
    verifyByCode(verifyCode: string): Promise<{
        success: boolean;
        data: {
            valid: boolean;
            studentName: string;
            courseTitle: string;
            instructorName: string;
            issueDate: Date;
            verifyCode: string;
            certificateUrl: string;
        };
    }>;
    getAllAdmin(): Promise<{
        success: boolean;
        data: ({
            user: {
                profile: {
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
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
                googleId: string | null;
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
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
            };
            course: {
                titleEn: string;
                titleAr: string;
            };
        } & {
            id: string;
            serialNumber: string;
            userId: string;
            courseId: string;
            certificateUrl: string;
            qrCodeUrl: string;
            issuedAt: Date;
            expiresAt: Date | null;
        })[];
    }>;
    getStats(): Promise<{
        success: boolean;
        data: {
            totalCertificates: number;
            certificatesThisMonth: number;
        };
    }>;
}
