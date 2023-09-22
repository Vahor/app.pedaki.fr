import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import fastify from 'fastify';
import { fastifyTRPCOpenApiPlugin } from 'trpc-openapi';
import { env } from './env';
import { openApiDocument } from './openapi';
import { appRouter } from './router';
import { createContext } from './router/context';
import { serverFactory } from './services/architecture/factory';

export function createServer() {
  const dev = env.DEV;
  const port = env.PORT;
  const prefix = env.PREFIX;

  const server = fastify({ logger: dev });

  const setupSwagger = async () => {
    // Serve the OpenAPI document
    server.get('/openapi.json', () => openApiDocument);

    // Server Swagger UI
    await server.register(fastifySwagger, {
      mode: 'static',
      specification: { document: openApiDocument },
    });

    await server.register(fastifySwaggerUi, {
      routePrefix: '/docs',
    });

    // Handle incoming OpenAPI requests
    // @ts-expect-error: I don't know how to fix this and it works
    await server.register(fastifyTRPCOpenApiPlugin, {
      basePath: '/api',
      router: appRouter,
      createContext,
    });

    console.log(`Swagger UI available on http://localhost:${port}/docs`);
  };

  const init = async () => {
    await server.register(cors);
    await server.register(fastifyTRPCPlugin, {
      prefix,
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
      await server.listen({ port });
      console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
      server.log.error(err);
      process.exit(1);
    }
  };

  return { server, start, stop };
}
