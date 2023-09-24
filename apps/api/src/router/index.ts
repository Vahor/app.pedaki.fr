import { authRouter } from './routers/auth';
import { stackRouter } from './routers/stack';
import { router } from './trpc';

export const appRouter = router({
  stack: stackRouter,
  auth: authRouter,
});

appRouter.createCaller;

export type AppRouter = typeof appRouter;
