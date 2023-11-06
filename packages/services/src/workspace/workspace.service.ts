import {prisma} from '@pedaki/db';
import type {CreateWorkspaceInput} from '@pedaki/models/workspace/api-workspace.model.js';


class WorkspaceService {
    getHealthStatusUrl(identifier: string) {
        return `https://${identifier}.pedaki.fr/api/_health`;
    }

    getWorkspaceUrl(identifier: string) {
        return `https://${identifier}.pedaki.fr`;
    }

    /**
     * Mark a workspace as deleted, this will not delete the workpace.
     * The column `deletedAt` will be set to the current date.
     * @param identifier the workspace identifier
     */
    async deleteWorkspaceByIdentifier(identifier: string): Promise<boolean> {
        console.log(`Deleting workspace '${identifier}'`);
        try {
            await prisma.workspace.update({
                where: {
                    identifier,
                },
                data: {
                    identifier: null,
                    deletedAt: new Date(),
                },
                select: {
                    id: true,
                },
            });
            return true;
        } catch (error) {
            console.error(`Workspace '${identifier}' not found`);
            return false;
        }
    }

    async getLatestSubscriptionId(identifier: string): Promise<number | null> {
        console.log(`Getting latest subscription id for workspace '${identifier}'`);
        const subscription = await prisma.workspaceSubscription.findFirst({
            where: {
                workspace: {
                    identifier,
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            select: {
                id: true,
            },
        });
        return subscription?.id ?? null;
    }

    async createWorkspace({
                              workspace,
                              subscription,
                          }: {
        workspace: Pick<CreateWorkspaceInput, 'name' | 'identifier' | 'email'>;
        subscription: {
            customerId: string;
            subscriptionId: string;
        };
    }): Promise<{ subscriptionId: number }> {
        // TODO: this is a temporary code
        const result = await prisma.workspace.create({
            select: {
                subscriptions: {
                    select: {
                        id: true,
                    },
                }
            },
            data: {
                identifier: workspace.identifier,
                name: workspace.name,
                mainEmail: workspace.email,
                stripeCustomerId: subscription?.customerId,
                subscriptions: {
                    create: {
                        type: 'host',
                        paidUntil: new Date(),
                    },
                },
            },
        });
        return {
            subscriptionId: result.subscriptions[0]!.id
        };
    }
}

const workspaceService = new WorkspaceService();
export {workspaceService};