import { authFromRequest } from '@pedaki/auth';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface Context {
  req: FastifyRequest;
  res: FastifyReply;
}

export const createContext = async ({
  req,
  res,
}: CreateFastifyContextOptions): Promise<Context> => {
  const session = await authFromRequest(req);

  console.log({ session });

  return {
    req,
    res,
  };
};
