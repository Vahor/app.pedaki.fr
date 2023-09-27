import { prisma } from '@pedaki/db';
import { TRPCError } from '@trpc/server';
import { TAGS } from '~/router/routers/workspace/shared.ts';
import { inviteInWorkspaceFlow } from '~/services/emails/inviteInWorkspaceFlow.ts';
import { z } from 'zod';
import { privateProcedure, publicProcedure, router } from '../../trpc.ts';

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

  validate: publicProcedure
    .input(z.undefined())
    .output(z.void())
    .meta({ openapi: { method: 'POST', path: '/workspace/invites/validate', tags: TAGS } })
    .mutation(({ input, ctx }) => {
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'NOT_IMPLEMENTED',
      });
    }),
});
