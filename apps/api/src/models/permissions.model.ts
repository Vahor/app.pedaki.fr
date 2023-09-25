import { WithTimestamps } from '~/models/shared/dates.model.ts';
import { WithId } from '~/models/shared/id.model.ts';
import { z } from 'zod';

export const WorkspacePermission = z
  .object({
    identifier: z.string({ required_error: "L'identifiant est requis" }),
  })
  .merge(WithTimestamps)
  .merge(WithId);
