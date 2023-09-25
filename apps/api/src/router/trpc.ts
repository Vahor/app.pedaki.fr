import { t } from '~/router/init';
import { isLogged } from '~/router/middleware/session.middleware';
import { isInWorkspace } from '~/router/middleware/workspace.middleware.ts';

export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isLogged);
export const workspaceProcedure = t.procedure.use(isInWorkspace);
