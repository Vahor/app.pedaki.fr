import { TRPCError } from '@trpc/server';

export class NotPaidYetError extends TRPCError {
  constructor() {
    super({
      code: 'BAD_REQUEST',
      message: 'not_paid_yet',
    });
  }
}
