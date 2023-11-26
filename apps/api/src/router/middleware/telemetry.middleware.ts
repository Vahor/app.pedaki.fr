import { trpcTracingMiddleware } from '@baselime/node-opentelemetry';

export const telemetryMiddleware = trpcTracingMiddleware({
  collectInput: true,
});
