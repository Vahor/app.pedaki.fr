import { ServerProviderModel } from '~/resource/provider.model.ts';
import { isValidServerRegion } from '~/resource/server-region.model.ts';
import z from 'zod';

export const ResourceSchema = z.object({
  server: z
    .object({
      region: z.string(),
      provider: ServerProviderModel,
    })
    .refine(
      value => {
        return isValidServerRegion(value.provider, value.region);
      },
      {
        message: 'INVALID_REGION',
      },
    ),
});

export type Resource = z.infer<typeof ResourceSchema>;
