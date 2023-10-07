import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(8080),

    PULUMI_ACCESS_TOKEN: z.string(),
    PUBLIC_KEY: z.string().optional(),

    PRISMA_ENCRYPTION_KEY: z.string().min(1).default('secret'),

    // optional for development
    RESEND_API_KEY: z.string().min(1),
    MAILER_PREVIEW: z.coerce.boolean().default(false),

    NEXTAUTH_SECRET: z.string().min(1).default('secret'),

    DATABASE_URL: z.string().url(),

    APP_URL: z.string().url().default('https://app.pedaki.fr'),
  },
  runtimeEnv: process.env,
});
