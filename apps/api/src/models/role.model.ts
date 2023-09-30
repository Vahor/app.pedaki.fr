import { WithTimestamps } from '~/models/shared/dates.model.ts';
import { WithId } from '~/models/shared/id.model.ts';
import { z } from 'zod';
import { WorkspacePermission } from './permissions.model.ts';

export const WorkspaceRole = z
  .object({
    name: z.string({ required_error: 'Le nom est requis' }),
    description: z.string().nullable(),
    // TODO: WorkspacePermission.pick
    permissions: z.array(z.string()),
  })
  .merge(WithTimestamps)
  .merge(WithId);
