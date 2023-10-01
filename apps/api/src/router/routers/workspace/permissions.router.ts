import { allPermissions } from '@pedaki/auth/permissions';
import { prisma } from '@pedaki/db';
import { WorkspacePermissionIdentifier } from '~/models/permissions.model.ts';
import { WorkspaceRole } from '~/models/role.model.ts';
import { hasPermission } from '~/router/middleware/permission.middleware.ts';
import { TAGS } from '~/router/routers/workspace/shared.ts';
import { router, workspaceProcedure } from '~/router/trpc.ts';
import { z } from 'zod';

export const workspacePermissionsRouter = router({
  getMany: workspaceProcedure
    .use(hasPermission(['read:workspace:workspace']))
    .input(WorkspaceRole.pick({ id: true }).extend({ role_id: z.string().cuid().length(25) })) // TODO
    .output(z.array(WorkspacePermissionIdentifier))
    .meta({ openapi: { method: 'GET', path: '/workspace/{id}/permissions/{role_id}', tags: TAGS } })
    .query(async ({ input }) => {
      const role = await prisma.workspaceRole.findFirst({
        where: {
          workspaceId: input.id,
          id: input.role_id,
        },
        include: {
          permissions: true,
        },
      });

      if (!role) return [];
      return role.isAdmin
        ? allPermissions
        : role.permissions.map(permission => permission.identifier);
    }),
});
