import { BaselimeTransport } from '@baselime/winston-transport';
import { env } from '~/env.ts';
import winston from 'winston';

export const logger = winston.createLogger({
  level: env.LOGGER_LEVEL,
  format: winston.format.json(),
  // @ts-expect-error: null is filtered out
  transports: [
    new BaselimeTransport({
      baselimeApiKey: env.BASELIME_API_KEY,
      service: env.LOGGER_SERVICE_NAME,
    }),
    env.LOGGER_USE_CONSOLE ? new winston.transports.Console() : null,
  ].filter(Boolean),
});
