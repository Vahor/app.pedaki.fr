import { logger } from '@pedaki/logger';
import { initTRPC } from '@trpc/server';
import { env } from '~/env.ts';
import superjson from 'superjson';
import type { OpenApiMeta } from 'trpc-openapi';
import type { Context } from './context.ts';

export const t = initTRPC
  .meta<OpenApiMeta>()
  .context<Context>()
  .create({
    transformer: superjson,
    errorFormatter({ error, shape }) {
      if (error.code === 'INTERNAL_SERVER_ERROR' && env.NODE_ENV === 'production') {
        return { ...shape, message: 'Internal server error' };
      }
      logger.error(error);
      return shape;
    },
  });
