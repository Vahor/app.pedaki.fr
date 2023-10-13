import { encrypt } from '@pedaki/common/utils/hash.js';
import { prisma } from '@pedaki/db';
import { CreateWorkspaceInput } from '@pedaki/schema/workspace.model.js';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { env } from '~/env.ts';
import { createPayment } from '~/services/stripe/create-payment.ts';
import { products } from '~/services/stripe/products.ts';
import { z } from 'zod';
import { publicProcedure, router } from '../../trpc.ts';

export const workspaceReservationRouter = router({
  create: publicProcedure
    .input(CreateWorkspaceInput)
    .output(
      z.object({
        id: z.string().cuid(),
        stripeUrl: z.string().url(),
      }),
    )
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

        const payment = await createPayment({
          product: products.hosted,
          metadata: {
            workspaceName: input.name,
            pendingId: pending.id,
          },
          customer: {
            email: input.email,
          },
        });

        // Update pending with payment id
        await prisma.pendingWorkspaceCreation.update({
          where: {
            id: pending.id,
          },
          data: {
            stripePaymentId: payment.id,
          },
        });

        return {
          id: pending.id,
          stripeUrl: payment.url,
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

  getHealthUrl: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .output(
      z.object({
        url: z.string().url(),
      }),
    )
    .query(async ({ input }) => {
      const pending = await prisma.pendingWorkspaceCreation.findUnique({
        where: {
          id: input.id,
        },
        select: {
          identifier: true,
        },
      });

      if (!pending) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NOT_FOUND',
        });
      }

      return {
        // TODO base domain / health url
        url: `https://${pending.identifier}.pedaki.fr/api/health`,
      };
    }),

  status: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .output(
      z.object({
        paid: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      // TODO: add cache and quotas here as it's easy to spam this endpoint
      const pending = await prisma.pendingWorkspaceCreation.findUnique({
        where: {
          id: input.id,
        },
        select: {
          paidAt: true,
        },
      });

      if (!pending) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NOT_FOUND',
        });
      }

      return {
        paid: pending.paidAt !== null,
      };
    }),

  generateToken: publicProcedure
    .input(
      z.object({
        id: z.string().cuid(),
      }),
    )
    .output(z.string())
    .query(async ({ input }) => {
      // TODO: add cache and quotas here as it's easy to spam this endpoint
      const pending = await prisma.pendingWorkspaceCreation.findUnique({
        where: {
          id: input.id,
        },
        select: {
          workspaceId: true,
          paidAt: true,
        },
      });

      if (!pending?.paidAt || !pending.workspaceId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NOT_FOUND',
        });
      }

      const raw = {
        workspaceId: pending.workspaceId,
        // 1 hour after payment
        expiresAt: new Date(pending.paidAt.getTime() + 1000 * 60 * 60).toISOString(),
      };

      return encrypt(JSON.stringify(raw), env.API_ENCRYPTION_KEY);
    }),
});
