import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    cleanDatabase(): Promise<void>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        error?: undefined;
    } | {
        status: string;
        timestamp: string;
        error: any;
    }>;
    softDelete<T>(model: any, where: any): Promise<any>;
    restore<T>(model: any, where: any): Promise<any>;
    findManyWithoutDeleted<T>(model: any, args?: any): Promise<any>;
    findOneWithoutDeleted<T>(model: any, where: any): Promise<any>;
    countWithoutDeleted<T>(model: any, where?: any): Promise<any>;
    transaction<T>(callback: (prisma: PrismaClient) => Promise<T>): Promise<T>;
    batch(operations: any[]): Promise<any[]>;
    rawQuery(query: string, params?: any[]): Promise<unknown>;
    getTableInfo(tableName: string): Promise<unknown>;
    exists(model: any, where: any): Promise<boolean>;
    paginate(model: any, { page, limit, ...args }: any): Promise<{
        data: any;
        meta: {
            total: any;
            page: any;
            limit: any;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
}
