import { workspaceBillingRouter } from '~/router/routers/workspace/billing.router.ts';
import { workspaceMembersRouter } from '~/router/routers/workspace/members.router.ts';
import { workspaceResourcesRouter } from '~/router/routers/workspace/resources.router.ts';
import { router } from '../../trpc.ts';
import { workspaceInvitationRouter } from './invitations.router.ts';
import { workspaceReservationRouter } from './reservations.router.ts';
import { workspaceDataRouter } from './workspace.router.ts';

export const workspaceRouter = router({
  billing: workspaceBillingRouter,
  resource: workspaceResourcesRouter,
  member: workspaceMembersRouter,
  reservation: workspaceReservationRouter,
  invitation: workspaceInvitationRouter,
  data: workspaceDataRouter,
});
