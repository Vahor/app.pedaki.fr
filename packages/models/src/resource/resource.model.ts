import { ServerProviderModel } from '~/resource/provider.model.ts';
import z from 'zod';

export const StackSize = z.enum(['small', 'medium', 'large']);

const ResourceSchema = z
  .object({
    type: z.enum(['server', 'database']),
    data: z.any(),
  })
  .merge(
    z.object({
      region: z.string(),
      provider: ServerProviderModel,
      identifier: z.string(),
    }),
  );

/// Server
export const ServerResourceSchema = ResourceSchema.merge(
  z.object({
    type: z.enum(['server']),
    data: z.object({}),
  }),
);
export type ServerResource = z.infer<typeof ServerResourceSchema>;

/// Database
export const DatabaseResourceSchema = z;
