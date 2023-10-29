import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    AWS_ENVIRONMENT: z.enum(['aws-dev']).default('aws-dev'),

    PULUMI_ACCESS_TOKEN: z.string(),
  },
  runtimeEnv: process.env,
});
