import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    BASELIME_API_KEY: z.string(),

    LOGGER_SERVICE_NAME: z.string(),
    LOGGER_USE_CONSOLE: z.boolean().default(true),
    LOGGER_LEVEL: z.enum(['error', 'warn', 'info', 'verbose', 'debug', 'silly']).default('info'),
  },
  runtimeEnv: process.env,
});
