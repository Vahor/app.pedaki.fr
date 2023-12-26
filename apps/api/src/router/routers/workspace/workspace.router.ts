import { prisma } from '@pedaki/db';
import { NotYourWorkspaceError, WorkspaceNotFoundError } from '@pedaki/models/errors/index.js';
import {
  WorkspacePropertiesSchema,
  WorkspaceStatusSchema,
} from '@pedaki/models/workspace/workspace.model.js';
import type { WorkspaceProperties } from '@pedaki/models/workspace/workspace.model.js';
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
    .output(z.boolean())
    .meta({ openapi: { method: 'POST', path: '/workspace/{workspaceId}/status' } })
    .mutation(async ({ input, ctx }) => {
      // The param is only here to respect the REST API
      // But we don't need it as we already have the workspaceId in the context
      if (ctx.workspace.id !== input.workspaceId) {
        throw new NotYourWorkspaceError();
      }

      await workspaceService.updateCurrentStatus({
        workspaceId: ctx.workspace.id,
        status: input.status,
      });

      return true;
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

  updateSettings: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        settings: WorkspacePropertiesSchema.partial(),
      }),
    )
    .output(z.boolean())
    .meta({ openapi: { method: 'POST', path: '/workspace/{workspaceId}/settings' } })
    .mutation(async ({ input, ctx }) => {
      // The param is only here to respect the REST API
      // But we don't need it as we already have the workspaceId in the context
      if (ctx.workspace.id !== input.workspaceId) {
        throw new NotYourWorkspaceError();
      }

      await workspaceService.updateSettings({
        workspaceId: ctx.workspace.id,
        settings: input.settings,
      });

      return true;
    }),

  getSettings: workspaceProcedure
    .input(
      z.object({
        workspaceId: z.string(),
      }),
    )
    .output(WorkspacePropertiesSchema)
    .meta({ openapi: { method: 'GET', path: '/workspace/{workspaceId}/settings' } })
    .query(async ({ input, ctx }) => {
      // The param is only here to respect the REST API
      // But we don't need it as we already have the workspaceId in the context
      if (ctx.workspace.id !== input.workspaceId) {
        throw new NotYourWorkspaceError();
      }

      const settings = await prisma.workspace.findUniqueOrThrow({
        where: {
          id: ctx.workspace.id,
        },
        select: {
          name: true,
          contactEmail: true,
          contactName: true,
          defaultLanguage: true,
          maintenanceWindow: true,
          currentMaintenanceWindow: true,
        },
      });

      return {
        ...settings,
        defaultLanguage: settings.defaultLanguage as WorkspaceProperties['defaultLanguage'],
      };
    }),
});
