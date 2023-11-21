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
  console.log('DEBUG: headers', headers)
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
    throw error;
  }

  return [workspaceId, token];
};

export const isFromWorkspace = t.middleware(async ({ ctx, next }) => {
  // Check if there is an authorization header
  const [workspaceId, token] = getAuthorizationToken(ctx.req.headers);

  // Check if the token is valid
  const workspace = await prisma.workspaceToken.findUnique({
    where: {
      workspaceId: workspaceId,
      token: token,
    },
    select: {
      workspace: {
        select: {
          subdomain: true,
          stripeCustomerId: true,
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
      },
    },
  });
});
