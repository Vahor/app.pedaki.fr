import { workspaceMembersRouter } from '~/router/routers/workspace/members.router.ts';
import { workspaceResourcesRouter } from '~/router/routers/workspace/resources.router.ts';
import { router } from '../../trpc.ts';
import { workspaceInvitationRouter } from './invitations.router.ts';
import { workspaceReservationRouter } from './reservations.router.ts';

export const workspaceRouter = router({
  resource: workspaceResourcesRouter,
  member: workspaceMembersRouter,
  reservation: workspaceReservationRouter,
  invitation: workspaceInvitationRouter,
});
