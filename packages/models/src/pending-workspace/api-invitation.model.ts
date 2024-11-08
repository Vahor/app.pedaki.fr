import { z } from "zod";

export const CreateWorkspaceInvitationInput = z.object({
	email: z.string().email().max(255),
	token: z.string(),
});
