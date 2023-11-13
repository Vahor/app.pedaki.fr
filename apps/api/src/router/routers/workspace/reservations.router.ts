import { prisma } from '@pedaki/db';
import { CreateWorkspaceInput } from '@pedaki/models/workspace/api-workspace.model.js';
import { pendingWorkspaceService } from '@pedaki/services/pending-workspace/pending-workspace.service.js';
import { products } from '@pedaki/services/stripe/products.js';
import { stripeService } from '@pedaki/services/stripe/stripe.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';
import { ProductType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
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
      const pendingId = await pendingWorkspaceService.create(input);
      const payment = await stripeService.createPayment({
        product: {
          payment_type: products[ProductType.HOSTING].payment_type,
          priceId: products[ProductType.HOSTING].priceId[input.subscriptionInterval],
        },
        metadata: {
          workspaceName: input.name,
          pendingId,
        },
        customer: {
          email: input.email,
        },
      });
      await pendingWorkspaceService.linkStripePayment(pendingId, payment.id);

      return {
        id: pendingId,
        stripeUrl: payment.url,
      };
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
        url: workspaceService.getHealthStatusUrl(pending.identifier),
      };
    }),

  paidStatus: publicProcedure
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
          identifier: true,
          paidAt: true,
        },
      });
      if (!pending?.identifier || !pending.workspaceId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NOT_FOUND',
        });
      }

      if (!pending.paidAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NOT_PAID',
        });
      }

      return pendingWorkspaceService.generateToken({
        workspaceId: pending.workspaceId,
        identifier: pending.identifier,
        paidAt: pending.paidAt,
      });
    }),

  readyStatus: publicProcedure
    .input(z.object({ token: z.string() }))
    .output(z.object({ ready: z.boolean() }))
    .query(async ({ input }) => {
      const { identifier } = pendingWorkspaceService.decryptToken(input.token);
      const healthUrl = workspaceService.getHealthStatusUrl(identifier);
      console.log('DEBUG: healthUrl', healthUrl);

      const result = await fetch(healthUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      })
        .then(response => {
          console.log('DEBUG: response', response);
          // TODO: do more checks ?
          return response.ok;
        })
        .catch(() => {
          // do nothing
          return false;
        });

      return {
        ready: result,
      };
    }),
});