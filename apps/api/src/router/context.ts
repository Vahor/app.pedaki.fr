import { authFromRequest } from '@pedaki/auth';
// eslint-disable-next-line node/file-extension-in-import
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';
// eslint-disable-next-line node/file-extension-in-import
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
