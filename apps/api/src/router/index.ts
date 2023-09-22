import { stackRouter } from './routers/stack';
import { router } from './trpc';

export const appRouter = router({
  stack: stackRouter,
});

export type AppRouter = typeof appRouter;
