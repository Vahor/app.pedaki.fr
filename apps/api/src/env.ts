import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    AWS_ENVIRONMENT: z.enum(['aws-dev']).default('aws-dev'),

    PORT: z.coerce.number().default(8080),

    PULUMI_ACCESS_TOKEN: z.string(),
    PUBLIC_KEY: z.string().optional(),

    // optional for development
    RESEND_API_KEY: z.string().startsWith('re_'),
    MAILER_PREVIEW: z.coerce.boolean().default(false),

    STORE_URL: z.string().url().default('https://store.pedaki.fr'),

    STRIPE_WEBHOOK_SECRET: z.string().min(1),

    API_INTERNAL_SECRET: z.string().min(1),
    API_ENCRYPTION_KEY: z.string().min(32),
  },
  runtimeEnv: process.env,
});
