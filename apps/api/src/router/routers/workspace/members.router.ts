import { prisma } from '@pedaki/db';
import { TRPCError } from '@trpc/server';
import { WorkspaceRole } from '~/models/role.model.ts';
import { PublicUserModel } from '~/models/user.model.ts';
import { WorkspaceModel } from '~/models/workspace.model.ts';
import { hasPermission } from '~/router/middleware/permission.middleware.ts';
import { TAGS } from '~/router/routers/workspace/shared.ts';
import { z } from 'zod';
import { router, workspaceProcedure } from '../../trpc.ts';

export const workspaceMembersRouter = router({
  delete: workspaceProcedure
    .use(hasPermission(['create:billing:user']))
    .input(WorkspaceModel.pick({ id: true }))
    .output(z.undefined())
    .meta({ openapi: { method: 'DELETE', path: '/workspace/members', tags: TAGS } })
    .mutation(({ input, ctx }) => {
      ctx.session.id;
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'NOT_IMPLEMENTED',
      });
    }),

  getMany: workspaceProcedure
    .input(WorkspaceModel.pick({ id: true }))
    .output(
      z.array(
        PublicUserModel.pick({ id: true, name: true, email: true }).merge(
          WorkspaceRole.pick({ id: true, name: true }),
        ),
      ),
    )
    .meta({ openapi: { method: 'GET', path: '/workspace/members', tags: TAGS } })
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
