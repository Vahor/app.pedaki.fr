import { TRPCError } from '@trpc/server';
import type { Context } from '~/router/context';
import { t } from '~/router/init';

// infers the `session` as non-nullable
const ctxWithUser = (ctx: Context) => {
  return {
    ctx: {
      session: ctx.session!,
    },
  };
};

const error = new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'You must be logged in',
});

export const isLogged = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.id) {
    throw error;
  }

  return next(ctxWithUser(ctx));
});
