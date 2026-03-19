import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    this.stripe = new Stripe(this.configService.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-01-27.acacia' as any,
      typescript: true,
    });
  }

  async createPaymentIntent(paymentData: {
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
    payment_method?: string;
    customer?: string;
  }) {
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
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string) {
    try {
      const paymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });

      return paymentIntent;
    } catch (error) {
      this.logger.error('Failed to confirm payment intent', error);
      throw new Error('Failed to confirm payment');
    }
  }

  async retrievePaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error('Failed to retrieve payment intent', error);
      throw new Error('Failed to retrieve payment intent');
    }
  }

  async createCustomer(customerData: {
    email: string;
    name?: string;
    metadata?: Record<string, any>;
    payment_method?: string;
  }) {
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
    } catch (error) {
      this.logger.error('Failed to create customer', error);
      throw new Error('Failed to create customer');
    }
  }

  async retrieveCustomer(customerId: string) {
    try {
      return await this.stripe.customers.retrieve(customerId);
    } catch (error) {
      this.logger.error('Failed to retrieve customer', error);
      throw new Error('Failed to retrieve customer');
    }
  }

  async updateCustomer(customerId: string, updateData: {
    name?: string;
    email?: string;
    metadata?: Record<string, any>;
    invoice_settings?: {
      default_payment_method?: string;
    };
  }) {
    try {
      const customer = await this.stripe.customers.update(customerId, updateData);
      return customer;
    } catch (error) {
      this.logger.error('Failed to update customer', error);
      throw new Error('Failed to update customer');
    }
  }

  async createPaymentMethod(paymentMethodData: {
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
  }) {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: paymentMethodData.type,
        card: paymentMethodData.card,
        billing_details: paymentMethodData.billing_details,
        metadata: paymentMethodData.metadata || {},
      });

      this.logger.log(`Payment method created: ${paymentMethod.id}`);

      return paymentMethod;
    } catch (error) {
      this.logger.error('Failed to create payment method', error);
      throw new Error('Failed to create payment method');
    }
  }

  async retrievePaymentMethod(paymentMethodId: string) {
    try {
      return await this.stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      this.logger.error('Failed to retrieve payment method', error);
      throw new Error('Failed to retrieve payment method');
    }
  }

  async attachPaymentMethodToCustomer(paymentMethodId: string, customerId: string) {
    try {
      return await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });
    } catch (error) {
      this.logger.error('Failed to attach payment method to customer', error);
      throw new Error('Failed to attach payment method');
    }
  }

  async detachPaymentMethod(paymentMethodId: string) {
    try {
      return await this.stripe.paymentMethods.detach(paymentMethodId);
    } catch (error) {
      this.logger.error('Failed to detach payment method', error);
      throw new Error('Failed to detach payment method');
    }
  }

  async getCustomerPaymentMethods(customerId: string, type?: 'card') {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type || 'card',
      });

      return paymentMethods.data;
    } catch (error) {
      this.logger.error('Failed to get customer payment methods', error);
      throw new Error('Failed to get payment methods');
    }
  }

  async createSubscription(subscriptionData: {
    customerId: string;
    priceId: string;
    paymentMethodId?: string;
    metadata?: Record<string, any>;
    trial_period_days?: number;
  }) {
    try {
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
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
    } catch (error) {
      this.logger.error('Failed to create subscription', error);
      throw new Error('Failed to create subscription');
    }
  }

  async retrieveSubscription(subscriptionId: string) {
    try {
      return await this.stripe.subscriptions.retrieve(subscriptionId);
    } catch (error) {
      this.logger.error('Failed to retrieve subscription', error);
      throw new Error('Failed to retrieve subscription');
    }
  }

  async updateSubscription(subscriptionId: string, updateData: {
    metadata?: Record<string, any>;
    payment_method?: string;
    proration_behavior?: 'create_prorations' | 'none';
  }) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, updateData);
      return subscription;
    } catch (error) {
      this.logger.error('Failed to update subscription', error);
      throw new Error('Failed to update subscription');
    }
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = false) {
    try {
      if (cancelAtPeriodEnd) {
        const subscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        return subscription;
      } else {
        const subscription = await this.stripe.subscriptions.cancel(subscriptionId);
        return subscription;
      }
    } catch (error) {
      this.logger.error('Failed to cancel subscription', error);
      throw new Error('Failed to cancel subscription');
    }
  }

  async createRefund(refundData: {
    paymentIntentId: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
    metadata?: Record<string, any>;
  }) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: refundData.paymentIntentId,
        amount: refundData.amount,
        reason: refundData.reason || 'requested_by_customer',
        metadata: refundData.metadata || {},
      });

      this.logger.log(`Refund created: ${refund.id}`);

      return refund;
    } catch (error) {
      this.logger.error('Failed to create refund', error);
      throw new Error('Failed to create refund');
    }
  }

  async retrieveRefund(refundId: string) {
    try {
      return await this.stripe.refunds.retrieve(refundId);
    } catch (error) {
      this.logger.error('Failed to retrieve refund', error);
      throw new Error('Failed to retrieve refund');
    }
  }

  async createInvoice(invoiceData: {
    customerId: string;
    metadata?: Record<string, any>;
    description?: string;
  }) {
    try {
      const invoice = await this.stripe.invoices.create({
        customer: invoiceData.customerId,
        metadata: invoiceData.metadata || {},
        description: invoiceData.description,
        auto_advance: true,
      });

      this.logger.log(`Invoice created: ${invoice.id}`);

      return invoice;
    } catch (error) {
      this.logger.error('Failed to create invoice', error);
      throw new Error('Failed to create invoice');
    }
  }

  async retrieveInvoice(invoiceId: string) {
    try {
      return await this.stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      this.logger.error('Failed to retrieve invoice', error);
      throw new Error('Failed to retrieve invoice');
    }
  }

  async getInvoice(invoiceId: string) {
    try {
      return this.stripe.invoices.retrieve(invoiceId);
    } catch (error) {
      this.logger.error('Failed to get invoice', error);
      throw new Error('Failed to get invoice');
    }
  }

  async getCustomerInvoices(customerId: string, options: {
    limit?: number;
    starting_after?: string;
  } = {}) {
    try {
      const invoices = await this.stripe.invoices.list({
        customer: customerId,
        limit: options.limit || 10,
        starting_after: options.starting_after,
      });

      return invoices;
    } catch (error) {
      this.logger.error('Failed to get customer invoices', error);
      throw new Error('Failed to get invoices');
    }
  }

  async createPrice(priceData: {
    unitAmount: number;
    currency: string;
    product?: string;
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year';
      intervalCount?: number;
    };
    metadata?: Record<string, any>;
  }) {
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
    } catch (error) {
      this.logger.error('Failed to create price', error);
      throw new Error('Failed to create price');
    }
  }

  async createProduct(productData: {
    name: string;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const product = await this.stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata || {},
      });

      this.logger.log(`Product created: ${product.id}`);

      return product;
    } catch (error) {
      this.logger.error('Failed to create product', error);
      throw new Error('Failed to create product');
    }
  }

  async handleWebhook(webhookData: any) {
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

  async constructWebhookEvent(payload: string, signature: string, secret: string): Promise<Stripe.Event> {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (error) {
      this.logger.error('Failed to construct webhook event', error);
      throw new Error('Invalid webhook signature');
    }
  }

  async getBalance() {
    try {
      const balance = await this.stripe.balance.retrieve();
      return balance;
    } catch (error) {
      this.logger.error('Failed to get balance', error);
      throw new Error('Failed to get balance');
    }
  }

  async createPayout(payoutData: {
    amount: number;
    currency: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const payout = await this.stripe.payouts.create({
        amount: payoutData.amount,
        currency: payoutData.currency,
        metadata: payoutData.metadata || {},
      });

      this.logger.log(`Payout created: ${payout.id}`);

      return payout;
    } catch (error) {
      this.logger.error('Failed to create payout', error);
      throw new Error('Failed to create payout');
    }
  }

  async createCheckoutSession(sessionData: {
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
  }) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        success_url: sessionData.successUrl,
        cancel_url: sessionData.cancelUrl,
        payment_method_types: (sessionData.paymentMethodTypes || ['card']) as any,
        mode: sessionData.mode || 'payment',
        line_items: sessionData.lineItems,
        customer: sessionData.customer,
        metadata: sessionData.metadata || {},
      });

      this.logger.log(`Checkout session created: ${session.id}`);

      return session;
    } catch (error) {
      this.logger.error('Failed to create checkout session', error);
      throw new Error('Failed to create checkout session');
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getBalance();
      return true;
    } catch (error) {
      this.logger.error('Stripe connection test failed', error);
      return false;
    }
  }

  private async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    this.logger.log(`Payment succeeded: ${paymentIntent.id}`);
    // Handle successful payment - update database, send notifications, etc.
  }

  private async handlePaymentIntentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    this.logger.log(`Payment failed: ${paymentIntent.id}`);
    // Handle failed payment - update database, send notifications, etc.
  }

  private async handleInvoicePaymentSucceeded(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    this.logger.log(`Invoice payment succeeded: ${invoice.id}`);
    // Handle successful invoice payment - update subscription status, etc.
  }

  private async handleInvoicePaymentFailed(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;
    this.logger.log(`Invoice payment failed: ${invoice.id}`);
    // Handle failed invoice payment - notify customer, handle dunning, etc.
  }

  private async handleSubscriptionCreated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    this.logger.log(`Subscription created: ${subscription.id}`);
    // Handle subscription creation - update database, send welcome email, etc.
  }

  private async handleSubscriptionUpdated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    this.logger.log(`Subscription updated: ${subscription.id}`);
    // Handle subscription update - update database, send notifications, etc.
  }

  private async handleSubscriptionDeleted(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    this.logger.log(`Subscription deleted: ${subscription.id}`);
    // Handle subscription deletion - update database, send confirmation, etc.
  }
}

