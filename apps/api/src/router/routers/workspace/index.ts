import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { CreateWorkspaceModel, WorkspaceModel } from '~/models/workspace.model.ts';
import { workspaceInvitesRouter } from '~/router/routers/workspace/invites.router.ts';
import { workspaceMembersRouter } from '~/router/routers/workspace/members.router.ts';
import { workspaceResourcesRouter } from '~/router/routers/workspace/resources.router.ts';
import { workspaceRolesRouter } from '~/router/routers/workspace/roles.router.ts';
import { PREFIX, TAGS } from '~/router/routers/workspace/shared.ts';
import { z } from 'zod';
import { privateProcedure, router, workspaceProcedure } from '../../trpc.ts';

export const workspaceRouter = router({
  roles: workspaceRolesRouter,
  invites: workspaceInvitesRouter,
  resources: workspaceResourcesRouter,
  members: workspaceMembersRouter,

  create: privateProcedure
    .input(CreateWorkspaceModel)
    .output(WorkspaceModel)
    .meta({ openapi: { method: 'POST', path: '/workspaces', tags: TAGS } })
    .mutation(async ({ input, ctx }) => {
      try {
        const workspace = await prisma.workspace.create({
          data: {
            name: input.name,
            identifier: input.identifier,
            members: {
              create: {
                user: {
                  connect: {
                    id: ctx.session.id,
                  },
                },
              },
            },
          },
        });

        // Create admin role and attach it to the user
        await prisma.workspaceRole.create({
          data: {
            name: 'Admin',
            isAdmin: true,
            workspaceId: workspace.id,
            memberRoles: {
              create: {
                member: {
                  connect: {
                    userId_workspaceId: {
                      userId: ctx.session.id,
                      workspaceId: workspace.id,
                    },
                  },
                },
              },
            },
          },
        });

        return workspace;
      } catch (error) {
        // Delete the workspace if it was created
        await prisma.workspace.delete({
          where: {
            identifier: input.identifier,
          },
        });

        if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2002') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'ALREADY_EXISTS',
          });
        }
        throw error;
      }
    }),

  getOne: workspaceProcedure
    .input(WorkspaceModel.pick({ id: true }))
    .output(WorkspaceModel)
    .meta({ openapi: { method: 'GET', path: `${PREFIX}/{id}`, tags: TAGS } })
    .query(async ({ input }) => {
      const workspace = await prisma.workspace.findUnique({
        where: {
          id: input.id,
        },
      });
      if (!workspace) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'NOT_FOUND',
        });
      }
      return workspace;
    }),

  getMany: workspaceProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .output(z.array(WorkspaceModel))
    // TODO: should be a GET request
    .meta({ openapi: { method: 'POST', path: `${PREFIX}/bulk`, tags: TAGS } })
    .query(async ({ input }) => {
      const workspaces = await prisma.workspace.findMany({
        where: {
          id: {
            in: input.ids,
          },
        },
      });
      return workspaces;
    }),
});
