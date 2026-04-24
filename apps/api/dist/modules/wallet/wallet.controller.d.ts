import { WalletService } from './wallet.service';
export declare class WalletController {
    private walletService;
    constructor(walletService: WalletService);
    getWallet(req: any): Promise<{
        success: boolean;
        data: {
            balance: number;
            transactions: {
                id: string;
                status: string;
                createdAt: Date;
                userId: string;
                type: string;
                amount: number;
                description: string | null;
                stripePaymentIntentId: string | null;
                courseId: string | null;
            }[];
        };
    }>;
    createTopupIntent(req: any, body: {
        amount: number;
    }): Promise<{
        success: boolean;
        data: {
            clientSecret: string;
            paymentIntentId: string;
        };
    }>;
    confirmTopup(req: any, body: {
        paymentIntentId: string;
    }): Promise<{
        success: boolean;
        data: {
            balance: number;
        };
    }>;
    payWithWallet(req: any, courseId: string): Promise<{
        success: boolean;
        data: {
            success: boolean;
            message: string;
        };
    }>;
    transferFromEarnings(req: any, body: {
        amount: number;
    }): Promise<{
        success: boolean;
        data: {
            success: boolean;
            newBalance: number;
            transferred: number;
        };
    }>;
}
