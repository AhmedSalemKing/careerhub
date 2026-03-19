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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollmentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let EnrollmentService = class EnrollmentService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async enrollUser(userId, courseId, paymentId) { return { success: true, courseId, userId }; }
    async getEnrollment(userId, courseId) { return this.prisma.enrollment.findFirst({ where: { userId, courseId } }); }
    async getUserEnrollments(userId, options) { return { data: [], total: 0 }; }
    async updateEnrollmentProgress(enrollmentId, progress) { return { success: true, progress }; }
    async completeEnrollment(enrollmentId) { return { success: true }; }
    async getEnrollmentDetails(userId, courseId, language) { return { courseId, userId, progress: 0 }; }
    async getEnrollmentProgress(userId, courseId) { return { progress: 0, completedLessons: 0, totalLessons: 0 }; }
    async unenroll(userId, courseId) { return { success: true }; }
    async getAdminEnrollments(options) { return { data: [], total: 0 }; }
    async checkLessonCompletion(userId, lessonId, courseId) { return { success: true }; }
};
exports.EnrollmentService = EnrollmentService;
exports.EnrollmentService = EnrollmentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], EnrollmentService);
