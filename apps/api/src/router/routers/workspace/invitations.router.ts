import { prisma } from '@pedaki/db';
import { WorkspaceNotFoundError } from '@pedaki/models/errors/WorkspaceNotFoundError.js';
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

      await invitationService.addPendingInvite(workspaceId, input.email, input.name);
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
    .output(z.object({ invitations: z.array(z.object({ email: z.string(), name: z.string() })) }))
    .query(({ input }) => {
      const { workspaceId } = pendingWorkspaceService.decryptToken(input.token);

      return invitationService.getAllInvites(workspaceId);
    }),

  getManyInWorkspace: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .output(z.object({ invitations: z.array(z.object({ email: z.string(), name: z.string() })) }))
    .meta({ openapi: { method: 'GET', path: '/workspace/{workspaceId}/invitations' } })
    .query(({ input, ctx }) => {
      // TODO: currently we can read invites of our own workspace
      if (ctx.workspace.id !== input.workspaceId) {
        throw new WorkspaceNotFoundError();
      }
      return invitationService.getAllInvites(input.workspaceId);
    }),

  deleteManyInWorkspace: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), emails: z.array(z.string()) }))
    .output(z.undefined())
    .meta({ openapi: { method: 'POST', path: '/workspace/{workspaceId}/invitations/delete' } })
    .mutation(async ({ input, ctx }) => {
      // TODO: currently we can read invites of our own workspace
      if (ctx.workspace.id !== input.workspaceId) {
        throw new WorkspaceNotFoundError();
      }
      await invitationService.deleteManyInvites(input.workspaceId, input.emails);
    }),
});
