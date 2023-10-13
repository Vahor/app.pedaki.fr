import { z } from 'zod';
import { isValidRegion, ProviderModel } from './region.model.ts';

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
    provider: ProviderModel,
    region: z.string(),
    email: z.string().email(),
  })
  .refine(
    value => {
      return isValidRegion(value.provider, value.region);
    },
    {
      message: 'INVALID_REGION',
    },
  );

export const CreateWorkspaceResponse = z.object({
  id: WorkspaceId,
});
