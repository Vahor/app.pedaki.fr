import { prisma } from '@pedaki/db';
import { CreateWorkspaceInput } from '@pedaki/schema/workspace.model.js';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../../trpc.ts';

export const workspaceReservationRouter = router({
  create: publicProcedure
    .input(CreateWorkspaceInput)
    .output(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .meta({ openapi: { method: 'POST', path: '/workspace-reservation' } })
    .mutation(async ({ input }) => {
      const jsonData = JSON.stringify(input);

      try {
        const pending = await prisma.pendingWorkspaceCreation.create({
          data: {
            data: jsonData,
            identifier: input.identifier,
          },
          select: {
            id: true,
          },
        });

        return {
          id: pending.id,
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

  getOne: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .output(CreateWorkspaceInput)
    .meta({ openapi: { method: 'GET', path: '/workspace-reservation/{id}' } })
    .query(async ({ input }) => {
      // TODO: add cache and quotas here as it's easy to spam this endpoint
      const pending = await prisma.pendingWorkspaceCreation.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!pending) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NOT_FOUND',
        });
      }

      return JSON.parse(pending.data) as z.infer<typeof CreateWorkspaceInput>;
    }),
});
