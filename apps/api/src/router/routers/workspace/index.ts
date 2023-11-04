import { generateToken } from '@pedaki/common/utils/random.js';
import { prisma } from '@pedaki/db';
import type { CreateWorkspaceInput } from '@pedaki/schema/workspace.model.js';
import { CreateWorkspaceResponse } from '@pedaki/schema/workspace.model.js';
import { stripeService } from '@pedaki/services/stripe/stripe.service.js';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { workspaceMembersRouter } from '~/router/routers/workspace/members.router.ts';
import { workspaceResourcesRouter } from '~/router/routers/workspace/resources.router.ts';
import { assertQuota } from '~/services/quotas/quotas.ts';
import { z } from 'zod';
import { publicProcedure, router } from '../../trpc.ts';
import { workspaceInvitationRouter } from './invitations.router.ts';
import { workspaceReservationRouter } from './reservations.router.ts';


export const workspaceRouter = router({
  resource: workspaceResourcesRouter,
  member: workspaceMembersRouter,
  reservation: workspaceReservationRouter,
  invitation: workspaceInvitationRouter,

  validate: publicProcedure
    .input(
      z.object({
        pendingId: z.string().cuid(),
      }),
    )
    .output(CreateWorkspaceResponse)
    .meta({ openapi: { method: 'POST', path: '/workspace' } })
    .mutation(async ({ input }) => {
      // Get the pending data
      const pending = await prisma.pendingWorkspaceCreation.findUnique({
        where: {
          id: input.pendingId,
        },
        select: {
          data: true,
          stripePaymentId: true,
        },
      });

      if (!pending?.stripePaymentId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'NOT_FOUND',
        });
      }

      const customerId = await stripeService.getCustomerFromPayment(pending.stripePaymentId);

      const pendingData = JSON.parse(pending.data) as z.infer<typeof CreateWorkspaceInput>;

      const email = 'contact@pedaki.fr';
      await assertQuota(prisma, 'IN_WORKSPACE', 'USER', email);

      try {
        const workspaceToken = generateToken();

        const workspace = await prisma.workspace.create({
          data: {
            name: pendingData.name,
            identifier: pendingData.identifier,
            mainEmail: email,
            stripeCustomerId: customerId,
          },
        });

        await prisma.$transaction([
          // Add the user as a member of the workspace
          prisma.workspaceMember.create({
            data: {
              // TODO: email
              email: email,
              workspaceId: workspace.id,
            },
          }),
          // Create token for the workspace
          prisma.workspaceToken.create({
            data: {
              token: workspaceToken,
              workspace: {
                connect: {
                  id: workspace.id,
                },
              },
            },
          }),
        ]);

        return {
          ...workspace,
          identifier: pendingData.identifier,
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
});