import type { Product } from '~/stripe/products.ts';
import { z } from 'zod';

export interface CreatePaymentInput {
  product: {
    payment_type: Product['payment_type'];
    priceId: string;
  };
  metadata: PaymentMetadata;
  customer?: {
    id?: string;
    email?: string;
  };
}

export const PaymentMetadataSchema = z
  .object({
    pendingId: z.string().cuid(),
    workspaceName: z.string(),
    subdomain: z.string(),
  })
  .catchall(z.string());

export type PaymentMetadata = z.infer<typeof PaymentMetadataSchema>;

export interface CreatePaymentOutput {
  url: string;
  id: string;
}

export const CustomerSubscriptionSchema = z.object({
  id: z.string(),
  ended_at: z.number().nullable(),
  cancel_at: z.number().nullable(),
  canceled_at: z.number().nullable(),
  current_period_start: z.number(),
  current_period_end: z.number(),
});

export const CheckoutSessionCompletedSchema = z.object({
  metadata: PaymentMetadataSchema,
  status: z.string(),
  customer: z.string(),
  subscription: z.string(),
  expires_at: z.number(),
});

export const CheckoutSessionExpiredSchema = z.object({
  metadata: PaymentMetadataSchema,
  status: z.string(),
});
