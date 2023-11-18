import { prisma } from '@pedaki/db';
import { CreateWorkspaceInvitationInput } from '@pedaki/models/pending-workspace/api-invitation.model.js';
import { invitationService } from '@pedaki/services/invitation/invitation.service.js';
import { pendingWorkspaceService } from '@pedaki/services/pending-workspace/pending-workspace.service.js';
import { z } from 'zod';
import { publicProcedure, router, workspaceProcedure } from '../../trpc.ts';

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
    .query(({ input }) => {
      const { workspaceId } = pendingWorkspaceService.decryptToken(input.token);

      return invitationService.getAllInvites(workspaceId);
    }),

  getManyInWorkspace: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .output(z.object({ emails: z.array(z.string()) }))
    .meta({ openapi: { method: 'GET', path: '/workspace/{workspaceId}/invitations' } })
    .query(({ input }) => {
      return invitationService.getAllInvites(input.workspaceId);
    }),

  deleteManyInWorkspace: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), emails: z.array(z.string()) }))
    .output(z.undefined())
    .meta({ openapi: { method: 'DELETE', path: '/workspace/{workspaceId}/invitations' } })
    .mutation(async ({ input }) => {
      await invitationService.deleteManyInvites(input.workspaceId, input.emails);
    }),
});
