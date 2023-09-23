import { generateOpenApiDocument } from 'trpc-openapi';
import { env } from './env';
import { appRouter } from './router';

export const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Pedaki Internal API',
  version: '1.0.0',
  baseUrl: env.NODE_ENV === 'production' ? 'https://api.pedaki.fr/api' :   `http://localhost:${env.PORT}/api`,
});
