import { PrismaService } from '../../prisma/prisma.service';
export interface LogActivityDto {
    userId: string;
    action: string;
    entity?: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ip?: string;
    userAgent?: string;
}
export declare class ActivityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(dto: LogActivityDto): Promise<void>;
    getLiveActivity(limit?: number): Promise<({
        user: {
            id: string;
            email: string;
            role: import(".prisma/client").$Enums.UserRole;
            accountType: string;
            profile: {
                firstName: string;
                lastName: string;
                avatar: string;
            };
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        ipAddress: string | null;
        entity: string | null;
        entityId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    getUserActivity(userId: string, limit?: number): Promise<({
        user: {
            id: string;
            email: string;
            accountType: string;
            profile: {
                firstName: string;
                lastName: string;
                avatar: string;
            };
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        action: string;
        ipAddress: string | null;
        entity: string | null;
        entityId: string | null;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    getActivityFiltered(opts: {
        userId?: string;
        action?: string;
        entity?: string;
        from?: Date;
        to?: Date;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ({
            user: {
                id: string;
                email: string;
                role: import(".prisma/client").$Enums.UserRole;
                accountType: string;
                profile: {
                    firstName: string;
                    lastName: string;
                    avatar: string;
                };
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            action: string;
            ipAddress: string | null;
            entity: string | null;
            entityId: string | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        total: number;
        page: number;
        pages: number;
    }>;
    getActivityStats(): Promise<{
        total: number;
        today: number;
        thisWeek: number;
        topActions: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserActivityGroupByOutputType, "action"[]> & {
            _count: {
                action: number;
            };
        })[];
    }>;
}
