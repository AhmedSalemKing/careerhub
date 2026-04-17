import { PrismaService } from '../../prisma/prisma.service';
export declare class PushService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    sendPushNotification(token: string, payload: any): Promise<{
        success: boolean;
    }>;
    sendToUser(userId: string, payload: any): Promise<{
        success: boolean;
    }>;
    sendToRole(role: string, payload: any): Promise<{
        success: boolean;
    }>;
    sendToAll(payload: any): Promise<{
        success: boolean;
    }>;
    registerToken(userId: string, token: string, platform: string): Promise<{
        success: boolean;
    }>;
    removeToken(token: string): Promise<{
        success: boolean;
    }>;
    getStats(): Promise<{
        total: number;
    }>;
}
