import { allPermissions } from '@pedaki/auth/permissions.ts';
import { prisma } from '@pedaki/db';
import { WorkspaceRole } from '~/models/role.model.ts';
import { WorkspaceModel } from '~/models/workspace.model.ts';
import { hasPermission } from '~/router/middleware/permission.middleware.ts';
import { TAGS } from '~/router/routers/workspace/shared.ts';
import { z } from 'zod';
import { router, workspaceProcedure } from '../../trpc.ts';

export const workspaceRolesRouter = router({
  getMany: workspaceProcedure
    .use(hasPermission(['read:workspace:workspace']))
    .input(WorkspaceModel.pick({ id: true }))
    .output(z.array(WorkspaceRole))
    .meta({ openapi: { method: 'GET', path: '/workspace/{id}/roles', tags: TAGS } })
    .query(async ({ input }) => {
      const roles = await prisma.workspaceRole.findMany({
        where: {
          workspaceId: input.id,
        },
        include: {
          permissions: true,
        },
      });

      return roles.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        permissions: role.isAdmin
          ? allPermissions
          : role.permissions.map(permission => permission.identifier),
        updatedAt: role.updatedAt,
        createdAt: role.createdAt,
      }));
    }),
});
