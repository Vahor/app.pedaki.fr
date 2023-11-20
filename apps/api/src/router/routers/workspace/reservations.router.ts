import { prisma } from '@pedaki/db';
import { NotPaidYetError, PendingNotFoundError } from '@pedaki/models/errors/index.js';
import { CreateWorkspaceInput } from '@pedaki/models/workspace/api-workspace.model.js';
import { pendingWorkspaceService } from '@pedaki/services/pending-workspace/pending-workspace.service.js';
import { products } from '@pedaki/services/stripe/products.js';
import { stripeService } from '@pedaki/services/stripe/stripe.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';
import { ProductType } from '@prisma/client';
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
          priceId: products[ProductType.HOSTING].priceId[input.billing.subscriptionInterval],
        },
        metadata: {
          identifier: input.identifier,
          workspaceName: input.name,
          pendingId,
        },
        customer: {
          email: input.billing.email,
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
        throw new PendingNotFoundError();
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
          subdomain: true,
        },
      });

      if (!pending) {
        throw new PendingNotFoundError();
      }

      return {
        url: workspaceService.getHealthStatusUrl(pending.subdomain),
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
        throw new PendingNotFoundError();
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
          subdomain: true,
          paidAt: true,
        },
      });
      if (!pending?.subdomain || !pending.workspaceId) {
        throw new PendingNotFoundError();
      }

      if (!pending.paidAt) {
        throw new NotPaidYetError();
      }

      return pendingWorkspaceService.generateToken({
        workspaceId: pending.workspaceId,
        subdomain: pending.subdomain,
        paidAt: pending.paidAt,
      });
    }),
});
