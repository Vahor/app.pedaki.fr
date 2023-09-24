import { t } from '~/router/init';
import { isLogged } from '~/router/middleware/session.middleware';

export const router = t.router;
export const publicProcedure = t.procedure;
export const privateProcedure = t.procedure.use(isLogged);
