import { allPermissions } from '@pedaki/auth/guards/ressources.js';
import { prisma } from '@pedaki/db';

export const seedPermissions = async () => {
  const allAdmins = await prisma.workspaceRole.findMany({
    where: {
      isAdmin: true,
    },
  });

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
    // Add all permissions to all admins
    ...allAdmins.map(admin =>
      prisma.workspaceRole.update({
        where: {
          id: admin.id,
        },
        data: {
          permissions: {
            connect: allPermissions.map(permission => ({
              identifier: permission,
            })),
          },
        },
      }),
    ),
  ]);
};
