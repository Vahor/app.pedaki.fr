import { generateOpenApiDocument } from "trpc-openapi";
import { env } from "./env.ts";
import { appRouter } from "./router/router.ts";

const openApiDocument = generateOpenApiDocument(appRouter, {
	title: "Pedaki Internal API",
	version: "1.0.0",
	baseUrl:
		env.NODE_ENV === "production"
			? "https://api.pedaki.fr/api"
			: `http://localhost:${env.PORT}/api`,
	securitySchemes: {
		bearerAuth: {
			type: "http",
			scheme: "bearer",
			bearerFormat: "JWT",
		},
	},
	tags: ["Auth", "Stack", "Workspace"],
});

const paths = openApiDocument.paths as Record<string, Record<string, unknown>>;

for (const path of Object.values(paths)) {
	for (const operation of Object.values(path)) {
		// @ts-expect-error operation is an object
		operation.security = [{ bearerAuth: [] }];
	}
}

export { openApiDocument };
