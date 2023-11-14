import { generateToken } from '@pedaki/common/utils/random.js';
import { prisma } from '@pedaki/db';
import type { CreateWorkspaceInput } from '@pedaki/models/workspace/api-workspace.model.js';
import type { WorkspaceData } from '@pedaki/models/workspace/workspace.model.js';
import type { Prisma } from '@prisma/client';
import { ProductType } from '@prisma/client';

const WORKSPACE_CREATION_METADATA_VERSION = 1;

class WorkspaceService {
  getHealthStatusUrl(identifier: string) {
    return `${this.getWorkspaceUrl(identifier)}/api/health`;
  }

  getWorkspaceUrl(identifier: string) {
    return `https://${identifier}.pedaki.fr`;
  }

  getDomainName(identifier: string) {
    return `${identifier}.pedaki.fr`;
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
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
      },
    });
    console.log('DEBUG: subscription', subscription);
    return subscription?.id ?? null;
  }

  async createWorkspace({
    workspace,
    subscription,
  }: {
    workspace: Pick<CreateWorkspaceInput, 'name' | 'identifier' | 'email'> & {
      creationData: Omit<WorkspaceData, 'workspace' | 'server'> & {
        server: Omit<WorkspaceData['server'], 'environment_variables'>;
      };
    };
    subscription: {
      customerId: string;
      subscriptionId: string;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
    };
  }): Promise<{ workspaceId: string; subscriptionId: number; authToken: string }> {
    console.log(`Creating workspace (database) '${workspace.identifier}'...`);
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
              currentPeriodStart: subscription.currentPeriodStart,
              currentPeriodEnd: subscription.currentPeriodEnd,
              workspaceCreationData: {
                version: WORKSPACE_CREATION_METADATA_VERSION,
                ...workspace.creationData,
              } as Prisma.JsonObject,
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
    const subscriptionId = subscriptions[0]!.id;

    console.log('Updating workspace creation data on subscription and generating token...');
    // Create token for the workspace
    const token = generateToken();

    await prisma.$transaction([
      // Insert token
      prisma.workspaceToken.create({
        data: {
          token,
          workspaceId: id,
        },
      }),
      // Update subscription
      prisma.workspaceSubscription.update({
        where: {
          id: subscriptionId,
        },
        data: {
          workspaceCreationData: {
            version: WORKSPACE_CREATION_METADATA_VERSION,
            ...workspace.creationData,
            workspace: {
              identifier: workspace.identifier,
              subscriptionId,
            },
          } as Prisma.JsonObject,
        },
      }),
    ]);

    return { workspaceId: id, subscriptionId, authToken: token };
  }

  async updateWorkspaceSubscriptionStripeData({
    subscriptionId,
    currentPeriodStart,
    currentPeriodEnd,
    endedAt,
    cancelAt,
    canceledAt,
  }: {
    subscriptionId: number;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    endedAt?: Date;
    cancelAt?: Date;
    canceledAt?: Date;
  }) {
    await prisma.workspaceSubscription.update({
      where: {
        id: subscriptionId,
      },
      data: {
        currentPeriodStart,
        currentPeriodEnd,
        endedAt,
        cancelAt,
        canceledAt,
      },
    });
  }
}

const workspaceService = new WorkspaceService();
export { workspaceService };
