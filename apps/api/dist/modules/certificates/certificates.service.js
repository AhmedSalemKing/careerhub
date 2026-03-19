"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CertificatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificatesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const QRCode = __importStar(require("qrcode"));
const AWS = __importStar(require("aws-sdk"));
const puppeteer_service_1 = require("./puppeteer.service");
let CertificatesService = CertificatesService_1 = class CertificatesService {
    constructor(prisma, configService, puppeteerService) {
        this.prisma = prisma;
        this.configService = configService;
        this.puppeteerService = puppeteerService;
        this.logger = new common_1.Logger(CertificatesService_1.name);
        // Initialize AWS S3
        this.s3 = new AWS.S3({
            accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            region: this.configService.get('AWS_REGION'),
        });
    }
    async getUserCertificates(userId, options) {
        const { page, limit } = options;
        const skip = (page - 1) * limit;
        const [certificates, total] = await Promise.all([
            this.prisma.certificate.findMany({
                where: { userId },
                include: {
                    course: {
                        include: {
                            careerPath: true,
                        },
                    },
                },
                orderBy: { issuedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.certificate.count({ where: { userId } }),
        ]);
        const transformedCertificates = certificates.map(certificate => ({
            id: certificate.id,
            serialNumber: certificate.serialNumber,
            certificateUrl: certificate.certificateUrl,
            qrCodeUrl: certificate.qrCodeUrl,
            issuedAt: certificate.issuedAt,
            isRevoked: certificate.isRevoked,
            course: {
                id: certificate.course.id,
                title: certificate.course.titleEn,
                slug: certificate.course.slug,
                thumbnail: certificate.course.thumbnail,
                duration: certificate.course.duration,
                careerPath: {
                    id: certificate.course.careerPath.id,
                    title: certificate.course.careerPath.titleEn,
                    color: certificate.course.careerPath.color,
                },
            },
            verificationUrl: `${this.configService.get('FRONTEND_URL')}/verify/${certificate.serialNumber}`,
            shareUrl: `${this.configService.get('FRONTEND_URL')}/certificate/${certificate.serialNumber}`,
        }));
        return {
            certificates: transformedCertificates,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async getCertificateBySerialNumber(serialNumber) {
        const certificate = await this.prisma.certificate.findUnique({
            where: { serialNumber },
            include: {
                user: {
                    include: { profile: true },
                },
                course: {
                    include: {
                        careerPath: true,
                    },
                },
            },
        });
        if (!certificate) {
            throw new common_1.NotFoundException('Certificate not found');
        }
        return {
            id: certificate.id,
            serialNumber: certificate.serialNumber,
            issuedAt: certificate.issuedAt,
            isRevoked: certificate.isRevoked,
            revokedAt: certificate.revokedAt,
            revokeReason: certificate.revokeReason,
            user: {
                id: certificate.user.id,
                firstName: certificate.user.profile?.firstName,
                lastName: certificate.user.profile?.lastName,
                email: certificate.user.email,
            },
            course: {
                id: certificate.course.id,
                title: certificate.course.titleEn,
                description: certificate.course.descriptionEn,
                duration: certificate.course.duration,
                level: certificate.course.level,
                careerPath: {
                    id: certificate.course.careerPath.id,
                    title: certificate.course.careerPath.titleEn,
                    description: certificate.course.careerPath.descriptionEn,
                },
            },
            verificationUrl: `${this.configService.get('FRONTEND_URL')}/verify/${certificate.serialNumber}`,
        };
    }
    async verifyCertificate(serialNumber) {
        const certificate = await this.prisma.certificate.findUnique({
            where: { serialNumber },
            include: {
                user: {
                    include: { profile: true },
                },
                course: {
                    include: {
                        careerPath: true,
                    },
                },
            },
        });
        if (!certificate) {
            return {
                isValid: false,
                reason: 'Certificate not found',
            };
        }
        if (certificate.isRevoked) {
            return {
                isValid: false,
                reason: 'Certificate has been revoked',
                revokedAt: certificate.revokedAt,
                revokeReason: certificate.revokeReason,
            };
        }
        return {
            isValid: true,
            certificate: {
                serialNumber: certificate.serialNumber,
                issuedAt: certificate.issuedAt,
                user: {
                    firstName: certificate.user.profile?.firstName,
                    lastName: certificate.user.profile?.lastName,
                },
                course: {
                    title: certificate.course.titleEn,
                    duration: certificate.course.duration,
                    careerPath: {
                        title: certificate.course.careerPath.titleEn,
                    },
                },
            },
            verificationUrl: `${this.configService.get('FRONTEND_URL')}/verify/${certificate.serialNumber}`,
        };
    }
    async getDownloadUrl(userId, serialNumber) {
        const certificate = await this.prisma.certificate.findUnique({
            where: { serialNumber },
        });
        if (!certificate) {
            throw new common_1.NotFoundException('Certificate not found');
        }
        if (certificate.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized to download this certificate');
        }
        // Generate signed URL for S3 download
        const signedUrl = this.s3.getSignedUrl('getObject', {
            Bucket: this.configService.get('AWS_S3_BUCKET'),
            Key: `certificates/${certificate.serialNumber}.pdf`,
            Expires: 3600, // 1 hour
        });
        return {
            downloadUrl: signedUrl,
            fileName: `certificate_${certificate.serialNumber}.pdf`,
            expiresAt: new Date(Date.now() + 3600 * 1000),
        };
    }
    async getShareData(serialNumber) {
        const certificate = await this.prisma.certificate.findUnique({
            where: { serialNumber },
            include: {
                user: {
                    include: { profile: true },
                },
                course: true,
            },
        });
        if (!certificate) {
            throw new common_1.NotFoundException('Certificate not found');
        }
        const userName = `${certificate.user.profile?.firstName} ${certificate.user.profile?.lastName}`.trim();
        const courseTitle = certificate.course.titleEn;
        return {
            title: `I've successfully completed the ${courseTitle} course!`,
            description: `Proud to share my certificate of completion for ${courseTitle} from CareerHub.`,
            url: `${this.configService.get('FRONTEND_URL')}/certificate/${certificate.serialNumber}`,
            imageUrl: certificate.qrCodeUrl,
            hashtags: ['CareerHub', 'Certificate', 'Learning', courseTitle.replace(/\s+/g, '')],
            userName,
            courseTitle,
            issuedAt: certificate.issuedAt,
        };
    }
    async shareCertificate(userId, serialNumber, shareData) {
        const certificate = await this.prisma.certificate.findUnique({
            where: { serialNumber },
            include: {
                user: {
                    include: { profile: true },
                },
                course: true,
            },
        });
        if (!certificate) {
            throw new common_1.NotFoundException('Certificate not found');
        }
        if (certificate.userId !== userId) {
            throw new common_1.ForbiddenException('Not authorized to share this certificate');
        }
        const shareUrls = {
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${this.configService.get('FRONTEND_URL')}/certificate/${serialNumber}`)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.message || `I've completed ${certificate.course.titleEn} course!`)}&url=${encodeURIComponent(`${this.configService.get('FRONTEND_URL')}/certificate/${serialNumber}`)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${this.configService.get('FRONTEND_URL')}/certificate/${serialNumber}`)}`,
        };
        return {
            shareUrl: shareUrls[shareData.platform],
            platform: shareData.platform,
        };
    }
    async getCourseCertificate(userId, courseId) {
        const certificate = await this.prisma.certificate.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
            include: {
                course: {
                    include: {
                        careerPath: true,
                    },
                },
            },
        });
        if (!certificate) {
            throw new common_1.NotFoundException('Certificate not found');
        }
        return {
            id: certificate.id,
            serialNumber: certificate.serialNumber,
            certificateUrl: certificate.certificateUrl,
            qrCodeUrl: certificate.qrCodeUrl,
            issuedAt: certificate.issuedAt,
            isRevoked: certificate.isRevoked,
            course: {
                id: certificate.course.id,
                title: certificate.course.titleEn,
                slug: certificate.course.slug,
                careerPath: {
                    id: certificate.course.careerPath.id,
                    title: certificate.course.careerPath.titleEn,
                    color: certificate.course.careerPath.color,
                },
            },
        };
    }
    async requestCertificate(userId, courseId, requestData) {
        // Check if user has completed the course
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });
        if (!enrollment || enrollment.status !== 'COMPLETED') {
            throw new common_1.BadRequestException('Course must be completed to request a certificate');
        }
        // Check if certificate already exists
        const existingCertificate = await this.prisma.certificate.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });
        if (existingCertificate) {
            throw new common_1.BadRequestException('Certificate already issued for this course');
        }
        // Generate certificate
        const certificate = await this.generateCertificate(userId, courseId, requestData);
        this.logger.log(`Certificate generated for user ${userId}, course ${courseId}`);
        return certificate;
    }
    async getCertificateTemplates() {
        // Mock templates - in a real app, these would be stored in the database
        return [
            {
                id: 'modern',
                name: 'Modern',
                description: 'Clean and modern design',
                thumbnail: 'https://example.com/templates/modern.jpg',
            },
            {
                id: 'classic',
                name: 'Classic',
                description: 'Traditional certificate design',
                thumbnail: 'https://example.com/templates/classic.jpg',
            },
            {
                id: 'minimal',
                name: 'Minimal',
                description: 'Simple and elegant design',
                thumbnail: 'https://example.com/templates/minimal.jpg',
            },
        ];
    }
    async createCertificateTemplate(templateData) {
        // Mock implementation - would store template in database
        const template = {
            id: `template_${Date.now()}`,
            ...templateData,
            createdAt: new Date(),
        };
        this.logger.log(`Certificate template created: ${template.name}`);
        return template;
    }
    async regenerateCertificate(certificateId) {
        const certificate = await this.prisma.certificate.findUnique({
            where: { id: certificateId },
        });
        if (!certificate) {
            throw new common_1.NotFoundException('Certificate not found');
        }
        // Generate new certificate with same serial number
        const newCertificate = await this.generateCertificate(certificate.userId, certificate.courseId, {}, certificate.serialNumber);
        this.logger.log(`Certificate regenerated: ${certificate.serialNumber}`);
        return newCertificate;
    }
    async revokeCertificate(certificateId, reason) {
        const certificate = await this.prisma.certificate.update({
            where: { id: certificateId },
            data: {
                issuedAt: new Date(),
                revokedAt: new Date(),
                revokeReason: reason,
            },
        });
        this.logger.log(`Certificate revoked: ${certificate.serialNumber}, reason: ${reason}`);
        return certificate;
    }
    async getAllCertificates(options) {
        const { page, limit, status, courseId } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (status === 'revoked') {
            where.isRevoked = true;
        }
        else if (status === 'active') {
            where.isRevoked = false;
        }
        if (courseId) {
            where.courseId = courseId;
        }
        const [certificates, total] = await Promise.all([
            this.prisma.certificate.findMany({
                where,
                include: {
                    user: {
                        include: { profile: true },
                    },
                    course: {
                        include: {
                            careerPath: true,
                        },
                    },
                },
                orderBy: { issuedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.certificate.count({ where }),
        ]);
        return {
            certificates,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async getCertificateStats() {
        const [totalCertificates, activeCertificates, revokedCertificates, certificatesThisMonth, certificatesThisYear,] = await Promise.all([
            this.prisma.certificate.count(),
            this.prisma.certificate.count({ where: {} }),
            this.prisma.certificate.count({ where: {} }),
            this.prisma.certificate.count({
                where: {
                    issuedAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
            this.prisma.certificate.count({
                where: {
                    issuedAt: {
                        gte: new Date(new Date().getFullYear(), 0, 1),
                    },
                },
            }),
        ]);
        return {
            totalCertificates,
            activeCertificates,
            revokedCertificates,
            certificatesThisMonth,
            certificatesThisYear,
            revokeRate: totalCertificates > 0 ? (revokedCertificates / totalCertificates) * 100 : 0,
        };
    }
    async bulkGenerateCertificates(enrollmentIds) {
        const results = [];
        for (const enrollmentId of enrollmentIds) {
            try {
                const enrollment = await this.prisma.enrollment.findUnique({
                    where: { id: enrollmentId },
                });
                if (enrollment && enrollment.status === 'COMPLETED') {
                    const certificate = await this.generateCertificate(enrollment.userId, enrollment.courseId, {});
                    results.push({
                        enrollmentId,
                        success: true,
                        certificate,
                    });
                }
                else {
                    results.push({
                        enrollmentId,
                        success: false,
                        error: 'Enrollment not completed',
                    });
                }
            }
            catch (error) {
                results.push({
                    enrollmentId,
                    success: false,
                    error: error.message,
                });
            }
        }
        this.logger.log(`Bulk certificate generation: ${results.filter(r => r.success).length}/${results.length} successful`);
        return {
            total: enrollmentIds.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
        };
    }
    async verifyBatchCertificates(serialNumbers) {
        const results = {};
        for (const serialNumber of serialNumbers) {
            results[serialNumber] = await this.verifyCertificate(serialNumber);
        }
        return results;
    }
    async getPublicCertificate(serialNumber) {
        const certificate = await this.prisma.certificate.findUnique({
            where: { serialNumber },
            include: {
                user: {
                    include: { profile: true },
                },
                course: {
                    include: {
                        careerPath: true,
                    },
                },
            },
        });
        if (!certificate) {
            throw new common_1.NotFoundException('Certificate not found');
        }
        // Return only public information
        return {
            serialNumber: certificate.serialNumber,
            issuedAt: certificate.issuedAt,
            isRevoked: certificate.isRevoked,
            user: {
                firstName: certificate.user.profile?.firstName,
                lastName: certificate.user.profile?.lastName,
            },
            course: {
                title: certificate.course.titleEn,
                duration: certificate.course.duration,
                level: certificate.course.level,
                careerPath: {
                    title: certificate.course.careerPath.titleEn,
                },
            },
            verificationUrl: `${this.configService.get('FRONTEND_URL')}/verify/${certificate.serialNumber}`,
        };
    }
    async generateCertificate(userId, courseId, options, existingSerialNumber) {
        const [user, course] = await Promise.all([
            this.prisma.user.findUnique({
                where: { id: userId },
                include: { profile: true },
            }),
            this.prisma.course.findUnique({
                where: { id: courseId },
                include: { careerPath: true },
            }),
        ]);
        if (!user || !course) {
            throw new common_1.NotFoundException('User or course not found');
        }
        const serialNumber = existingSerialNumber || this.generateSerialNumber();
        const fullName = options.fullName || `${user.profile?.firstName} ${user.profile?.lastName}`.trim();
        // Generate PDF certificate
        const pdfBuffer = await this.puppeteerService.generateCertificatePDF({
            serialNumber,
            fullName,
            courseTitle: course.titleEn,
            courseDuration: course.duration,
            careerPath: course.careerPath.titleEn,
            issuedAt: new Date(),
            includeDateOfBirth: options.includeDateOfBirth,
            dateOfBirth: user.profile?.dateOfBirth,
        });
        // Upload PDF to S3
        const pdfKey = `certificates/${serialNumber}.pdf`;
        await this.s3.upload({
            Bucket: this.configService.get('AWS_S3_BUCKET'),
            Key: pdfKey,
            Body: pdfBuffer,
            ContentType: 'application/pdf',
            ACL: 'public-read',
        }).promise();
        // Generate QR code
        const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify/${serialNumber}`;
        const qrCodeBuffer = await QRCode.toBuffer(verificationUrl);
        const qrKey = `qrcodes/${serialNumber}.png`;
        const qrUploadResult = await this.s3.upload({
            Bucket: this.configService.get('AWS_S3_BUCKET'),
            Key: qrKey,
            Body: qrCodeBuffer,
            ContentType: 'image/png',
            ACL: 'public-read',
        }).promise();
        // Create certificate record
        const certificate = await this.prisma.certificate.create({
            data: {
                userId,
                courseId,
                serialNumber,
                certificateUrl: `https://${this.configService.get('AWS_S3_BUCKET')}.s3.amazonaws.com/${pdfKey}`,
                qrCodeUrl: qrUploadResult.Location,
                issuedAt: new Date(),
            },
        });
        return certificate;
    }
    generateSerialNumber() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `CERT-${timestamp}-${random}`.toUpperCase();
    }
};
exports.CertificatesService = CertificatesService;
exports.CertificatesService = CertificatesService = CertificatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        puppeteer_service_1.PuppeteerService])
], CertificatesService);
