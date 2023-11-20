import { prisma } from '@pedaki/db';
import { NotYourWorkspaceError, WorkspaceNotFoundError } from '@pedaki/models/errors/index.js';
import { WorkspaceStatusSchema } from '@pedaki/models/workspace/workspace.model.js';
import { workspaceService } from '@pedaki/services/workspace/workspace.service.js';
import { z } from 'zod';
import { publicProcedure, router, workspaceProcedure } from '../../trpc.ts';

export const workspaceDataRouter = router({
  updateCurrentStatus: workspaceProcedure
    .input(
      z.object({
        status: WorkspaceStatusSchema,
        subdomain: z.string(),
      }),
    )
    .output(z.undefined())
    .meta({ openapi: { method: 'POST', path: '/workspace/{subdomain}/status' } })
    .mutation(async ({ input, ctx }) => {
      // The param is only here to respect the REST API
      // But we don't need it as we already have the workspaceId in the context
      if (ctx.workspace.subdomain !== input.subdomain) {
        throw new NotYourWorkspaceError();
      }

      await workspaceService.updateCurrentStatus({
        subdomain: ctx.workspace.subdomain,
        status: input.status,
      });
    }),

  getStatus: publicProcedure
    .input(
      z.object({
        subdomain: z.string(),
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
          subdomain: input.subdomain,
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
