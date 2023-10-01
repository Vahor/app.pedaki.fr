import type { Permission } from '@pedaki/auth/permissions.js';
import { allPermissions } from '@pedaki/auth/permissions.js';
import { cache } from '@pedaki/common/cache/index.js';
import { prisma } from '@pedaki/db';
import type { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type { User } from 'next-auth';

type UserData = User & {
  blocked: boolean;
};

export const getUserDataCached = (filter: { id: string }): Promise<UserData> => {
  return cache<UserData>(async () => getUserData(filter), `getUserData:${filter.id}`, {
    ttl: 1000 * 10, // 1 minute
  });
};

export const getUserData = async (
  filter: Prisma.UserWhereUniqueInput,
  condition?: ({ password }: { password: string }) => boolean,
): Promise<UserData> => {
  console.log('getUserData');
  // TODO: monitor this query
  const user = await prisma.user.findUnique({
    where: filter,
    select: {
      id: true,
      name: true,
      email: true,
      blocked: true,
      emailVerified: true,
      image: true,
      password: !!condition,
      memberships: {
        select: {
          workspaceId: true,
          roles: {
            select: {
              role: {
                select: {
                  id: true,
                  permissions: true,
                  isAdmin: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'INVALID_USER',
    });
  }

  if (condition && (!user.password || !condition({ password: user.password }))) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'INVALID_PASSWORD',
    });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    blocked: user.blocked,
    emailVerified: user.emailVerified,
    workspaces: user.memberships.map(m => ({
      id: m.workspaceId,
      roles: m.roles.flatMap(r => ({
        id: r.role.id,
        permissions: r.role.isAdmin
          ? allPermissions
          : r.role.permissions.map(p => p.identifier as Permission),
      })),
    })),
  };
};
