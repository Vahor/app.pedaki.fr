import { router } from '../../trpc.ts';

export const stackRouter = router({
  // create_stack: publicProcedure
  //   .meta({ openapi: { method: 'POST', path: '/create-stack' } })
  //   .input(StackParametersSchema)
  //   .output(z.any())
  //   .mutation(async ({ input }) => {
  //     const { name, region, provider: providerName, size } = input;
  //     const provider = serverFactory.getProvider(providerName);
  //     if (!provider) {
  //       throw new TRPCError({ code: 'NOT_FOUND', message: `Provider ${providerName} not found` });
  //     }
  //
  //     const outputs = await provider.create({
  //       workspaceId: name,
  //       region,
  //       size,
  //     });
  //
  //     return outputs;
  //   }),
  //
  // delete_stack: publicProcedure
  //   .meta({ openapi: { method: 'DELETE', path: '/delete-stack' } })
  //   .input(StackParametersSchema)
  //   .output(z.any())
  //   .mutation(({ input }) => {
  //     const { name, provider: providerName, region, size } = input;
  //     const provider = serverFactory.getProvider(providerName);
  //     if (!provider) {
  //       throw new TRPCError({ code: 'NOT_FOUND', message: `Provider ${providerName} not found` });
  //     }
  //
  //     return provider.delete({
  //       workspaceId: name,
  //       region,
  //       size,
  //     });
  //   }),
  //
  // list_stacks: publicProcedure
  //   .meta({ openapi: { method: 'GET', path: '/list-stacks' } })
  //   .input(z.undefined())
  //   .output(z.any())
  //   .query(({}) => {
  //     console.log('list stacks');
  //     return null;
  //   }),
});
