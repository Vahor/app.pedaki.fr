import { stackRouter } from './routers/stack/index.ts';
import { workspaceRouter } from './routers/workspace/index.ts';
import { router } from './trpc.ts';

export const appRouter = router({
  stack: stackRouter,
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
