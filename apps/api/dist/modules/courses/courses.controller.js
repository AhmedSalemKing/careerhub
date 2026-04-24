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
exports.CoursesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const courses_service_1 = require("./courses.service");
const enrollment_service_1 = require("./enrollment.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CoursesController = class CoursesController {
    constructor(coursesService, enrollmentService) {
        this.coursesService = coursesService;
        this.enrollmentService = enrollmentService;
    }
    async getCourses(page, limit, careerPath, categoryId, level, search, language) {
        const courses = await this.coursesService.getCourses({
            page: page || 1,
            limit: limit || 12,
            careerPath,
            categoryId,
            level,
            search,
            language: language || 'en',
        });
        return {
            success: true,
            data: courses,
        };
    }
    async globalSearch(q) {
        const data = await this.coursesService.globalSearch(q || '');
        return { success: true, data };
    }
    async getCategories(language) {
        return this.coursesService.getCategories(language || 'en');
    }
    async getFeaturedCourses(limit, language) {
        const courses = await this.coursesService.getFeaturedCourses(limit || 6, language || 'en');
        return {
            success: true,
            data: { courses },
        };
    }
    async getEnrolledCourses(req) {
        const userId = req.user.sub || req.user.id;
        const result = await this.coursesService.getMyCourses(userId, { page: 1, limit: 100 });
        return { success: true, data: result.enrollments };
    }
    async getMyCourses(req, page, limit, status) {
        if (req.user.accountType === 'INSTRUCTOR') {
            return this.coursesService.getInstructorCourses(req.user.id);
        }
        const courses = await this.coursesService.getMyCourses(req.user.id, {
            page: page || 1,
            limit: limit || 10,
            status,
        });
        return { success: true, data: courses };
    }
    async getInstructorStats(req) {
        return this.coursesService.getInstructorStats(req.user.id);
    }
    async getCourseBySlug(slug, language) {
        const isCuid = /^c[a-z0-9]{24,}$/.test(slug);
        if (isCuid) {
            try {
                const course = await this.coursesService.getCourseById(slug);
                return { success: true, data: { course } };
            }
            catch {
            }
        }
        const course = await this.coursesService.getCourseBySlug(slug, language || 'en');
        return {
            success: true,
            data: { course },
        };
    }
    async getCourseLessons(id, language) {
        const lessons = await this.coursesService.getCourseLessons(id, language || 'en');
        return {
            success: true,
            data: { lessons },
        };
    }
    async enrollInCourse(user, courseId) {
        const enrollment = await this.enrollmentService.enrollUser(user.id, courseId);
        return {
            success: true,
            message: 'Enrolled successfully',
            data: { enrollment },
        };
    }
    async getEnrollmentStatus(user, courseId) {
        const enrollment = await this.enrollmentService.getEnrollment(user.id, courseId);
        return {
            success: true,
            data: { enrollment },
        };
    }
    async markLessonComplete(courseId, lessonId, req) {
        const userId = req.user.sub || req.user.id;
        const result = await this.coursesService.markLessonComplete(userId, courseId, lessonId);
        return { success: true, data: result };
    }
    async heartbeat(courseId, lessonId, seconds, req) {
        const userId = req.user.sub || req.user.id;
        const clampedSeconds = Math.max(1, Math.min(60, Math.floor(Number(seconds) || 30)));
        const result = await this.coursesService.heartbeat(userId, courseId, lessonId, clampedSeconds);
        return { success: true, data: result };
    }
    async completeCheck(courseId, req) {
        const userId = req.user.sub || req.user.id;
        const result = await this.coursesService.completeCheck(userId, courseId);
        return { success: true, data: result };
    }
    async updateProgress(user, courseId, lessonId, progress, timeSpent) {
        const updatedProgress = await this.enrollmentService.updateEnrollmentProgress(user.id, 0);
        return {
            success: true,
            message: 'Progress updated successfully',
            data: updatedProgress,
        };
    }
    async getCourseStats(user, courseId) {
        const stats = await this.coursesService.getCourseStats(courseId, user.id);
        return {
            success: true,
            data: { stats },
        };
    }
    async getLevels() {
        const levels = await this.coursesService.getLevels();
        return {
            success: true,
            data: { levels },
        };
    }
    async getRecommendations(user) {
        const recommendations = await this.coursesService.getRecommendations(user.id);
        return {
            success: true,
            data: { recommendations },
        };
    }
    async getSearchSuggestions(query) {
        const suggestions = await this.coursesService.getSearchSuggestions(query);
        return {
            success: true,
            data: { suggestions },
        };
    }
    async getInstructorCourseDetails(id, req) {
        return this.coursesService.getInstructorCourseDetails(id, req.user.id);
    }
    async addSection(id, req, body) {
        return this.coursesService.addSection(id, req.user.id, body.title);
    }
    async addLesson(sectionId, body) {
        return this.coursesService.addLesson(sectionId, body);
    }
    async createCourse(req, body) {
        if (req.user.role === 'ADMIN') {
            const course = await this.coursesService.createCourse(body);
            return { success: true, message: 'Course created successfully', data: { course } };
        }
        return this.coursesService.createInstructorCourse(req.user.id, body);
    }
    async updateCourse(id, req, body) {
        if (req.user.role === 'ADMIN') {
            const course = await this.coursesService.updateCourse(id, body);
            return { success: true, message: 'Course updated successfully', data: { course } };
        }
        return this.coursesService.updateInstructorCourse(id, req.user.id, body);
    }
    async deleteCourse(id) {
        await this.coursesService.deleteCourse(id);
    }
    async publishCourse(id) {
        const course = await this.coursesService.publishCourse(id);
        return {
            success: true,
            message: 'Course published successfully',
            data: { course },
        };
    }
    async unpublishCourse(id) {
        const course = await this.coursesService.unpublishCourse(id);
        return {
            success: true,
            message: 'Course unpublished successfully',
            data: { course },
        };
    }
    async getAdminCourses(page, limit, status, search) {
        const courses = await this.coursesService.getAdminCourses({
            page: page || 1,
            limit: limit || 20,
            status,
            search,
        });
        return {
            success: true,
            data: courses,
        };
    }
    async getCourseAnalytics(id) {
        const analytics = await this.coursesService.getCourseAnalytics(id);
        return {
            success: true,
            data: { analytics },
        };
    }
};
exports.CoursesController = CoursesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all courses' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Courses retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'careerPath', required: false, description: 'Filter by career path' }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, description: 'Filter by category (includes subcategories)' }),
    (0, swagger_1.ApiQuery)({ name: 'level', required: false, description: 'Filter by level' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search term' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('careerPath')),
    __param(3, (0, common_1.Query)('categoryId')),
    __param(4, (0, common_1.Query)('level')),
    __param(5, (0, common_1.Query)('search')),
    __param(6, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getCourses", null);
__decorate([
    (0, common_1.Get)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Global search for courses and consultants' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "globalSearch", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all course categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Categories retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' }),
    __param(0, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('featured'),
    (0, swagger_1.ApiOperation)({ summary: 'Get featured courses' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Featured courses retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of courses to return' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' }),
    __param(0, (0, common_1.Query)('limit')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getFeaturedCourses", null);
__decorate([
    (0, common_1.Get)('enrolled'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get enrolled courses for current user' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getEnrolledCourses", null);
__decorate([
    (0, common_1.Get)('my-courses'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get courses (enrolled for students, created for instructors)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Courses retrieved successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getMyCourses", null);
__decorate([
    (0, common_1.Get)('instructor/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get instructor dashboard stats' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getInstructorStats", null);
__decorate([
    (0, common_1.Get)(':slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course by slug or ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Course not found' }),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Course slug or ID' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getCourseBySlug", null);
__decorate([
    (0, common_1.Get)(':id/lessons'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course lessons' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lessons retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Course ID' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getCourseLessons", null);
__decorate([
    (0, common_1.Post)(':id/enroll'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Enroll in a course' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Enrolled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Already enrolled or course not available' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Course ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "enrollInCourse", null);
__decorate([
    (0, common_1.Get)(':id/enrollment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get course enrollment status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Enrollment status retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Course ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getEnrollmentStatus", null);
__decorate([
    (0, common_1.Post)(':courseId/lessons/:lessonId/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a lesson as complete and update progress' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lesson completed, enrollment progress updated' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Not enrolled in this course' }),
    (0, swagger_1.ApiParam)({ name: 'courseId', description: 'Course ID' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID' }),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, common_1.Param)('lessonId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "markLessonComplete", null);
__decorate([
    (0, common_1.Post)(':courseId/lessons/:lessonId/heartbeat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Track time spent on a lesson' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Time tracked successfully' }),
    (0, swagger_1.ApiParam)({ name: 'courseId', description: 'Course ID' }),
    (0, swagger_1.ApiParam)({ name: 'lessonId', description: 'Lesson ID' }),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, common_1.Param)('lessonId')),
    __param(2, (0, common_1.Body)('seconds')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)(':id/complete-check'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Check if course is completed and get certificate URL' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "completeCheck", null);
__decorate([
    (0, common_1.Post)(':id/progress'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update course progress' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Progress updated successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Course ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('lessonId')),
    __param(3, (0, common_1.Body)('progress')),
    __param(4, (0, common_1.Body)('timeSpent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "updateProgress", null);
__decorate([
    (0, common_1.Get)(':id/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get course statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Course ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getCourseStats", null);
__decorate([
    (0, common_1.Get)('levels/list'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course levels' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Levels retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getLevels", null);
__decorate([
    (0, common_1.Post)('recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get course recommendations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recommendations retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('search/suggestions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get search suggestions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Suggestions retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'q', required: true, description: 'Search query' }),
    __param(0, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getSearchSuggestions", null);
__decorate([
    (0, common_1.Get)('instructor/:id/details'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get full course details for instructor' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getInstructorCourseDetails", null);
__decorate([
    (0, common_1.Post)('instructor/:id/sections'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add section to instructor course' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "addSection", null);
__decorate([
    (0, common_1.Post)('sections/:sectionId/lessons'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add lesson to section' }),
    __param(0, (0, common_1.Param)('sectionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "addLesson", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create course (Admin: full DTO / Instructor: own course)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Course created successfully' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "createCourse", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update course (Admin: any / Instructor: own)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "updateCourse", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a course (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Course deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "deleteCourse", null);
__decorate([
    (0, common_1.Patch)(':id/publish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Publish a course (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course published successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "publishCourse", null);
__decorate([
    (0, common_1.Patch)(':id/unpublish'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Unpublish a course (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course unpublished successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "unpublishCourse", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all courses for admin (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Courses retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getAdminCourses", null);
__decorate([
    (0, common_1.Get)(':id/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get course analytics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoursesController.prototype, "getCourseAnalytics", null);
exports.CoursesController = CoursesController = __decorate([
    (0, swagger_1.ApiTags)('Courses'),
    (0, common_1.Controller)('courses'),
    __metadata("design:paramtypes", [courses_service_1.CoursesService,
        enrollment_service_1.EnrollmentService])
], CoursesController);
//# sourceMappingURL=courses.controller.js.map