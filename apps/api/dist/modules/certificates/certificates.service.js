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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const canvas_1 = require("@napi-rs/canvas");
const QRCode = __importStar(require("qrcode"));
const uuid_1 = require("uuid");
const path = __importStar(require("path"));
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
const sharp_1 = __importDefault(require("sharp"));
let CertificatesService = class CertificatesService {
    constructor(prisma) {
        this.prisma = prisma;
        cloudinary_1.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
        });
    }
    async generateCertificate(userId, courseId, bypassEnrollment = false) {
        var _a;
        try {
            return await this._doGenerate(userId, courseId, bypassEnrollment);
        }
        catch (e) {
            console.error('[Certificate] Generation error:', {
                message: e.message,
                code: e.code,
                stack: (_a = e.stack) === null || _a === void 0 ? void 0 : _a.split('\n').slice(0, 6).join(' | '),
            });
            throw e;
        }
    }
    async _doGenerate(userId, courseId, bypassEnrollment) {
        var _a;
        const existing = await this.prisma.certificate.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        if (existing)
            return { success: true, data: existing };
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                instructor: {
                    include: { profile: true },
                },
            },
        });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        if (!bypassEnrollment) {
            const enrollment = await this.prisma.enrollment.findUnique({
                where: { userId_courseId: { userId, courseId } },
            });
            if (!enrollment)
                throw new common_1.ForbiddenException('Not enrolled in this course');
        }
        const serialNumber = `DVW-${Date.now().toString(36).toUpperCase()}-${(0, uuid_1.v4)().slice(0, 8).toUpperCase()}`;
        const studentName = user.profile
            ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim()
            : user.email.split('@')[0];
        const courseTitle = course.titleAr || course.titleEn || 'الدورة التدريبية';
        const instructorName = ((_a = course.instructor) === null || _a === void 0 ? void 0 : _a.profile)
            ? `${course.instructor.profile.firstName || ''} ${course.instructor.profile.lastName || ''}`.trim()
            : 'DeveWay Instructor';
        const instructorSignatureUrl = null;
        const issueDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const certificateBuffer = await this.createCertificateImage({
            studentName,
            courseTitle,
            issueDate,
            serialNumber,
            instructorName,
            instructorSignatureUrl,
        });
        const certificateUrl = await this.uploadToCloudinary(certificateBuffer, serialNumber);
        const certificate = await this.prisma.certificate.create({
            data: {
                userId,
                courseId,
                serialNumber,
                certificateUrl,
                qrCodeUrl: certificateUrl,
                issuedAt: new Date(),
            },
        });
        return { success: true, data: certificate };
    }
    resolveTemplatePath() {
        const fs = require('fs');
        const candidates = [
            path.join(__dirname, 'template.png'),
            path.join(process.cwd(), 'dist', 'modules', 'certificates', 'template.png'),
            path.join(process.cwd(), 'src', 'modules', 'certificates', 'template.png'),
            path.join(process.cwd(), 'public', 'template.png'),
        ];
        console.log('[Certificate] __dirname:', __dirname);
        for (const p of candidates) {
            const exists = fs.existsSync(p);
            console.log(`[Certificate] Checking ${p} → ${exists ? 'FOUND' : 'missing'}`);
            if (exists)
                return p;
        }
        console.error('[Certificate] Template NOT FOUND. Searched:', candidates);
        throw new Error('Certificate template not found in any expected location');
    }
    registerFonts() {
        var _a, _b;
        const fs = require('fs');
        const { GlobalFonts } = require('@napi-rs/canvas');
        const base = path.join(process.cwd(), 'node_modules', '@fontsource');
        const fonts = [
            { file: path.join(base, 'playfair-display', 'files', 'playfair-display-latin-400-normal.woff2'), family: 'Playfair Display' },
            { file: path.join(base, 'playfair-display', 'files', 'playfair-display-latin-400-italic.woff2'), family: 'Playfair Display' },
            { file: path.join(base, 'cormorant-garamond', 'files', 'cormorant-garamond-latin-400-normal.woff2'), family: 'Cormorant Garamond' },
            { file: path.join(base, 'cormorant-garamond', 'files', 'cormorant-garamond-latin-400-italic.woff2'), family: 'Cormorant Garamond' },
            { file: path.join(base, 'great-vibes', 'files', 'great-vibes-latin-400-normal.woff2'), family: 'Great Vibes' },
        ];
        for (const f of fonts) {
            if (fs.existsSync(f.file)) {
                try {
                    GlobalFonts.registerFromPath(f.file, f.family);
                }
                catch { }
            }
            else {
                console.warn('[Certificate] Font not found:', f.file);
            }
        }
        console.log('[Certificate] Registered fonts:', (_b = (_a = GlobalFonts.families) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : '?');
    }
    async createCertificateImage(data) {
        this.registerFonts();
        const fs = require('fs');
        const { GlobalFonts } = require('@napi-rs/canvas');
        const arabicFontPath = path.join(__dirname, 'fonts', 'certificate.ttf');
        if (fs.existsSync(arabicFontPath)) {
            try {
                GlobalFonts.registerFromPath(arabicFontPath, 'CertificateArabic');
            }
            catch { }
            console.log('[Certificate] Arabic font registered');
        }
        else {
            console.warn('[Certificate] Arabic font not found:', arabicFontPath);
        }
        const templatePath = this.resolveTemplatePath();
        const template = await (0, canvas_1.loadImage)(templatePath).catch((e) => {
            console.error('[Certificate] loadImage failed:', e.message, 'path:', templatePath);
            throw e;
        });
        const W = template.width;
        const H = template.height;
        console.log(`[Certificate] Template loaded: ${W}x${H}`);
        const canvas = (0, canvas_1.createCanvas)(W, H);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(template, 0, 0);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.floor(W * 0.042)}px "Playfair Display", Georgia, serif`;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillText('Certificate of Completion', W / 2, H * 0.230);
        ctx.font = `${Math.floor(W * 0.016)}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillStyle = '#2c2c2c';
        ctx.fillText('This is to certify that', W / 2, H * 0.305);
        ctx.font = `${Math.floor(W * 0.015)}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillStyle = '#2c2c2c';
        ctx.fillText('has successfully completed the course:', W / 2, H * 0.455);
        ctx.font = `${Math.floor(W * 0.013)}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillText('This certificate is awarded in recognition of their commitment and', W / 2, H * 0.650);
        ctx.fillText('achievement in mastering the course material.', W / 2, H * 0.670);
        ctx.font = `${Math.floor(W * 0.012)}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillText('DeveWay Instructor', W * 0.215, H * 0.855);
        ctx.fillText('DeveWay CEO', W * 0.785, H * 0.855);
        ctx.font = `${Math.floor(W * 0.010)}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillStyle = '#5a5a5a';
        ctx.fillText('www.deveway.com', W / 2, H * 0.920);
        const nameLen = data.studentName.length;
        const nameFontSize = nameLen > 35 ? Math.floor(W * 0.030)
            : nameLen > 25 ? Math.floor(W * 0.036)
                : Math.floor(W * 0.042);
        const nameHasArabic = /[\u0600-\u06FF]/.test(data.studentName);
        if (nameHasArabic) {
            ctx.font = `bold ${nameFontSize}px "CertificateArabic", Arial, sans-serif`;
            ctx.direction = 'rtl';
        }
        else {
            ctx.font = `italic bold ${nameFontSize}px "Playfair Display", Georgia, serif`;
            ctx.direction = 'ltr';
        }
        ctx.fillStyle = '#1a1a2e';
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 2;
        ctx.fillText(data.studentName.length > 40 ? data.studentName.substring(0, 38) + '...' : data.studentName, W / 2, H * 0.360);
        ctx.shadowBlur = 0;
        ctx.direction = 'ltr';
        const courseFontSize = data.courseTitle.length > 35 ? Math.floor(W * 0.024) : Math.floor(W * 0.030);
        const courseHasArabic = /[\u0600-\u06FF]/.test(data.courseTitle);
        if (courseHasArabic) {
            ctx.font = `bold ${courseFontSize}px "CertificateArabic", Arial, sans-serif`;
            ctx.direction = 'rtl';
        }
        else {
            ctx.font = `bold ${courseFontSize}px "Playfair Display", Georgia, serif`;
            ctx.direction = 'ltr';
        }
        ctx.fillStyle = '#1a1a2e';
        const courseLines = this.splitText(ctx, data.courseTitle, W * 0.68);
        if (courseLines.length === 1) {
            ctx.fillText(courseLines[0], W / 2, H * 0.520);
        }
        else {
            ctx.fillText(courseLines[0], W / 2, H * 0.505);
            ctx.fillText(courseLines[1] || '', W / 2, H * 0.540);
        }
        ctx.direction = 'ltr';
        ctx.font = `${Math.floor(W * 0.015)}px "Cormorant Garamond", Georgia, serif`;
        ctx.fillStyle = '#2c2c2c';
        ctx.fillText(`on ${data.issueDate}`, W / 2, H * 0.610);
        ctx.font = `italic ${Math.floor(W * 0.018)}px "Playfair Display", Georgia, serif`;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillText(data.instructorName, W * 0.215, H * 0.800);
        ctx.font = `${Math.floor(W * 0.009)}px "Courier New", monospace`;
        ctx.fillStyle = '#5a5a5a';
        ctx.fillText(`Certificate ID: ${data.serialNumber}`, W / 2, H * 0.890);
        const certBuffer = canvas.toBuffer('image/png');
        console.log('[QR] Starting QR generation');
        const verifyUrl = `${process.env.LEARN_URL || 'https://devewayhub.vercel.app'}/ar/certificate/${data.serialNumber}`;
        console.log('[QR] URL:', verifyUrl);
        const qrBuffer = await QRCode.toBuffer(verifyUrl, {
            width: Math.floor(W * 0.095),
            margin: 2,
            type: 'png',
            color: { dark: '#000000', light: '#ffffff' },
        });
        console.log('[QR] Buffer generated, size:', qrBuffer.length);
        const qrSize = Math.floor(W * 0.095);
        const qrX = Math.floor(W * 0.840);
        const qrY = Math.floor(H * 0.695);
        const qrWithBg = await (0, sharp_1.default)({
            create: {
                width: qrSize + 20,
                height: qrSize + 35,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 },
            },
        })
            .composite([{ input: qrBuffer, left: 10, top: 5 }])
            .png()
            .toBuffer();
        const finalBuffer = await (0, sharp_1.default)(certBuffer)
            .composite([{
                input: qrWithBg,
                left: qrX - 10,
                top: qrY - 5,
            }])
            .png()
            .toBuffer();
        console.log('[QR] Composite complete');
        return finalBuffer;
    }
    splitText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let cur = '';
        for (const word of words) {
            const test = cur ? `${cur} ${word}` : word;
            if (ctx.measureText(test).width > maxWidth && cur) {
                lines.push(cur);
                cur = word;
            }
            else {
                cur = test;
            }
        }
        if (cur)
            lines.push(cur);
        return lines;
    }
    uploadToCloudinary(buffer, serialNumber) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder: 'deveway/certificates',
                public_id: serialNumber,
                resource_type: 'image',
                format: 'png',
            }, (error, result) => {
                if (error)
                    return reject(error);
                resolve(result.secure_url);
            });
            const readable = new stream_1.Readable();
            readable.push(buffer);
            readable.push(null);
            readable.pipe(uploadStream);
        });
    }
    async verifyCertificate(serialNumber) {
        var _a;
        const cert = await this.prisma.certificate.findFirst({
            where: { serialNumber },
            include: {
                user: { include: { profile: true } },
                course: {
                    include: {
                        instructor: { include: { profile: true } },
                    },
                },
            },
        });
        if (!cert)
            throw new common_1.NotFoundException('الشهادة غير موجودة أو رمز التحقق غير صحيح');
        const studentName = cert.user.profile
            ? `${cert.user.profile.firstName || ''} ${cert.user.profile.lastName || ''}`.trim()
            : cert.user.email;
        const instructorName = ((_a = cert.course.instructor) === null || _a === void 0 ? void 0 : _a.profile)
            ? `${cert.course.instructor.profile.firstName || ''} ${cert.course.instructor.profile.lastName || ''}`.trim()
            : 'DeveWay Instructor';
        return {
            valid: true,
            studentName,
            courseTitle: cert.course.titleAr || cert.course.titleEn,
            instructorName,
            issueDate: cert.issuedAt,
            verifyCode: cert.serialNumber,
            certificateUrl: cert.certificateUrl,
        };
    }
    async getMyCertificates(userId) {
        return this.prisma.certificate.findMany({
            where: { userId },
            include: {
                course: {
                    select: {
                        id: true,
                        titleAr: true,
                        titleEn: true,
                        thumbnail: true,
                        instructor: {
                            include: { profile: { select: { firstName: true, lastName: true } } },
                        },
                    },
                },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }
    async getAllCertificatesAdmin() {
        return this.prisma.certificate.findMany({
            include: {
                user: {
                    include: { profile: { select: { firstName: true, lastName: true } } },
                },
                course: {
                    select: { titleAr: true, titleEn: true },
                },
            },
            orderBy: { issuedAt: 'desc' },
            take: 200,
        });
    }
    async getUserCertificates(userId, options) {
        const { page, limit } = options;
        const skip = (page - 1) * limit;
        const [certificates, total] = await Promise.all([
            this.prisma.certificate.findMany({
                where: { userId },
                include: { course: true },
                orderBy: { issuedAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.certificate.count({ where: { userId } }),
        ]);
        return {
            certificates,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }
    async getCertificateStats() {
        const total = await this.prisma.certificate.count();
        const thisMonth = await this.prisma.certificate.count({
            where: {
                issuedAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
            },
        });
        return { totalCertificates: total, certificatesThisMonth: thisMonth };
    }
};
exports.CertificatesService = CertificatesService;
exports.CertificatesService = CertificatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CertificatesService);
//# sourceMappingURL=certificates.service.js.map