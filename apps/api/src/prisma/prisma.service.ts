import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

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

  // ═══════════════════════════════════════════════════════════════
  // SOFT DELETE FILTER - Core logic
  // ═══════════════════════════════════════════════════════════════
  private addDeletedFilter<T extends { where?: Record<string, unknown> }>(
    args: T,
    includeDeleted: boolean
  ): T {
    if (includeDeleted) return args;

    const currentWhere = args.where || {};
    const deletedFilter: Record<string, unknown> = { deletedAt: null };

    return {
      ...args,
      where: this.mergeWhere(currentWhere, deletedFilter),
    };
  }

  private mergeWhere(
    currentWhere: Record<string, unknown>,
    filter: Record<string, unknown>
  ): Record<string, unknown> {
    if (Object.keys(currentWhere).length === 0) return filter;
    if (currentWhere.AND && Array.isArray(currentWhere.AND)) {
      return { AND: [...currentWhere.AND, filter] };
    }
    return { AND: [currentWhere, filter] };
  }

  // ═══════════════════════════════════════════════════════════════
  // SAFE USER QUERIES - Default excludes deleted users
  // ═══════════════════════════════════════════════════════════════
  async findManyUsers(
    args: {
      where?: Prisma.UserWhereInput;
      include?: Prisma.UserInclude;
      orderBy?: Prisma.UserOrderByWithRelationInput;
      skip?: number;
      take?: number;
    },
    options?: { includeDeleted?: boolean }
  ): Promise<unknown[]> {
    const filteredArgs = this.addDeletedFilter(args, options?.includeDeleted ?? false);
    return this.user.findMany(filteredArgs as Prisma.UserFindManyArgs);
  }

  async findFirstUser(
    args: {
      where?: Prisma.UserWhereInput;
      include?: Prisma.UserInclude;
      orderBy?: Prisma.UserOrderByWithRelationInput;
    },
    options?: { includeDeleted?: boolean }
  ): Promise<unknown> {
    const filteredArgs = this.addDeletedFilter(args, options?.includeDeleted ?? false);
    return this.user.findFirst(filteredArgs as Prisma.UserFindFirstArgs);
  }

  // Explicit admin method to include deleted
  async findManyUsersAdmin(
    args: {
      where?: Prisma.UserWhereInput;
      include?: Prisma.UserInclude;
      orderBy?: Prisma.UserOrderByWithRelationInput;
      skip?: number;
      take?: number;
    }
  ): Promise<unknown[]> {
    return this.user.findMany(args as Prisma.UserFindManyArgs);
  }

  // Count without deleted
  async countUsers(
    args?: { where?: Prisma.UserWhereInput },
    options?: { includeDeleted?: boolean }
  ): Promise<number> {
    const filteredArgs = this.addDeletedFilter(args || {}, options?.includeDeleted ?? false);
    return this.user.count(filteredArgs as Prisma.UserCountArgs);
  }

  // ═══════════════════════════════════════════════════════════════
  // SOFT DELETE OPERATIONS
  // ═══════════════════════════════════════════════════════════════
  async softDeleteUser(id: string): Promise<void> {
    await this.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, status: 'DELETED' },
    });
  }

  async restoreUser(id: string): Promise<void> {
    await this.user.update({
      where: { id },
      data: { deletedAt: null, isActive: true, status: 'ACTIVE' },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // UTILITY METHODS
  // ═══════════════════════════════════════════════════════════════
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
      this.logger.log('🧹 Database cleaned');
    } catch (error) {
      this.logger.error('❌ Error:', error);
    }
  }

  async healthCheck() {
    try {
      await this.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', timestamp: new Date().toISOString(), error: error.message };
    }
  }

  async transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn);
  }
}