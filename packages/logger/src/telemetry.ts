import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { AsyncHooksContextManager } from "@opentelemetry/context-async-hooks";
import { Resource } from '@opentelemetry/resources';
import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { env } from '~/env.ts';
import { INSTANCE_ID } from '~/index.ts';
import { VERSION } from '~/version.ts';
import * as api from "@opentelemetry/api";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";
export const initTelemetry = (instrumentations: any[]) => {
  const collectorUrl = 'https://otel.baselime.io/v1';

  const contextManager = new AsyncHooksContextManager().enable();
  api.context.setGlobalContextManager(contextManager);

  const provider = new NodeTracerProvider({
    resource: new Resource({
      'service.instanceId': INSTANCE_ID,
      'service.community': false,
      [SemanticResourceAttributes.SERVICE_NAME]: env.LOGGER_SERVICE_NAME,
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: env.LOGGER_NAMESPACE,
      [SemanticResourceAttributes.SERVICE_VERSION]: VERSION,
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
