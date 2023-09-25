import { prisma } from '@pedaki/db';
import { CreateWorkspaceModel, WorkspaceModel } from '~/models/workspace.model.ts';
import { privateProcedure, router } from '../../trpc.ts';

export const workspaceRouter = router({
  create: privateProcedure
    .input(CreateWorkspaceModel)
    .output(WorkspaceModel)
    .meta({ openapi: { method: 'POST', path: '/workspace', tags: ['Workspace'] } })
    .mutation(async ({ input, ctx }) => {
      const workspace = await prisma.workspace.create({
        data: {
          name: input.name,
          identifier: input.identifier,
          members: {
            create: {
              user: {
                connect: {
                  id: ctx.session.id,
                },
              },
            },
          },
        },
      });

      return workspace;
    }),
});
