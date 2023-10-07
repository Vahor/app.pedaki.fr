import { t } from '~/router/init.ts';
import { isFromWorkspace } from '~/router/middleware/workspace.middleware.ts';

export const router = t.router;
export const publicProcedure = t.procedure;
export const workspaceProcedure = t.procedure.use(isFromWorkspace);
