import { PrismaService } from '../../prisma/prisma.service';
export declare class PaymentController {
    private readonly prisma;
    private stripe;
    constructor(prisma: PrismaService);
    getCheckoutData(courseId: string, req: any): Promise<{
        success: boolean;
        data: {
            course: {
                category: {
                    nameAr: string;
                    nameEn: string;
                };
                _count: {
                    enrollments: number;
                    sections: number;
                };
                instructor: {
                    profile: {
                        firstName: string;
                        lastName: string;
                    };
                };
            } & {
                id: string;
                createdAt: Date;
                status: import(".prisma/client").$Enums.CourseStatus;
                updatedAt: Date;
                titleEn: string;
                titleAr: string | null;
                slug: string;
                careerPathId: string | null;
                instructorId: string | null;
                categoryId: string | null;
                descriptionEn: string | null;
                descriptionAr: string | null;
                thumbnail: string | null;
                previewVideo: string | null;
                price: number;
                currency: string;
                duration: number | null;
                level: string;
                isFeatured: boolean;
                sortOrder: number;
            };
            alreadyEnrolled: boolean;
        };
    }>;
    createPaymentIntent(req: any, body: {
        courseId: string;
    }): Promise<{
        success: boolean;
        data: {
            free: boolean;
            courseId: string;
            clientSecret?: undefined;
            amount?: undefined;
            currency?: undefined;
            mode?: undefined;
            sandbox?: undefined;
            txId?: undefined;
        };
    } | {
        success: boolean;
        data: {
            clientSecret: string;
            amount: number;
            currency: string;
            mode: string;
            free?: undefined;
            courseId?: undefined;
            sandbox?: undefined;
            txId?: undefined;
        };
    } | {
        success: boolean;
        data: {
            sandbox: boolean;
            courseId: string;
            txId: string;
            free?: undefined;
            clientSecret?: undefined;
            amount?: undefined;
            currency?: undefined;
            mode?: undefined;
        };
    }>;
    confirmPayment(req: any, body: {
        paymentIntentId: string;
        courseId: string;
    }): Promise<{
        success: boolean;
        data: {
            courseId: string;
        };
    }>;
    getMyPayments(req: any): Promise<{
        success: boolean;
        data: ({
            course: {
                id: string;
                titleEn: string;
                titleAr: string;
                thumbnail: string;
            };
        } & {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            method: string;
            status: string;
            updatedAt: Date;
            description: string | null;
            courseId: string | null;
            completedAt: Date | null;
            currency: string;
            amount: number;
            transactionId: string | null;
            stripeIntentId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
        })[];
    }>;
    private doEnroll;
}
