// import { BetterHttpInstrumentation, StripePlugin } from '@baselime/node-opentelemetry';
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { FastifyInstrumentation } from "@opentelemetry/instrumentation-fastify";
import type { BasicTracerProvider } from "@opentelemetry/sdk-trace-node";
import { prisma } from "@pedaki/db";
import { logger } from "@pedaki/logger";
import { initTelemetry } from "@pedaki/logger/telemetry.js";
import { DOCKER_IMAGE } from "@pedaki/pulumi/utils/docker.js";
import PrismaInstrumentationPkg from "@prisma/instrumentation";
// eslint-disable-next-line node/file-extension-in-import
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { openApiDocument } from "~/openapi.ts";
import { seedDatabase } from "~/seeds/seeds.ts";
import fastify from "fastify";
import fastifyRawBody from "fastify-raw-body";
import { fastifyTRPCOpenApiPlugin } from "trpc-openapi";
import { env } from "./env.ts";
import { createContext } from "./router/context.ts";
import { appRouter } from "./router/router.ts";

const { PrismaInstrumentation } = PrismaInstrumentationPkg;

export function createServer() {
	const port = env.PORT;

	const server = fastify({
		logger: false,
	});

	const init = async () => {
		await server.register(cors, {
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
			origin: (origin, callback) => {
				// Allow all origins
				return callback(null, true);
			},
			hideOptionsRoute: true,
		});
		await server.register(cookie, {
			parseOptions: {},
		});

		// We need to access the rawBody for stripe webhooks
		await server.register(fastifyRawBody, {
			encoding: false, // don't convert the request body to string
			runFirst: true,
			global: false,
			routes: ["/api/*"],
		});

		await server.register(fastifyTRPCOpenApiPlugin, {
			basePath: "/api",
			router: appRouter,
			createContext,
		});

		await server.register(fastifyTRPCPlugin, {
			prefix: "/t/api",
			useWSS: false,
			trpcOptions: { router: appRouter, createContext },
		});

		// Add _health route
		server.route({
			method: "GET",
			url: "/_health",
			handler: (req, res) => {
				void res.send({ status: "ok" });
			},
		});

		if (env.NODE_ENV === "development") {
			// Serve openapi.json
			server.route({
				method: "GET",
				url: "/openapi.json",
				handler: (req, res) => {
					void res.send(openApiDocument);
				},
			});
		}
	};

	let provider: BasicTracerProvider;

	const stop = async () => {
		await server.close();
		await prisma.$disconnect();
		await provider.shutdown();
	};
	const start = async () => {
		try {
			await init();
			await server.listen({ port, host: "0.0.0.0" });
			await seedDatabase();
			logger.info(`Server listening on http://localhost:${port}`);
			logger.info(`Will use docker image: ${DOCKER_IMAGE}`);

			provider = initTelemetry([
				// new BetterHttpInstrumentation({
				//   plugins: [new StripePlugin()],
				// }),
				new FastifyInstrumentation(),
				new PrismaInstrumentation(),
			]);
		} catch (err) {
			console.error(err);
			throw err;
		} finally {
			await prisma.$disconnect();
		}
	};

	return { server, start, stop };
}
