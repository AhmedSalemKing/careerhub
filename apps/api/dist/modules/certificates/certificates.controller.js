"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const certificates_service_1 = require("./certificates.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CertificatesController = class CertificatesController {
    constructor(certificatesService) {
        this.certificatesService = certificatesService;
    }
    async getMyCertificates(user, page, limit) {
        const certificates = await this.certificatesService.getUserCertificates(user.id, {
            page: page || 1,
            limit: limit || 10,
        });
        return {
            success: true,
            data: certificates,
        };
    }
    async getCertificateBySerialNumber(serialNumber) {
        const certificate = await this.certificatesService.getCertificateBySerialNumber(serialNumber);
        return {
            success: true,
            data: { certificate },
        };
    }
    async verifyCertificate(serialNumber) {
        const verification = await this.certificatesService.verifyCertificate(serialNumber);
        return {
            success: true,
            data: verification,
        };
    }
    async downloadCertificate(user, serialNumber) {
        const downloadUrl = await this.certificatesService.getDownloadUrl(user.id, serialNumber);
        return {
            success: true,
            data: { downloadUrl },
        };
    }
    async getCertificateShareData(serialNumber) {
        const shareData = await this.certificatesService.getShareData(serialNumber);
        return {
            success: true,
            data: shareData,
        };
    }
    async shareCertificate(user, serialNumber, shareData) {
        const result = await this.certificatesService.shareCertificate(user.id, serialNumber, shareData);
        return {
            success: true,
            message: 'Certificate shared successfully',
            data: result,
        };
    }
    async getCourseCertificate(user, courseId) {
        const certificate = await this.certificatesService.getCourseCertificate(user.id, courseId);
        return {
            success: true,
            data: { certificate },
        };
    }
    async requestCertificate(user, courseId, requestData) {
        const certificate = await this.certificatesService.requestCertificate(user.id, courseId, requestData);
        return {
            success: true,
            message: 'Certificate generated successfully',
            data: { certificate },
        };
    }
    async getCertificateTemplates() {
        const templates = await this.certificatesService.getCertificateTemplates();
        return {
            success: true,
            data: { templates },
        };
    }
    async createCertificateTemplate(templateData) {
        const template = await this.certificatesService.createCertificateTemplate(templateData);
        return {
            success: true,
            message: 'Template created successfully',
            data: { template },
        };
    }
    async regenerateCertificate(certificateId) {
        const certificate = await this.certificatesService.regenerateCertificate(certificateId);
        return {
            success: true,
            message: 'Certificate regenerated successfully',
            data: { certificate },
        };
    }
    async revokeCertificate(certificateId, reason) {
        const certificate = await this.certificatesService.revokeCertificate(certificateId, reason);
        return {
            success: true,
            message: 'Certificate revoked successfully',
            data: { certificate },
        };
    }
    async getAllCertificates(page, limit, status, courseId) {
        const certificates = await this.certificatesService.getAllCertificates({
            page: page || 1,
            limit: limit || 20,
            status,
            courseId,
        });
        return {
            success: true,
            data: certificates,
        };
    }
    async getCertificateStats() {
        const stats = await this.certificatesService.getCertificateStats();
        return {
            success: true,
            data: { stats },
        };
    }
    async bulkGenerateCertificates(bulkData) {
        const result = await this.certificatesService.bulkGenerateCertificates(bulkData.enrollments);
        return {
            success: true,
            message: 'Bulk generation initiated',
            data: result,
        };
    }
    async verifyBatchCertificates(serialNumbers) {
        const serialNumbersArray = serialNumbers.split(',');
        const results = await this.certificatesService.verifyBatchCertificates(serialNumbersArray);
        return {
            success: true,
            data: results,
        };
    }
    async getPublicCertificate(serialNumber) {
        const certificate = await this.certificatesService.getPublicCertificate(serialNumber);
        return {
            success: true,
            data: { certificate },
        };
    }
};
exports.CertificatesController = CertificatesController;
__decorate([
    (0, common_1.Get)('my-certificates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user certificates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificates retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getMyCertificates", null);
__decorate([
    (0, common_1.Get)(':serialNumber'),
    (0, swagger_1.ApiOperation)({ summary: 'Get certificate by serial number' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificate retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Certificate not found' }),
    (0, swagger_1.ApiParam)({ name: 'serialNumber', description: 'Certificate serial number' }),
    __param(0, (0, common_1.Param)('serialNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getCertificateBySerialNumber", null);
__decorate([
    (0, common_1.Get)(':serialNumber/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify certificate authenticity' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificate verification result' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Certificate not found' }),
    (0, swagger_1.ApiParam)({ name: 'serialNumber', description: 'Certificate serial number' }),
    __param(0, (0, common_1.Param)('serialNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "verifyCertificate", null);
__decorate([
    (0, common_1.Get)(':serialNumber/download'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Download certificate PDF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Download URL generated' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not authorized to download this certificate' }),
    (0, swagger_1.ApiParam)({ name: 'serialNumber', description: 'Certificate serial number' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('serialNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "downloadCertificate", null);
__decorate([
    (0, common_1.Get)(':serialNumber/share'),
    (0, swagger_1.ApiOperation)({ summary: 'Get certificate sharing data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sharing data retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Certificate not found' }),
    (0, swagger_1.ApiParam)({ name: 'serialNumber', description: 'Certificate serial number' }),
    __param(0, (0, common_1.Param)('serialNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getCertificateShareData", null);
__decorate([
    (0, common_1.Post)(':serialNumber/share'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Share certificate on social media' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificate shared successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not authorized to share this certificate' }),
    (0, swagger_1.ApiParam)({ name: 'serialNumber', description: 'Certificate serial number' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('serialNumber')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "shareCertificate", null);
__decorate([
    (0, common_1.Get)('course/:courseId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get certificate for specific course' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificate retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Certificate not found' }),
    (0, swagger_1.ApiParam)({ name: 'courseId', description: 'Course ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getCourseCertificate", null);
__decorate([
    (0, common_1.Post)('request/:courseId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Request certificate for completed course' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Certificate request processed' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Course not completed or certificate already issued' }),
    (0, swagger_1.ApiParam)({ name: 'courseId', description: 'Course ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('courseId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "requestCertificate", null);
__decorate([
    (0, common_1.Get)('templates/list'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get certificate templates (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Templates retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getCertificateTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create certificate template (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Template created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "createCertificateTemplate", null);
__decorate([
    (0, common_1.Post)('regenerate/:certificateId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Regenerate certificate (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificate regenerated successfully' }),
    (0, swagger_1.ApiParam)({ name: 'certificateId', description: 'Certificate ID' }),
    __param(0, (0, common_1.Param)('certificateId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "regenerateCertificate", null);
__decorate([
    (0, common_1.Post)('revoke/:certificateId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke certificate (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificate revoked successfully' }),
    (0, swagger_1.ApiParam)({ name: 'certificateId', description: 'Certificate ID' }),
    __param(0, (0, common_1.Param)('certificateId')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "revokeCertificate", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all certificates (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificates retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'courseId', required: false, description: 'Filter by course' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getAllCertificates", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get certificate statistics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getCertificateStats", null);
__decorate([
    (0, common_1.Post)('bulk/generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk generate certificates (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Bulk generation initiated' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "bulkGenerateCertificates", null);
__decorate([
    (0, common_1.Get)('verify/batch'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify multiple certificates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Batch verification completed' }),
    __param(0, (0, common_1.Query)('serialNumbers')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "verifyBatchCertificates", null);
__decorate([
    (0, common_1.Get)('public/:serialNumber'),
    (0, swagger_1.ApiOperation)({ summary: 'Get public certificate view' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Public certificate data retrieved' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Certificate not found' }),
    (0, swagger_1.ApiParam)({ name: 'serialNumber', description: 'Certificate serial number' }),
    __param(0, (0, common_1.Param)('serialNumber')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getPublicCertificate", null);
exports.CertificatesController = CertificatesController = __decorate([
    (0, swagger_1.ApiTags)('Certificates'),
    (0, common_1.Controller)('certificates'),
    __metadata("design:paramtypes", [certificates_service_1.CertificatesService])
], CertificatesController);
