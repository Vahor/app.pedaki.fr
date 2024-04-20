import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
	registerInstrumentations,
	type InstrumentationOption,
} from "@opentelemetry/instrumentation";
import { Resource } from "@opentelemetry/resources";
import {
	BatchSpanProcessor,
	NodeTracerProvider,
} from "@opentelemetry/sdk-trace-node";
import {
	SEMRESATTRS_SERVICE_NAME,
	SEMRESATTRS_SERVICE_NAMESPACE,
	SEMRESATTRS_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { env } from "~/env.ts";
import { INSTANCE_ID } from "~/index.ts";
import { VERSION } from "~/version.ts";

export const initTelemetry = (
	instrumentations: InstrumentationOption[],
): NodeTracerProvider => {
	const collectorUrl = "https://otel.baselime.io/v1";

	const provider = new NodeTracerProvider({
		resource: new Resource({
			"pedaki.instanceId": INSTANCE_ID,
			"pedaki.community": false,
			[SEMRESATTRS_SERVICE_NAME]: env.LOGGER_SERVICE_NAME,
			[SEMRESATTRS_SERVICE_NAMESPACE]: env.LOGGER_NAMESPACE,
			[SEMRESATTRS_SERVICE_VERSION]: VERSION,
		}),
		forceFlushTimeoutMillis: 500,
	});

	const exporter = new OTLPTraceExporter({
		url: collectorUrl,
		headers: {
			"x-api-key": env.BASELIME_API_KEY,
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
