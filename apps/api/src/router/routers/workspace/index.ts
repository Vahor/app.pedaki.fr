import { generateToken } from '@pedaki/common/utils/random.js';
import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {CreateWorkspaceInput, CreateWorkspaceResponse} from '@pedaki/schema/workspace.model.ts';
import { workspaceMembersRouter } from '~/router/routers/workspace/members.router.ts';
import { workspaceResourcesRouter } from '~/router/routers/workspace/resources.router.ts';
import { assertQuota } from '~/services/quotas/quotas.ts';
import { publicProcedure, router } from '../../trpc.ts';

export const workspaceRouter = router({
  resources: workspaceResourcesRouter,
  members: workspaceMembersRouter,

  create: publicProcedure
    .input(CreateWorkspaceInput)
    .output(CreateWorkspaceResponse)
    .meta({ openapi: { method: 'POST', path: '/workspace' } })
    .mutation(async ({ input, ctx }) => {
      // TODO: email
      const email = 'nathan.d0601@gmail.com';
      await assertQuota(prisma, 'IN_WORKSPACE', 'USER', email);

      try {
        const workspaceToken = generateToken();

        const workspace = await prisma.workspace.create({
          data: {
            name: input.name,
            identifier: input.identifier,
            mainEmail: email,
          },
        });

        await prisma.$transaction([
          // Add the user as a member of the workspace
          prisma.workspaceMember.create({
            data: {
              // TODO: email
              email: email,
              workspaceId: workspace.id,
            },
          }),
          // Create token for the workspace
          prisma.workspaceToken.create({
            data: {
              token: workspaceToken,
              workspace: {
                connect: {
                  id: workspace.id,
                },
              },
            },
          }),
        ]);

        return {
          ...workspace,
          identifier: workspace.identifier ?? input.identifier,
        };
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
