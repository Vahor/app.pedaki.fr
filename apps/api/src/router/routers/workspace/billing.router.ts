import { prisma } from '@pedaki/db';
import { CreateWorkspaceInput } from '@pedaki/models/workspace/api-workspace.model.js';
import { pendingWorkspaceService } from '@pedaki/services/pending-workspace/pending-workspace.service.js';
import { products } from '@pedaki/services/stripe/products.js';
import { stripeService } from '@pedaki/services/stripe/stripe.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';
import type { Prisma } from '@prisma/client';
import { ProductType } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router } from '../../trpc.ts';

export const workspaceBillingRouter = router({
  getStripePortalUrl: publicProcedure
    .input(z.object({ token: z.string() }))
    .output(z.object({ url: z.string().url() }))
    .query(async ({ input }) => {
      // TODO: user rights
      const { workspaceId } = pendingWorkspaceService.decryptToken(input.token);

      // Get workspace
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: {
          identifier: true,
          stripeCustomerId: true,
        },
      });

      if (!workspace || !workspace.identifier) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NOT_FOUND',
        });
      }

      const { url } = await stripeService.createPortalSession({
        customerId: workspace.stripeCustomerId,
        returnUrl: workspaceService.getBillingUrl(workspace.identifier),
      });

      return { url };
    }),
});
