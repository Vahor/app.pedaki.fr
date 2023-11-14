import { prisma } from '@pedaki/db';
import { WorkspaceNotFoundError } from '@pedaki/models/errors/WorkspaceNotFoundError';
import type { CreateWorkspaceInput } from '@pedaki/models/workspace/api-workspace.model.js';
import { resourceService } from '@pedaki/services/resource/resource.service.js';
import {
  CheckoutSessionCompletedSchema,
  CustomerSubscriptionSchema,
} from '@pedaki/services/stripe/stripe.model.js';
import { stripeService } from '@pedaki/services/stripe/stripe.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, stripeProcedure, workspaceProcedure } from '../../trpc.ts';

export const stripeRouter = router({
  webhook: stripeProcedure
    .input(z.object({}).passthrough())
    .output(z.undefined())
    .meta({ openapi: { method: 'POST', path: '/stripe/webhook' } })
    .mutation(async ({ ctx }) => {
      const event = ctx.stripeEvent;
      console.log(event.type);
      switch (event.type) {
        // Not necessary? Already handled in checkout.session.completed
        // case 'customer.subscription.created':
        // break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          {
            // Update subscription info
            const data = CustomerSubscriptionSchema.parse(event.data.object);

            // Get our subscription id from stripe subscription id
            const subscription = await prisma.workspaceSubscription.findUnique({
              where: {
                stripeSubscriptionId: data.id,
              },
              select: {
                id: true,
              },
            });

            if (!subscription) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'NOT_FOUND',
              });
            }

            await workspaceService.updateWorkspaceSubscriptionStripeData({
              subscriptionId: subscription.id,
              currentPeriodStart: new Date(data.current_period_start * 1000),
              currentPeriodEnd: new Date(data.current_period_end * 1000),
              endedAt: data.ended_at ? new Date(data.ended_at * 1000) : undefined,
              cancelAt: data.cancel_at ? new Date(data.cancel_at * 1000) : undefined,
              canceledAt: data.canceled_at ? new Date(data.canceled_at * 1000) : undefined,
            });
          }
          break;
        case 'checkout.session.completed':
          {
            // Payment is successful and the subscription is created.
            // You should provision the subscription and save the customer ID to your database.
            // --
            // 	Sent when a customer clicks the Pay or Subscribe button in Checkout, informing you of a new purchase.

            const data = CheckoutSessionCompletedSchema.parse(event.data.object);

            // TODO: I don't want to be poor
            const count = await prisma.workspace.count();
            if (count >= 2) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'TOO_MANY_WORKSPACES',
              });
            }

            const status = data.status;
            const pendingId = data.metadata.pendingId;
            if (status !== 'complete') {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'INVALID_STATUS',
              });
            }

            // We are now sure that the payment is complete, we can create the workspace
            const pending = await prisma.pendingWorkspaceCreation.findUnique({
              where: {
                id: pendingId,
              },
              select: {
                data: true,
              },
            });

            if (!pending) {
              throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'NOT_FOUND',
              });
            }

            // Create workspace
            const subscription = await stripeService.getSubscriptionInfo(data.subscription);
            const pendingData = JSON.parse(pending.data) as z.infer<typeof CreateWorkspaceInput>;

            const workspaceCreationData = {
              vpc: {
                provider: pendingData.server.provider,
                region: pendingData.server.region,
              },
              server: {
                size: pendingData.server.size,
                environment_variables: {},
              },
              database: {
                size: pendingData.server.size,
              },
              dns: {
                subdomain: pendingData.identifier,
              },
            };

            const { workspaceId, subscriptionId } = await workspaceService.createWorkspace({
              workspace: {
                name: pendingData.name,
                identifier: pendingData.identifier,
                email: pendingData.email,
                creationData: workspaceCreationData,
              },
              subscription: {
                customerId: data.customer,
                subscriptionId: data.subscription,
                currentPeriodStart: new Date(subscription.current_period_start * 1000),
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              },
            });

            // Update the pending workspace creation
            await prisma.pendingWorkspaceCreation.update({
              where: {
                id: pendingId,
              },
              data: {
                workspaceId: workspaceId,
                paidAt: new Date(),
              },
            });

            void resourceService.safeCreateStack({
              ...workspaceCreationData,
              workspace: {
                identifier: pendingData.identifier,
                subscriptionId,
              },
            });
          }
          break;
        case 'invoice.paid':
          // Continue to provision the subscription as payments continue to be made.
          // Store the status in your database and check when a user accesses your service.
          // This approach helps you avoid hitting rate limits.
          // --
          // Sent each billing interval when a payment succeeds.
          break;
        case 'invoice.payment_failed':
          // The payment failed or the customer does not have a valid payment method.
          // The subscription becomes past_due. Notify your customer and send them to the
          // customer portal to update their payment information.
          // --
          // Sent each billing interval if there is an issue with your customer’s payment method.
          break;
      }
    }),

  getCustomerPortalUrl: workspaceProcedure
    .input(z.object({ returnUrl: z.string().url() }))
    .output(z.object({ url: z.string().url() }))
    .query(async ({ input, ctx }) => {
      // Get workspace
      const workspace = await prisma.workspace.findUnique({
        where: { id: ctx.workspaceId },
        select: {
          identifier: true,
          stripeCustomerId: true,
        },
      });

      if (!workspace || !workspace.identifier) {
        throw new WorkspaceNotFoundError();
      }

      const { url } = await stripeService.createPortalSession({
        customerId: workspace.stripeCustomerId,
        returnUrl: input.returnUrl,
      });

      return { url };
    }),
});
