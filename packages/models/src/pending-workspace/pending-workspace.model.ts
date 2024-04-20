import { z } from "zod";

export const PendingWorkspaceSchema = z.object({
	id: z.string().cuid(),
	createdAt: z.date(),
	updatedAt: z.date(),

	stripePaymentId: z.string().optional(),
	paidAt: z.date().optional(),
	workspaceId: z.string().optional(),

	data: z.string(),

	subdomain: z.string(),
});

export type PendingWorkspace = z.infer<typeof PendingWorkspaceSchema>;

export const PendingTokenSchema = z.object({
	subdomain: z.string(),
	workspaceId: z.string(),
	expiresAt: z.coerce.date(),
	workspaceUrl: z.string(),
});
export type PendingToken = z.infer<typeof PendingTokenSchema>;
