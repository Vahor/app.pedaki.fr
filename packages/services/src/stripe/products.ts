import { ProductType } from '@prisma/client';
import { env } from '~/env.ts';

export interface Product {
  type: 'plan';
  payment_type: 'subscription';
  priceId: { monthly: string; yearly: string };
}

export const products = {
  [ProductType.HOSTING]: {
    type: 'plan',
    payment_type: 'subscription',
    priceId: {
      monthly: env.STRIPE_PRODUCT_HOSTED_MONTHLY_PRICE_ID,
      yearly: env.STRIPE_PRODUCT_HOSTED_YEARLY_PRICE_ID,
    },
  },
} satisfies Record<ProductType, Product>;
