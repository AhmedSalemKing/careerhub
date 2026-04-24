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
exports.ProgressService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProgressService = class ProgressService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateLessonProgress(userId, lessonId, data) { return { success: true }; }
    async getLessonProgress(userId, lessonId) { return { progress: 0, completed: false }; }
    async getCourseProgress(userId, courseId) { return { progress: 0, completedLessons: 0, totalLessons: 0 }; }
    async getModuleProgress(userId, moduleId) { return { progress: 0 }; }
    async markLessonComplete(userId, lessonId, timeSpent) { return { success: true }; }
    async getUserProgressSummary(userId) { return { coursesInProgress: 0, coursesCompleted: 0 }; }
    async resetCourseProgress(userId, courseId) { return { success: true }; }
    async getProgressAnalytics(courseId) { return { avgProgress: 0, completionRate: 0 }; }
};
exports.ProgressService = ProgressService;
exports.ProgressService = ProgressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProgressService);
//# sourceMappingURL=progress.service.js.map