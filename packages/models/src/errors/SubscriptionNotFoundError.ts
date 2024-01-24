import { TRPCError } from '@trpc/server';

export class SubscriptionNotFoundError extends TRPCError {
  constructor() {
    super({
      code: 'NOT_FOUND',
      message: 'subscription_not_found',
    });
  }
}
