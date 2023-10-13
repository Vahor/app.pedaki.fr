import stripe from './stripe.ts';

interface DisablePaymentInput {
  paymentId: string;
}

export const disablePayment = async (input: DisablePaymentInput) => {
  const session = await stripe.paymentLinks.update(input.paymentId, {
    active: false,
  });

  return session.url;
};
