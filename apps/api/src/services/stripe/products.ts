export interface Product {
  type: 'plan';
  payment_type: 'subscription';
  priceId: string;
}

export const products = {
  hosted: {
    type: 'plan',
    payment_type: 'subscription',
    priceId: 'price_1NyhGDGjIZI03z0TsT9T7Om0',
  },
} satisfies Record<string, Product>;
