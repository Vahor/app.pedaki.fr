import { stackRouter } from './routers/stack';
import { router } from './trpc';
import {authRouter} from "./routers/auth";

export const appRouter = router({
  stack: stackRouter,
  auth: authRouter
});

export type AppRouter = typeof appRouter;
