import { WithTimestamps } from '~/models/shared/dates.model.ts';
import { WithId } from '~/models/shared/id.model.ts';
import { z } from 'zod';

export const WorkspacePermissionIdentifier = z
  .string()
  .regex(
    /^(create|read|update|delete|manage):(\w+):(user|workspace|\*)$/,
    "L'identifiant de permission doit être de la forme `{CallType}:{Resource}:{Target}`",
  );

export const WorkspacePermission = z
  .object({
    identifier: WorkspacePermissionIdentifier,
  })
  .merge(WithTimestamps)
  .merge(WithId);
