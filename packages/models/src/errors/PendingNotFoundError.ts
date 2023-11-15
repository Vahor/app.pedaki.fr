import { TRPCError } from '@trpc/server';

export class PendingNotFoundError extends TRPCError {
  constructor() {
    super({
      code: 'NOT_FOUND',
      message: 'pending_not_found',
    });
  }
}
