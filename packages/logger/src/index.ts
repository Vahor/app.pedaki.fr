import { BaselimeTransport } from '@baselime/winston-transport';
import { env } from '~/env.ts';
import winston from 'winston';
import * as api from '@opentelemetry/api';

export const logger = winston.createLogger({
  level: env.LOGGER_LEVEL,
  format: winston.format.combine(
    winston.format(info => {
      const span = api.trace.getActiveSpan();
        if (span) {
          info.spanId = span.spanContext().spanId;
          info.traceId = span.spanContext().traceId;
        }
      return info;
    })(),
    winston.format.json(),
  ),
  exitOnError: false,
  transports: [
    new BaselimeTransport({
      baselimeApiKey: env.BASELIME_API_KEY,
      service: env.LOGGER_SERVICE_NAME,
    }),
    new winston.transports.Console({ level: 'debug' }),
  ],
});
