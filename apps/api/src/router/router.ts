import { stackRouter } from './routers/stack/index.ts';
import { stripeRouter } from './routers/stripe/stripe.router.ts';
import { workspaceRouter } from './routers/workspace/index.ts';
import { router } from './trpc.ts';

export const appRouter = router({
  stack: stackRouter,
  workspace: workspaceRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
