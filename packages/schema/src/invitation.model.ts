import { z } from 'zod';

export const CreateWorkspaceInvitationInput = z.object({
  email: z.string().email(),
  token: z.string(),
});
