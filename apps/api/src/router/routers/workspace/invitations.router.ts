import { prisma } from '@pedaki/db';
import { CreateWorkspaceInvitationInput } from '@pedaki/schema/invitation.model.js';
import { invitationService } from '@pedaki/services/invitation/invitation.service.js';
import { pendingWorkspaceService } from '@pedaki/services/pending-workspace/pending-workspace.service.js';
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

      await invitationService.addPendingInvite(workspaceId, input.email);
    }),

  delete: publicProcedure
    .input(CreateWorkspaceInvitationInput)
    .output(z.undefined())
    .mutation(async ({ input }) => {
      const { workspaceId } = pendingWorkspaceService.decryptToken(input.token);

      await prisma.pendingWorkspaceInvite.deleteMany({
        where: {
          email: input.email,
          workspaceId: workspaceId,
        },
      });
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
