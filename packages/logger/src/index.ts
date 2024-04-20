import crypto from "node:crypto";
import { BaselimeTransport } from "@baselime/winston-transport";
import * as api from "@opentelemetry/api";
import { env } from "~/env.ts";
import winston from "winston";
import { VERSION } from "./version.js";

export const INSTANCE_ID = crypto.randomBytes(8).toString("hex");

const transports = [
	env.NODE_ENV === "production"
		? new BaselimeTransport({
				baselimeApiKey: env.BASELIME_API_KEY,
				service: env.LOGGER_SERVICE_NAME,
			})
		: null,
	new winston.transports.Console({ level: "debug" }),
].filter(Boolean) as winston.transport[];

export const logger = winston.createLogger({
	level: env.LOGGER_LEVEL,
	format: winston.format.combine(
		winston.format((info) => {
			const span = api.trace.getActiveSpan();
			if (span) {
				info.spanId = span.spanContext().spanId;
				info.traceId = span.spanContext().traceId;
			}

			// Meta data
			info.service = {
				name: env.LOGGER_SERVICE_NAME,
				namespace: env.LOGGER_NAMESPACE,
				instanceId: INSTANCE_ID,
				version: VERSION,
			};
			return info;
		})(),
		winston.format.json(),
	),
	exitOnError: false,
	transports: transports,
});
