import { WithTimestamps } from '~/models/shared/dates.model.ts';
import { WithId } from '~/models/shared/id.model.ts';
import { z } from 'zod';
import { WorkspacePermission } from './permissions.model';

export const WorkspaceRole = z
  .object({
    name: z.string({ required_error: 'Le nom est requis' }),
    description: z.string().optional(),
    permissions: z.array(WorkspacePermission.pick({ identifier: true })).array(),
  })
  .merge(WithTimestamps)
  .merge(WithId);
