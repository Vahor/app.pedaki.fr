import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    AWS_ACCESS_KEY_ID: z.string(),
    AWS_SECRET_ACCESS_KEY: z.string(),

    GITHUB_ACCESS_TOKEN: z.string(),

    APP_DOCKER_HOST: z.string(),
    APP_DOCKER_ORGANISATION: z.string(),
    APP_DOCKER_PACKAGE_NAME: z.string(),
    APP_DOCKER_IMAGE_VERSION: z.string(),
    APP_DOCKER_USERNAME: z.string(),
    APP_DOCKER_PASSWORD: z.string(),

    PULUMI_ACCESS_TOKEN: z.string(),
  },
  runtimeEnv: process.env,
});
