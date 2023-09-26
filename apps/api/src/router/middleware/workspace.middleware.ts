import { TRPCError } from '@trpc/server';
import { isLogged } from '~/router/middleware/session.middleware.ts';

const error = new TRPCError({
  code: 'FORBIDDEN',
  message: 'NOT_IN_WORKSPACE',
});

export const isInWorkspace = isLogged.unstable_pipe(({ ctx, next, rawInput }) => {
  if (typeof rawInput === 'object' && rawInput && 'id' in rawInput) {
    const workspaceId = rawInput.id;
    if (!ctx.session?.workspaces?.some(({ id }) => id === workspaceId)) {
      throw error;
    }
  } else if (typeof rawInput === 'object' && rawInput && 'ids' in rawInput) {
    const workspaceIds = rawInput.ids;
    if (
      !Array.isArray(workspaceIds) ||
      !ctx.session?.workspaces?.every(({ id }) => workspaceIds.includes(id))
    ) {
      throw error;
    }
  } else {
    throw error;
  }

  return next();
});
