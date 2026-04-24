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
var CertificatesProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificatesProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const certificates_service_1 = require("./certificates.service");
let CertificatesProcessor = CertificatesProcessor_1 = class CertificatesProcessor {
    constructor(certificatesService) {
        this.certificatesService = certificatesService;
        this.logger = new common_1.Logger(CertificatesProcessor_1.name);
    }
    async handleGenerate(job) {
        const { userId, courseId } = job.data;
        this.logger.log(`Auto-generating certificate for user=${userId} course=${courseId}`);
        try {
            await this.certificatesService.generateCertificate(userId, courseId);
            this.logger.log(`Certificate generated for user=${userId} course=${courseId}`);
        }
        catch (err) {
            this.logger.error(`Certificate generation failed: ${err.message}`, err.stack);
            throw err;
        }
    }
};
exports.CertificatesProcessor = CertificatesProcessor;
__decorate([
    (0, bull_1.Process)('generate'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CertificatesProcessor.prototype, "handleGenerate", null);
exports.CertificatesProcessor = CertificatesProcessor = CertificatesProcessor_1 = __decorate([
    (0, bull_1.Processor)('certificates'),
    __metadata("design:paramtypes", [certificates_service_1.CertificatesService])
], CertificatesProcessor);
//# sourceMappingURL=certificates.processor.js.map