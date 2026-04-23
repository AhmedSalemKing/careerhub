import { PrismaService } from '../../prisma/prisma.service';
export declare class WalletService {
    private prisma;
    constructor(prisma: PrismaService);
    private getStripe;
    getWallet(userId: string): Promise<{
        balance: number;
        transactions: {
            id: string;
            createdAt: Date;
            userId: string;
            status: string;
            type: string;
            description: string | null;
            courseId: string | null;
            amount: number;
            stripePaymentIntentId: string | null;
        }[];
    }>;
    createTopupIntent(userId: string, amount: number): Promise<{
        clientSecret: string;
        paymentIntentId: string;
    }>;
    confirmTopup(userId: string, paymentIntentId: string): Promise<{
        balance: number;
    }>;
    payWithWallet(userId: string, courseId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
