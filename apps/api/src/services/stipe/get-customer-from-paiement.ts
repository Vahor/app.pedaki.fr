import stripe from './stripe.ts';

export const getCustomerFromPayment = async (paymentId: string) => {
  const payment = await stripe.paymentIntents.retrieve(paymentId, {
    expand: ['customer'],
  });

  return payment.customer as string;
};
