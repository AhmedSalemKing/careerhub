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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({
            log: ['error', 'warn'],
        });
        this.logger = new common_1.Logger(PrismaService_1.name);
    }
    async onModuleInit() {
        await this.$connect();
        this.logger.log('✅ Database connected successfully');
    }
    async onModuleDestroy() {
        await this.$disconnect();
        this.logger.log('🔌 Database disconnected');
    }
    async cleanDatabase() {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Clean database is not allowed in production');
        }
        const tableNames = await this.$queryRaw `
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;
        const tables = tableNames
            .map(({ name }) => name)
            .filter((name) => name !== '_prisma_migrations')
            .map((name) => `"public"."${name}"`)
            .join(', ');
        try {
            await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
            this.logger.log('🧹 Database cleaned successfully');
        }
        catch (error) {
            this.logger.error('❌ Error cleaning database:', error);
        }
    }
    async healthCheck() {
        try {
            await this.$queryRaw `SELECT 1`;
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            this.logger.error('❌ Database health check failed:', error);
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                error: error.message,
            };
        }
    }
    async softDelete(model, where) {
        return model.update({
            where,
            data: {
                deletedAt: new Date(),
            },
        });
    }
    async restore(model, where) {
        return model.update({
            where,
            data: {
                deletedAt: null,
            },
        });
    }
    async findManyWithoutDeleted(model, args) {
        return model.findMany({
            ...args,
            where: {
                ...args === null || args === void 0 ? void 0 : args.where,
                deletedAt: null,
            },
        });
    }
    async findOneWithoutDeleted(model, where) {
        return model.findFirst({
            where: {
                ...where,
                deletedAt: null,
            },
        });
    }
    async countWithoutDeleted(model, where) {
        return model.count({
            where: {
                ...where,
                deletedAt: null,
            },
        });
    }
    async transaction(callback) {
        return this.$transaction(callback);
    }
    async batch(operations) {
        return this.$transaction(operations);
    }
    async rawQuery(query, params) {
        return this.$queryRawUnsafe(query, ...params);
    }
    async getTableInfo(tableName) {
        return this.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position
    `);
    }
    async exists(model, where) {
        const count = await model.count({ where });
        return count > 0;
    }
    async paginate(model, { page = 1, limit = 10, ...args }) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            model.findMany({
                ...args,
                skip,
                take: limit,
            }),
            model.count({ where: args.where }),
        ]);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map