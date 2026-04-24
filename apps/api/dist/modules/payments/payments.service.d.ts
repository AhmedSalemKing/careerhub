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
            courseId: string | null;
            amount: number;
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            status: string;
            updatedAt: Date;
            description: string | null;
            completedAt: Date | null;
            currency: string;
            method: string;
            transactionId: string | null;
            stripeIntentId: string | null;
            itemType: string | null;
            itemId: string | null;
            refundedAt: Date | null;
        };
        itemDetails: any;
    }>;
    confirmPayment(userId: string, paymentIntentId: string): Promise<{
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
    }>;
    private createEnrollmentAfterPayment;
    purchaseCourse(userId: string, courseId: string, paymentMethodId: string, couponCode?: string): Promise<{
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
    }>;
    purchaseCoachingPackage(userId: string, packageId: string, paymentMethodId: string): Promise<{
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
    }>;
    createSubscription(userId: string, planId: string, paymentMethodId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: string;
        updatedAt: Date;
        plan: string;
        startDate: Date;
        endDate: Date | null;
    }>;
    cancelSubscription(userId: string, subscriptionId: string, reason?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: string;
        updatedAt: Date;
        plan: string;
        startDate: Date;
        endDate: Date | null;
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
            id: string;
            createdAt: Date;
            userId: string;
            status: string;
            updatedAt: Date;
            plan: string;
            startDate: Date;
            endDate: Date | null;
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
                googleId: string | null;
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
                provider: string;
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
                idVerificationStatus: string;
                idFrontUrl: string | null;
                idBackUrl: string | null;
                idVerifiedAt: Date | null;
                idRejectedReason: string | null;
                isVerified: boolean;
                walletBalance: number;
                updatedAt: Date;
                deletedAt: Date | null;
            };
        } & {
            courseId: string | null;
            amount: number;
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            status: string;
            updatedAt: Date;
            description: string | null;
            completedAt: Date | null;
            currency: string;
            method: string;
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
