import { prisma } from '@pedaki/db';
import type { CreateWorkspaceInput } from '@pedaki/models/workspace/api-workspace.model.js';
import { ProductType } from '@prisma/client';

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
      paidUntil: Date;
    };
  }): Promise<{ worskpaceId: string; subscriptionId: number }> {
    const { id, subscriptions } = await prisma.workspace.create({
      data: {
        name: workspace.name,
        identifier: workspace.identifier,
        mainEmail: workspace.email,
        stripeCustomerId: subscription.customerId,
        members: {
          create: {
            email: workspace.email,
          },
        },
        subscriptions: {
          create: [
            {
              type: ProductType.HOSTING,
              stripeSubscriptionId: subscription.subscriptionId,
              // expires_at
              paidUntil: subscription.paidUntil,
            },
          ],
        },
      },
      select: {
        id: true,
        subscriptions: {
          select: {
            id: true,
          },
        },
      },
    });

    return { worskpaceId: id, subscriptionId: subscriptions[0]!.id };
  }
}

const workspaceService = new WorkspaceService();
export { workspaceService };
