import { env } from '~/env.ts';
import type { Product } from './products.ts';
import stripe from './stripe.ts';

interface CreatePaymentInput {
  product: Product;
  metadata: PaymentMetadata;
  customer?: {
    id?: string;
    email?: string;
  };
}

export interface PaymentMetadata {
  pendingId: string;
  workspaceName: string;
  [key: string]: string;
}

interface CreatePaymentOutput {
  url: string;
  id: string;
}

export const createPayment = async ({
  metadata,
  product,
  customer = {},
}: CreatePaymentInput): Promise<CreatePaymentOutput> => {
  const isSubscription = product.payment_type === 'subscription';

  const session = await stripe.checkout.sessions.create({
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
    metadata: metadata,
    //
    success_url: `${env.APP_URL}/new/pending?status=success&pendingId=${metadata.pendingId}`,
    cancel_url: `${env.APP_URL}/new`,
    payment_intent_data: isSubscription
      ? undefined
      : {
          // TODO: parametrize
          description: `Workspace creation for ${metadata.workspaceName}`,
          receipt_email: customer.email,
          statement_descriptor: `pedaki`,
        },
  });

  return {
    url: session.url!,
    id: session.id,
  };
};
