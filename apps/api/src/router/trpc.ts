import { t } from "~/router/init.ts";
import { isInternal } from "~/router/middleware/internal.middleware.ts";
import { isFromStripe } from "~/router/middleware/stripe.middleware.ts";
import { withTelemetry } from "~/router/middleware/telemetry.middleware.ts";
import { isFromWorkspace } from "~/router/middleware/workspace.middleware.ts";

export const router = t.router;
export const publicProcedure = t.procedure.use(withTelemetry);
export const internalProcedure = publicProcedure.use(isInternal);
export const stripeProcedure = publicProcedure.use(isFromStripe);
export const workspaceProcedure = publicProcedure.use(isFromWorkspace);
