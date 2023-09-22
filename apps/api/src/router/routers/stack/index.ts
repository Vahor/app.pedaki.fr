import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { serverFactory } from '../../../services/architecture/factory';
import { publicProcedure, router } from '../../trpc';

const StackParametersSchema = z.object({
  name: z.string(),
  region: z.enum(['us-east-2', 'eu-west-3']),
  provider: z.enum(['AWS', 'test']),
  size: z.enum(['small']),
});

export const stackRouter = router({
  create_stack: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/create-stack' } })
    .input(StackParametersSchema)
    .output(z.any())
    .mutation(async ({ input }) => {
      const { name, region, provider: providerName, size } = input;
      const provider = serverFactory.getProvider(providerName);
      if (!provider) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Provider ${providerName} not found` });
      }

      const outputs = await provider.create({
        workspaceId: name,
        region,
        size,
      });

      return outputs;
    }),

  delete_stack: publicProcedure
    .meta({ openapi: { method: 'DELETE', path: '/delete-stack' } })
    .input(StackParametersSchema)
    .output(z.any())
    .mutation(({ input }) => {
      const { name, provider: providerName, region, size } = input;
      const provider = serverFactory.getProvider(providerName);
      if (!provider) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Provider ${providerName} not found` });
      }

      return provider.delete({
        workspaceId: name,
        region,
        size,
      });
    }),

  list_stacks: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/list-stacks' } })
    .input(z.undefined())
    .output(z.any())
    .query(({}) => {
      console.log('list stacks');
      return null;
    }),
});
