import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router, workspaceProcedure } from '../../trpc.ts';

export const workspaceMembersRouter = router({
  delete: publicProcedure
    .input(z.object({ id: z.string().cuid().length(25) }))
    .output(z.undefined())
    .meta({ openapi: { method: 'DELETE', path: '/workspace/{id}/member' } })
    .mutation(({ input, ctx }) => {
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'NOT_IMPLEMENTED',
      });
    }),

  create: workspaceProcedure
    .input(
      z.object({
        email: z.string().email(),
      }),
    )
    .output(z.undefined())
    .meta({ openapi: { method: 'POST', path: '/workspace/member' } })
    .mutation(async ({ input, ctx }) => {
      const { email } = input;
      try {
        await prisma.workspaceMember.create({
          data: {
            email,
            workspaceId: ctx.workspaceId,
          },
        });
      } catch (error) {
        if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'ALREADY_EXISTS',
          });
        }
      }
    }),
});
