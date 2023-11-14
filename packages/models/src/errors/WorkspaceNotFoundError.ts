import { TRPCError } from '@trpc/server';

export class WorkspaceNotFoundError extends TRPCError {
  constructor() {
    super({
      code: 'NOT_FOUND',
      message: 'workspace_not_found',
    });
  }
}
