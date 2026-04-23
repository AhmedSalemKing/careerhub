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
                createdAt: Date;
                userId: string;
                status: string;
                type: string;
                description: string | null;
                courseId: string | null;
                amount: number;
                stripePaymentIntentId: string | null;
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
}
