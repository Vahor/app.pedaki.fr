import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
// eslint-disable-next-line node/file-extension-in-import
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { seedDatabase } from '~/seeds/seeds.ts';
import fastify from 'fastify';
import { fastifyTRPCOpenApiPlugin } from 'trpc-openapi';
import { env } from './env.ts';
import { openApiDocument } from './openapi.ts';
import { appRouter } from './router';
import { createContext } from './router/context.ts';
import { serverFactory } from './services/architecture/factory.ts';

export function createServer() {
  const port = env.PORT;

  const server = fastify({
    logger: false,
  });

  const setupSwagger = async () => {
    // Server Swagger UI
    await server.register(fastifySwagger, {
      mode: 'static',
      specification: { document: openApiDocument },
    });

    await server.register(fastifySwaggerUi, {
      routePrefix: '/docs',
    });

    // Handle incoming OpenAPI requests
    await server.register(fastifyTRPCOpenApiPlugin, {
      basePath: '/api',
      router: appRouter,
      createContext,
    });

    console.log(`Swagger UI available on http://localhost:${port}/docs`);
  };

  const init = async () => {
    const allowedOrigins = ['https://app.pedaki.fr', 'https://www.pedaki.fr'];
    if (env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:4000');
    }
    await server.register(cors, {
      allowedHeaders: ['Content-Type', 'Authorization'],
      origin: allowedOrigins,
      credentials: true,
    });
    await server.register(cookie, {
      parseOptions: {},
    });
    await server.register(fastifyTRPCPlugin, {
      prefix: '/t/api',
      useWSS: false,
      trpcOptions: { router: appRouter, createContext },
    });
  };

  const stop = async () => {
    await server.close();
  };
  const start = async () => {
    try {
      await init();
      await serverFactory.init();
      await setupSwagger();
      server.swagger();
      await server.listen({ port, host: '0.0.0.0' });
      await seedDatabase();
      console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
      server.log.error(err);
      throw err;
    }
  };

  return { server, start, stop };
}
