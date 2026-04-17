import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
export declare class StripeService {
    private configService;
    private readonly logger;
    private readonly stripe;
    constructor(configService: ConfigService);
    createPaymentIntent(paymentData: {
        amount: number;
        currency: string;
        metadata?: Record<string, any>;
        payment_method?: string;
        customer?: string;
    }): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.Response<Stripe.PaymentIntent>>;
    createCustomer(customerData: {
        email: string;
        name?: string;
        metadata?: Record<string, any>;
        payment_method?: string;
    }): Promise<Stripe.Response<Stripe.Customer>>;
    retrieveCustomer(customerId: string): Promise<Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>>;
    updateCustomer(customerId: string, updateData: {
        name?: string;
        email?: string;
        metadata?: Record<string, any>;
        invoice_settings?: {
            default_payment_method?: string;
        };
    }): Promise<Stripe.Response<Stripe.Customer>>;
    createPaymentMethod(paymentMethodData: {
        type: 'card';
        card: {
            number: string;
            exp_month: number;
            exp_year: number;
            cvc: string;
        };
        billing_details?: {
            name?: string;
            email?: string;
            phone?: string;
            address?: {
                line1?: string;
                line2?: string;
                city?: string;
                state?: string;
                postal_code?: string;
                country?: string;
            };
        };
        metadata?: Record<string, any>;
    }): Promise<Stripe.Response<Stripe.PaymentMethod>>;
    retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.Response<Stripe.PaymentMethod>>;
    attachPaymentMethodToCustomer(paymentMethodId: string, customerId: string): Promise<Stripe.Response<Stripe.PaymentMethod>>;
    detachPaymentMethod(paymentMethodId: string): Promise<Stripe.Response<Stripe.PaymentMethod>>;
    getCustomerPaymentMethods(customerId: string, type?: 'card'): Promise<Stripe.PaymentMethod[]>;
    createSubscription(subscriptionData: {
        customerId: string;
        priceId: string;
        paymentMethodId?: string;
        metadata?: Record<string, any>;
        trial_period_days?: number;
    }): Promise<Stripe.Response<Stripe.Subscription>>;
    retrieveSubscription(subscriptionId: string): Promise<Stripe.Response<Stripe.Subscription>>;
    updateSubscription(subscriptionId: string, updateData: {
        metadata?: Record<string, any>;
        payment_method?: string;
        proration_behavior?: 'create_prorations' | 'none';
    }): Promise<Stripe.Response<Stripe.Subscription>>;
    cancelSubscription(subscriptionId: string, cancelAtPeriodEnd?: boolean): Promise<Stripe.Response<Stripe.Subscription>>;
    createRefund(refundData: {
        paymentIntentId: string;
        amount?: number;
        reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
        metadata?: Record<string, any>;
    }): Promise<Stripe.Response<Stripe.Refund>>;
    retrieveRefund(refundId: string): Promise<Stripe.Response<Stripe.Refund>>;
    createInvoice(invoiceData: {
        customerId: string;
        metadata?: Record<string, any>;
        description?: string;
    }): Promise<Stripe.Response<Stripe.Invoice>>;
    retrieveInvoice(invoiceId: string): Promise<Stripe.Response<Stripe.Invoice>>;
    getInvoice(invoiceId: string): Promise<Stripe.Response<Stripe.Invoice>>;
    getCustomerInvoices(customerId: string, options?: {
        limit?: number;
        starting_after?: string;
    }): Promise<Stripe.Response<Stripe.ApiList<Stripe.Invoice>>>;
    createPrice(priceData: {
        unitAmount: number;
        currency: string;
        product?: string;
        recurring?: {
            interval: 'day' | 'week' | 'month' | 'year';
            intervalCount?: number;
        };
        metadata?: Record<string, any>;
    }): Promise<Stripe.Response<Stripe.Price>>;
    createProduct(productData: {
        name: string;
        description?: string;
        metadata?: Record<string, any>;
    }): Promise<Stripe.Response<Stripe.Product>>;
    handleWebhook(webhookData: any): Promise<void>;
    constructWebhookEvent(payload: string, signature: string, secret: string): Promise<Stripe.Event>;
    getBalance(): Promise<Stripe.Response<Stripe.Balance>>;
    createPayout(payoutData: {
        amount: number;
        currency: string;
        metadata?: Record<string, any>;
    }): Promise<Stripe.Response<Stripe.Payout>>;
    createCheckoutSession(sessionData: {
        successUrl: string;
        cancelUrl: string;
        paymentMethodTypes?: string[];
        mode?: 'payment' | 'subscription';
        lineItems?: Array<{
            price: string;
            quantity: number;
        }>;
        customer?: string;
        metadata?: Record<string, any>;
    }): Promise<Stripe.Response<Stripe.Checkout.Session>>;
    testConnection(): Promise<boolean>;
    private handlePaymentIntentSucceeded;
    private handlePaymentIntentFailed;
    private handleInvoicePaymentSucceeded;
    private handleInvoicePaymentFailed;
    private handleSubscriptionCreated;
    private handleSubscriptionUpdated;
    private handleSubscriptionDeleted;
}
