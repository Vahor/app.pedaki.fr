import { TRPCError } from '@trpc/server';
import { env } from '~/env.ts';
import { t } from '~/router/init.ts';
import stripe from '~/services/stipe/stripe.ts';

const error = new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'INVALID_TOKEN',
});

const missingSignature = new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'MISSING_SIGNATURE',
});

export const isFromStripe = t.middleware(async ({ ctx, next }) => {
  // Check stripe-signature header
  const signature = ctx.req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    throw missingSignature;
  }

  const body = ctx.req.rawBody;
  if (!body) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'MISSING_BODY',
    });
  }

  try {
    const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);

    return next({
      ctx: {
        ...ctx,
        stripeEvent: event,
      },
    });
  } catch (err) {
    throw error;
  }
});
