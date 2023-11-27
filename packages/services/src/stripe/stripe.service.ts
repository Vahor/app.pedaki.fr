import { logger } from '@pedaki/logger';
import { env } from '~/env.ts';
import type { CreatePaymentInput, CreatePaymentOutput } from '~/stripe/stripe.model.ts';
import { PendingJWTSchema } from '~/stripe/stripe.model.ts';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import type { z } from 'zod';

// 30 min expiration
const EXPIRES_AT_DURATION_MINUTES = 30;

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

    logger.info(`Subscription info for ${subscriptionId}`, subscription);

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

      expires_at: Math.floor(Date.now() / 1000) + 60 * EXPIRES_AT_DURATION_MINUTES,
      mode: isSubscription ? 'subscription' : 'payment',
      invoice_creation: isSubscription
        ? undefined
        : {
            // Invoices are automatically created for subscription
            enabled: true,
          },

      success_url: `${env.STORE_URL}/new/pending?token=${this.generatePendingJWT(
        {
          pendingId: metadata.pendingId,
        },
        '6h',
      )}`,
      cancel_url: `${env.STORE_URL}/new/cancel?token=${this.generatePendingJWT({
        pendingId: metadata.pendingId,
      })}`,
      payment_intent_data: isSubscription
        ? undefined
        : {
            // TODO: parametrize
            description: `Workspace creation for ${metadata.workspaceName}`,
            receipt_email: customer.email,
            statement_descriptor: `pedaki`,
          },

      metadata: metadata,
      custom_text: {
        submit: {
          message: `Votre workspace sera accessible à l'adresse ${metadata.subdomain}.pedaki.fr.`,
        },
      },
    });

    return {
      url: session.url!,
      id: session.id,
    };
  }

  async expireCheckoutSession({ sessionId }: { sessionId: string }) {
    // checkout.session.expired webhook event will be called right after
    await this.stripe.checkout.sessions.expire(sessionId);
  }

  async createPortalSession({ customerId, returnUrl }: { customerId: string; returnUrl: string }) {
    return await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  generatePendingJWT(
    content: z.infer<typeof PendingJWTSchema>,
    expiresIn = `${EXPIRES_AT_DURATION_MINUTES}m`,
  ) {
    return jwt.sign(content, env.JWT_PRIVATE_KEY, {
      expiresIn,
    });
  }

  decodePendingJWT(token: string): z.infer<typeof PendingJWTSchema> {
    return PendingJWTSchema.parse(jwt.verify(token, env.JWT_PRIVATE_KEY));
  }
}

const stripeService = new StripeService();
export { stripeService };
