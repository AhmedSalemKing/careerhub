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
let CertificatesController = class CertificatesController {
    constructor(certificatesService) {
        this.certificatesService = certificatesService;
    }
    async generate(courseId, req) {
        const userId = req.user.sub || req.user.id;
        const isAdmin = req.user.role === 'ADMIN' || req.user.accountType === 'ADMIN';
        return this.certificatesService.generateCertificate(userId, courseId, isAdmin);
    }
    async getMy(req) {
        const userId = req.user.sub || req.user.id;
        const certs = await this.certificatesService.getMyCertificates(userId);
        return { success: true, data: certs };
    }
    async getMyCertificatesLegacy(req) {
        const userId = req.user.sub || req.user.id;
        const certs = await this.certificatesService.getMyCertificates(userId);
        return { success: true, data: certs };
    }
    async verifyByCode(verifyCode) {
        const result = await this.certificatesService.verifyCertificate(verifyCode);
        return { success: true, data: result };
    }
    async getAllAdmin() {
        const certs = await this.certificatesService.getAllCertificatesAdmin();
        return { success: true, data: certs };
    }
    async getStats() {
        const stats = await this.certificatesService.getCertificateStats();
        return { success: true, data: stats };
    }
};
exports.CertificatesController = CertificatesController;
__decorate([
    (0, common_1.Post)('generate/:courseId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate certificate image for completed course' }),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user certificates' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getMy", null);
__decorate([
    (0, common_1.Get)('my-certificates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user certificates (legacy)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getMyCertificatesLegacy", null);
__decorate([
    (0, common_1.Get)('verify/:verifyCode'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify certificate by serial number' }),
    __param(0, (0, common_1.Param)('verifyCode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "verifyByCode", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all certificates (Admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getAllAdmin", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'SUPER_ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Certificate statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CertificatesController.prototype, "getStats", null);
exports.CertificatesController = CertificatesController = __decorate([
    (0, swagger_1.ApiTags)('Certificates'),
    (0, common_1.Controller)('certificates'),
    __metadata("design:paramtypes", [certificates_service_1.CertificatesService])
], CertificatesController);
//# sourceMappingURL=certificates.controller.js.map