import { t } from '~/router/init.ts';
import { isInternal } from '~/router/middleware/internal.middleware.ts';
import { isFromStripe } from '~/router/middleware/stripe.middleware.ts';
import { telemetryMiddleware } from '~/router/middleware/telemetry.middleware.ts';
import { isFromWorkspace } from '~/router/middleware/workspace.middleware.ts';

export const router = t.router;
export const publicProcedure = t.procedure.use(telemetryMiddleware);
export const internalProcedure = t.procedure.use(isInternal);
export const stripeProcedure = t.procedure.use(isFromStripe);
export const workspaceProcedure = t.procedure.use(isFromWorkspace);
