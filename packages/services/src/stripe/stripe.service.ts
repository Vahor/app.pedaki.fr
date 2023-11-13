import { env } from '~/env.ts';
import type { CreatePaymentInput, CreatePaymentOutput } from '~/stripe/stripe.model.ts';
import Stripe from 'stripe';

class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }

  async getSubscriptionInfo(subscriptionId: string) {
    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['default_payment_method'],
    });

    console.log(`Subscription info for ${subscriptionId}`, subscription);

    return subscription;
  }

  async getCustomerFromPayment(paymentId: string) {
    const payment = await this.stripe.paymentIntents.retrieve(paymentId, {
      expand: ['customer'],
    });

    return payment.customer as string;
  }

  constructEvent(body: string | Buffer, signature: string, secret: string) {
    return this.stripe.webhooks.constructEvent(body, signature, secret);
  }

  async createPayment({
    metadata,
    product,
    customer = {},
  }: CreatePaymentInput): Promise<CreatePaymentOutput> {
    const isSubscription = product.payment_type === 'subscription';

    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.priceId,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      automatic_tax: {
        // TODO: do we need this?
        enabled: false,
      },

      customer: customer.id,
      customer_email: customer.email,
      customer_creation: isSubscription ? undefined : 'if_required',

      // 30 min expiration
      expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
      mode: isSubscription ? 'subscription' : 'payment',
      invoice_creation: isSubscription
        ? undefined
        : {
            // Invoices are automatically created for subscription
            enabled: true,
          },

      success_url: `${env.STORE_URL}/new/pending?token=${metadata.pendingId}`,
      cancel_url: `${env.STORE_URL}/new`,
      payment_intent_data: isSubscription
        ? undefined
        : {
            // TODO: parametrize
            description: `Workspace creation for ${metadata.workspaceName}`,
            receipt_email: customer.email,
            statement_descriptor: `pedaki`,
          },

      metadata: metadata,
    });

    return {
      url: session.url!,
      id: session.id,
    };
  }
}

const stripeService = new StripeService();
export { stripeService };
