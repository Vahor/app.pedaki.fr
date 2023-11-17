import { prisma } from '@pedaki/db';
import { WorkspaceNotFoundError } from '@pedaki/models/errors/index.js';
import { WorkspaceStatusSchema } from '@pedaki/models/workspace/workspace.model.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';
import { z } from 'zod';
import { publicProcedure, router, workspaceProcedure } from '../../trpc.ts';

export const workspaceDataRouter = router({
  updateCurrentStatus: workspaceProcedure
    .input(
      z.object({
        status: WorkspaceStatusSchema,
        workspaceId: z.string(),
      }),
    )
    .output(z.object({}))
    .meta({ openapi: { method: 'POST', path: '/workspace/{workspaceId}/status' } })
    .mutation(async ({ input, ctx }) => {
      await workspaceService.updateCurrentStatus({
        workspaceId: ctx.workspace.identifier,
        status: input.status,
      });
    }),

  getStatus: publicProcedure
    .input(
      z.object({
        identifier: z.string(),
      }),
    )
    .output(
      z.object({
        expected: WorkspaceStatusSchema,
        current: WorkspaceStatusSchema,
      }),
    )
    .query(async ({ input }) => {
      // TODO: add cache and quotas here as it's easy to spam this endpoint

      const response = await prisma.workspace.findUnique({
        where: {
          identifier: input.identifier,
        },
        select: {
          currentStatus: true,
          expectedStatus: true,
        },
      });

      if (!response) {
        throw new WorkspaceNotFoundError();
      }

      return {
        expected: response.expectedStatus,
        current: response.currentStatus,
      };
    }),
});
