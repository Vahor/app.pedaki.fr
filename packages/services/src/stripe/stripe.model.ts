import type {Product} from "~/stripe/products.ts";

export interface CreatePaymentInput {
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

export interface CreatePaymentOutput {
    url: string;
    id: string;
}