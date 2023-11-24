import { prisma } from '@pedaki/db';
import { NotYourWorkspaceError } from '@pedaki/models/errors/NotYourWorkspaceError.js';
import { PendingNotFoundError } from '@pedaki/models/errors/PendingNotFoundError.js';
import type { CreateWorkspaceInput } from '@pedaki/models/workspace/api-workspace.model.js';
import { pendingWorkspaceService } from '@pedaki/services/pending-workspace/pending-workspace.service.js';
import { resourceService } from '@pedaki/services/resource/resource.service.js';
import {
  CheckoutSessionCompletedSchema,
  CheckoutSessionExpiredSchema,
  CustomerSubscriptionSchema,
} from '@pedaki/services/stripe/stripe.model.js';
import { stripeService } from '@pedaki/services/stripe/stripe.service.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router, stripeProcedure, workspaceProcedure } from '../../trpc.ts';

export const stripeRouter = router({
  webhook: stripeProcedure
    .input(z.object({}).passthrough())
    .output(z.undefined())
    .meta({ openapi: { method: 'POST', path: '/stripe/webhook' } })
    .mutation(async ({ ctx }) => {
      const event = ctx.stripeEvent;
      console.log(event.type);
      switch (event.type) {
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          {
            // Update subscription info
            const data = CustomerSubscriptionSchema.parse(event.data.object);
            // FIXME: delete me later
            console.log('Subscription object', event.data.object);

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
              endedAt: data.ended_at ? new Date(data.ended_at * 1000) : null,
              cancelAt: data.cancel_at ? new Date(data.cancel_at * 1000) : null,
              canceledAt: data.canceled_at ? new Date(data.canceled_at * 1000) : null,
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
              },
              database: {
                size: pendingData.server.size,
              },
              dns: {
                subdomain: pendingData.subdomain,
              },
            };

            const { workspaceId, subscriptionId, authToken } =
              await workspaceService.createWorkspace({
                workspace: {
                  name: pendingData.name,
                  subdomain: pendingData.subdomain,
                  billing: {
                    name: pendingData.billing.name,
                    email: pendingData.billing.email,
                  },
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
                  server: {
                      ...workspaceCreationData.server,
                      environment_variables: {
                          PEDAKI_AUTH_TOKEN: authToken,
                          PEDAKI_BILLING_EMAIL: pendingData.billing.email,
                          PEDAKI_BILLING_NAME: pendingData.billing.name,
                      },
                  },
                  workspace: {
                      id: workspaceId,
                      subdomain: pendingData.subdomain,
                      subscriptionId,
                  },
              });
          }
          break;
        case 'checkout.session.expired':
          {
            // Checkout session expired, we can safely delete the pending workspace creation
            const data = CheckoutSessionExpiredSchema.parse(event.data.object);
            const pendingId = data.metadata.pendingId;

            pendingWorkspaceService.delete(pendingId);

            console.log('Deleted pending workspace creation after session expired', pendingId);

            // we expect the server to be created in the next 10 minutes
            void new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000)).then(async () => {
              await prisma.workspace.update({
                where: {
                  id: workspaceId,
                  expectedStatus: 'CREATING',
                },
                data: {
                  expectedStatus: status,
                },
              });
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

  cancelCheckoutSession: publicProcedure
    .input(
      z.object({
        token: z.string(),
      }),
    )
    .output(z.undefined())
    .mutation(async ({ input }) => {
      const { pendingId } = stripeService.decodePendingJWT(input.token);

      // TODO: add cache and quotas here as it's easy to spam this endpoint
      // TODO: not sure about safety though
      const pending = await prisma.pendingWorkspaceCreation.findUnique({
        where: {
          id: pendingId,
        },
        select: {
          stripePaymentId: true,
        },
      });

      if (!pending?.stripePaymentId) {
        throw new PendingNotFoundError();
      }

      stripeService.expireCheckoutSession({ sessionId: pending.stripePaymentId });
    }),

  getCustomerPortalUrl: workspaceProcedure
    .input(z.object({ returnUrl: z.string().url(), subdomain: z.string() }))
    .output(z.object({ url: z.string().url() }))
    .meta({ openapi: { method: 'GET', path: '/stripe/{subdomain}/customer-portal-url' } })
    .query(async ({ input, ctx }) => {
      // TODO: currently we can only update the status of our own workspace
      //  we might want to update this in the future to allow admins to generate a portal url for any workspace

      if (ctx.workspace.subdomain !== input.subdomain) {
        throw new NotYourWorkspaceError();
      }

      const { url } = await stripeService.createPortalSession({
        customerId: ctx.workspace.stripeCustomerId,
        returnUrl: input.returnUrl,
      });

      return { url };
    }),
});
