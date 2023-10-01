import { allPermissions } from '@pedaki/auth/permissions.js';
import { prisma } from '@pedaki/db';

export const seedPermissions = async () => {
  const exisingPermissions = await prisma.workspacePermission
    .findMany({
      select: {
        identifier: true,
      },
    })
    .then(permissions => permissions.flatMap(permission => permission.identifier));
  const neededPermissions = allPermissions.filter(
    permission => !exisingPermissions.includes(permission),
  );

  await prisma.$transaction([
    // Create missing permissions
    prisma.workspacePermission.createMany({
      data: neededPermissions.map(permission => ({
        identifier: permission,
      })),
    }),
    // Delete permissions that are not needed anymore
    prisma.workspacePermission.deleteMany({
      where: {
        NOT: {
          identifier: {
            in: allPermissions,
          },
        },
      },
    }),
  ]);
};
