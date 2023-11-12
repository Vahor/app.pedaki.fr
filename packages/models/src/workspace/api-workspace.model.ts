import { ServerResourceSchema } from '~/resource/resource.model.js';
import { isValidServerRegion } from '~/resource/server-region.model.ts';
import { z } from 'zod';

const restrictedIdentifiers = [
  'api',
  'admin',
  'demo',
  'test',
  'store',
  'auth',
  'app',
  'login',
  'static',
  'assets',
  'files',
  'docs',
];

export const WorkspaceId = z.string().cuid();

export const CreateWorkspaceInput = z.object({
  name: z.string().min(3).max(60),
  identifier: z
    .string()
    .min(3)
    .max(50)
    .refine(
      identifier => {
        return !restrictedIdentifiers.includes(identifier);
      },
      {
        message: 'RESTRICTED_IDENTIFIER',
      },
    ),
  email: z.string().email(),
  subscriptionInterval: z.enum(['monthly', 'yearly']),

  server: ServerResourceSchema.pick({ region: true, provider: true, size: true }).refine(
    value => {
      return value.region && isValidServerRegion(value.provider, value.region);
    },
    {
      message: 'INVALID_REGION',
    },
  ),
});
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInput>;

export const CreateWorkspaceResponse = z.object({
  id: WorkspaceId,
});
