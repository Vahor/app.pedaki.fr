import { z } from 'zod';

export const PendingWorkspaceSchema = z.object({
  id: z.string().cuid(),
  createdAt: z.date(),
  updatedAt: z.date(),

  stripePaymentId: z.string().optional(),
  paidAt: z.date().optional(),
  workspaceId: z.string().optional(),

  data: z.string(),

  identifier: z.string(),
});

export type PendingWorkspace = z.infer<typeof PendingWorkspaceSchema>;