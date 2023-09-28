import { prisma } from '@pedaki/db';
import { TRPCError } from '@trpc/server';
import { TAGS } from '~/router/routers/workspace/shared.ts';
import { inviteInWorkspaceFlow } from '~/services/emails/inviteInWorkspaceFlow.ts';
import { getTokenOrThrow } from '~/services/tokens';
import { z } from 'zod';
import { privateProcedure, router } from '../../trpc.ts';

export const workspaceInvitesRouter = router({
  create: privateProcedure
    .input(z.undefined())
    .output(z.void())
    .meta({ openapi: { method: 'POST', path: '/workspace/invites', tags: TAGS } })
    .mutation(({ input, ctx }) => {
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'NOT_IMPLEMENTED',
      });
    }),

  debug_create: privateProcedure
    .input(z.undefined())
    .output(z.void())
    .meta({ openapi: { method: 'POST', path: '/workspace/invites_debug', tags: TAGS } })
    .mutation(({ ctx }) => {
      return inviteInWorkspaceFlow(prisma, {
        workspace: {
          id: ctx.session.workspaces[0]!.id,
          name: 'cool workspace name',
        },
        user: {
          email: 'nathan.d0601@gmail.com',
        },
      });
    }),

  getMany: privateProcedure
    .input(z.undefined())
    .output(z.void())
    .meta({ openapi: { method: 'GET', path: '/workspace/invites', tags: TAGS } })
    .mutation(({ input, ctx }) => {
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'NOT_IMPLEMENTED',
      });
    }),

  validate: privateProcedure
    .input(z.object({ token: z.string() }))
    .output(z.void())
    .meta({ openapi: { method: 'POST', path: '/workspace/invites/validate', tags: TAGS } })
    .mutation(async ({ input, ctx }) => {
      const { token } = input;

      const tokenRecord = await getTokenOrThrow(prisma, token, 'WORKSPACE_INVITATION', false);

      // Make sure that the invitation exists
      const invitation = await prisma.workspaceInvitation.findFirstOrThrow({
        where: {
          tokenId: tokenRecord.id,
        },
        select: {
          workspaceId: true,
        },
      });

      if (ctx.session.workspaces.some((w) => w.id === invitation.workspaceId)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'ALREADY_IN_WORKSPACE',
        });
      }

      // Delete token (cascade delete invitation)
      await prisma.token.delete({
        where: {
          id: tokenRecord.id,
        },
      });

      // Add current user in the workspace
      await prisma.workspaceMember.create({
        data: {
          userId: ctx.session.id,
          workspaceId: invitation.workspaceId,
        },
      });
    }),
});
