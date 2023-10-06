import { prisma } from '@pedaki/db';
import { TRPCError } from '@trpc/server';
import { WorkspaceModel } from '~/models/workspace.model.ts';
import { z } from 'zod';
import {publicProcedure, router} from '../../trpc.ts';

export const workspaceMembersRouter = router({
  delete: publicProcedure
    .input(WorkspaceModel.pick({ id: true }))
    .output(z.undefined())
    .meta({ openapi: { method: 'DELETE', path: '/workspace/{id}/member' } })
    .mutation(({ input, ctx }) => {
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'NOT_IMPLEMENTED',
      });
    }),

  create: publicProcedure
    .input(WorkspaceModel.pick({ id: true }).extend({ email: z.string() }))
    .output(z.undefined())
    .meta({ openapi: { method: 'POST', path: '/workspace/{id}/member' } })
    .mutation(async ({ input }) => {
      const {id: workspaceId, email} = input;
      await prisma.workspaceMember.create({
        data: {
          email,
          workspaceId,
        },
      });

      // TODO: return type
    }),



});
