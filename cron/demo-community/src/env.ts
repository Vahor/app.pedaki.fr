import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    PRISMA_ENCRYPTION_KEY: z.string().min(1).default('secret'),

    APP_DOCKER_HOST: z.string().min(1),
    APP_DOCKER_ORGANISATION: z.string().min(1),
    APP_DOCKER_PACKAGE_NAME: z.string().min(1),
    APP_DOCKER_PASSWORD: z.string().min(1),
  },
  runtimeEnv: process.env,
});
