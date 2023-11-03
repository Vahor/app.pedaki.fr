import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    STRIPE_SECRET_KEY: z.string().optional(),
    STORE_URL: z.string().url().default('https://store.pedaki.fr'),
  },
  runtimeEnv: process.env,
});
