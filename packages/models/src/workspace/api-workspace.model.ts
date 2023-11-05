import { ResourceSchema } from '~/resource/resource.model';
import { z } from 'zod';

export const restrictedIdentifiers = ['api', 'admin', 'app', 'docs'];
export const WorkspaceId = z.string().cuid();

export const CreateWorkspaceInput = z
  .object({
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
  })
  .merge(ResourceSchema.pick({ server: true }));

export const CreateWorkspaceResponse = z.object({
  id: WorkspaceId,
});
