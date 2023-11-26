import { BaselimeTransport } from '@baselime/winston-transport';
import { env } from '~/env.ts';
import winston from 'winston';

export const logger = winston.createLogger({
  level: env.LOGGER_LEVEL,
  format: winston.format.json(),
  exitOnError: false,
  transports: [
    new BaselimeTransport({
      baselimeApiKey: env.BASELIME_API_KEY,
      service: env.LOGGER_SERVICE_NAME,
    }),
    new winston.transports.Console({ level: 'debug' }),
  ],
});
