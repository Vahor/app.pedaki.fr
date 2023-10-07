import { isValidRegion, ProviderModel } from './region.model.ts';
import { z } from 'zod';

export const restrictedIdentifiers = ['api', 'admin', 'app', 'docs'];

export const CreateWorkspaceInput = z
  .object({
    name: z.string().min(3).max(50),
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
    id: z.string(),
});

