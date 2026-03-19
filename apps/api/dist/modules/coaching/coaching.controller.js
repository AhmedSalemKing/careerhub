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
exports.CoachingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const coaching_service_1 = require("./coaching.service");
const scheduling_service_1 = require("./scheduling.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let CoachingController = class CoachingController {
    constructor(coachingService, schedulingService) {
        this.coachingService = coachingService;
        this.schedulingService = schedulingService;
    }
    async getCoaches(specialization, language) {
        const coaches = await this.coachingService.getCoaches(specialization, language || 'en');
        return {
            success: true,
            data: { coaches },
        };
    }
    async getCoach(id, language) {
        const coach = await this.coachingService.getCoach(id, language || 'en');
        return {
            success: true,
            data: { coach },
        };
    }
    async getCoachAvailability(id, startDate, endDate) {
        const availability = await this.schedulingService.getCoachAvailability(id, new Date(startDate), new Date(endDate));
        return {
            success: true,
            data: { availability },
        };
    }
    async getAvailableSlots(id, date) {
        const slots = await this.schedulingService.getAvailableSlots(id, new Date(date));
        return {
            success: true,
            data: { slots },
        };
    }
    async bookSession(user, bookingData) {
        const session = await this.schedulingService.bookSession(user.id, bookingData);
        return {
            success: true,
            message: 'Session booked successfully',
            data: { session },
        };
    }
    async getMySessions(user, page, limit, status) {
        const sessions = await this.coachingService.getUserSessions(user.id, {
            page: page || 1,
            limit: limit || 10,
            status,
        });
        return {
            success: true,
            data: sessions,
        };
    }
    async getSession(user, id) {
        const session = await this.coachingService.getSession(user.id, id);
        return {
            success: true,
            data: { session },
        };
    }
    async rescheduleSession(user, id, rescheduleData) {
        const session = await this.schedulingService.rescheduleSession(user.id, id, rescheduleData.newSlotId);
        return {
            success: true,
            message: 'Session rescheduled successfully',
            data: { session },
        };
    }
    async cancelSession(user, id, reason) {
        const session = await this.schedulingService.cancelSession(user.id, id, reason);
        return {
            success: true,
            message: 'Session cancelled successfully',
            data: { session },
        };
    }
    async joinSession(user, id) {
        const joinData = await this.coachingService.joinSession(user.id, id);
        return {
            success: true,
            data: joinData,
        };
    }
    async completeSession(user, id, completionData) {
        const session = await this.coachingService.completeSession(user.id, id, completionData);
        return {
            success: true,
            message: 'Session completed successfully',
            data: { session },
        };
    }
    async submitReview(user, id, reviewData) {
        const review = await this.coachingService.submitReview(user.id, id, reviewData);
        return {
            success: true,
            message: 'Review submitted successfully',
            data: { review },
        };
    }
    async getCoachReviews(coachId, page, limit) {
        const reviews = await this.coachingService.getCoachReviews(coachId, {
            page: page || 1,
            limit: limit || 10,
        });
        return {
            success: true,
            data: reviews,
        };
    }
    async getPackages(language) {
        const packages = await this.coachingService.getPackages(language || 'en');
        return {
            success: true,
            data: { packages },
        };
    }
    async purchasePackage(user, packageId, purchaseData) {
        const purchase = await this.coachingService.purchasePackage(user.id, packageId, purchaseData);
        return {
            success: true,
            message: 'Package purchased successfully',
            data: { purchase },
        };
    }
    async getMyStats(user) {
        const stats = await this.coachingService.getUserStats(user.id);
        return {
            success: true,
            data: { stats },
        };
    }
    // Coach endpoints
    async getCoachDashboard(user) {
        const dashboard = await this.coachingService.getCoachDashboard(user.id);
        return {
            success: true,
            data: dashboard,
        };
    }
    async getCoachSchedule(user, startDate, endDate) {
        const schedule = await this.coachingService.getCoachSchedule(user.id, new Date(startDate), new Date(endDate));
        return {
            success: true,
            data: { schedule },
        };
    }
    async setAvailability(user, availabilityData) {
        const result = await this.schedulingService.setAvailability(user.id, availabilityData.slots);
        return {
            success: true,
            message: 'Availability set successfully',
            data: result,
        };
    }
    // Admin endpoints
    async createCoach(coachData) {
        const coach = await this.coachingService.createCoach(coachData);
        return {
            success: true,
            message: 'Coach created successfully',
            data: { coach },
        };
    }
    async getAllCoaches(page, limit, status) {
        const coaches = await this.coachingService.getAllCoaches({
            page: page || 1,
            limit: limit || 20,
            status,
        });
        return {
            success: true,
            data: coaches,
        };
    }
    async getAllSessions(page, limit, status, coachId) {
        const sessions = await this.coachingService.getAllSessions({
            page: page || 1,
            limit: limit || 20,
            status,
            coachId,
        });
        return {
            success: true,
            data: sessions,
        };
    }
    async getAnalytics() {
        const analytics = await this.coachingService.getAnalytics();
        return {
            success: true,
            data: { analytics },
        };
    }
};
exports.CoachingController = CoachingController;
__decorate([
    (0, common_1.Get)('coaches'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available coaches' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Coaches retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'specialization', required: false, description: 'Filter by specialization' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' }),
    __param(0, (0, common_1.Query)('specialization')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoaches", null);
__decorate([
    (0, common_1.Get)('coaches/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get coach by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Coach retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Coach not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Coach ID' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoach", null);
__decorate([
    (0, common_1.Get)('coaches/:id/availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Get coach availability' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Availability retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Coach not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Coach ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachAvailability", null);
__decorate([
    (0, common_1.Get)('coaches/:id/slots'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available booking slots' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Slots retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Coach not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Coach ID' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: true, description: 'Date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getAvailableSlots", null);
__decorate([
    (0, common_1.Post)('sessions/book'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Book a coaching session' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Session booked successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Slot not available or booking conflict' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "bookSession", null);
__decorate([
    (0, common_1.Get)('sessions/my-sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user coaching sessions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sessions retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getMySessions", null);
__decorate([
    (0, common_1.Get)('sessions/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get session details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Session ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getSession", null);
__decorate([
    (0, common_1.Patch)('sessions/:id/reschedule'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reschedule session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session rescheduled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Rescheduling not allowed' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Session ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "rescheduleSession", null);
__decorate([
    (0, common_1.Patch)('sessions/:id/cancel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session cancelled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cancellation not allowed' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Session ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "cancelSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/join'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Join coaching session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Joined session successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Session not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Session ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "joinSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('COACH', 'ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mark session as completed (Coach/Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session marked as completed' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Session ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "completeSession", null);
__decorate([
    (0, common_1.Post)('sessions/:id/review'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit session review' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Review submitted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Review already submitted' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Session ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "submitReview", null);
__decorate([
    (0, common_1.Get)('reviews/coach/:coachId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get coach reviews' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reviews retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'coachId', description: 'Coach ID' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    __param(0, (0, common_1.Param)('coachId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachReviews", null);
__decorate([
    (0, common_1.Get)('packages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get coaching packages' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Packages retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'language', required: false, enum: ['en', 'ar'], description: 'Response language' }),
    __param(0, (0, common_1.Query)('language')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getPackages", null);
__decorate([
    (0, common_1.Post)('packages/:id/purchase'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Purchase coaching package' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Package purchased successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Purchase failed' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Package ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "purchasePackage", null);
__decorate([
    (0, common_1.Get)('stats/my-stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user coaching statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Get)('coach/dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('COACH', 'ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get coach dashboard (Coach/Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard data retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachDashboard", null);
__decorate([
    (0, common_1.Get)('coach/schedule'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('COACH', 'ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get coach schedule (Coach/Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Schedule retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getCoachSchedule", null);
__decorate([
    (0, common_1.Post)('coach/availability'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)('COACH', 'ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Set coach availability (Coach/Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Availability set successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "setAvailability", null);
__decorate([
    (0, common_1.Post)('coaches'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create new coach (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Coach created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "createCoach", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all coaches (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Coaches retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getAllCoaches", null);
__decorate([
    (0, common_1.Get)('admin/sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all sessions (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Sessions retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('coachId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getAllSessions", null);
__decorate([
    (0, common_1.Get)('admin/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get coaching analytics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CoachingController.prototype, "getAnalytics", null);
exports.CoachingController = CoachingController = __decorate([
    (0, swagger_1.ApiTags)('Coaching'),
    (0, common_1.Controller)('coaching'),
    __metadata("design:paramtypes", [coaching_service_1.CoachingService,
        scheduling_service_1.SchedulingService])
], CoachingController);
