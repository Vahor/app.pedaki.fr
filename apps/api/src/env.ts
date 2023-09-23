import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DEV: z.coerce.boolean().default(false),
    PORT: z.coerce.number().default(8080),

    TRPC_PREFIX: z.string().default('/trpc'),

    PULUMI_ACCESS_TOKEN: z.string(),
    PUBLIC_KEY: z.string().optional(),

    NEXTAUTH_SECRET: z.string().min(1).default('secret'),
  },
  runtimeEnv: process.env,
});
