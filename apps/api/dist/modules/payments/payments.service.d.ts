import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StripeService } from './stripe.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class PaymentsService {
    private prisma;
    private configService;
    private stripeService;
    private notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, stripeService: StripeService, notificationsService: NotificationsService);
    createPaymentIntent(userId: string, paymentData: {
        amount: number;
        currency: string;
        itemType: 'COURSE' | 'COACHING_PACKAGE' | 'SUBSCRIPTION';
        itemId: string;
        metadata?: Record<string, any>;
    }): Promise<{
        paymentIntent: import("stripe").Stripe.Response<import("stripe").Stripe.PaymentIntent>;
        payment: {
            description: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            courseId: string | null;
            completedAt: Date | null;
            amount: number;
            method: import(".prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
        itemDetails: any;
    }>;
    confirmPayment(userId: string, paymentIntentId: string): Promise<{
        payment: {
            description: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            courseId: string | null;
            completedAt: Date | null;
            amount: number;
            method: import(".prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
        status: string;
    }>;
    purchaseCourse(userId: string, courseId: string, paymentMethodId: string, couponCode?: string): Promise<{
        payment: {
            description: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            courseId: string | null;
            completedAt: Date | null;
            amount: number;
            method: import(".prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        };
        status: string;
        enrollment: any;
        purchase: any;
        discount: number;
        originalPrice: number;
        finalPrice: number;
    }>;
    purchaseCoachingPackage(userId: string, packageId: string, paymentMethodId: string): Promise<{
        payment: {
            description: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            courseId: string | null;
            completedAt: Date | null;
            amount: number;
            method: import(".prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
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
    }>;
    createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<{
        status: string;
        id: string;
        startDate: Date;
        endDate: Date | null;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        plan: string;
    }>;
    cancelSubscription(userId: string, subscriptionId: string, reason?: string): Promise<{
        status: string;
        id: string;
        startDate: Date;
        endDate: Date | null;
        userId: string;
        createdAt: Date;
        updatedAt: Date;
        plan: string;
    }>;
    getUserPayments(userId: string, options: {
        page: number;
        limit: number;
        status?: string;
    }): Promise<{
        payments: {
            id: string;
            amount: number;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
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
    }>;
    getUserSubscriptions(userId: string): Promise<{
        id: string;
        plan: string;
        status: string;
        startDate: Date;
        endDate: Date;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getUserPaymentMethods(userId: string): Promise<{
        id: string;
        type: import("stripe").Stripe.PaymentMethod.Type;
        card: import("stripe").Stripe.PaymentMethod.Card;
        billing_details: import("stripe").Stripe.PaymentMethod.BillingDetails;
        isDefault: boolean;
    }[]>;
    addPaymentMethod(userId: string, paymentMethodData: {
        type: 'card';
        card: any;
        billing_details?: any;
    }): Promise<import("stripe").Stripe.Response<import("stripe").Stripe.PaymentMethod>>;
    removePaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
    setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void>;
    getAdminPayments(options: {
        page: number;
        limit: number;
        status?: string;
        search?: string;
    }): Promise<{
        payments: any;
        total: any;
        stats: any;
        page: number;
        limit: number;
    }>;
    refundPayment(id: string): Promise<any>;
    getUserInvoices(userId: string, options: {
        page: number;
        limit: number;
    }): Promise<{
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
    }>;
    getInvoice(userId: string, invoiceId: string): Promise<{
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
    }>;
    getInvoiceDownloadUrl(userId: string, invoiceId: string): Promise<{
        downloadUrl: string;
        expiresAt: Date;
    }>;
    validateCoupon(userId: string, code: string, itemType: string, itemId: string): Promise<{
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
    }>;
    getPricingPlans(): Promise<{
        id: string;
        name: string;
        price: number;
        currency: string;
        interval: string;
        features: string[];
        stripePriceId: string;
        popular: boolean;
    }[]>;
    getUserPaymentStats(userId: string): Promise<{
        totalPayments: number;
        completedPayments: number;
        totalSpent: number;
        thisMonthSpent: number;
        successRate: number;
        hasActiveSubscription: boolean;
        activeSubscription: {
            status: string;
            id: string;
            startDate: Date;
            endDate: Date | null;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            plan: string;
        };
    }>;
    getAllPayments(options: {
        page: number;
        limit: number;
        status?: string;
        userId?: string;
    }): Promise<{
        payments: ({
            user: {
                profile: {
                    id: string;
                    userId: string;
                    lastName: string;
                    firstName: string;
                    createdAt: Date;
                    updatedAt: Date;
                    phone: string | null;
                    dateOfBirth: Date | null;
                    gender: import(".prisma/client").$Enums.Gender | null;
                    nationality: string | null;
                    country: string | null;
                    city: string | null;
                    avatar: string | null;
                    bio: string | null;
                    linkedinUrl: string | null;
                    timezone: string;
                    language: string;
                };
            } & {
                role: import(".prisma/client").$Enums.UserRole;
                id: string;
                email: string;
                password: string;
                isActive: boolean;
                stripeCustomerId: string | null;
                createdAt: Date;
                updatedAt: Date;
                deletedAt: Date | null;
            };
        } & {
            description: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            id: string;
            userId: string;
            createdAt: Date;
            updatedAt: Date;
            currency: string;
            courseId: string | null;
            completedAt: Date | null;
            amount: number;
            method: import(".prisma/client").$Enums.PaymentMethod;
            transactionId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    getPaymentAnalytics(): Promise<{
        totalRevenue: number;
        totalPayments: number;
        completedPayments: number;
        successRate: number;
        thisMonthRevenue: number;
        revenueByMonth: any[];
    }>;
    getRevenueOverview(startDate?: Date, endDate?: Date): Promise<{
        totalRevenue: number;
        totalTransactions: number;
        averageTransactionValue: number;
        revenueByType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PaymentGroupByOutputType, "itemType"[]> & {
            _count: number;
            _sum: {
                amount: number;
            };
        })[];
        paymentsByStatus: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.PaymentGroupByOutputType, "status"[]> & {
            _count: number;
            _sum: {
                amount: number;
            };
        })[];
        period: {
            startDate: Date;
            endDate: Date;
        };
    }>;
    private fulfillPurchase;
    private getOrCreateStripeCustomer;
    private getCoachingPackages;
    private getRevenueByMonth;
}
