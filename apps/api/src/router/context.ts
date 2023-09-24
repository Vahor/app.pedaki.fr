import { authFromRequest } from '@pedaki/auth';
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { JWT } from 'next-auth/jwt';

export interface Context {
  req: FastifyRequest;
  res: FastifyReply;
  session: JWT | null;
}

export const createContext = async ({
  req,
  res,
}: CreateFastifyContextOptions): Promise<Context> => {
  const session = await authFromRequest(req);

  return {
    req,
    res,
    session,
  };
};
