import { t } from '~/router/init.ts';
import { isFromStripe } from '~/router/middleware/stripe.middleware.ts';
import { isFromWorkspace } from '~/router/middleware/workspace.middleware.ts';

export const router = t.router;
export const publicProcedure = t.procedure;
export const stripeProcedure = t.procedure.use(isFromStripe);
export const workspaceProcedure = t.procedure.use(isFromWorkspace);
