import { trace } from '@opentelemetry/api';
import { t } from '~/router/init.ts';
import { flatten } from 'flat';

export const withTelemetry = t.middleware(async ({ rawInput, path, type, ctx, next }) => {
  const tracer = trace.getTracer('@pedaki/trpc');
  return tracer.startActiveSpan(`${path} - ${type}`, async span => {
    const result = await next();
    span.setAttributes(flatten({ input: rawInput }));

    const meta = { path: path, type: type, ok: result.ok };
    span.setAttributes(meta);
    span.end();
    return result;
  });
});
