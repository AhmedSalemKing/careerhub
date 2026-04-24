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
exports.CareerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const career_service_1 = require("./career.service");
const assessment_service_1 = require("./assessment.service");
const ai_assessment_service_1 = require("./ai-assessment.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CareerController = class CareerController {
    constructor(careerService, assessmentService, aiAssessmentService) {
        this.careerService = careerService;
        this.assessmentService = assessmentService;
        this.aiAssessmentService = aiAssessmentService;
    }
    async saveMyPath(user, body) {
        const path = await this.careerService.saveUserCareerPath(user.id, body);
        return { success: true, data: { path } };
    }
    async getMyPath(user) {
        const path = await this.careerService.getUserCareerPath(user.id);
        return { success: true, data: { path } };
    }
    async getCareerPaths(language) {
        const careerPaths = await this.careerService.getCareerPaths(language);
        return {
            success: true,
            data: { careerPaths },
        };
    }
    async getCareerPathBySlug(slug, language) {
        const careerPath = await this.careerService.getCareerPathBySlug(slug, language);
        return {
            success: true,
            data: { careerPath },
        };
    }
    async getAiQuestions() {
        const questions = this.aiAssessmentService.getQuestions();
        return { success: true, data: { questions } };
    }
    async startAiSession(user) {
        const result = await this.aiAssessmentService.startSession(user.id);
        return { success: true, data: result };
    }
    async completeAiSession(user, sessionId, answers) {
        const result = await this.aiAssessmentService.completeSession(user.id, sessionId, answers);
        return { success: true, data: result };
    }
    async getAiSessionHistory(user) {
        const sessions = await this.aiAssessmentService.getSessionHistory(user.id);
        return { success: true, data: { sessions } };
    }
    async startAssessment(user, careerPathId) {
        const assessment = await this.assessmentService.startAssessment(user.id, careerPathId);
        return {
            success: true,
            message: 'Assessment started successfully',
            data: { assessment },
        };
    }
    async getNextQuestion(user, assessmentId, answer) {
        const result = await this.assessmentService.getNextQuestion(user.id, assessmentId, answer);
        return {
            success: true,
            data: result,
        };
    }
    async completeAssessment(user, assessmentId) {
        const result = await this.assessmentService.completeAssessment(user.id, assessmentId);
        return {
            success: true,
            message: 'Assessment completed successfully',
            data: result,
        };
    }
    async getAssessment(user, assessmentId) {
        const assessment = await this.assessmentService.getAssessment(user.id, assessmentId);
        return {
            success: true,
            data: { assessment },
        };
    }
    async getAssessmentHistory(user, page, limit) {
        const history = await this.assessmentService.getAssessmentHistory(user.id, {
            page: page || 1,
            limit: limit || 10,
        });
        return {
            success: true,
            data: history,
        };
    }
    async getCareerPathCourses(slug, language, level) {
        const courses = await this.careerService.getCareerPathCourses(slug, language, level);
        return {
            success: true,
            data: { courses },
        };
    }
    async getCareerPathStatistics(slug) {
        const statistics = await this.careerService.getCareerPathStatistics(slug);
        return {
            success: true,
            data: { statistics },
        };
    }
    async getRecommendations(user) {
        const recommendations = await this.careerService.getRecommendations(user.id);
        return {
            success: true,
            data: { recommendations },
        };
    }
    async getSkills(search) {
        const skills = await this.careerService.getSkills(search);
        return {
            success: true,
            data: { skills },
        };
    }
    async getMarketInsights(country, careerPath) {
        const insights = await this.careerService.getMarketInsights(country, careerPath);
        return {
            success: true,
            data: { insights },
        };
    }
    async compareCareerPaths(paths, language) {
        const comparison = await this.careerService.compareCareerPaths(paths, language);
        return {
            success: true,
            data: { comparison },
        };
    }
    async getCareerPathRoadmap(slug, language) {
        const roadmap = await this.careerService.getCareerPathRoadmap(slug, language);
        return {
            success: true,
            data: { roadmap },
        };
    }
};
exports.CareerController = CareerController;
__decorate([
    (0, common_1.Post)('my-path'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Save user selected career path' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Career path saved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "saveMyPath", null);
__decorate([
    (0, common_1.Get)('my-path'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user selected career path' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Career path retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getMyPath", null);
__decorate([
    (0, common_1.Get)('paths'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all career paths' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Career paths retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' }),
    __param(0, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getCareerPaths", null);
__decorate([
    (0, common_1.Get)('paths/:slug'),
    (0, swagger_1.ApiOperation)({ summary: 'Get career path by slug' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Career path retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Career path not found' }),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Career path slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getCareerPathBySlug", null);
__decorate([
    (0, common_1.Get)('assessment/questions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI assessment questions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Questions retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getAiQuestions", null);
__decorate([
    (0, common_1.Post)('assessment/session/start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Start AI assessment session' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Session started successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "startAiSession", null);
__decorate([
    (0, common_1.Post)('assessment/session/:sessionId/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Complete AI assessment session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session completed with AI report' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Assessment session ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('sessionId')),
    __param(2, (0, common_1.Body)('answers')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "completeAiSession", null);
__decorate([
    (0, common_1.Get)('assessment/session/history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get AI assessment session history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session history retrieved' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getAiSessionHistory", null);
__decorate([
    (0, common_1.Post)('assessment/start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Start career assessment' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Assessment started successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('careerPathId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "startAssessment", null);
__decorate([
    (0, common_1.Post)('assessment/:assessmentId/question'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get next assessment question' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Question retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'assessmentId', description: 'Assessment ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('assessmentId')),
    __param(2, (0, common_1.Body)('answer')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getNextQuestion", null);
__decorate([
    (0, common_1.Post)('assessment/:assessmentId/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Complete career assessment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Assessment completed successfully' }),
    (0, swagger_1.ApiParam)({ name: 'assessmentId', description: 'Assessment ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('assessmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "completeAssessment", null);
__decorate([
    (0, common_1.Get)('assessment/:assessmentId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get assessment details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Assessment retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'assessmentId', description: 'Assessment ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('assessmentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getAssessment", null);
__decorate([
    (0, common_1.Get)('assessment/history'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user assessment history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Assessment history retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getAssessmentHistory", null);
__decorate([
    (0, common_1.Get)('paths/:slug/courses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get courses for a career path' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Courses retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Career path slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('language')),
    __param(2, (0, common_1.Query)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getCareerPathCourses", null);
__decorate([
    (0, common_1.Get)('paths/:slug/statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get career path statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Career path slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getCareerPathStatistics", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get career path recommendations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recommendations retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('skills'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all skills' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Skills retrieved successfully' }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getSkills", null);
__decorate([
    (0, common_1.Get)('market-insights'),
    (0, swagger_1.ApiOperation)({ summary: 'Get market insights' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Market insights retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'country', required: false, description: 'Filter by country' }),
    (0, swagger_1.ApiQuery)({ name: 'careerPath', required: false, description: 'Filter by career path' }),
    __param(0, (0, common_1.Query)('country')),
    __param(1, (0, common_1.Query)('careerPath')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getMarketInsights", null);
__decorate([
    (0, common_1.Post)('compare'),
    (0, swagger_1.ApiOperation)({ summary: 'Compare career paths' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Comparison completed successfully' }),
    __param(0, (0, common_1.Body)('paths')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "compareCareerPaths", null);
__decorate([
    (0, common_1.Get)('paths/:slug/roadmap'),
    (0, swagger_1.ApiOperation)({ summary: 'Get career path roadmap' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Roadmap retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'slug', description: 'Career path slug' }),
    __param(0, (0, common_1.Param)('slug')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CareerController.prototype, "getCareerPathRoadmap", null);
exports.CareerController = CareerController = __decorate([
    (0, swagger_1.ApiTags)('Career'),
    (0, common_1.Controller)('career'),
    __metadata("design:paramtypes", [career_service_1.CareerService,
        assessment_service_1.AssessmentService,
        ai_assessment_service_1.AiAssessmentService])
], CareerController);
//# sourceMappingURL=career.controller.js.map