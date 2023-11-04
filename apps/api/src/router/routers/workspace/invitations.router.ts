import { prisma } from '@pedaki/db';
import { CreateWorkspaceInvitationInput } from '@pedaki/schema/invitation.model.js';
import { pendingWorkspaceService } from '@pedaki/services/pending-workspace/pending-workspace.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../../trpc.ts';


export const workspaceInvitationRouter = router({
  create: publicProcedure
    .input(CreateWorkspaceInvitationInput)
    .output(z.undefined())
    .mutation(async ({ input }) => {
      const { workspaceId } = pendingWorkspaceService.decryptToken(input.token);

      await workspaceService.addPendingInvite(workspaceId, input.email);
    }),

  delete: publicProcedure
    .input(CreateWorkspaceInvitationInput)
    .output(z.undefined())
    .mutation(async ({ input }) => {
      const { workspaceId } = pendingWorkspaceService.decryptToken(input.token);

      try {
        await prisma.pendingWorkspaceInvite.deleteMany({
          where: {
            email: input.email,
            workspaceId: workspaceId,
          },
        });
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

  getMany: publicProcedure
    .input(z.object({ token: z.string() }))
    .output(z.object({ emails: z.array(z.string()) }))
    .query(async ({ input }) => {
      const { workspaceId } = pendingWorkspaceService.decryptToken(input.token);

      const emails = await prisma.pendingWorkspaceInvite.findMany({
        where: { workspaceId: workspaceId },
        orderBy: { createdAt: 'asc' },
        select: { email: true },
      });

      return { emails: emails.map(e => e.email) };
    }),
});