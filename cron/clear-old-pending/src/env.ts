import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    PRISMA_ENCRYPTION_KEY: z.string().min(1).default('secret'),

    CRON_INTERVAL_MINUTES: z.coerce.number(),
  },
  runtimeEnv: process.env,
});
