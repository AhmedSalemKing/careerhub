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
exports.RatingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
let RatingsController = class RatingsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async rateCourse(courseId, req, body) {
        const userId = req.user.sub || req.user.id;
        if (body.value < 1 || body.value > 5) {
            throw new common_1.BadRequestException('Rating must be 1-5');
        }
        const rating = await this.prisma.rating.upsert({
            where: { userId_courseId: { userId, courseId } },
            update: { value: body.value, comment: body.comment },
            create: { userId, courseId, value: body.value, comment: body.comment },
        });
        return { success: true, data: rating };
    }
    async getCourseRatings(courseId) {
        const ratings = await this.prisma.rating.findMany({
            where: { courseId },
            include: {
                user: { select: { profile: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const avg = ratings.length
            ? ratings.reduce((sum, r) => sum + r.value, 0) / ratings.length
            : 0;
        return {
            success: true,
            data: {
                ratings,
                average: Math.round(avg * 10) / 10,
                count: ratings.length,
            },
        };
    }
    async getMyRating(courseId, req) {
        const userId = req.user.sub || req.user.id;
        const rating = await this.prisma.rating.findUnique({
            where: { userId_courseId: { userId, courseId } },
        });
        return { success: true, data: rating };
    }
};
exports.RatingsController = RatingsController;
__decorate([
    (0, common_1.Post)('course/:courseId'),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "rateCourse", null);
__decorate([
    (0, common_1.Get)('course/:courseId'),
    __param(0, (0, common_1.Param)('courseId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "getCourseRatings", null);
__decorate([
    (0, common_1.Get)('my/course/:courseId'),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], RatingsController.prototype, "getMyRating", null);
exports.RatingsController = RatingsController = __decorate([
    (0, swagger_1.ApiTags)('Ratings'),
    (0, common_1.Controller)('ratings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RatingsController);
