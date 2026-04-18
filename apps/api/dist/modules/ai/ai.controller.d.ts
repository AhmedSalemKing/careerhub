import { PrismaService } from '../../prisma/prisma.service';
import { Response } from 'express';
export declare class AiController {
    private readonly prisma;
    private readonly groqApiKey;
    private readonly model;
    constructor(prisma: PrismaService);
    getConversations(req: any): Promise<{
        success: boolean;
        data: {
            title: string;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            context: string;
            messages: {
                content: string;
                role: string;
            }[];
        }[];
    }>;
    getConversation(id: string, req: any): Promise<{
        success: boolean;
        data: {
            messages: {
                content: string;
                createdAt: Date;
                id: string;
                role: string;
                conversationId: string;
                tokens: number | null;
            }[];
        } & {
            title: string;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            context: string | null;
        };
    }>;
    createConversation(req: any, body: {
        context?: string;
    }): Promise<{
        success: boolean;
        data: {
            title: string;
            createdAt: Date;
            id: string;
            updatedAt: Date;
            userId: string;
            context: string | null;
        };
    }>;
    deleteConversation(id: string, req: any): Promise<{
        success: boolean;
    }>;
    chat(req: any, body: {
        conversationId: string;
        message: string;
    }, res: Response): Promise<void>;
    private buildSystemPrompt;
}
