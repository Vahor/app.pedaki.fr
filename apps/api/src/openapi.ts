import { generateOpenApiDocument } from 'trpc-openapi';
import { env } from './env';
import { appRouter } from './router';

const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Pedaki Internal API',
  version: '1.0.0',
  baseUrl:
    env.NODE_ENV === 'production'
      ? 'https://api.pedaki.fr/api'
      : `http://localhost:${env.PORT}/api`,
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
});

Object.values(openApiDocument.paths as Record<string, Record<string, any>>).forEach(path => {
  Object.values(path).forEach(operation => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    operation.security = [{ bearerAuth: [] }];
  });
});

export { openApiDocument };
