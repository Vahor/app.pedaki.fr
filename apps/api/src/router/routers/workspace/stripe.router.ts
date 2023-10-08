import { prisma } from '@pedaki/db';
import type { CreateWorkspaceInput } from '@pedaki/schema/workspace.model.js';
import { TRPCError } from '@trpc/server';
import type { PaymentMetadata } from '~/services/stipe/create-payment.ts';
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
      switch (event.type) {
        case 'checkout.session.completed':
          // Payment is successful and the subscription is created.
          // You should provision the subscription and save the customer ID to your database.
          // --
          // 	Sent when a customer clicks the Pay or Subscribe button in Checkout, informing you of a new purchase.

          const data = event.data.object as {
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

          const pendingData = JSON.parse(pending.data) as z.infer<typeof CreateWorkspaceInput>;

          // TODO move into a flow file
          await prisma.$transaction([
            prisma.pendingWorkspaceCreation.delete({
              where: {
                id: pendingId,
              },
            }),
            prisma.workspace.create({
              data: {
                name: pendingData.name,
                identifier: pendingData.identifier,
                mainEmail: pendingData.email,
                stripeCustomerId: data.customer,
                members: {
                  create: {
                    email: pendingData.email,
                  },
                },
                subscriptions: {
                  create: [
                    {
                      // TODO: type (create an enum for this)
                      type: 'hosting',
                      stripeSubscriptionId: data.subscription,
                      // expires_at
                      paidUntil: new Date(data.expires_at * 1000),
                    },
                  ],
                },
              },
            }),
          ]);

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
