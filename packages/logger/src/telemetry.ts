import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { env } from '~/env.ts';

export const initTelemetry = (instrumentations: any[]) => {
  const collectorUrl = 'https://otel.baselime.io/v1';

  const provider = new NodeTracerProvider({
    resource: new Resource({
      'service.name': env.LOGGER_SERVICE_NAME,
      'service.namespace': env.LOGGER_NAMESPACE,
    }),
    forceFlushTimeoutMillis: 500,
  });

  const exporter = new OTLPTraceExporter({
    url: collectorUrl,
    headers: {
      'x-api-key': env.BASELIME_API_KEY,
    },
    timeoutMillis: 1000,
  });

  const spanProcessor = new BatchSpanProcessor(exporter, {
    maxQueueSize: 100,
    maxExportBatchSize: 5,
  });

  provider.addSpanProcessor(spanProcessor);
  provider.register();

  registerInstrumentations({
    instrumentations: instrumentations,
  });
  return provider;
};
