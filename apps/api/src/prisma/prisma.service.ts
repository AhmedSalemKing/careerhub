import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: ['error', 'warn'],
    });
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

    const tableNames = await this.$queryRaw<{ name: string }[]>`
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
    } catch (error) {
      this.logger.error('❌ Error cleaning database:', error);
    }
  }

  async healthCheck() {
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('❌ Database health check failed:', error);
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  // Soft delete helper
  async softDelete<T>(model: any, where: any) {
    return model.update({
      where,
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // Restore soft deleted record
  async restore<T>(model: any, where: any) {
    return model.update({
      where,
      data: {
        deletedAt: null,
      },
    });
  }

  // Find only non-deleted records
  async findManyWithoutDeleted<T>(model: any, args?: any) {
    return model.findMany({
      ...args,
      where: {
        ...args?.where,
        deletedAt: null,
      },
    });
  }

  // Find one non-deleted record
  async findOneWithoutDeleted<T>(model: any, where: any) {
    return model.findFirst({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  // Count non-deleted records
  async countWithoutDeleted<T>(model: any, where?: any) {
    return model.count({
      where: {
        ...where,
        deletedAt: null,
      },
    });
  }

  // Transaction helper
  async transaction<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(callback);
  }

  // Batch operations
  async batch(operations: any[]) {
    return this.$transaction(operations);
  }

  // Raw query helper
  async rawQuery(query: string, params?: any[]) {
    return this.$queryRawUnsafe(query, ...params);
  }

  // Get table info
  async getTableInfo(tableName: string) {
    return this.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = '${tableName}'
      ORDER BY ordinal_position
    `);
  }

  // Check if record exists
  async exists(model: any, where: any) {
    const count = await model.count({ where });
    return count > 0;
  }

  // Pagination helper
  async paginate(model: any, { page = 1, limit = 10, ...args }: any) {
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
}
