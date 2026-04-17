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
exports.ActivityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ActivityService = class ActivityService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async log(dto) {
        var _a;
        await this.prisma.userActivity.create({
            data: {
                userId: dto.userId,
                action: dto.action,
                entity: dto.entity,
                entityId: dto.entityId,
                metadata: (_a = dto.metadata) !== null && _a !== void 0 ? _a : {},
                ipAddress: dto.ip,
            },
        });
    }
    async getLiveActivity(limit = 100) {
        return this.prisma.userActivity.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        accountType: true,
                        role: true,
                        profile: { select: { firstName: true, lastName: true, avatar: true } },
                    },
                },
            },
        });
    }
    async getUserActivity(userId, limit = 100) {
        return this.prisma.userActivity.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        accountType: true,
                        profile: { select: { firstName: true, lastName: true, avatar: true } },
                    },
                },
            },
        });
    }
    async getActivityFiltered(opts) {
        const { userId, action, entity, from, to, page = 1, limit = 50 } = opts;
        const where = {};
        if (userId)
            where.userId = userId;
        if (action)
            where.action = { contains: action, mode: 'insensitive' };
        if (entity)
            where.entity = entity;
        if (from || to) {
            where.createdAt = {};
            if (from)
                where.createdAt.gte = from;
            if (to)
                where.createdAt.lte = to;
        }
        const [items, total] = await Promise.all([
            this.prisma.userActivity.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            accountType: true,
                            role: true,
                            profile: { select: { firstName: true, lastName: true, avatar: true } },
                        },
                    },
                },
            }),
            this.prisma.userActivity.count({ where }),
        ]);
        return {
            items,
            total,
            page,
            pages: Math.ceil(total / limit),
        };
    }
    async getActivityStats() {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [total, today, thisWeek, topActions] = await Promise.all([
            this.prisma.userActivity.count(),
            this.prisma.userActivity.count({ where: { createdAt: { gte: todayStart } } }),
            this.prisma.userActivity.count({ where: { createdAt: { gte: weekStart } } }),
            this.prisma.userActivity.groupBy({
                by: ['action'],
                _count: { action: true },
                orderBy: { _count: { action: 'desc' } },
                take: 10,
            }),
        ]);
        return { total, today, thisWeek, topActions };
    }
};
exports.ActivityService = ActivityService;
exports.ActivityService = ActivityService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivityService);
//# sourceMappingURL=activity.service.js.map