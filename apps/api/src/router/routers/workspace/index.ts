import {privateProcedure, router} from '../../trpc.ts';
import {CreateWorkspaceModel, WorkspaceModel} from "~/models/workspace.model.ts";
import {prisma} from "@pedaki/db";

export const workspaceRouter = router({
    create: privateProcedure
        .input(CreateWorkspaceModel)
        .output(WorkspaceModel)
        .meta({ openapi: { method: 'POST', path: '/workspace', tags: ["Workspace"] } })
        .mutation(async ({input, ctx}) => {

            const workspace = await prisma.workspace.create({
                data: {
                    name: input.name,
                    identifier: input.identifier,
                    members: {
                        create: {
                            user: {
                                connect: {
                                    id: ctx.session.id
                                }
                            }
                        }
                    }
                }
            })

            return workspace;
        }),


});
