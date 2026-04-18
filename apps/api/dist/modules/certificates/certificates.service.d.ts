import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PuppeteerService } from './puppeteer.service';
export declare class CertificatesService {
    private prisma;
    private configService;
    private puppeteerService;
    private readonly s3;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, puppeteerService: PuppeteerService);
    getUserCertificates(userId: string, options: {
        page: number;
        limit: number;
    }): Promise<{
        certificates: {
            id: string;
            serialNumber: string;
            certificateUrl: string;
            qrCodeUrl: string;
            issuedAt: any;
            isRevoked: any;
            course: {
                id: string;
                title: string;
                slug: string;
                thumbnail: string;
                duration: any;
                careerPath: {
                    id: any;
                    title: any;
                    color: any;
                };
            };
            verificationUrl: string;
            shareUrl: string;
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
    getCertificateBySerialNumber(serialNumber: string): Promise<{
        id: string;
        serialNumber: string;
        issuedAt: any;
        isRevoked: any;
        revokedAt: any;
        revokeReason: any;
        user: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
        };
        course: {
            id: string;
            title: string;
            description: string;
            duration: any;
            level: string;
            careerPath: {
                id: any;
                title: any;
                description: any;
            };
        };
        verificationUrl: string;
    }>;
    verifyCertificate(serialNumber: string): Promise<{
        isValid: boolean;
        reason: string;
        revokedAt?: undefined;
        revokeReason?: undefined;
        certificate?: undefined;
        verificationUrl?: undefined;
    } | {
        isValid: boolean;
        reason: string;
        revokedAt: any;
        revokeReason: any;
        certificate?: undefined;
        verificationUrl?: undefined;
    } | {
        isValid: boolean;
        certificate: {
            serialNumber: string;
            issuedAt: any;
            user: {
                firstName: string;
                lastName: string;
            };
            course: {
                title: string;
                duration: any;
                careerPath: {
                    title: any;
                };
            };
        };
        verificationUrl: string;
        reason?: undefined;
        revokedAt?: undefined;
        revokeReason?: undefined;
    }>;
    getDownloadUrl(userId: string, serialNumber: string): Promise<{
        downloadUrl: string;
        fileName: string;
        expiresAt: Date;
    }>;
    getShareData(serialNumber: string): Promise<{
        title: string;
        description: string;
        url: string;
        imageUrl: string;
        hashtags: string[];
        userName: string;
        courseTitle: string;
        issuedAt: any;
    }>;
    shareCertificate(userId: string, serialNumber: string, shareData: {
        platform: 'linkedin' | 'twitter' | 'facebook';
        message?: string;
    }): Promise<{
        shareUrl: string;
        platform: "linkedin" | "twitter" | "facebook";
    }>;
    getCourseCertificate(userId: string, courseId: string): Promise<{
        id: string;
        serialNumber: string;
        certificateUrl: string;
        qrCodeUrl: string;
        issuedAt: any;
        isRevoked: any;
        course: {
            id: string;
            title: string;
            slug: string;
            careerPath: {
                id: any;
                title: any;
                color: any;
            };
        };
    }>;
    requestCertificate(userId: string, courseId: string, requestData: {
        fullName?: string;
        includeDateOfBirth?: boolean;
    }): Promise<{
        id: string;
        userId: string;
        certificateUrl: string;
        expiresAt: Date | null;
        courseId: string;
        serialNumber: string;
        qrCodeUrl: string;
        issuedAt: Date;
    }>;
    getCertificateTemplates(): Promise<{
        id: string;
        name: string;
        description: string;
        thumbnail: string;
    }[]>;
    createCertificateTemplate(templateData: {
        name: string;
        description?: string;
        backgroundUrl?: string;
        layout: any;
    }): Promise<{
        createdAt: Date;
        name: string;
        description?: string;
        backgroundUrl?: string;
        layout: any;
        id: string;
    }>;
    regenerateCertificate(certificateId: string): Promise<{
        id: string;
        userId: string;
        certificateUrl: string;
        expiresAt: Date | null;
        courseId: string;
        serialNumber: string;
        qrCodeUrl: string;
        issuedAt: Date;
    }>;
    revokeCertificate(certificateId: string, reason: string): Promise<{
        id: string;
        userId: string;
        certificateUrl: string;
        expiresAt: Date | null;
        courseId: string;
        serialNumber: string;
        qrCodeUrl: string;
        issuedAt: Date;
    }>;
    getAllCertificates(options: {
        page: number;
        limit: number;
        status?: string;
        courseId?: string;
    }): Promise<{
        certificates: ({
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
            course: {
                careerPath: {
                    id: string;
                    createdAt: Date;
                    isActive: boolean;
                    updatedAt: Date;
                    titleEn: string;
                    titleAr: string;
                    slug: string;
                    descriptionEn: string;
                    descriptionAr: string;
                    sortOrder: number;
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
                createdAt: Date;
                status: import(".prisma/client").$Enums.CourseStatus;
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
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    getCertificateStats(): Promise<{
        totalCertificates: number;
        activeCertificates: number;
        revokedCertificates: number;
        certificatesThisMonth: number;
        certificatesThisYear: number;
        revokeRate: number;
    }>;
    bulkGenerateCertificates(enrollmentIds: string[]): Promise<{
        total: number;
        successful: number;
        failed: number;
        results: any[];
    }>;
    verifyBatchCertificates(serialNumbers: string[]): Promise<{}>;
    getPublicCertificate(serialNumber: string): Promise<{
        serialNumber: string;
        issuedAt: any;
        isRevoked: any;
        user: {
            firstName: string;
            lastName: string;
        };
        course: {
            title: string;
            duration: any;
            level: string;
            careerPath: {
                title: any;
            };
        };
        verificationUrl: string;
    }>;
    private generateCertificate;
    generateLocalCert(userId: string, courseId: string): Promise<string>;
    private generateSerialNumber;
}
