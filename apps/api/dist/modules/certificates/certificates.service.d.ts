import { PrismaService } from '../../prisma/prisma.service';
export declare class CertificatesService {
    private prisma;
    constructor(prisma: PrismaService);
    generateCertificate(userId: string, courseId: string, bypassEnrollment?: boolean): Promise<{
        success: boolean;
        data: {
            id: string;
            userId: string;
            certificateUrl: string;
            expiresAt: Date | null;
            courseId: string;
            serialNumber: string;
            qrCodeUrl: string;
            issuedAt: Date;
        };
    }>;
    private _doGenerate;
    private resolveTemplatePath;
    private registerFonts;
    private createCertificateImage;
    private splitToLines;
    private uploadToCloudinary;
    verifyCertificate(serialNumber: string): Promise<{
        valid: boolean;
        studentName: string;
        courseTitle: string;
        instructorName: string;
        issueDate: Date;
        verifyCode: string;
        certificateUrl: string;
    }>;
    getMyCertificates(userId: string): Promise<({
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
        };
    } & {
        id: string;
        userId: string;
        certificateUrl: string;
        expiresAt: Date | null;
        courseId: string;
        serialNumber: string;
        qrCodeUrl: string;
        issuedAt: Date;
    })[]>;
    getAllCertificatesAdmin(): Promise<({
        user: {
            profile: {
                firstName: string;
                lastName: string;
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
        course: {
            titleEn: string;
            titleAr: string;
        };
    } & {
        id: string;
        userId: string;
        certificateUrl: string;
        expiresAt: Date | null;
        courseId: string;
        serialNumber: string;
        qrCodeUrl: string;
        issuedAt: Date;
    })[]>;
    getUserCertificates(userId: string, options: {
        page: number;
        limit: number;
    }): Promise<{
        certificates: ({
            course: {
                id: string;
                status: import(".prisma/client").$Enums.CourseStatus;
                createdAt: Date;
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
            certificateUrl: string;
            expiresAt: Date | null;
            courseId: string;
            serialNumber: string;
            qrCodeUrl: string;
            issuedAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getCertificateStats(): Promise<{
        totalCertificates: number;
        certificatesThisMonth: number;
    }>;
}
