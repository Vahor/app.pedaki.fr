import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { WorkspaceRole } from '~/models/role.model.ts';
import { PublicUserModel } from '~/models/user.model.ts';
import { CreateWorkspaceModel, WorkspaceModel } from '~/models/workspace.model.ts';
import { z } from 'zod';
import { privateProcedure, router, workspaceProcedure } from '../../trpc.ts';

export const workspaceRouter = router({
  create: privateProcedure
    .input(CreateWorkspaceModel)
    .output(WorkspaceModel)
    .meta({ openapi: { method: 'POST', path: '/workspace', tags: ['Workspace'] } })
    .mutation(async ({ input, ctx }) => {
      try {
        return await prisma.workspace.create({
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

  getOne: workspaceProcedure
    .input(WorkspaceModel.pick({ id: true }))
    .output(WorkspaceModel)
    .meta({ openapi: { method: 'GET', path: '/workspace', tags: ['Workspace'] } })
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
    .meta({ openapi: { method: 'POST', path: '/workspace/bulk', tags: ['Workspace'] } })
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

  listMembers: workspaceProcedure
    .input(WorkspaceModel.pick({ id: true }))
    .output(
      z.array(
        PublicUserModel.pick({ id: true, name: true, email: true }).merge(
          WorkspaceRole.pick({ id: true, name: true }),
        ),
      ),
    )
    .meta({ openapi: { method: 'GET', path: '/workspace/members', tags: ['Workspace'] } })
    .query(async ({ input }) => {
      const members = await prisma.workspaceMember.findMany({
        where: {
          workspaceId: input.id,
        },
        select: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              memberships: {
                select: {
                  roles: {
                    select: {
                      role: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return members.map(member => {
        return {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          roles: member.user.memberships.flatMap(membership => {
            return membership.roles.map(role => {
              return {
                id: role.role.id,
                name: role.role.name,
              };
            });
          }),
        };
      });
    }),
});
