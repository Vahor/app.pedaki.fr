import { prisma } from '@pedaki/db';
import { TRPCError } from '@trpc/server';
import { t } from '~/router/init.ts';

const error = new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'INVALID_TOKEN',
});

const missingToken = new TRPCError({
  code: 'UNAUTHORIZED',
  message: 'MISSING_TOKEN',
});

const getAuthorizationToken = (
  headers: Record<string, string | string[] | undefined>,
): [string, string] => {
  const authorization = headers.authorization;
  if (!authorization || typeof authorization !== 'string') {
    throw missingToken;
  }

  const header = authorization.split(' ')[1];
  if (!header) {
    throw missingToken;
  }

  const [workspaceId, token] = header.split(':', 2);
  if (!workspaceId || !token) {
    throw missingToken;
  }

  return [workspaceId, token];
};

export const isFromWorkspace = t.middleware(async ({ ctx, next }) => {
  // Check if there is an authorization header
  const [workspaceId, token] = getAuthorizationToken(ctx.req.headers);

  // Check if the token is valid
  const workspace = await prisma.workspaceToken.findUnique({
    where: {
      token,
      workspaceId,
    },
    select: {
      workspace: {
        select: {
          subdomain: true,
          stripeCustomerId: true,
          currentStatus: true,
        },
      },
    },
  });

  // Can be null if the workspace is deleted
  if (!workspace?.workspace.subdomain) {
    throw error;
  }

  return next({
    ctx: {
      workspace: {
        id: workspaceId,
        subdomain: workspace.workspace.subdomain!,
        stripeCustomerId: workspace.workspace.stripeCustomerId,
        currentStatus: workspace.workspace.currentStatus,
      },
    },
  });
});
