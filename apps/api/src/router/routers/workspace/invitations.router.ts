import { decrypt } from '@pedaki/common/utils/hash.js';
import { prisma } from '@pedaki/db';
import { CreateWorkspaceInvitationInput } from '@pedaki/schema/invitation.model.js';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { env } from '~/env.ts';
import { z } from 'zod';
import { publicProcedure, router } from '../../trpc.ts';

const tokenSchema = z.object({
  workspaceId: z.string(),
  expiresAt: z.string(),
});

export const decryptToken = (token: string) => {
  const decrypted = decrypt(token, env.API_ENCRYPTION_KEY);
  const parsed = tokenSchema.parse(JSON.parse(decrypted));
  if (new Date(parsed.expiresAt) < new Date()) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'EXPIRED',
    });
  }
  return parsed;
};

export const workspaceInvitationRouter = router({
  create: publicProcedure
    .input(CreateWorkspaceInvitationInput)
    .output(z.undefined())
    .mutation(async ({ input }) => {
      const { workspaceId } = decryptToken(input.token);

      try {
        await prisma.pendingWorkspaceInvite.create({
          data: {
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
      const { workspaceId } = decryptToken(input.token);

      const emails = await prisma.pendingWorkspaceInvite.findMany({
        where: { workspaceId: workspaceId },
        orderBy: { createdAt: 'asc' },
        select: { email: true },
      });

      return { emails: emails.map(e => e.email) };
    }),
});
