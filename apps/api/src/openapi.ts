import { generateOpenApiDocument } from 'trpc-openapi';
import { env } from './env';
import { appRouter } from './router';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Example CRUD API',
  description: 'OpenAPI compliant REST API built using tRPC with Fastify',
  version: '1.0.0',
  baseUrl: `http://localhost:${env.PORT}/api`,
});
