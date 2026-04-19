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
exports.LessonsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const lessons_service_1 = require("./lessons.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let LessonsController = class LessonsController {
    constructor(lessonsService) {
        this.lessonsService = lessonsService;
    }
    async getLesson(id, language) {
        const lesson = await this.lessonsService.getLesson(id, language || 'en');
        return {
            success: true,
            data: { lesson },
        };
    }
    async getLessonContent(user, id, language) {
        const content = await this.lessonsService.getLessonContent(user.id, id, language || 'en');
        return {
            success: true,
            data: { content },
        };
    }
    async getLessonVideo(user, id) {
        const videoData = await this.lessonsService.getLessonVideo(user.id, id);
        return {
            success: true,
            data: videoData,
        };
    }
    async updateProgress(user, id, progressData) {
        const result = await this.lessonsService.updateProgress(user.id, id, progressData);
        return {
            success: true,
            message: 'Progress updated successfully',
            data: result,
        };
    }
    async completeLesson(user, id, timeSpent) {
        const result = await this.lessonsService.completeLesson(user.id, id, timeSpent);
        return {
            success: true,
            message: 'Lesson completed successfully',
            data: result,
        };
    }
    async getLessonQuiz(user, id, language) {
        const quiz = await this.lessonsService.getLessonQuiz(user.id, id);
        return {
            success: true,
            data: { quiz },
        };
    }
    async submitQuiz(user, id, submissionData) {
        const result = await this.lessonsService.submitQuiz(user.id, id, submissionData);
        return {
            success: true,
            message: 'Quiz submitted successfully',
            data: result,
        };
    }
    async getNextLesson(user, id) {
        const nextLesson = await this.lessonsService.getNextLesson(user.id, id);
        return {
            success: true,
            data: { nextLesson },
        };
    }
    async getPreviousLesson(user, id) {
        const previousLesson = await this.lessonsService.getPreviousLesson(user.id, id);
        return {
            success: true,
            data: { previousLesson },
        };
    }
    async getCourseOutline(courseId, language) {
        const outline = await this.lessonsService.getCourseOutline(courseId, language || 'en');
        return {
            success: true,
            data: { outline },
        };
    }
    async getLessonNotes(user, id) {
        const notes = await this.lessonsService.getLessonNotes(user.id, id);
        return {
            success: true,
            data: { notes },
        };
    }
    async saveLessonNotes(user, id, notesData) {
        const notes = await this.lessonsService.saveLessonNotes(user.id, id, notesData);
        return {
            success: true,
            message: 'Notes saved successfully',
            data: { notes },
        };
    }
    async getLessonDiscussion(id, page, limit) {
        const discussion = await this.lessonsService.getPopularLessons({
            page: page || 1,
            limit: limit || 20,
        });
        return {
            success: true,
            data: discussion,
        };
    }
    async createLesson(createLessonDto) {
        const lesson = await this.lessonsService.createLesson(createLessonDto);
        return {
            success: true,
            message: 'Lesson created successfully',
            data: { lesson },
        };
    }
    async updateLesson(id, updateLessonDto) {
        const lesson = await this.lessonsService.updateLesson(id, updateLessonDto);
        return {
            success: true,
            message: 'Lesson updated successfully',
            data: { lesson },
        };
    }
    async deleteLesson(id) {
        await this.lessonsService.deleteLesson(id);
    }
    async publishLesson(id) {
        const lesson = await this.lessonsService.publishLesson(id);
        return {
            success: true,
            message: 'Lesson published successfully',
            data: { lesson },
        };
    }
    async unpublishLesson(id) {
        const lesson = await this.lessonsService.unpublishLesson(id);
        return {
            success: true,
            message: 'Lesson unpublished successfully',
            data: { lesson },
        };
    }
    async getLessonAnalytics(id) {
        const analytics = await this.lessonsService.getLessonAnalytics(id);
        return {
            success: true,
            data: { analytics },
        };
    }
    async getAdminLessons(page, limit, courseId, isPublished) {
        const lessons = await this.lessonsService.getAdminLessons({
            page: page || 1,
            limit: limit || 20,
            courseId,
            isPublished,
        });
        return {
            success: true,
            data: lessons,
        };
    }
};
exports.LessonsController = LessonsController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get lesson by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lesson retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Lesson not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getLesson", null);
__decorate([
    (0, common_1.Get)(':id/content'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get lesson content (requires enrollment)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lesson content retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not enrolled in course' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Content language' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getLessonContent", null);
__decorate([
    (0, common_1.Get)(':id/video'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get lesson video URL (requires enrollment)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Video URL retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not enrolled in course' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getLessonVideo", null);
__decorate([
    (0, common_1.Post)(':id/progress'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update lesson progress' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Progress updated successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "updateProgress", null);
__decorate([
    (0, common_1.Post)(':id/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mark lesson as completed' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lesson marked as completed' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('timeSpent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "completeLesson", null);
__decorate([
    (0, common_1.Get)(':id/quiz'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get lesson quiz' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Quiz retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No quiz found for this lesson' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Quiz language' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getLessonQuiz", null);
__decorate([
    (0, common_1.Post)(':id/quiz/submit'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit lesson quiz answers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Quiz submitted successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "submitQuiz", null);
__decorate([
    (0, common_1.Get)(':id/next'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get next lesson in course' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Next lesson retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No next lesson found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Current lesson ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getNextLesson", null);
__decorate([
    (0, common_1.Get)(':id/previous'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get previous lesson in course' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Previous lesson retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'No previous lesson found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Current lesson ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getPreviousLesson", null);
__decorate([
    (0, common_1.Get)('course/:courseId/outline'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course lesson outline' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course outline retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'courseId', description: 'Course ID' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Content language' }),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getCourseOutline", null);
__decorate([
    (0, common_1.Get)(':id/notes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get lesson notes' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notes retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getLessonNotes", null);
__decorate([
    (0, common_1.Post)(':id/notes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Save lesson notes' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notes saved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "saveLessonNotes", null);
__decorate([
    (0, common_1.Get)(':id/discussion'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get lesson discussion' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Discussion retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Lesson ID' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getLessonDiscussion", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new lesson (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Lesson created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "createLesson", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update a lesson (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lesson updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "updateLesson", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a lesson (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Lesson deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "deleteLesson", null);
__decorate([
    (0, common_1.Patch)(':id/publish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Publish a lesson (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lesson published successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "publishLesson", null);
__decorate([
    (0, common_1.Patch)(':id/unpublish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Unpublish a lesson (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lesson unpublished successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "unpublishLesson", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get lesson analytics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getLessonAnalytics", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all lessons for admin (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lessons retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('courseId')),
    __param(3, (0, common_1.Query)('isPublished')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, Boolean]),
    __metadata("design:returntype", Promise)
], LessonsController.prototype, "getAdminLessons", null);
exports.LessonsController = LessonsController = __decorate([
    (0, swagger_1.ApiTags)('Lessons'),
    (0, common_1.Controller)('lessons'),
    __metadata("design:paramtypes", [lessons_service_1.LessonsService])
], LessonsController);
//# sourceMappingURL=lessons.controller.js.map