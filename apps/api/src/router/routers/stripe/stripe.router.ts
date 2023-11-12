import { prisma } from '@pedaki/db';
import type { CreateWorkspaceInput } from '@pedaki/models/workspace/api-workspace.model.js';
import type { PaymentMetadata } from '@pedaki/services/stripe/stripe.model.js';
import { stripeService } from '@pedaki/services/stripe/stripe.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, stripeProcedure } from '../../trpc.ts';

export const stripeRouter = router({
  webhook: stripeProcedure
    .input(z.object({}).passthrough())
    .output(z.undefined())
    .meta({ openapi: { method: 'POST', path: '/stripe/webhook' } })
    .mutation(async ({ ctx }) => {
      const event = ctx.stripeEvent;
      console.log(event.type);
      // TODO: move each event into a separate function (in stripe service folder ?)
      switch (event.type) {
        // Not necessary? Already handled in checkout.session.completed
        // case 'customer.subscription.created':
        // break;
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          {
            // Update subscription info
            // TODO: use zod to make sure the data is valid
            // TODO: fix type
            const data = event.data.object as unknown as {
              id: string;
              ended_at: number | null;
              cancel_at: number | null;
              canceled_at: number | null;
              current_period_start: number;
              current_period_end: number;
            };

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

            // TODO: use zod to make sure the data is valid
            // TODO: fix type
            const data = event.data.object as unknown as {
              metadata: PaymentMetadata;
              status: string;
              customer: string;
              subscription: string;
              expires_at: number;
            };

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
            const { workspaceId, subscriptionId } = await workspaceService.createWorkspace({
              workspace: {
                name: pendingData.name,
                identifier: pendingData.identifier,
                email: pendingData.email,
                creationMetadata: pendingData.server,
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

            // TODO: create server
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
});
