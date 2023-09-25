import {z} from 'zod';
import {WithTimestamps} from "~/models/shared/dates.model.ts";
import {WithId} from "~/models/shared/id.model.ts";

export const WorkspaceModel = z.object({
    name: z
        .string({required_error: 'Le nom est requis'}),
    identifier: z.string({required_error: 'L\'identifiant est requis'}),
})
    .merge(WithTimestamps)
    .merge(WithId)

export const CreateWorkspaceModel = WorkspaceModel.pick({name: true, identifier: true})