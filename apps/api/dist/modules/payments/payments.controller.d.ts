import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { User } from '@prisma/client';
export declare class PaymentsController {
    private readonly paymentsService;
    private readonly stripeService;
    constructor(paymentsService: PaymentsService, stripeService: StripeService);
    createPaymentIntent(user: User, paymentData: {
        amount: number;
        currency: string;
        itemType: 'COURSE' | 'COACHING_PACKAGE' | 'SUBSCRIPTION';
        itemId: string;
        metadata?: Record<string, any>;
    }): Promise<{
        success: boolean;
        data: {
            paymentIntent: {
                paymentIntent: import("stripe").Stripe.Response<import("stripe").Stripe.PaymentIntent>;
                payment: {
                    id: string;
                    metadata: import("@prisma/client/runtime/library").JsonValue | null;
                    createdAt: Date;
                    userId: string;
                    method: string;
                    status: string;
                    updatedAt: Date;
                    courseId: string | null;
                    currency: string;
                    completedAt: Date | null;
                    description: string | null;
                    amount: number;
                    transactionId: string | null;
                    stripeIntentId: string | null;
                    itemType: string | null;
                    itemId: string | null;
                    refundedAt: Date | null;
                };
                itemDetails: any;
            };
        };
    }>;
    confirmPayment(user: User, confirmData: {
        paymentIntentId: string;
        paymentMethodId?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            payment: {
                id: string;
                status: string;
                amount: number;
                currency: string;
            };
            enrollment: {
                id: any;
                courseId: any;
                status: any;
                progress: any;
            };
            message: string;
        };
    }>;
    purchaseCourse(user: User, purchaseData: {
        courseId: string;
        paymentMethodId: string;
        couponCode?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            payment: {
                id: string;
                status: string;
                amount: number;
                currency: string;
            };
            status: string;
            enrollment: any;
            purchase: any;
            discount: number;
            originalPrice: number;
            finalPrice: number;
        };
    }>;
    purchaseCoachingPackage(user: User, purchaseData: {
        packageId: string;
        paymentMethodId: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            payment: {
                id: string;
                status: string;
                amount: number;
                currency: string;
            };
            status: string;
            enrollment: any;
            purchase: any;
            package: {
                id: string;
                name: string;
                price: number;
                currency: string;
                sessions: number;
            };
        };
    }>;
    createSubscription(user: User, subscriptionData: {
        planId: string;
        paymentMethodId: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            subscription: {
                id: string;
                createdAt: Date;
                userId: string;
                status: string;
                updatedAt: Date;
                startDate: Date;
                endDate: Date | null;
                plan: string;
            };
        };
    }>;
    cancelSubscription(user: User, subscriptionId: string, reason?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            id: string;
            createdAt: Date;
            userId: string;
            status: string;
            updatedAt: Date;
            startDate: Date;
            endDate: Date | null;
            plan: string;
        };
    }>;
    getMyPayments(user: User, page?: number, limit?: number, status?: string): Promise<{
        success: boolean;
        data: {
            payments: {
                id: string;
                amount: number;
                currency: string;
                status: string;
                itemType: string;
                itemId: string;
                transactionId: string;
                createdAt: Date;
                completedAt: Date;
                metadata: import("@prisma/client/runtime/library").JsonValue;
            }[];
            meta: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
        };
    }>;
    getMySubscriptions(user: User): Promise<{
        success: boolean;
        data: {
            subscriptions: {
                id: string;
                plan: string;
                status: string;
                startDate: Date;
                endDate: Date;
                createdAt: Date;
                updatedAt: Date;
            }[];
        };
    }>;
    getPaymentMethods(user: User): Promise<{
        success: boolean;
        data: {
            paymentMethods: {
                id: string;
                type: import("stripe").Stripe.PaymentMethod.Type;
                card: import("stripe").Stripe.PaymentMethod.Card;
                billing_details: import("stripe").Stripe.PaymentMethod.BillingDetails;
                isDefault: boolean;
            }[];
        };
    }>;
    addPaymentMethod(user: User, paymentMethodData: {
        type: 'card';
        card: {
            number: string;
            exp_month: number;
            exp_year: number;
            cvc: string;
        };
        billing_details?: {
            name: string;
            email: string;
            phone?: string;
            address?: {
                line1: string;
                line2?: string;
                city: string;
                state: string;
                postal_code: string;
                country: string;
            };
        };
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            paymentMethod: import("stripe").Stripe.Response<import("stripe").Stripe.PaymentMethod>;
        };
    }>;
    removePaymentMethod(user: User, paymentMethodId: string): Promise<void>;
    setDefaultPaymentMethod(user: User, paymentMethodId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAdminPayments(page?: number, limit?: number, status?: string, search?: string): Promise<{
        payments: any;
        total: any;
        stats: any;
        page: number;
        limit: number;
    }>;
    refundPayment(id: string): Promise<any>;
    processRefund(paymentId: string, refundData: {
        amount?: number;
        reason: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            refund: any;
        };
    }>;
    getInvoices(user: User, page?: number, limit?: number): Promise<{
        success: boolean;
        data: {
            invoices: {
                id: string;
                number: string;
                status: import("stripe").Stripe.Invoice.Status;
                amount: number;
                currency: string;
                created: Date;
                due_date: Date;
                hosted_invoice_url: string;
                invoice_pdf: string;
            }[];
            has_more: boolean;
        };
    }>;
    getInvoice(user: User, invoiceId: string): Promise<{
        success: boolean;
        data: {
            invoice: {
                id: string;
                number: string;
                status: import("stripe").Stripe.Invoice.Status;
                amount: number;
                currency: string;
                created: Date;
                due_date: Date;
                hosted_invoice_url: string;
                invoice_pdf: string;
                lines: {
                    description: string;
                    amount: number;
                    quantity: number;
                }[];
            };
        };
    }>;
    downloadInvoice(user: User, invoiceId: string): Promise<{
        success: boolean;
        data: {
            downloadUrl: {
                downloadUrl: string;
                expiresAt: Date;
            };
        };
    }>;
    validateCoupon(user: User, couponData: {
        code: string;
        itemType: 'COURSE' | 'COACHING_PACKAGE';
        itemId: string;
    }): Promise<{
        success: boolean;
        data: {
            valid: boolean;
            reason: string;
            coupon?: undefined;
        } | {
            valid: boolean;
            coupon: {
                code: string;
                discountType: string;
                discountValue: number;
                discountAmount: number;
            };
            reason?: undefined;
        };
    }>;
    getPricingPlans(): Promise<{
        success: boolean;
        data: {
            plans: {
                id: string;
                name: string;
                price: number;
                currency: string;
                interval: string;
                features: string[];
                stripePriceId: string;
                popular: boolean;
            }[];
        };
    }>;
    getMyStats(user: User): Promise<{
        success: boolean;
        data: {
            stats: {
                totalPayments: number;
                completedPayments: number;
                totalSpent: number;
                thisMonthSpent: number;
                successRate: number;
                hasActiveSubscription: boolean;
                activeSubscription: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    status: string;
                    updatedAt: Date;
                    startDate: Date;
                    endDate: Date | null;
                    plan: string;
                };
            };
        };
    }>;
    handleStripeWebhook(webhookData: any): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllPayments(page?: number, limit?: number, status?: string, userId?: string): Promise<{
        success: boolean;
        data: {
            payments: ({
                user: {
                    profile: {
                        id: string;
                        createdAt: Date;
                        userId: string;
                        bio: string | null;
                        linkedinUrl: string | null;
                        updatedAt: Date;
                        firstName: string;
                        lastName: string;
                        phone: string | null;
                        dateOfBirth: Date | null;
                        gender: import(".prisma/client").$Enums.Gender | null;
                        nationality: string | null;
                        country: string | null;
                        city: string | null;
                        avatar: string | null;
                        timezone: string;
                        language: string;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    email: string;
                    password: string;
                    role: import(".prisma/client").$Enums.UserRole;
                    isActive: boolean;
                    accountType: string;
                    status: string;
                    cvUrl: string | null;
                    bio: string | null;
                    experience: number | null;
                    speciality: string | null;
                    linkedinUrl: string | null;
                    hourlyRate: number | null;
                    meetingMethod: string | null;
                    stripeCustomerId: string | null;
                    approvedAt: Date | null;
                    rejectedAt: Date | null;
                    rejectedReason: string | null;
                    lastSeenAt: Date | null;
                    updatedAt: Date;
                    deletedAt: Date | null;
                };
            } & {
                id: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                userId: string;
                method: string;
                status: string;
                updatedAt: Date;
                courseId: string | null;
                currency: string;
                completedAt: Date | null;
                description: string | null;
                amount: number;
                transactionId: string | null;
                stripeIntentId: string | null;
                itemType: string | null;
                itemId: string | null;
                refundedAt: Date | null;
            })[];
            meta: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
        };
    }>;
    getAnalytics(): Promise<{
        success: boolean;
        data: {
            analytics: {
                totalRevenue: number;
                totalPayments: number;
                completedPayments: number;
                successRate: number;
                thisMonthRevenue: number;
                revenueByMonth: any[];
            };
        };
    }>;
    adminProcessRefund(refundData: {
        paymentId: string;
        amount?: number;
        reason: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            refund: any;
        };
    }>;
    getRevenueOverview(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            revenue: {
                totalRevenue: number;
                totalTransactions: number;
                averageTransactionValue: number;
                revenueByType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PaymentGroupByOutputType, "itemType"[]> & {
                    _sum: {
                        amount: number;
                    };
                    _count: number;
                })[];
                paymentsByStatus: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PaymentGroupByOutputType, "status"[]> & {
                    _sum: {
                        amount: number;
                    };
                    _count: number;
                })[];
                period: {
                    startDate: Date;
                    endDate: Date;
                };
            };
        };
    }>;
}
