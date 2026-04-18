import { CertificatesService } from './certificates.service';
import { User } from '@prisma/client';
export declare class CertificatesController {
    private readonly certificatesService;
    constructor(certificatesService: CertificatesService);
    generateCert(courseId: string, req: any): Promise<{
        success: boolean;
        data: {
            pdfUrl: string;
        };
    }>;
    getMyCertificates(user: User, page?: number, limit?: number): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getCertificateBySerialNumber(serialNumber: string): Promise<{
        success: boolean;
        data: {
            certificate: {
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
            };
        };
    }>;
    verifyCertificate(serialNumber: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    downloadCertificate(user: User, serialNumber: string): Promise<{
        success: boolean;
        data: {
            downloadUrl: {
                downloadUrl: string;
                fileName: string;
                expiresAt: Date;
            };
        };
    }>;
    getCertificateShareData(serialNumber: string): Promise<{
        success: boolean;
        data: {
            title: string;
            description: string;
            url: string;
            imageUrl: string;
            hashtags: string[];
            userName: string;
            courseTitle: string;
            issuedAt: any;
        };
    }>;
    shareCertificate(user: User, serialNumber: string, shareData: {
        platform: 'linkedin' | 'twitter' | 'facebook';
        message?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            shareUrl: string;
            platform: "linkedin" | "twitter" | "facebook";
        };
    }>;
    getCourseCertificate(user: User, courseId: string): Promise<{
        success: boolean;
        data: {
            certificate: {
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
            };
        };
    }>;
    requestCertificate(user: User, courseId: string, requestData: {
        fullName?: string;
        includeDateOfBirth?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            certificate: {
                id: string;
                courseId: string;
                userId: string;
                expiresAt: Date | null;
                serialNumber: string;
                certificateUrl: string;
                qrCodeUrl: string;
                issuedAt: Date;
            };
        };
    }>;
    getCertificateTemplates(): Promise<{
        success: boolean;
        data: {
            templates: {
                id: string;
                name: string;
                description: string;
                thumbnail: string;
            }[];
        };
    }>;
    createCertificateTemplate(templateData: {
        name: string;
        description?: string;
        backgroundUrl?: string;
        layout: any;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            template: {
                createdAt: Date;
                name: string;
                description?: string;
                backgroundUrl?: string;
                layout: any;
                id: string;
            };
        };
    }>;
    regenerateCertificate(certificateId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            certificate: {
                id: string;
                courseId: string;
                userId: string;
                expiresAt: Date | null;
                serialNumber: string;
                certificateUrl: string;
                qrCodeUrl: string;
                issuedAt: Date;
            };
        };
    }>;
    revokeCertificate(certificateId: string, reason: string): Promise<{
        success: boolean;
        message: string;
        data: {
            certificate: {
                id: string;
                courseId: string;
                userId: string;
                expiresAt: Date | null;
                serialNumber: string;
                certificateUrl: string;
                qrCodeUrl: string;
                issuedAt: Date;
            };
        };
    }>;
    getAllCertificates(page?: number, limit?: number, status?: string, courseId?: string): Promise<{
        success: boolean;
        data: {
            certificates: ({
                course: {
                    careerPath: {
                        createdAt: Date;
                        sortOrder: number;
                        id: string;
                        slug: string;
                        titleEn: string;
                        titleAr: string;
                        descriptionEn: string;
                        descriptionAr: string;
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
                    createdAt: Date;
                    sortOrder: number;
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
                    updatedAt: Date;
                };
                user: {
                    profile: {
                        createdAt: Date;
                        id: string;
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
                    createdAt: Date;
                    id: string;
                    status: string;
                    updatedAt: Date;
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
                    meetingMethod: string | null;
                    stripeCustomerId: string | null;
                    approvedAt: Date | null;
                    rejectedAt: Date | null;
                    rejectedReason: string | null;
                    lastSeenAt: Date | null;
                    deletedAt: Date | null;
                };
            } & {
                id: string;
                courseId: string;
                userId: string;
                expiresAt: Date | null;
                serialNumber: string;
                certificateUrl: string;
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
        };
    }>;
    getCertificateStats(): Promise<{
        success: boolean;
        data: {
            stats: {
                totalCertificates: number;
                activeCertificates: number;
                revokedCertificates: number;
                certificatesThisMonth: number;
                certificatesThisYear: number;
                revokeRate: number;
            };
        };
    }>;
    bulkGenerateCertificates(bulkData: {
        enrollments: string[];
        templateId?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            total: number;
            successful: number;
            failed: number;
            results: any[];
        };
    }>;
    verifyBatchCertificates(serialNumbers: string): Promise<{
        success: boolean;
        data: {};
    }>;
    getPublicCertificate(serialNumber: string): Promise<{
        success: boolean;
        data: {
            certificate: {
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
            };
        };
    }>;
}
