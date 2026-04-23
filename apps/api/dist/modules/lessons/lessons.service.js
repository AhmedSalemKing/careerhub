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
exports.LessonsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LessonsService = class LessonsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLessons(courseId, language = 'en') { return { data: [], total: 0 }; }
    async getLesson(id, language = 'en') { return { id, title: 'stub' }; }
    async getLessonById(id, language = 'en') { return { id, title: 'stub' }; }
    async getLessonContent(userId, lessonId, language = 'en') { return { id: lessonId, content: 'stub' }; }
    async getLessonVideo(userId, lessonId) { return { id: lessonId, videoUrl: 'stub' }; }
    async updateLessonProgress(userId, lessonId, data) { return { success: true }; }
    async updateProgress(userId, lessonId, data) { return { success: true }; }
    async completeLesson(userId, lessonId, timeSpent) { return { success: true, completed: true }; }
    async markLessonAsComplete(userId, lessonId) { return { success: true, completed: true }; }
    async getLessonQuiz(lessonId, language = 'en') { return { lessonId, questions: [] }; }
    async submitQuiz(userId, lessonId, data) { return { success: true, score: 0, passed: false }; }
    async submitLessonQuiz(userId, lessonId, answers) { return { success: true, score: 0, passed: false }; }
    async getCourseOutline(courseId, userId, language = 'en') { return { courseId, modules: [] }; }
    async getCourseStructure(courseId, language = 'en') { return { modules: [] }; }
    async getLessonNotes(userId, lessonId) { return { notes: '' }; }
    async saveLessonNotes(userId, lessonId, data) { return { success: true, notes: data.notes }; }
    async updateLessonNotes(userId, lessonId, content) { return { success: true, content }; }
    async createLesson(data) { return { id: 'new-id', ...data }; }
    async updateLesson(id, data) { return { id, ...data }; }
    async deleteLesson(id) { return { success: true }; }
    async publishLesson(id) { return { id, isPublished: true }; }
    async unpublishLesson(id) { return { id, isPublished: false }; }
    async reorderLessons(moduleId, order) { return { success: true }; }
    async getLessonAnalytics(id) { return { totalViews: 0, completionRate: 0 }; }
    async getAdminLessons(options) { return { data: [], total: 0 }; }
    async adminGetLessons(options) { return { data: [], total: 0 }; }
    async getNextLesson(userId, currentLessonId) { return { id: 'next-id' }; }
    async getPreviousLesson(userId, currentLessonId) { return { id: 'prev-id' }; }
    async bookmarkLesson(userId, lessonId) { return { success: true }; }
    async unbookmarkLesson(userId, lessonId) { return { success: true }; }
    async getBookmarkedLessons(userId, options) { return { data: [], total: 0 }; }
    async getQuizAttempts(userId, lessonId) { return { data: [] }; }
    async resetQuizProgress(userId, lessonId) { return { success: true }; }
    async getLessonResources(lessonId) { return { data: [] }; }
    async addLessonResource(lessonId, data) { return { id: 'new-resource-id', ...data }; }
    async removeLessonResource(lessonId, resourceId) { return { success: true }; }
    async searchLessons(query, filters, options) { return { data: [], total: 0 }; }
    async getPopularLessons(options) { return { data: [], total: 0 }; }
    async getLessonDiscussion(userId, lessonId) { return { data: [], total: 0 }; }
};
exports.LessonsService = LessonsService;
exports.LessonsService = LessonsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LessonsService);
//# sourceMappingURL=lessons.service.js.map