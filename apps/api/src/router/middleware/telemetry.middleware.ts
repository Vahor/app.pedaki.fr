import { trace } from "@opentelemetry/api";
import { t } from "~/router/init.ts";
import { flatten } from "flat";

export const withTelemetry = t.middleware(
	async ({ rawInput, path, type, ctx, next }) => {
		const tracer = trace.getTracer("@baselime/trpc"); // use baselime to keep the logo
		return tracer.startActiveSpan(`${path} - ${type}`, async (span) => {
			const result = await next();
			span.setAttributes(
				flatten({
					input: rawInput,
					path: path,
					type: type,
					ok: result.ok,
				}),
			);
			span.end();
			return result;
		});
	},
);
