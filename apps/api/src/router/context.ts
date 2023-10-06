// eslint-disable-next-line node/file-extension-in-import
import type { CreateFastifyContextOptions } from '@trpc/server/adapters/fastify';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface Context {
  req: FastifyRequest;
  res: FastifyReply;
}

export const createContext = ({
  req,
  res,
}: CreateFastifyContextOptions): Context => {

  return {
    req,
    res,
  };
};
