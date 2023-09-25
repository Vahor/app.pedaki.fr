import { authRouter } from './routers/auth/index.ts';
import { stackRouter } from './routers/stack/index.ts';
import { workspaceRouter } from './routers/workspace/index.ts';
import { router } from './trpc.ts';

export const appRouter = router({
  stack: stackRouter,
  auth: authRouter,
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
