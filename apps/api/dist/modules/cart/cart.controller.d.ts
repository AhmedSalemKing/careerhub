import { PrismaService } from '../../prisma/prisma.service';
export declare class CartController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getCart(req: any): Promise<{
        success: boolean;
        data: ({
            course: {
                id: string;
                titleEn: string;
                titleAr: string;
                thumbnail: string;
                price: number;
                level: string;
                instructor: {
                    profile: {
                        firstName: string;
                        lastName: string;
                    };
                };
            };
        } & {
            id: string;
            courseId: string;
            cartId: string;
            addedAt: Date;
        })[];
    }>;
    addToCart(req: any, body: {
        courseId: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    removeFromCart(req: any, courseId: string): Promise<{
        success: boolean;
        message?: undefined;
    } | {
        success: boolean;
        message: string;
    }>;
    clearCart(req: any): Promise<{
        success: boolean;
    }>;
    getCartCount(req: any): Promise<{
        success: boolean;
        data: {
            count: number;
        };
    }>;
}
