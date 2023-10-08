import { TRPCError } from '@trpc/server';
import { env } from '~/env.ts';
import { t } from '~/router/init.ts';

const error = new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'INVALID_TOKEN',
});

const missingSignature = new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'MISSING_SIGNATURE',
});

export const isInternal = t.middleware(async ({ ctx, next }) => {
  console.log(ctx.req.headers)
  const secret = ctx.req.headers['internal-secret'];
  if (!secret || typeof secret !== 'string') {
    throw missingSignature;
  }

  if (secret !== env.API_INTERNAL_SECRET) {
    throw error;
  }

  try {
    return next();
  } catch (err) {
    throw error;
  }
});
