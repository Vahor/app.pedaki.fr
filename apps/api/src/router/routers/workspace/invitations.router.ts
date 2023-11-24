import { prisma } from '@pedaki/db';
import { NotYourWorkspaceError } from '@pedaki/models/errors/NotYourWorkspaceError.js';
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
    .input(CreateWorkspaceInvitationInput.pick({ email: true, token: true }))
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
    .query(async ({ input }) => {
      const { workspaceId } = pendingWorkspaceService.decryptToken(input.token);

      return {
        invitations: await invitationService.getAllInvites(workspaceId),
      };
    }),

  getManyInWorkspace: workspaceProcedure
    .input(z.object({ workspaceId: z.string() }))
    .output(z.object({ invitations: z.array(z.object({ email: z.string(), name: z.string() })) }))
    .meta({ openapi: { method: 'GET', path: '/workspace/{workspaceId}/invitations' } })
    .query(async ({ input, ctx }) => {
      // TODO: currently we can read invites of our own workspace
      if (ctx.workspace.id !== input.workspaceId) {
        throw new NotYourWorkspaceError();
      }
      return {
        invitations: await invitationService.getAllInvites(input.workspaceId),
      };
    }),

  deleteManyInWorkspace: workspaceProcedure
    .input(z.object({ workspaceId: z.string(), emails: z.array(z.string()) }))
    .output(z.boolean())
    .meta({ openapi: { method: 'POST', path: '/workspace/{workspaceId}/invitations/delete' } })
    .mutation(async ({ input, ctx }) => {
      // TODO: currently we can read invites of our own workspace
      if (ctx.workspace.id !== input.workspaceId) {
        throw new NotYourWorkspaceError();
      }
      await invitationService.deleteManyInvites(input.workspaceId, input.emails);

      return true;
    }),
});
