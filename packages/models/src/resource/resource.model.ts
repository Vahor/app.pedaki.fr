import { ServerProviderModel } from '~/resource/provider.model.ts';
import z from 'zod';

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

export type Resource = z.infer<typeof ResourceSchema>;
export type ResourceInput = Pick<Resource, 'provider' | 'region'>;

/// Server
export const ServerResourceSchema = ResourceSchema.merge(
  z.object({
    type: z.enum(['server']),
    data: z.object({}),
    size: z.enum(['small']),
  }),
);
export type ServerResource = z.infer<typeof ServerResourceSchema>;
export type ServerResourceInput = Pick<ServerResource, 'size'>;

/// Database
export const DatabaseResourceSchema = ResourceSchema.merge(
  z.object({
    type: z.enum(['database']),
    data: z.object({}),
    size: z.enum(['small']),
  }),
);
export type DatabaseResource = z.infer<typeof DatabaseResourceSchema>;
export type DatabaseResourceInput = Pick<DatabaseResource, 'size'>;
