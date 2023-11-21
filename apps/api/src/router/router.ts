import { versionRouter } from './routers/version/index.ts';
import { stripeRouter } from './routers/stripe/stripe.router.ts';
import { workspaceRouter } from './routers/workspace/index.ts';
import { router } from './trpc.ts';

export const appRouter = router({
  version: versionRouter,
  workspace: workspaceRouter,
  stripe: stripeRouter,
});

export type AppRouter = typeof appRouter;
