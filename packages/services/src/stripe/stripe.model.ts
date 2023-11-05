import type { Product } from '~/stripe/products.ts';

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

export interface PaymentMetadata {
  pendingId: string;
  workspaceName: string;
  [key: string]: string;
}

export interface CreatePaymentOutput {
  url: string;
  id: string;
}
