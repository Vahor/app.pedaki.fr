import type { Permission } from '@pedaki/auth/guards/ressources.js';
import { TRPCError } from '@trpc/server';
import { t } from '~/router/init.ts';

const error = new TRPCError({
  code: 'FORBIDDEN',
  message: 'MISSING_PERMISSIONS',
});

const cache = new Map<string, ReturnType<typeof t.middleware>>();

// Here I suppose that we are already in a isLogged context
export const hasPermission = (permissions: Permission[]) => {
  const key = permissions.sort().join('-');
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const middleware = t.middleware(({ ctx, next }) => {
    const userPermissions = ctx.session!.workspaces.flatMap(w =>
      w.roles.flatMap(r => r.permissions),
    );

    if (!permissions.every(p => userPermissions.includes(p))) {
      throw error;
    }

    return next();
  });
  cache.set(key, middleware);
  return middleware;
};
