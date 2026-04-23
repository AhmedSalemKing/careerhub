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
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            context: string;
            messages: {
                role: string;
                content: string;
            }[];
        }[];
    }>;
    getConversation(id: string, req: any): Promise<{
        success: boolean;
        data: {
            messages: {
                id: string;
                role: string;
                createdAt: Date;
                content: string;
                conversationId: string;
                tokens: number | null;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
            context: string | null;
        };
    }>;
    createConversation(req: any, body: {
        context?: string;
    }): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            title: string;
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
