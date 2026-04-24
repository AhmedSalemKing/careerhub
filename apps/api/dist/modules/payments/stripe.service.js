"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
let StripeService = StripeService_1 = class StripeService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StripeService_1.name);
        this.stripe = new stripe_1.default(this.configService.get('STRIPE_SECRET_KEY'), {
            apiVersion: '2025-01-27.acacia',
            typescript: true,
        });
    }
    async createPaymentIntent(paymentData) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.create({
                amount: paymentData.amount,
                currency: paymentData.currency,
                metadata: paymentData.metadata || {},
                payment_method: paymentData.payment_method,
                customer: paymentData.customer,
                automatic_payment_methods: {
                    enabled: true,
                },
                confirmation_method: 'manual',
                confirm: false,
            });
            this.logger.log(`Payment intent created: ${paymentIntent.id}`);
            return paymentIntent;
        }
        catch (error) {
            this.logger.error('Failed to create payment intent', error);
            throw new Error('Failed to create payment intent');
        }
    }
    async confirmPaymentIntent(paymentIntentId, paymentMethodId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
                payment_method: paymentMethodId,
            });
            return paymentIntent;
        }
        catch (error) {
            this.logger.error('Failed to confirm payment intent', error);
            throw new Error('Failed to confirm payment');
        }
    }
    async retrievePaymentIntent(paymentIntentId) {
        try {
            return await this.stripe.paymentIntents.retrieve(paymentIntentId);
        }
        catch (error) {
            this.logger.error('Failed to retrieve payment intent', error);
            throw new Error('Failed to retrieve payment intent');
        }
    }
    async createCustomer(customerData) {
        try {
            const customer = await this.stripe.customers.create({
                email: customerData.email,
                name: customerData.name,
                metadata: customerData.metadata || {},
                payment_method: customerData.payment_method,
                invoice_settings: customerData.payment_method ? {
                    default_payment_method: customerData.payment_method,
                } : undefined,
            });
            this.logger.log(`Customer created: ${customer.id}`);
            return customer;
        }
        catch (error) {
            this.logger.error('Failed to create customer', error);
            throw new Error('Failed to create customer');
        }
    }
    async retrieveCustomer(customerId) {
        try {
            return await this.stripe.customers.retrieve(customerId);
        }
        catch (error) {
            this.logger.error('Failed to retrieve customer', error);
            throw new Error('Failed to retrieve customer');
        }
    }
    async updateCustomer(customerId, updateData) {
        try {
            const customer = await this.stripe.customers.update(customerId, updateData);
            return customer;
        }
        catch (error) {
            this.logger.error('Failed to update customer', error);
            throw new Error('Failed to update customer');
        }
    }
    async createPaymentMethod(paymentMethodData) {
        try {
            const paymentMethod = await this.stripe.paymentMethods.create({
                type: paymentMethodData.type,
                card: paymentMethodData.card,
                billing_details: paymentMethodData.billing_details,
                metadata: paymentMethodData.metadata || {},
            });
            this.logger.log(`Payment method created: ${paymentMethod.id}`);
            return paymentMethod;
        }
        catch (error) {
            this.logger.error('Failed to create payment method', error);
            throw new Error('Failed to create payment method');
        }
    }
    async retrievePaymentMethod(paymentMethodId) {
        try {
            return await this.stripe.paymentMethods.retrieve(paymentMethodId);
        }
        catch (error) {
            this.logger.error('Failed to retrieve payment method', error);
            throw new Error('Failed to retrieve payment method');
        }
    }
    async attachPaymentMethodToCustomer(paymentMethodId, customerId) {
        try {
            return await this.stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId,
            });
        }
        catch (error) {
            this.logger.error('Failed to attach payment method to customer', error);
            throw new Error('Failed to attach payment method');
        }
    }
    async detachPaymentMethod(paymentMethodId) {
        try {
            return await this.stripe.paymentMethods.detach(paymentMethodId);
        }
        catch (error) {
            this.logger.error('Failed to detach payment method', error);
            throw new Error('Failed to detach payment method');
        }
    }
    async getCustomerPaymentMethods(customerId, type) {
        try {
            const paymentMethods = await this.stripe.paymentMethods.list({
                customer: customerId,
                type: type || 'card',
            });
            return paymentMethods.data;
        }
        catch (error) {
            this.logger.error('Failed to get customer payment methods', error);
            throw new Error('Failed to get payment methods');
        }
    }
    async createSubscription(subscriptionData) {
        try {
            const subscriptionParams = {
                customer: subscriptionData.customerId,
                items: [{ price: subscriptionData.priceId }],
                metadata: subscriptionData.metadata || {},
                payment_behavior: 'default_incomplete',
                payment_settings: {
                    save_default_payment_method: 'on_subscription',
                },
                expand: ['latest_invoice.payment_intent'],
            };
            if (subscriptionData.trial_period_days) {
                subscriptionParams.trial_period_days = subscriptionData.trial_period_days;
            }
            if (subscriptionData.paymentMethodId) {
                subscriptionParams.default_payment_method = subscriptionData.paymentMethodId;
            }
            const subscription = await this.stripe.subscriptions.create(subscriptionParams);
            this.logger.log(`Subscription created: ${subscription.id}`);
            return subscription;
        }
        catch (error) {
            this.logger.error('Failed to create subscription', error);
            throw new Error('Failed to create subscription');
        }
    }
    async retrieveSubscription(subscriptionId) {
        try {
            return await this.stripe.subscriptions.retrieve(subscriptionId);
        }
        catch (error) {
            this.logger.error('Failed to retrieve subscription', error);
            throw new Error('Failed to retrieve subscription');
        }
    }
    async updateSubscription(subscriptionId, updateData) {
        try {
            const subscription = await this.stripe.subscriptions.update(subscriptionId, updateData);
            return subscription;
        }
        catch (error) {
            this.logger.error('Failed to update subscription', error);
            throw new Error('Failed to update subscription');
        }
    }
    async cancelSubscription(subscriptionId, cancelAtPeriodEnd = false) {
        try {
            if (cancelAtPeriodEnd) {
                const subscription = await this.stripe.subscriptions.update(subscriptionId, {
                    cancel_at_period_end: true,
                });
                return subscription;
            }
            else {
                const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
                return subscription;
            }
        }
        catch (error) {
            this.logger.error('Failed to cancel subscription', error);
            throw new Error('Failed to cancel subscription');
        }
    }
    async createRefund(refundData) {
        try {
            const refund = await this.stripe.refunds.create({
                payment_intent: refundData.paymentIntentId,
                amount: refundData.amount,
                reason: refundData.reason || 'requested_by_customer',
                metadata: refundData.metadata || {},
            });
            this.logger.log(`Refund created: ${refund.id}`);
            return refund;
        }
        catch (error) {
            this.logger.error('Failed to create refund', error);
            throw new Error('Failed to create refund');
        }
    }
    async retrieveRefund(refundId) {
        try {
            return await this.stripe.refunds.retrieve(refundId);
        }
        catch (error) {
            this.logger.error('Failed to retrieve refund', error);
            throw new Error('Failed to retrieve refund');
        }
    }
    async createInvoice(invoiceData) {
        try {
            const invoice = await this.stripe.invoices.create({
                customer: invoiceData.customerId,
                metadata: invoiceData.metadata || {},
                description: invoiceData.description,
                auto_advance: true,
            });
            this.logger.log(`Invoice created: ${invoice.id}`);
            return invoice;
        }
        catch (error) {
            this.logger.error('Failed to create invoice', error);
            throw new Error('Failed to create invoice');
        }
    }
    async retrieveInvoice(invoiceId) {
        try {
            return await this.stripe.invoices.retrieve(invoiceId);
        }
        catch (error) {
            this.logger.error('Failed to retrieve invoice', error);
            throw new Error('Failed to retrieve invoice');
        }
    }
    async getInvoice(invoiceId) {
        try {
            return this.stripe.invoices.retrieve(invoiceId);
        }
        catch (error) {
            this.logger.error('Failed to get invoice', error);
            throw new Error('Failed to get invoice');
        }
    }
    async getCustomerInvoices(customerId, options = {}) {
        try {
            const invoices = await this.stripe.invoices.list({
                customer: customerId,
                limit: options.limit || 10,
                starting_after: options.starting_after,
            });
            return invoices;
        }
        catch (error) {
            this.logger.error('Failed to get customer invoices', error);
            throw new Error('Failed to get invoices');
        }
    }
    async createPrice(priceData) {
        try {
            const price = await this.stripe.prices.create({
                unit_amount: priceData.unitAmount,
                currency: priceData.currency,
                product: priceData.product,
                recurring: priceData.recurring,
                metadata: priceData.metadata || {},
            });
            this.logger.log(`Price created: ${price.id}`);
            return price;
        }
        catch (error) {
            this.logger.error('Failed to create price', error);
            throw new Error('Failed to create price');
        }
    }
    async createProduct(productData) {
        try {
            const product = await this.stripe.products.create({
                name: productData.name,
                description: productData.description,
                metadata: productData.metadata || {},
            });
            this.logger.log(`Product created: ${product.id}`);
            return product;
        }
        catch (error) {
            this.logger.error('Failed to create product', error);
            throw new Error('Failed to create product');
        }
    }
    async handleWebhook(webhookData) {
        const event = webhookData;
        this.logger.log(`Processing webhook event: ${event.type}`);
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentIntentSucceeded(event);
                break;
            case 'payment_intent.payment_failed':
                await this.handlePaymentIntentFailed(event);
                break;
            case 'invoice.payment_succeeded':
                await this.handleInvoicePaymentSucceeded(event);
                break;
            case 'invoice.payment_failed':
                await this.handleInvoicePaymentFailed(event);
                break;
            case 'customer.subscription.created':
                await this.handleSubscriptionCreated(event);
                break;
            case 'customer.subscription.updated':
                await this.handleSubscriptionUpdated(event);
                break;
            case 'customer.subscription.deleted':
                await this.handleSubscriptionDeleted(event);
                break;
            default:
                this.logger.log(`Unhandled webhook event: ${event.type}`);
        }
    }
    async constructWebhookEvent(payload, signature, secret) {
        try {
            return this.stripe.webhooks.constructEvent(payload, signature, secret);
        }
        catch (error) {
            this.logger.error('Failed to construct webhook event', error);
            throw new Error('Invalid webhook signature');
        }
    }
    async getBalance() {
        try {
            const balance = await this.stripe.balance.retrieve();
            return balance;
        }
        catch (error) {
            this.logger.error('Failed to get balance', error);
            throw new Error('Failed to get balance');
        }
    }
    async createPayout(payoutData) {
        try {
            const payout = await this.stripe.payouts.create({
                amount: payoutData.amount,
                currency: payoutData.currency,
                metadata: payoutData.metadata || {},
            });
            this.logger.log(`Payout created: ${payout.id}`);
            return payout;
        }
        catch (error) {
            this.logger.error('Failed to create payout', error);
            throw new Error('Failed to create payout');
        }
    }
    async createCheckoutSession(sessionData) {
        try {
            const session = await this.stripe.checkout.sessions.create({
                success_url: sessionData.successUrl,
                cancel_url: sessionData.cancelUrl,
                payment_method_types: (sessionData.paymentMethodTypes || ['card']),
                mode: sessionData.mode || 'payment',
                line_items: sessionData.lineItems,
                customer: sessionData.customer,
                metadata: sessionData.metadata || {},
            });
            this.logger.log(`Checkout session created: ${session.id}`);
            return session;
        }
        catch (error) {
            this.logger.error('Failed to create checkout session', error);
            throw new Error('Failed to create checkout session');
        }
    }
    async testConnection() {
        try {
            await this.getBalance();
            return true;
        }
        catch (error) {
            this.logger.error('Stripe connection test failed', error);
            return false;
        }
    }
    async handlePaymentIntentSucceeded(event) {
        const paymentIntent = event.data.object;
        this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    }
    async handlePaymentIntentFailed(event) {
        const paymentIntent = event.data.object;
        this.logger.log(`Payment failed: ${paymentIntent.id}`);
    }
    async handleInvoicePaymentSucceeded(event) {
        const invoice = event.data.object;
        this.logger.log(`Invoice payment succeeded: ${invoice.id}`);
    }
    async handleInvoicePaymentFailed(event) {
        const invoice = event.data.object;
        this.logger.log(`Invoice payment failed: ${invoice.id}`);
    }
    async handleSubscriptionCreated(event) {
        const subscription = event.data.object;
        this.logger.log(`Subscription created: ${subscription.id}`);
    }
    async handleSubscriptionUpdated(event) {
        const subscription = event.data.object;
        this.logger.log(`Subscription updated: ${subscription.id}`);
    }
    async handleSubscriptionDeleted(event) {
        const subscription = event.data.object;
        this.logger.log(`Subscription deleted: ${subscription.id}`);
    }
};
exports.StripeService = StripeService;
exports.StripeService = StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeService);
//# sourceMappingURL=stripe.service.js.map