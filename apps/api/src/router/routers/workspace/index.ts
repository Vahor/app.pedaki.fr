import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { CreateWorkspaceModel, WorkspaceModel } from '~/models/workspace.model.ts';
import { workspaceResourcesRouter } from '~/router/routers/workspace/resources.router.ts';
import { assertQuota } from '~/services/quotas/quotas.ts';
import { publicProcedure, router} from '../../trpc.ts';
import {workspaceMembersRouter} from "~/router/routers/workspace/members.router.ts";

export const workspaceRouter = router({
  resources: workspaceResourcesRouter,
  members: workspaceMembersRouter,

  create: publicProcedure
    .input(CreateWorkspaceModel)
    .output(WorkspaceModel)
    .meta({ openapi: { method: 'POST', path: '/workspaces' } })
    .mutation(async ({ input, ctx }) => {
      // TODO: email
      const email = "nathan.d0601@gmail.com"
      await assertQuota(prisma, 'IN_WORKSPACE', 'USER', email);

      try {
        const workspace = await prisma.workspace.create({
          data: {
            name: input.name,
            identifier: input.identifier,
          },
        });

        await prisma.workspaceMember.create({
            data: {
              // TODO: email
              email: email,
              workspaceId: workspace.id,
            },
          });

        return workspace;
      } catch (error) {
        if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'ALREADY_EXISTS',
          });
        }
        throw error;
      }
    }),
});
